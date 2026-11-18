// Build a standalone offline review artifact; never change application source.
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const qrcode = require('qrcode');
const root = __dirname;
const repo = path.resolve(root, '../../..');
const source = path.join(root, 'source');
const names = ['house', 'link-2', 'trending-up', 'user', 'heart', 'check', 'check-check', 'arrow-left', 'chevron-right', 'share-2', 'copy', 'qr-code', 'plus', 'more-vertical', 'refresh-cw', 'circle-check', 'clock', 'x', 'globe', 'book-open', 'footprints', 'sparkles'];
const imports = names.map((name, i) => `import icon${i} from ${JSON.stringify(path.join(repo, 'node_modules/lucide-angular/esm2020/icons', (name === 'more-vertical' ? 'ellipsis-vertical' : name) + '.mjs'))};`).join('\n') + `\nconst ICONS={${names.map((name, i) => JSON.stringify(name) + ':icon' + i).join(',')}};`;
const png = fs.readFileSync(path.join(repo, 'apps/mehrchain-frontend/public/assets/mero.png')).toString('base64');
const qr = qrcode.create('https://example.invalid/chain/demo-invite', { errorCorrectionLevel: 'M' });
let squares = '';
for (let y = 0; y < qr.modules.size; y++) for (let x = 0; x < qr.modules.size; x++) if (qr.modules.get(y, x)) squares += `<rect x="${x + 4}" y="${y + 4}" width="1" height="1"/>`;
const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.modules.size + 8} ${qr.modules.size + 8}"><rect width="100%" height="100%" fill="white"/><g fill="black">${squares}</g></svg>`;
const js = fs.readFileSync(path.join(source, 'app.js'), 'utf8').replace('/*ICON_IMPORTS*/', imports).replace('/*MERO_DATA*/', 'data:image/png;base64,' + png).replace('/*QR_DATA*/', 'data:image/svg+xml;base64,' + Buffer.from(qrSvg).toString('base64'));
const result = esbuild.buildSync({ stdin: { contents: js, resolveDir: source, sourcefile: 'app.js' }, bundle: true, write: false, platform: 'browser', format: 'iife', minify: true, legalComments: 'inline', target: 'es2022' });
new Function(result.outputFiles[0].text);
let fonts = '';
for (const [name, weight] of [['Poppins-Regular.ttf', 400], ['Poppins-SemiBold.ttf', 600]]) {
  const data = fs.readFileSync(path.join(root, '../t22-profile-structure/source', name)).toString('base64');
  fonts += `@font-face{font-family:Poppins;font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/ttf;base64,${data}) format('truetype')}\n`;
}
const html = fs.readFileSync(path.join(source, 'shell.html'), 'utf8').replace('/*FONTS*/', () => fonts).replace('/*STYLES*/', () => fs.readFileSync(path.join(source, 'styles.css'), 'utf8')).replace('/*APP*/', () => result.outputFiles[0].text.replaceAll('</script', '<\\/script'));
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log(`Built T34 v0.1 offline HTML (${Math.round(Buffer.byteLength(html) / 1024)} KiB)`);
