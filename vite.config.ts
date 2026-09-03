import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });

function fetchUrlWithRedirects(
  targetUrl: string,
  method: string,
  clientHeaders: Record<string, string | string[] | undefined>,
  redirectCount = 0
): Promise<{ res: http.IncomingMessage; finalUrl: string }> {
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

      const headers: Record<string, string> = {
        'Host': host,
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Accept': '*/*',
        'Connection': 'keep-alive',
      };

      if (clientHeaders['range']) {
        headers['Range'] = clientHeaders['range'] as string;
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

      req.on('error', err => {
        reject(err);
      });

      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

function corsProxyPlugin(): Plugin {
  return {
    name: 'vite-cors-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/proxy', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.statusCode = 204;
          res.end();
          return;
        }

        const rawUrl = req.url || '';
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
          if (rawParam.startsWith('http://') || rawParam.startsWith('https://')) {
            targetUrl = rawParam;
          } else {
            targetUrl = `http://${targetUrl}`;
          }
        }

        try {
          const { res: proxyRes, finalUrl } = await fetchUrlWithRedirects(targetUrl, req.method || 'GET', req.headers);

          const contentType = (proxyRes.headers['content-type'] || '').toLowerCase();
          console.log(`[PROXY] ${req.method} ${finalUrl} -> Status ${proxyRes.statusCode} (${contentType})`);

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

          // Se status for erro do servidor (ex: 404, 403, 500), repassar diretamente com o status correspondente
          if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
            res.statusCode = proxyRes.statusCode;
            if (proxyRes.headers['content-type']) {
              res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }
            proxyRes.pipe(res);
            return;
          }

          // If downloading raw M3U playlist file (get.php, m3u_plus), pipe directly with zero delay!
          const isM3uPlaylistFile =
            finalUrl.includes('get.php') ||
            finalUrl.includes('type=m3u') ||
            finalUrl.includes('player_api.php') ||
            contentType.includes('octet-stream');

          if (isM3uPlaylistFile) {
            res.statusCode = proxyRes.statusCode || 200;
            if (proxyRes.headers['content-type']) {
              res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }
            proxyRes.pipe(res);
            return;
          }

          let hasHandledFirstChunk = false;

          proxyRes.once('data', (firstChunk: Buffer) => {
            hasHandledFirstChunk = true;
            res.statusCode = proxyRes.statusCode || 200;

            const isM3u8Text = firstChunk.toString('utf8', 0, 15).trim().startsWith('#EXT');

            if (isM3u8Text) {
              const bodyChunks: Buffer[] = [firstChunk];
              proxyRes.on('data', (chunk: Buffer) => {
                bodyChunks.push(chunk);
              });
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
        } catch (err: any) {
          console.error('[PROXY ERROR]', err.message);
          if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(`Erro 502 no proxy: ${err.message}`);
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), corsProxyPlugin()],
  server: {
    port: 3000,
    host: true,
  },
});
