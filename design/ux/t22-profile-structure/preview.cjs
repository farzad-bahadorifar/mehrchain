// Local-only static preview, no dependencies or writes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const port = Number(process.env.MEHRCHAIN_UX_PORT || 4178);
const server = http.createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
