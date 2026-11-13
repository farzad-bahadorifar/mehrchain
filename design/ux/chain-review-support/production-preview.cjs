// Serve only the local production build for an intercepted-API rendering probe.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../../dist/mehrchain-frontend/browser');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');
 let file=path.resolve(root,relative);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(4186,'127.0.0.1',()=>console.log('Local production renderer: http://127.0.0.1:4186/chain'));
