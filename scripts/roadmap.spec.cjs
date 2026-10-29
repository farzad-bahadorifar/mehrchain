const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, transition } = require('./roadmap.cjs');
function task(id = 'T01') {
  return {
    id,
    title: 'Save draft after failed request',
    type: 'bug',
    area: 'profile',
    priority: 'P1',
    status: 'Ready',
    goal: 'Failed save keeps the entered name.',
    scope: ['Name input'],
    outOfScope: ['API changes'],
    inputs: ['profile.ts'],
    contextRefs: ['D-001'],
    steps: ['Trigger failure', 'Verify retained name'],
    acceptance: [{ id: 'A1', text: 'Name remains after 500 response', state: 'pending' }],
    verify: ['Run the failure regression'],
    dependsOn: [],
    evidence: [],
    history: [],
  };
}
const registry = (tasks = [task()]) => ({ updated: '2026-10-29', lastId: 1, tasks });
test('refuses Done until every criterion has evidence', () => {
  const data = registry();
  assert.throws(() => transition(data, 'T01', 'Done', 'report.md'), /unverified/);
  assert.equal(data.tasks[0].status, 'Ready');
  data.tasks[0].acceptance[0] = {
    ...data.tasks[0].acceptance[0],
    state: 'pass',
    evidence: 'Failure regression passed',
  };
  transition(data, 'T01', 'Done', 'report.md');
  assert.equal(data.tasks[0].status, 'Done');
  assert.throws(() => transition(data, 'T01', 'InProgress'), /immutable/);
});
test('requires concrete blocker and rejects duplicate IDs/issues', () => {
  assert.throws(() => transition(registry(), 'T01', 'Blocked'), /unblock/);
  assert.throws(() => validate(registry([task(), task()])), /Duplicate ID/);
  const a = task(),
    b = task('T02');
  a.issue = b.issue = 'https://github.com/a/b/issues/1';
  assert.throws(() => validate(registry([a, b])), /Duplicate issue/);
});
test('rejects missing inputs and cyclic dependencies', () => {
  const missing = task();
  missing.inputs = [];
  assert.throws(() => validate(registry([missing])), /inputs/);
  const a = task(),
    b = task('T02');
  a.dependsOn = ['T02'];
  b.dependsOn = ['T01'];
  assert.throws(() => validate(registry([a, b])), /cycle/);
});
test('does not start work before a declared dependency is Done', () => {
  const a = task(),
    b = task('T02');
  b.dependsOn = ['T01'];
  const data = registry([a, b]);
  assert.throws(() => transition(data, 'T02', 'InProgress'), /Dependencies/);
  assert.equal(b.status, 'Ready');
});
test('refuses untouched template text and clears a resolved blocker', () => {
  const data = registry();
  data.tasks[0].title = 'One exact observable result';
  assert.throws(() => validate(data), /placeholders/);
  data.tasks[0].title = 'Retain the name after 500 response';
  transition(data, 'T01', 'Blocked', undefined, 'Network down; unblock after endpoint responds');
  transition(data, 'T01', 'Ready', 'Endpoint returned 200');
  assert.equal(data.tasks[0].blockedReason, undefined);
});

test('requires known context so a new task cannot omit or invent prior decisions', () => {
  const data = registry();
  data.tasks[0].contextRefs = [];
  assert.throws(() => validate(data), /contextRefs/);
  data.tasks[0].contextRefs = ['D-999'];
  assert.throws(() => validate(data), /unknown context decision/);
  data.tasks[0].contextRefs = ['D-001'];
  assert.doesNotThrow(() => validate(data));
});

test('rejects non-English roadmap prose rather than generating mixed-language cards', () => {
  const data = registry();
  data.tasks[0].goal = '\u0646\u062a\u06cc\u062c\u0647';
  assert.throws(() => validate(data), /Use English/);
});
