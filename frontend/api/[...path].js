// NOTE: This file is a Vercel serverless proxy for PRODUCTION deployment only.
// It is NOT needed for local development (localhost with XAMPP/WAMP).
// When running locally, requests go directly to http://localhost/exam-duty/backend/api
// and this file is ignored entirely.

const https = require('https');

export default async function handler(req, res) {
  // Get the file path from URL segments
  const pathSegments = req.url.split('/api/')[1] || '';

  // Build target URL
  const targetUrl = `https://midnightblue-woodcock-705637.hostingersite.com/backend/api/${pathSegments}`;

  console.log('[PROXY] →', req.method, targetUrl);

  const body = req.method !== 'GET' ? JSON.stringify(req.body) : null;

  const urlObj = new URL(targetUrl);

  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {}),
      ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    },
  };

  return new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        console.log('[PROXY] Status:', proxyRes.statusCode);
        console.log('[PROXY] Raw:', data.substring(0, 200));
        try {
          res.status(proxyRes.statusCode).json(JSON.parse(data));
        } catch(e) {
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
