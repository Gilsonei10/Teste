const http = require('http');
const https = require('https');
const { URL } = require('url');

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });

function fetchUrlWithRedirects(targetUrl, method, clientHeaders, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error('Muitos redirecionamentos'));
    }

    try {
      const urlObj = new URL(targetUrl);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      const agent = isHttps ? httpsAgent : httpAgent;

      const headers = {
        'Host': urlObj.host,
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      };

      if (clientHeaders['range']) {
        headers['Range'] = clientHeaders['range'];
      }

      const req = client.request(
        targetUrl,
        {
          method: method || 'GET',
          headers,
          agent,
        },
        res => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode || 0) && res.headers.location) {
            const redirectLocation = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, targetUrl).href;

            res.resume();
            return resolve(fetchUrlWithRedirects(redirectLocation, method, clientHeaders, redirectCount + 1));
          }

          resolve({ res, finalUrl: targetUrl });
        }
      );

      req.on('error', err => reject(err));
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(204).end();
    return;
  }

  const rawUrl = req.url || '';
  const urlParamIndex = rawUrl.indexOf('url=');

  if (urlParamIndex === -1 && !req.query?.url) {
    res.status(400).setHeader('Access-Control-Allow-Origin', '*').end('Parametro URL ausente');
    return;
  }

  let targetUrl = req.query?.url || rawUrl.slice(urlParamIndex + 4);
  try {
    targetUrl = decodeURIComponent(targetUrl);
  } catch {
    // keep targetUrl
  }

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `http://${targetUrl}`;
  }

  try {
    const { res: proxyRes, finalUrl } = await fetchUrlWithRedirects(targetUrl, req.method || 'GET', req.headers);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

    if (proxyRes.headers['content-range']) {
      res.setHeader('Content-Range', proxyRes.headers['content-range']);
    }
    if (proxyRes.headers['accept-ranges']) {
      res.setHeader('Accept-Ranges', proxyRes.headers['accept-ranges']);
    }

    let hasHandledFirstChunk = false;

    proxyRes.once('data', firstChunk => {
      hasHandledFirstChunk = true;
      res.status(proxyRes.statusCode || 200);

      const isM3u8Text = firstChunk.toString('utf8', 0, 15).trim().startsWith('#EXT');

      if (isM3u8Text) {
        const bodyChunks = [firstChunk];
        proxyRes.on('data', chunk => bodyChunks.push(chunk));
        proxyRes.on('end', () => {
          const rawBody = Buffer.concat(bodyChunks).toString('utf8');
          const urlObj = new URL(finalUrl);
          const lastSlash = finalUrl.lastIndexOf('/');
          const baseUrl = lastSlash !== -1 ? finalUrl.substring(0, lastSlash + 1) : finalUrl + '/';
          const origin = urlObj.origin;

          const rewritten = rawBody
            .split(/\r?\n/)
            .map(line => {
              const trimmed = line.trim();
              if (!trimmed) return line;

              if (trimmed.startsWith('#')) {
                if (trimmed.includes('URI="')) {
                  return trimmed.replace(/URI="([^"]+)"/g, (_m, uri) => {
                    const fullUri = uri.startsWith('http')
                      ? uri
                      : uri.startsWith('/')
                      ? origin + uri
                      : baseUrl + uri;
                    return `URI="/proxy?url=${encodeURIComponent(fullUri)}"`;
                  });
                }
                return line;
              }

              const fullSegmentUrl = trimmed.startsWith('http')
                ? trimmed
                : trimmed.startsWith('/')
                ? origin + trimmed
                : baseUrl + trimmed;

              return `/proxy?url=${encodeURIComponent(fullSegmentUrl)}`;
            })
            .join('\n');

          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          res.setHeader('Content-Length', Buffer.byteLength(rewritten));
          res.end(rewritten);
        });
      } else {
        if (firstChunk[0] === 0x47) {
          res.setHeader('Content-Type', 'video/mp2t');
        } else if (proxyRes.headers['content-type']) {
          res.setHeader('Content-Type', proxyRes.headers['content-type']);
        }
        if (proxyRes.headers['content-length']) {
          res.setHeader('Content-Length', proxyRes.headers['content-length']);
        }

        res.write(firstChunk);
        proxyRes.pipe(res);
      }
    });

    proxyRes.once('end', () => {
      if (!hasHandledFirstChunk) {
        res.status(proxyRes.statusCode || 200).end();
      }
    });

    req.on('close', () => {
      proxyRes.destroy();
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).setHeader('Access-Control-Allow-Origin', '*').end(`Erro no proxy: ${err.message}`);
    }
  }
};
