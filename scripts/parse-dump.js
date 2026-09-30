const fs = require('fs');
const d = JSON.parse(fs.readFileSync('project-dump.json', 'utf8'));

console.log('=== ALL REPO ISSUES ===');
const issues = d.data.repository.issues.nodes;
console.log(`Total issues: ${issues.length}`);
issues.forEach(i => {
  const reason = i.stateReason ? ` (${i.stateReason})` : '';
  console.log(`#${i.number} [${i.state}${reason}]: ${i.title}`);
});
