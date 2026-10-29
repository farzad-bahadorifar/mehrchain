const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { inspectText } = require('./check-project-language.cjs');
const root = path.resolve(__dirname, '..');
const policy = JSON.parse(
  fs
    .readFileSync(path.join(root, 'docs/roadmap/language-policy.json'), 'utf8')
    .replace(/^\uFEFF/, ''),
);
test('preserves the exact poem while rejecting extra non-English README prose', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.doesNotThrow(() => inspectText('README.md', readme, policy));
  assert.throws(
    () => inspectText('README.md', readme + '\n\u0645\u062a\u0646', policy),
    /use English/,
  );
  assert.throws(
    () =>
      inspectText(
        'README.md',
        readme.replace(policy.startMarker, policy.startMarker + 'changed'),
        policy,
      ),
    /poem was changed/,
  );
});
test('permits Unicode English punctuation but rejects Persian-script project prose', () => {
  assert.doesNotThrow(() => inspectText('docs/example.md', 'Read first — scope → result.', policy));
  assert.throws(() => inspectText('docs/example.md', '\u0645\u062a\u0646', policy), /use English/);
});
