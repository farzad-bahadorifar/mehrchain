#!/usr/bin/env node
// Check the emitted document, not just the Angular optimization setting.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const directory = path.resolve(process.argv[2] || 'dist/mehrchain-frontend/browser');
const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
const document = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
const styles = (document.match(/<link\b[^>]*>/gi) || []).filter((link) =>
  /\brel=["']stylesheet["']/i.test(link),
);
assert.ok(styles.length, 'The application must load its complete stylesheet before first paint');
for (const link of styles) {
  assert.doesNotMatch(link, /\bonload\s*=/i, 'Do not activate application CSS asynchronously');
  const media = link.match(/\bmedia=["']([^"']*)["']/i)?.[1];
  assert.ok(
    !media || media === 'all' || media === 'screen',
    'Application CSS must block screen rendering',
  );
  const href = link.match(/\bhref=["']([^"']+)["']/i)?.[1];
  assert.ok(href && href.endsWith('.css'), 'Expected a generated local CSS file');
  assert.ok(fs.statSync(path.join(directory, href)).size > 0, 'Generated stylesheet must exist');
}
console.log(`Startup styles verified: ${styles.length} render-blocking stylesheet(s).`);
