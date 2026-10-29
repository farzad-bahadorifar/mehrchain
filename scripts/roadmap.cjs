#!/usr/bin/env node
// Local task registry only. Never calls GitHub, runs task commands, commits or deploys.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'docs/roadmap/tasks.json');
const states = ['Ready', 'InProgress', 'Blocked', 'Done', 'Dropped'];
function validateTask(task) {
  if (/[\u0600-\u06ff]/u.test(JSON.stringify(task)))
    throw Error('Use English for task definitions, evidence and history');
  if (!/^T\d{2,}$/.test(task.id)) throw Error('Invalid stable task ID');
  for (const key of ['title', 'area', 'goal'])
    if (!task[key]?.trim()) throw Error(task.id + ': missing ' + key);
  if (
    task.title === 'One exact observable result' ||
    task.goal.startsWith('Given a precise input/trigger')
  )
    throw Error(task.id + ': replace template placeholders with the actual requested behavior');
  if (!['implementation', 'bug', 'analysis', 'verification'].includes(task.type))
    throw Error(task.id + ': invalid type');
  if (!states.includes(task.status)) throw Error(task.id + ': invalid status');
  if (!['P0', 'P1', 'P2'].includes(task.priority)) throw Error(task.id + ': invalid priority');
  for (const key of ['scope', 'outOfScope', 'inputs', 'steps', 'verify']) {
    if (
      !Array.isArray(task[key]) ||
      !task[key].length ||
      task[key].some((x) => typeof x !== 'string' || !x.trim())
    )
      throw Error(task.id + ': define ' + key);
  }
  if (
    !Array.isArray(task.contextRefs) ||
    !task.contextRefs.length ||
    task.contextRefs.some((id) => !/^D-\d{3}$/.test(id)) ||
    new Set(task.contextRefs).size !== task.contextRefs.length
  ) {
    throw Error(task.id + ': reference the applicable decisions in contextRefs');
  }
  if (!Array.isArray(task.acceptance) || !task.acceptance.length)
    throw Error(task.id + ': define acceptance');
  const ids = new Set();
  for (const check of task.acceptance) {
    if (
      !check.id ||
      ids.has(check.id) ||
      !check.text?.trim() ||
      !['pending', 'pass'].includes(check.state)
    )
      throw Error(task.id + ': invalid/duplicate criterion');
    ids.add(check.id);
    if (check.state === 'pass' && !check.evidence?.trim())
      throw Error(task.id + ': passed criterion needs evidence');
  }
  if (
    !Array.isArray(task.dependsOn) ||
    !Array.isArray(task.evidence) ||
    !Array.isArray(task.history)
  )
    throw Error(task.id + ': missing tracking arrays');
  if (
    task.status === 'Done' &&
    (task.acceptance.some((c) => c.state !== 'pass') || !task.evidence.length)
  )
    throw Error(task.id + ': cannot finish with unverified acceptance');
  if (task.status === 'Blocked' && !task.blockedReason?.trim())
    throw Error(task.id + ': specify blocker and unblock condition');
  if (task.status === 'Dropped' && !task.dropReason?.trim())
    throw Error(task.id + ': specify removal reason');
}
function validate(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.updated) || !Number.isInteger(data.lastId))
    throw Error('Date and lastId required');
  const ids = new Set(),
    issues = new Set();
  const knownContext = new Set(
    [
      ...fs
        .readFileSync(path.join(root, 'docs/roadmap/context.md'), 'utf8')
        .matchAll(/^## (D-\d{3})\r?$/gm),
    ].map((match) => match[1]),
  );
  for (const task of data.tasks) {
    validateTask(task);
    for (const ref of task.contextRefs) {
      if (!knownContext.has(ref)) throw Error(task.id + ': unknown context decision ' + ref);
    }
    if (ids.has(task.id)) throw Error('Duplicate ID ' + task.id);
    ids.add(task.id);
    if (task.issue) {
      if (issues.has(task.issue)) throw Error('Duplicate issue ' + task.issue);
      issues.add(task.issue);
    }
  }
  for (const task of data.tasks) {
    for (const dep of task.dependsOn) {
      if (dep === task.id || !ids.has(dep)) throw Error(task.id + ': invalid dependency ' + dep);
      if (task.status === 'Done' && data.tasks.find((t) => t.id === dep).status !== 'Done')
        throw Error(task.id + ': completion depends on unfinished ' + dep);
    }
  }
  const visit = (id, stack = new Set()) => {
    if (stack.has(id)) throw Error('Dependency cycle ' + id);
    const next = new Set(stack).add(id);
    for (const dep of data.tasks.find((t) => t.id === id).dependsOn) visit(dep, next);
  };
  for (const task of data.tasks) visit(task.id);
  return data;
}
function transition(data, id, to, evidence, reason) {
  const task = data.tasks.find((t) => t.id === id);
  if (!task) throw Error('Unknown task ' + id);
  if (['Done', 'Dropped'].includes(task.status))
    throw Error('Closed task is immutable; create a linked follow-up instead');
  if (!states.includes(to)) throw Error('Invalid status');
  if (
    to === 'InProgress' &&
    task.dependsOn.some((id) => data.tasks.find((t) => t.id === id).status !== 'Done')
  )
    throw Error('Dependencies must be Done');
  const updated = JSON.parse(JSON.stringify(task));
  updated.status = to;
  if (evidence) updated.evidence.push(evidence);
  if (to === 'Blocked') updated.blockedReason = reason;
  else delete updated.blockedReason;
  if (to === 'Dropped') updated.dropReason = reason;
  updated.history.push({
    date: data.updated,
    event: to,
    evidence: evidence || reason || 'Status updated',
  });
  validateTask(updated);
  if (to !== 'Blocked') delete task.blockedReason;
  Object.assign(task, updated);
  return task;
}
const list = (items) => items.map((x) => '- ' + x).join('\n');
const cell = (x) => String(x).replaceAll('|', '\\|').replaceAll('\n', ' ');
function card(task) {
  const context = task.contextRefs
    .map((ref) => `[${ref}](../context.md#${ref.toLowerCase()})`)
    .join(', ');
  return `# ${task.id} — ${task.title}\n\n<!-- Generated from tasks.json; edit registry, then node scripts/roadmap.cjs render. -->\n\nStatus: **${task.status}** · Type: ${task.type} · Area: ${task.area} · Priority: ${task.priority}\n\nIssue: ${task.issue || 'Not linked; owner will create/link the issue.'}\n\n## Read first — known decisions and constraints\n\n${context}\n\nRead these before investigating; do not repeat a known blocked route without its stated reopening trigger. [Product direction](../direction.md).\n\n## One observable result\n\n${task.goal}\n\n## In scope\n\n${list(task.scope)}\n\n## Out of scope\n\n${list(task.outOfScope)}\n\n## Start here / inputs\n\n${list(task.inputs)}\n\n## Steps\n\n${task.steps.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n## Acceptance — every item must pass\n\n${task.acceptance.map((c) => `- [${c.state === 'pass' ? 'x' : ' '}] **${c.id}** ${c.text}${c.evidence ? ' — Evidence: ' + c.evidence : ''}`).join('\n')}\n\n## Verify\n\n${list(task.verify)}\n\n## Dependencies / blocker\n\n${task.dependsOn.join(', ') || 'None.'}${task.blockedReason ? '\n\n' + task.blockedReason : ''}\n\n## Evidence\n\n${task.evidence.length ? list(task.evidence) : 'No completion evidence recorded.'}\n\n## History\n\n${task.history.map((h) => `- ${h.date}: ${h.event} — ${h.evidence}`).join('\n')}\n`;
}
function render(data) {
  validate(data);
  const dir = path.join(root, 'docs/roadmap');
  fs.mkdirSync(path.join(dir, 'tasks'), { recursive: true });
  for (const task of data.tasks)
    fs.writeFileSync(path.join(dir, 'tasks', task.id + '.md'), card(task));
  const active = data.tasks.filter((t) => !['Done', 'Dropped'].includes(t.status));
  const table = (tasks) =>
    tasks
      .map(
        (t) =>
          `| [${t.id}](roadmap/tasks/${t.id}.md) | ${cell(t.title)} | ${t.type} | ${t.status} | ${t.priority} |`,
      )
      .join('\n');
  const intro = fs
    .readFileSync(path.join(dir, 'index-intro.md'), 'utf8')
    .replace(/\]\(([^)]+)\)/g, (match, target) =>
      /^(?:[a-z]+:|#)/i.test(target) ? match : `](${path.posix.join('roadmap', target)})`,
    );
  fs.writeFileSync(
    path.join(root, 'docs/development_roadmap.md'),
    intro +
      `\n\n## Active queue\n\n| ID | Exact outcome | Type | Status | Priority |\n| --- | --- | --- | --- | --- |\n${table(active) || '| — | Queue is empty | — | — | — |'}\n\nUpdated: ${data.updated}, Asia/Tehran. Next ID: T${String(Math.max(data.lastId, ...data.tasks.map((t) => Number(t.id.slice(1)))) + 1).padStart(2, '0')}.\n\nThis table is generated; [tasks.json](roadmap/tasks.json) owns task status.\n`,
  );
  const closed = data.tasks.filter((t) => t.status === 'Done');
  fs.writeFileSync(
    path.join(dir, 'completed.md'),
    '# Completed work\n\nOnly the stated deliverable is Done. A local-code task does not claim deployment/device acceptance.\n\n' +
      closed.map((t) => `- [${t.id} — ${t.title}](tasks/${t.id}.md): ${t.goal}`).join('\n') +
      '\n\nEarlier implementation/acceptance records remain in [legacy disposition](legacy.md) and linked history.\n',
  );
  const dropped = data.tasks.filter((t) => t.status === 'Dropped');
  fs.writeFileSync(
    path.join(dir, 'dropped.md'),
    '# Withdrawn tasks\n\nWithdrawn is not Done. IDs and reasons remain available for traceability.\n\n' +
      (dropped
        .map((t) => `- [${t.id} — ${t.title}](tasks/${t.id}.md): ${t.dropReason}`)
        .join('\n') || 'No new atomic tasks have been withdrawn.') +
      '\n\nHistorical umbrella definitions: [legacy.md](legacy.md).\n',
  );
}
function main(argv) {
  const [command, ...args] = argv;
  const option = (name) => {
    const i = args.indexOf('--' + name);
    return i < 0 ? undefined : args[i + 1];
  };
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (command === 'validate') {
    validate(data);
    const checked = require('./check-project-language.cjs').checkProjectLanguage();
    console.log('Roadmap valid: ' + data.tasks.length + ' atomic tasks');
    console.log(
      'English-only authored material checked: ' +
        checked +
        ' files; original README poem preserved.',
    );
    return;
  }
  if (command !== 'render') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(option('date') || ''))
      throw Error('Supply --date YYYY-MM-DD using the current Tehran date');
    data.updated = option('date');
  }
  if (command === 'add') {
    const supplied = JSON.parse(fs.readFileSync(path.resolve(option('file')), 'utf8'));
    if (
      data.tasks.some(
        (t) => t.title.toLowerCase() === supplied.title?.toLowerCase() && t.area === supplied.area,
      )
    )
      throw Error('Duplicate topic; inspect existing task');
    if (supplied.id) throw Error('Do not assign an ID manually');
    const id =
      'T' +
      String(Math.max(data.lastId, ...data.tasks.map((t) => Number(t.id.slice(1)))) + 1).padStart(
        2,
        '0',
      );
    const task = {
      ...supplied,
      id,
      status: 'Ready',
      issue: supplied.issue || null,
      evidence: [],
      history: [
        { date: data.updated, event: 'Ready', evidence: 'Explicit task definition supplied.' },
      ],
    };
    validateTask(task);
    data.tasks.push(task);
    data.lastId = Number(id.slice(1));
  } else if (command === 'status')
    transition(data, option('id'), option('to'), option('evidence'), option('reason'));
  else if (command === 'record') {
    const task = data.tasks.find((t) => t.id === option('id'));
    if (!task || ['Done', 'Dropped'].includes(task.status))
      throw Error('Task is unknown or closed');
    const criterion = task.acceptance.find((c) => c.id === option('check'));
    if (!criterion || !option('evidence')) throw Error('Known check and evidence required');
    criterion.state = 'pass';
    criterion.evidence = option('evidence');
    task.history.push({
      date: data.updated,
      event: 'Verified ' + criterion.id,
      evidence: criterion.evidence,
    });
  } else if (command === 'link') {
    const task = data.tasks.find((t) => t.id === option('id'));
    if (!task || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(option('issue') || ''))
      throw Error('Known task and issue URL required');
    task.issue = option('issue');
    task.history.push({ date: data.updated, event: 'Issue linked', evidence: task.issue });
  } else if (command !== 'render')
    throw Error(
      'Use validate | render | add --file | record --id --check --evidence | status --id --to [--evidence] [--reason] | link --id --issue',
    );
  validate(data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  render(data);
  console.log('Roadmap updated locally. No GitHub operation performed.');
}
module.exports = { validateTask, validate, transition };
if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
