// Check the known Persian-script restriction; English wording still needs review.
// The exact README poem and intentional Unicode test fixtures are not translated.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const scriptPattern = /[\u0600-\u06ff]/u;
const extensions = new Set([
  '.md',
  '.json',
  '.html',
  '.js',
  '.cjs',
  '.ts',
  '.css',
  '.yml',
  '.yaml',
]);
const excludedDirs = new Set([
  'node_modules',
  'tmp',
  'dist',
  'build',
  'backups',
  '.angular',
  '.nx',
]);
function inspectText(relative, source, policy) {
  let text = source;
  if (relative === policy.allowedFile) {
    const start = text.indexOf(policy.startMarker),
      end = text.indexOf(policy.endMarker);
    if (start < 0 || end < start || text.indexOf(policy.startMarker, start + 1) >= 0)
      throw Error('README must contain exactly one preserved poem block');
    const poem = text
      .slice(start + policy.startMarker.length, end)
      .replace(/^\r?\n/, '')
      .replace(/\r?\n$/, '')
      .replaceAll('\r\n', '\n');
    const hash = crypto.createHash('sha256').update(poem, 'utf8').digest('hex');
    if (hash !== policy.poemSha256) throw Error('The original Persian poem was changed');
    text = text.slice(0, start) + text.slice(end + policy.endMarker.length);
  }
  if (scriptPattern.test(text)) throw Error(relative + ': use English outside the preserved poem');
}
function checkProjectLanguage() {
  const policy = JSON.parse(
    fs
      .readFileSync(path.join(root, 'docs/roadmap/language-policy.json'), 'utf8')
      .replace(/^\uFEFF/, ''),
  );
  const files = ['README.md', 'CONTRIBUTING.md', 'AGENTS.md', 'GEMINI.md'];
  const walk = (relative) => {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const child = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) {
        if (!excludedDirs.has(entry.name)) walk(child);
      } else if (
        extensions.has(path.extname(entry.name)) &&
        !/\.(?:spec|test)\.[cm]?[jt]s$/.test(entry.name)
      )
        files.push(child);
    }
  };
  for (const folder of [
    'docs',
    'design',
    '.github',
    '.agents',
    '.gemini',
    'apps',
    'libs',
    'functions',
    'scripts',
  ]) {
    if (fs.existsSync(path.join(root, folder))) walk(folder);
  }
  for (const file of files)
    inspectText(file, fs.readFileSync(path.join(root, file), 'utf8'), policy);
  return files.length;
}
module.exports = { inspectText, checkProjectLanguage };
if (require.main === module) {
  try {
    console.log(
      'Language check passed for ' +
        checkProjectLanguage() +
        ' files; original README poem unchanged.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
