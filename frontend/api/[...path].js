const httpModule = require('http');

export default async function handler(req, res) {
  const pathParts = req.query.path || [];
  const path = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

  const params = new URLSearchParams();
  Object.entries(req.query).forEach(([key, val]) => {
    if (key !== 'path') params.append(key, val);
  });

  const targetUrl = `http://midnightblue-woodcock-705637.hostingersite.com/backend/api/${path}?${params.toString()}`;

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? JSON.stringify(req.body)
    : null;

  console.log('[PROXY] →', req.method, targetUrl);
  console.log('[PROXY] Request body:', body);

  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    },
  };

  return new Promise((resolve) => {
    const proxyReq = httpModule.request(targetUrl, options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        console.log('[PROXY] Response status:', proxyRes.statusCode);
        console.log('[PROXY] Raw response:', data);
        try {
          res.status(proxyRes.statusCode).json(JSON.parse(data));
        } catch (e) {
          console.log('[PROXY] JSON parse failed:', e.message);
          console.log('[PROXY] Raw response (first 500 chars):', data.substring(0, 500));
          res.status(500).json({ error: 'Backend error', raw: data.substring(0, 200) });
        }
        resolve();
      });
    });

    proxyReq.on('error', (err) => {
      res.status(500).json({ error: err.message });
      resolve();
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  });
}
