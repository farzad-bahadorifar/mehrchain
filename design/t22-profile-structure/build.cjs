// Build a single offline HTML from prototype sources and the existing Mero/Lucide code.
const fs=require('node:fs');
const path=require('node:path');
const esbuild=require('esbuild');
const root=__dirname;
const source=path.join(root,'source');
const icons=['user','sparkles','trophy','palette','sun','moon','monitor','house','link-2','trending-up','chevron-right','chevron-down','arrow-left','check','heart','plus','flame','calendar','lock-keyhole','log-out','trash-2','refresh-cw','circle-help','award'];
const imports=icons.map((name,i)=>`import icon${i} from ${JSON.stringify(path.resolve(root,'../../../node_modules/lucide-angular/esm2020/icons',(name==='circle-help'?'info':name)+'.mjs').replaceAll('\\','/'))};`).join('\n')+`\nconst ICONS={${icons.map((name,i)=>JSON.stringify(name)+':icon'+i).join(',')}};`;
const mero=fs.readFileSync(path.resolve(root,'../../../apps/mehrchain-frontend/public/assets/mero.png')).toString('base64');
let app=fs.readFileSync(path.join(source,'app.js'),'utf8').replace('/*ICON_IMPORTS*/',imports).replace('/*MERO_DATA*/','data:image/png;base64,'+mero);
const result=esbuild.buildSync({stdin:{contents:app,resolveDir:source,sourcefile:'app.js',loader:'js'},bundle:true,write:false,platform:'browser',format:'iife',minify:true,legalComments:'inline',target:'es2022'});
let fonts='';
for(const [filename,weight] of [['Poppins-Regular.ttf',400],['Poppins-SemiBold.ttf',600]]) fonts+=`@font-face{font-family:Poppins;font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(source,filename)).toString('base64')}) format('truetype')}\n`;
const html=fs.readFileSync(path.join(source,'shell.html'),'utf8').replace('/*FONT*/',()=>fonts).replace('/*CSS*/',()=>fs.readFileSync(path.join(source,'styles.css'),'utf8')).replace('/*APP*/',()=>result.outputFiles[0].text.replaceAll('</script','<\\/script'));
new Function(result.outputFiles[0].text);
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built offline v0.2 index.html ('+Math.round(Buffer.byteLength(html)/1024)+' KiB)');
