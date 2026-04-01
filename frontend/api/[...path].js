const https = require('https');
const http = require('http');

export default async function handler(req, res) {
  const path = req.query.path ? req.query.path.join('/') : '';
  const queryString = new URLSearchParams(req.query);
  queryString.delete('path');
  
  const targetUrl = `http://examduty.infinityfreeapp.com/backend/api/${path}?${queryString}`;

  const { 'content-length': _cl, 'transfer-encoding': _te, ...forwardHeaders } = req.headers;
  const options = {
    method: req.method,
    headers: {
      ...forwardHeaders,
      host: 'examduty.infinityfreeapp.com',
      'content-type': 'application/json',
    },
  };

  return new Promise((resolve) => {
    const proxyReq = http.request(targetUrl, options, (proxyRes) => {
      res.status(proxyRes.statusCode);
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      proxyRes.pipe(res);
      proxyRes.on('end', resolve);
    });

    proxyReq.on('error', (err) => {
      res.status(500).json({ error: err.message });
      resolve();
    });

    if (req.body) {
      const body = JSON.stringify(req.body);
      proxyReq.write(body);
    }
    proxyReq.end();
  });
}