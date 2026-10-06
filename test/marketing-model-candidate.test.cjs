'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { assertCandidate, automaticGate, reviewGate } = require('../tools/verify-marketing-model-candidate.cjs');
const { claim } = require('../tools/verify-marketing-comparison.cjs');
const digest = '6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7';
const info = { candidate: '0.1.0', snapshotVersion: '5.0.6', model: 'qwen3.5:9b', modelDigest: digest, context: 32768,
  diagnosticMode: 'baseline', outputContract: '0.1.0', compatibility: true, endpoint: 'http://127.0.0.1:11438/v1', appEndpoint: 'http://127.0.0.1:11439/v1', appVersion: '0.5.1', cliVersion: '1.18.34' };
function fixture() {
  return { report: { result: 'AWAITING_CONTENT_AND_VISUAL_REVIEW', completedAt: '2026-10-06T01:00:00Z', ptyClosed: true, recorderClosed: true,
    errors: [], contamination: [], sessionId: 'plain', loadedModel: { digest, context_length: 32768 },
    tasks: ['A', 'B'].map(task => ({ task, result: 'AUTOMATED_CHECKS_PASS', final: 'output ' + task, checks: { marker: true, contextRead: true } })) },
  events: { sessions: [{ id: 'plain' }] }, outputs: { A: 'output A', B: 'output B' },
  records: [{ path: '/v1/chat/completions', model: info.model, mode: 'baseline', reasoningEffort: 'none', forwardedReasoningEffort: 'none', statusCode: 200, parseErrors: 0, reasoningCharacters: 0, completion: 'end' }] };
}
const gate = f => automaticGate(info, f.report, f.events, f.records, f.outputs);
test('candidate rejects fallback, changed digest, context, rewriting and remote endpoint', () => {
  assert.doesNotThrow(() => assertCandidate(info, digest));
  for (const patch of [{ model: 'qwen3.5:4b' }, { modelDigest: 'other' }, { context: 8192 }, { diagnosticMode: 'no-thinking' }, { endpoint: 'https://example.com/v1' }, { compatibility: false }])
    assert.throws(() => assertCandidate({ ...info, ...patch }, digest));
  assert.throws(() => assertCandidate(info, 'wrong installed manifest'));
});
test('automatic gate rejects failed, skipped, contaminated, unclosed and altered evidence', () => {
  assert.equal(gate(fixture()).sessionId, 'plain');
  for (const mutate of [f => f.report.tasks.pop(), f => f.report.tasks[1].checks.contextRead = false,
    f => f.report.tasks[0].result = 'FAIL', f => f.report.errors.push('timeout'), f => f.report.contamination.push({ tool: 'hive' }),
    f => f.report.ptyClosed = false, f => f.report.recorderClosed = false, f => f.events.sessions.push({ id: 'extra' }),
    f => f.outputs.B = 'changed', f => f.report.loadedModel.context_length = 8192, f => f.report.loadedModel.digest = 'other']) {
    const f = fixture(); mutate(f); assert.throws(() => gate(f));
  }
});
test('wire gate requires exact-model none pass-through and completed error-free responses', () => {
  for (const patch of [{ model: 'other' }, { mode: 'no-thinking' }, { reasoningEffort: null }, { forwardedReasoningEffort: null },
    { statusCode: 500 }, { parseErrors: 1 }, { reasoningCharacters: 1 }, { completion: 'aborted' }]) {
    const f = fixture(); Object.assign(f.records[0], patch); assert.throws(() => gate(f));
  }
  const f = fixture(); f.records = []; assert.throws(() => gate(f));
});
test('manual gate requires explicit grounded review bound to both actual outputs', () => {
  const binding = gate(fixture());
  const review = { result: 'PASS', binding, reviewedAt: '2026-10-06T01:00:00Z', reviewer: 'ATHER',
    groundingA: { result: 'PASS', evidence: 'Compared supplied facts with A' }, groundingB: { result: 'PASS', evidence: 'Compared supplied facts with B' },
    editAccuracyB: { result: 'PASS', evidence: 'Compared each explanation against the actual A to B diff' } };
  assert.doesNotThrow(() => reviewGate(review, binding));
  for (const key of ['groundingA', 'groundingB', 'editAccuracyB']) {
    assert.throws(() => reviewGate({ ...review, [key]: { result: 'NOT_RUN', evidence: '' } }, binding));
  }
  assert.throws(() => reviewGate({ ...review, result: 'FAIL' }, binding));
  assert.throws(() => reviewGate(review, { ...binding, outputHashes: { ...binding.outputHashes, B: 'changed' } }));
  assert.throws(() => reviewGate(review, { ...binding, sessionId: 'previous' }));
});
test('consumed attempts and failure evidence survive rejection of a repeated run', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-candidate-'));
  try {
    claim(dir, 'candidate'); claim(dir, 'plain');
    fs.writeFileSync(path.join(dir, 'failure.json'), '{"result":"FAIL"}', { flag: 'wx' });
    for (const name of ['candidate', 'plain']) assert.throws(() => claim(dir, name), { code: 'EEXIST' });
    claim(dir, 'zuri'); assert.throws(() => claim(dir, 'zuri'), { code: 'EEXIST' });
    assert.equal(fs.readFileSync(path.join(dir, 'failure.json'), 'utf8'), '{"result":"FAIL"}');
  } finally { for (const file of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, file)); fs.rmdirSync(dir); }
});
