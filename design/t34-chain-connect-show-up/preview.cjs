// Loopback-only static preview. No product server, writes or API routes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.MEHRCHAIN_T34_PORT || 4184);
http.createServer((req, res) => {
  if (!['/', '/index.html'].includes(req.url)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`T34 review: http://127.0.0.1:${port}`));
