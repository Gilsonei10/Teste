import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL, fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });

function fetchUrlWithRedirects(targetUrl, method, clientHeaders, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error('Muitos redirecionamentos'));
    }

    try {
      const cleanTarget = targetUrl.split('#')[0];
      const urlObj = new URL(cleanTarget);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      const agent = isHttps ? httpsAgent : httpAgent;

      const host =
        urlObj.port && urlObj.port !== '80' && urlObj.port !== '443'
          ? `${urlObj.hostname}:${urlObj.port}`
          : urlObj.hostname;

      const headers = {
        'Host': host,
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      };

      if (clientHeaders['range']) {
        headers['Range'] = clientHeaders['range'];
      }

      const req = client.request(
        cleanTarget,
        {
          method: method || 'GET',
          headers,
          agent,
        },
        res => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode || 0) && res.headers.location) {
            const redirectLocation = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, cleanTarget).href;

            res.resume();
            return resolve(fetchUrlWithRedirects(redirectLocation, method, clientHeaders, redirectCount + 1));
          }

          resolve({ res, finalUrl: cleanTarget });
        }
      );

      req.on('error', err => reject(err));
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.statusCode = 204;
    res.end();
    return;
  }

  // 1. PROXY ENDPOINT
  if (req.url && req.url.startsWith('/proxy')) {
    const rawUrl = req.url;
    const urlParamIndex = rawUrl.indexOf('url=');

    if (urlParamIndex === -1) {
      res.statusCode = 400;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end('Parametro URL ausente');
      return;
    }

    const rawParam = rawUrl.slice(urlParamIndex + 4);
    let targetUrl = '';
    try {
      targetUrl = decodeURIComponent(rawParam);
    } catch {
      targetUrl = rawParam;
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

      if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
        res.statusCode = proxyRes.statusCode;
        if (proxyRes.headers['content-type']) {
          res.setHeader('Content-Type', proxyRes.headers['content-type']);
        }
        proxyRes.pipe(res);
        return;
      }

      let hasHandledFirstChunk = false;

      proxyRes.once('data', firstChunk => {
        hasHandledFirstChunk = true;
        res.statusCode = proxyRes.statusCode || 200;

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
          res.statusCode = proxyRes.statusCode || 200;
          res.end();
        }
      });

      req.on('close', () => {
        proxyRes.destroy();
      });
    } catch (err) {
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(`Erro no proxy: ${err.message}`);
      }
    }
    return;
  }

  // 2. STATIC FILES SERVING (dist/)
  let reqPath = req.url ? req.url.split('?')[0] : '/';
  let filePath = path.join(DIST_DIR, reqPath === '/' ? 'index.html' : reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 500;
      res.end('Erro interno no servidor');
    } else {
      res.setHeader('Content-Type', contentType);
      res.statusCode = 200;
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================================`);
  console.log(` Servidor Web IPTV Produção Online!`);
  console.log(` Porta: ${PORT}`);
  console.log(` Acesso Local: http://localhost:${PORT}`);
  console.log(`=================================================\n`);
});
