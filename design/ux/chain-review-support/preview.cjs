// Read-only loopback review server. Product requests are not proxied.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const ux=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
 const routes={'/':'t47-chain-identity-label/index.html','/t47':'t47-chain-identity-label/index.html','/t49':'t49-invite-acceptance-card/index.html'};
 const file=routes[req.url];if(!file){res.writeHead(404);res.end('Not found');return;}
 if(!fs.existsSync(path.join(ux,file))){res.writeHead(503);res.end('Review is being prepared');return;}
 res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});fs.createReadStream(path.join(ux,file)).pipe(res);
}).listen(4185,'127.0.0.1',()=>console.log('Review: http://127.0.0.1:4185/t47'));
