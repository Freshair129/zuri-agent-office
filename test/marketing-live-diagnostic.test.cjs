'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { sessionEvents, emptyFinalEvidence, taskFinal, contractInstructions, assessOutputContract } = require('../tools/verify-marketing-live.cjs');

const hero = 'Headline\nOrganize client tasks\nSubheading\nGroup tasks by client and see a daily checklist.\nCTA\nView the demo\nSources and unknowns\nSource: product context. Pricing unknown.';
const answer = letter => hero + (letter === 'B' ? '\nEdits\n1. Shortened the headline.\n2. Made the features explicit.' : '') + `\nQA_TASK_${letter}_DONE`;

test('new output contract assesses complete A and B layouts without claiming factuality', () => {
  for (const letter of ['A', 'B']) {
    const checks = assessOutputContract(answer(letter), letter);
    assert.ok(Object.values(checks).every(Boolean));
    assert.equal(checks.factuality, undefined);
  }
  const markdown = answer('A').replace('Headline\n', '## Headline\n').replace('CTA\n', '**CTA:**\n');
  // Plain or Markdown section labels are presentation, not different tasks.
  assert.equal(assessOutputContract(markdown, 'A').contractLayout, true);
});

test('missing, empty, duplicate, reordered and extra sections cannot pass the output contract', () => {
  for (const text of [answer('A').replace('Subheading\n', ''), answer('A').replace('Headline\nOrganize client tasks', 'Headline'),
    answer('A').replace('CTA\n', 'Headline\nAnother draft\nCTA\n'), answer('A').replace('CTA\n', '## Bonus\nMore\nCTA\n'),
    answer('A').replace('Headline\n', 'CTA\n'), answer('A').replace('QA_TASK_A_DONE', 'Edits\n1. Extra\nQA_TASK_A_DONE')]) {
    const checks = assessOutputContract(text, 'A');
    assert.equal(Object.values(checks).every(Boolean), false, text);
  }
});

test('inline bold section labels preserve their actual content and CTA', () => {
  const inline = answer('B').replace('Headline\n', '**Headline:** ').replace('Subheading\n', '**Subheading:** ').replace('CTA\n', '**CTA:** ')
    .replace('Sources and unknowns\n', '**Sources and unknowns**\n').replace('Edits\n', '**Edits**\n');
  assert.ok(Object.values(assessOutputContract(inline, 'B')).every(Boolean));
});

test('bold prose mentioning a label is not itself a section heading', () => {
  const prose = answer('A').replace('Headline\n', '**Headline ideas are useful**\n');
  assert.equal(assessOutputContract(prose, 'A').contractLayout, false);
});

test('B requires exactly two nonempty numbered explanations, not three or a forged count', () => {
  for (const edits of ['1. One', '1. One\n2. Two\n3. Three', '1. One\n2. Two\n3) Three',
    '1. One\n1. Two', '1. One\n2.', 'Intro\n1. One\n2. Two']) {
    assert.equal(assessOutputContract(hero + '\nEdits\n' + edits + '\nQA_TASK_B_DONE', 'B').exactlyTwoEdits, false, edits);
  }
});

test('CTA elsewhere and markers embedded, duplicated or missing do not satisfy literal fields', () => {
  assert.equal(assessOutputContract(answer('A').replace('CTA\nView the demo', 'CTA\nClick here') + '\nView the demo', 'A').exactCta, false);
  for (const text of [answer('A').replace('QA_TASK_A_DONE', ''), answer('A').replace('QA_TASK_A_DONE', 'Done QA_TASK_A_DONE'),
    answer('A').replace('Source:', 'QA_TASK_A_DONE Source:'), answer('A') + '\nMore text']) {
    assert.equal(assessOutputContract(text, 'A').marker, false);
  }
});

test('contract prompt distinguishes examples from evidence and does not supply marketing answers or a CTA', () => {
  for (const letter of ['A', 'B']) {
    const prompt = contractInstructions(letter);
    assert.ok(prompt.includes('examples are not facts') || prompt.includes('are not facts about this product'));
    assert.ok(prompt.includes(`QA_TASK_${letter}_DONE`));
    assert.ok(!prompt.includes('View the demo'));
    assert.ok(!prompt.includes('Amazon'));
  }
});

test('contract assessment retains missing-read and marker failures under exact task identity', () => {
  const { events, request } = completedTask();
  events.at(-1).part.text = answer('A');
  const scoped = { ...request, outputContract: '0.1.0', letter: 'A' };
  assert.equal(taskFinal(events, scoped).result, 'AUTOMATED_CHECKS_PASS');
  events.splice(1, 1);
  assert.equal(taskFinal(events, scoped).checks.skillRead, false);
  assert.equal(taskFinal(events, scoped).result, 'FAIL');
  events.at(-1).part.text = answer('A').replace('QA_TASK_A_DONE', '');
  assert.equal(taskFinal(events, scoped).checks.marker, false);
  assert.equal(taskFinal(events, scoped).usableDraft, true);
  events.at(-1).message.parentID = 'unrelated';
  assert.equal(taskFinal(events, scoped), null);
});

function fixture() {
  const message = { role: 'assistant', finish: 'stop', time: { created: 10000, completed: 12000 } };
  return {
    events: ['step-start', 'reasoning', 'step-finish'].map((type, index) => ({ messageId: 'msg-final', sessionId: 'session-1', at: 10000 + index, message, part: { type } })),
    records: [{ sequence: 4, phase: 'A', sessionId: 'session-1', path: '/v1/chat/completions', completion: 'end', statusCode: 200,
      parseErrors: 0, contentCharacters: 0, reasoningCharacters: 69, toolCalls: [], finishReasons: ['stop'],
      startedAt: new Date(10001).toISOString(), completedAt: new Date(11990).toISOString() }],
    windows: [{ task: 'A', start: 9000, end: 13000 }]
  };
}
function correlate(input) { return emptyFinalEvidence(input.events, input.records, 'session-1', input.windows); }
function completedTask() {
  const request = { sessionId: 's1', prompt: 'QA_TASK_A exact instruction', start: 100, skillPath: 'O:/qa/skill.md',
    contextPath: 'O:/qa/context.md', marker: 'QA_TASK_A_DONE', model: 'qwen3.5:4b' };
  const assistant = { role: 'assistant', parentID: 'user-a', finish: 'stop', time: { created: 105, completed: 110 }, providerID: 'local', modelID: request.model };
  const event = (id, part, message = assistant) => ({ sessionId: 's1', messageId: id, at: 105, part, message });
  return { request, events: [event('user-a', { type: 'text', text: request.prompt }, { role: 'user' }),
    ...[request.skillPath, request.contextPath].map(filePath => event('tools', { type: 'tool', tool: 'read', state: { status: 'completed', input: { filePath } } }, { ...assistant, finish: 'tool-calls' })),
    event('final', { type: 'text', text: 'Headline\nSubheading\nCTA: View the demo\nSources and unknowns\nQA_TASK_A_DONE' })] };
}

test('a completed exact-parent response without a marker is output, but remains a failed task', () => {
  const { events, request } = completedTask();
  assert.equal(taskFinal(events, request).result, 'AUTOMATED_CHECKS_PASS');
  events.at(-1).part.text = events.at(-1).part.text.replace('QA_TASK_A_DONE', '');
  const result = taskFinal(events, request);
  assert.equal(result.checks.outputPresent, true); assert.equal(result.checks.marker, false);
  assert.equal(result.usableDraft, true); assert.equal(result.result, 'FAIL'); assert.equal(result.factuality, 'NOT_RUN');
});

test('background, other-session, ambiguous and incomplete replies cannot satisfy task completion', () => {
  for (const mutate of [e => { e.message.parentID = 'inbox'; }, e => { e.sessionId = 'other'; },
    e => { delete e.message.time.completed; }, e => { e.message.finish = 'tool-calls'; }]) {
    const { events, request } = completedTask(); mutate(events.at(-1)); assert.equal(taskFinal(events, request), null);
  }
  const { events, request } = completedTask();
  events.push({ ...events[0], messageId: 'duplicate-user' });
  assert.equal(taskFinal(events, request), null);
});

test('empty terminal response is detected as empty, and tool-only text cannot become final output', () => {
  const { events, request } = completedTask();
  events.at(-1).part = { type: 'reasoning', text: 'not an answer QA_TASK_A_DONE' };
  const empty = taskFinal(events, request);
  assert.equal(empty.checks.outputPresent, false); assert.equal(empty.usableDraft, false); assert.equal(empty.result, 'FAIL');
  events.at(-1).part = { type: 'tool', tool: 'read', state: { output: 'Headline QA_TASK_A_DONE', status: 'completed' } };
  assert.equal(taskFinal(events, request), null);
});

test('missing actual reads, sections, wrong model and truncated replies retain independent failures', () => {
  const { events, request } = completedTask();
  events.splice(1, 2);
  events.at(-1).part.text = 'Headline\nCTA: View the demo\nQA_TASK_A_DONE';
  events.at(-1).message.modelID = 'wrong'; events.at(-1).message.finish = 'length';
  const result = taskFinal(events, request);
  assert.equal(result.checks.outputPresent, true); assert.equal(result.checks.marker, true);
  for (const check of ['contextRead', 'skillRead', 'sections', 'localModel', 'terminalStop']) assert.equal(result.checks[check], false);
  assert.equal(result.result, 'FAIL');
});

test('B completion and reads are bound to its own parent in the same session', () => {
  const { events, request } = completedTask();
  const b = { ...request, prompt: 'QA_TASK_B exact instruction', marker: 'QA_TASK_B_DONE', start: 200 };
  assert.equal(taskFinal(events, b), null);
  events.push({ ...events[0], messageId: 'user-b', at: 201, part: { type: 'text', text: b.prompt } });
  events.push({ ...events[3], messageId: 'answer-b', at: 205, message: { ...events[3].message, parentID: 'user-b', time: { created: 205, completed: 210 } },
    part: { type: 'text', text: events[3].part.text.replace('QA_TASK_A_DONE', 'QA_TASK_B_DONE') } });
  const result = taskFinal(events, b);
  assert.equal(result.parentMessageId, 'user-b'); assert.equal(result.sessionId, request.sessionId);
  assert.equal(result.checks.contextRead, false); assert.equal(result.checks.skillRead, false);
});
function removeFixture(dir) {
  assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(dir).startsWith('zuri-diagnostic-'));
  fs.rmSync(dir, { recursive: true, force: true });
}

test('empty-final control gate requires matching phase, session, timing and terminal response', () => {
  const data = fixture(), result = correlate(data);
  assert.equal(result.length, 1); assert.equal(result[0].messageId, 'msg-final'); assert.equal(result[0].wireSequence, 4);
  for (const change of [
    { phase: 'bootstrap' }, { sessionId: 'another-session' }, { startedAt: new Date(9999).toISOString() },
    { completedAt: new Date(15000).toISOString() }, { contentCharacters: 20 }, { reasoningCharacters: 0 },
    { completion: 'client-disconnect' }, { parseErrors: 1 }, { statusCode: 500 }, { finishReasons: ['length'] },
    { toolCalls: [{ id: 'pending-tool' }] }
  ]) assert.deepEqual(correlate({ ...data, records: [{ ...data.records[0], ...change }] }), [], JSON.stringify(change));
});

test('CLI nonempty text and ambiguous wire matches cannot authorize control', () => {
  const data = fixture();
  assert.deepEqual(correlate({ ...data, events: [...data.events, { ...data.events[0], part: { type: 'text', text: 'Actual answer' } }] }), []);
  assert.deepEqual(correlate({ ...data, records: [...data.records, { ...data.records[0], sequence: 5 }] }), []);
});

test('a later actual answer supersedes an earlier empty stop within the task window', () => {
  const data = fixture();
  data.events.push({ ...data.events[0], messageId: 'msg-later', at: 12500,
    message: { role: 'assistant', finish: 'stop', time: { created: 12400, completed: 12900 } }, part: { type: 'text', text: 'Final answer' } });
  assert.deepEqual(correlate(data), []);
});

test('SQLite extraction keeps message IDs and exact workspace scope; busy/init states remain pending', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-diagnostic-test-'));
  const database = path.join(dir, 'fixture.db'), db = new DatabaseSync(database);
  t.after(() => { db.close(); removeFixture(dir); });
  assert.equal(sessionEvents(database, dir).pending, 'initializing schema');
  db.exec('CREATE TABLE session(id TEXT,directory TEXT,title TEXT); CREATE TABLE message(id TEXT,data TEXT); CREATE TABLE part(id TEXT,message_id TEXT,session_id TEXT,time_created INTEGER,data TEXT);');
  db.prepare('INSERT INTO session VALUES(?,?,?)').run('s1', dir, 'QA');
  db.prepare('INSERT INTO session VALUES(?,?,?)').run('s2', dir + '-other', 'Other');
  db.prepare('INSERT INTO message VALUES(?,?)').run('m1', JSON.stringify({ role: 'assistant', finish: 'stop' }));
  db.prepare('INSERT INTO part VALUES(?,?,?,?,?)').run('p1', 'm1', 's1', 123, JSON.stringify({ type: 'text', text: 'fixture' }));
  db.prepare('INSERT INTO part VALUES(?,?,?,?,?)').run('p2', 'm1', 's2', 124, JSON.stringify({ type: 'text', text: 'other' }));
  const result = sessionEvents(database, dir);
  assert.equal(result.sessions.length, 1); assert.equal(result.events.length, 1); assert.equal(result.events[0].messageId, 'm1');
  db.exec('BEGIN EXCLUSIVE');
  try { assert.equal(sessionEvents(database, dir).pending, 'database busy'); } finally { db.exec('ROLLBACK'); }
  assert.equal(sessionEvents(database, dir).events.length, 1);
});

test('corrupt database remains an error rather than a pending or successful check', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-diagnostic-corrupt-'));
  t.after(() => removeFixture(dir));
  const database = path.join(dir, 'fixture.db'); fs.writeFileSync(database, 'not a database');
  assert.throws(() => sessionEvents(database, dir), /database/i);
});
