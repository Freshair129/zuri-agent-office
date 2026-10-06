'use strict';
// Approved candidate v0.1.0: one Plain attempt, then one manually gated Zuri attempt.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const comparison = require('./verify-marketing-comparison.cjs'), live = require('./verify-marketing-live.cjs');
const root = path.resolve(__dirname, '..'), receipt = path.join(root, 'output/marketing-live-current.json');
const MODEL = 'qwen3.5:9b', DIGEST = '6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7';
const MANIFEST = 'O:/.ollama/models/manifests/registry.ollama.ai/library/qwen3.5/9b';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const sha = p => hash(fs.readFileSync(p));
const save = (p, value) => fs.writeFileSync(p, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
function assertCandidate(info, manifestDigest) {
  assert.equal(info.candidate, '0.1.0'); assert.equal(info.snapshotVersion, '5.0.6');
  assert.equal(info.model, MODEL); assert.equal(info.modelDigest, DIGEST); assert.equal(manifestDigest, DIGEST);
  assert.equal(info.context, 32768); assert.equal(info.diagnosticMode, 'baseline');
  assert.equal(info.outputContract, '0.1.0'); assert.equal(info.compatibility, true);
  assert.equal(info.endpoint, 'http://127.0.0.1:11438/v1'); assert.equal(info.appEndpoint, 'http://127.0.0.1:11439/v1');
  assert.equal(info.appVersion, '0.5.1'); assert.equal(info.cliVersion, '1.18.34');
}
function verify(info) {
  assertCandidate(info, sha(MANIFEST));
  const integrity = comparison.verifyInputs(info);
  const loadTs = require('../test/load-ts.cjs');
  const expected = loadTs('src/shared/localProvider.ts').buildOpenCodeLocalConfig({ baseUrl: info.appEndpoint, model: MODEL, autoMode: false, hasKey: false,
    localThinkingOverride: { baseUrl: info.appEndpoint, model: MODEL, reasoningEffort: 'none' } });
  assert.deepEqual(read(path.join(info.dir, 'provider-control.json')), expected);
  return integrity;
}
function automaticGate(info, report, events, records, outputs) {
  assert.equal(report.result, 'AWAITING_CONTENT_AND_VISUAL_REVIEW');
  assert.ok(report.completedAt && report.ptyClosed && report.recorderClosed);
  assert.deepEqual(report.errors, []); assert.deepEqual(report.contamination, []);
  assert.equal(events.sessions.length, 1); assert.equal(events.sessions[0].id, report.sessionId);
  assert.equal(report.loadedModel?.digest, DIGEST); assert.equal(report.loadedModel?.context_length, 32768);
  assert.deepEqual(report.tasks.map(t => t.task), ['A', 'B']);
  const outputHashes = {};
  for (const task of report.tasks) {
    assert.equal(task.result, 'AUTOMATED_CHECKS_PASS');
    assert.equal(outputs[task.task], task.final); outputHashes[task.task] = hash(task.final);
    assert.ok(Object.values(task.checks).every(v => v === true));
  }
  const requests = records.filter(r => r.path === '/v1/chat/completions');
  assert.ok(requests.length > 0);
  for (const r of requests) {
    assert.equal(r.model, info.model); assert.equal(r.mode, 'baseline');
    assert.equal(r.reasoningEffort, 'none'); assert.equal(r.forwardedReasoningEffort, 'none');
    assert.equal(r.statusCode, 200); assert.equal(r.parseErrors, 0); assert.equal(r.reasoningCharacters, 0);
    assert.equal(r.completion, 'end');
  }
  return { sessionId: report.sessionId, outputHashes };
}
function plainEvidence(info) {
  const dir = path.join(info.dir, 'plain'), report = read(path.join(dir, 'live-result.json'));
  const events = read(path.join(dir, 'qa-session-events.json'));
  const records = fs.readFileSync(path.join(dir, 'wire-metadata.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  const outputs = Object.fromEntries(['A', 'B'].map(t => [t, fs.readFileSync(path.join(dir, `task-${t}-output.md`), 'utf8')]));
  const binding = automaticGate(info, report, events, records, outputs);
  for (const letter of ['A', 'B']) {
    const task = report.tasks.find(t => t.task === letter), window = report.taskWindows.find(t => t.task === letter);
    const observed = live.taskFinal(events.events, { sessionId: report.sessionId, prompt: fs.readFileSync(info.prompts[letter].path, 'utf8'), start: window.start,
      skillPath: info.commonSkills['marketing:' + (letter === 'A' ? 'copywriting' : 'copy-editing')].path, contextPath: info.contextPath,
      marker: `QA_TASK_${letter}_DONE`, model: MODEL, outputContract: info.outputContract, letter });
    assert.equal(observed?.result, 'AUTOMATED_CHECKS_PASS'); assert.equal(observed.final, task.final);
    assert.equal(observed.parentMessageId, task.parentMessageId);
  }
  assert.ok(!/truncating input prompt/i.test(fs.readFileSync(path.join(info.dir, 'ollama.stderr.log'), 'utf8')));
  return { ...binding, reportSha256: sha(path.join(dir, 'live-result.json')), eventsSha256: sha(path.join(dir, 'qa-session-events.json')),
    wireSha256: sha(path.join(dir, 'wire-metadata.jsonl')), contextSha256: sha(info.contextPath) };
}
function reviewGate(review, binding) {
  assert.equal(review.result, 'PASS'); assert.deepEqual(review.binding, binding);
  assert.ok(typeof review.reviewedAt === 'string' && Number.isFinite(Date.parse(review.reviewedAt)));
  assert.ok(typeof review.reviewer === 'string' && review.reviewer.trim());
  for (const key of ['groundingA', 'groundingB', 'editAccuracyB']) {
    assert.equal(review[key]?.result, 'PASS'); assert.ok(typeof review[key].evidence === 'string' && review[key].evidence.trim());
  }
}
function verifyZuriGate(info) {
  verify(info);
  const report = read(path.join(info.dir, 'candidate-plain-result.json'));
  assert.equal(report.result, 'AWAITING_MANUAL_REVIEW');
  assert.ok(fs.existsSync(path.join(info.dir, 'candidate.attempt')) && fs.existsSync(path.join(info.dir, 'plain.attempt')));
  const binding = plainEvidence(info);
  reviewGate(read(path.join(info.dir, 'plain-content-review.json')), binding);
  return binding;
}
async function preflight(info) {
  verify(info); await live.probe(info);
  const get = async p => { const r = await fetch('http://127.0.0.1:11438/api/' + p, { signal: AbortSignal.timeout(5000) }); assert.ok(r.ok); return r.json(); };
  assert.equal((await get('version')).version, '0.35.1');
  assert.equal((await get('tags')).models.find(m => m.name === MODEL)?.digest, DIGEST);
  assert.ok(!await live.portInUse(11439), 'Recorder port must be free');
}
async function main() {
  assert.ok(process.argv.length === 3 && ['--prepare', '--plain', '--zuri'].includes(process.argv[2]), 'Choose --prepare, --plain or --zuri; no retries');
  if (process.argv[2] === '--prepare') {
    assert.equal(sha(MANIFEST), DIGEST, 'Installed candidate manifest mismatch; no download');
    const info = await comparison.prepare({ candidate: true }); verify(info);
    const previous = read(path.join(info.dir, 'previous-receipt.json'));
    const differences = {};
    for (const letter of ['A', 'B']) {
      const oldText = fs.readFileSync(previous.prompts[letter].path, 'utf8'), newText = fs.readFileSync(info.prompts[letter].path, 'utf8');
      assert.equal(oldText.split(previous.dir).join(info.dir), newText, 'Prompt changed beyond fresh fixture root');
      differences[letter] = { historical: previous.prompts[letter].sha256, candidate: info.prompts[letter].sha256, change: 'fresh absolute fixture root only' };
    }
    assert.equal(sha(info.contextPath), sha(previous.contextPath));
    save(path.join(info.dir, 'candidate-controls.json'), { manifest: MANIFEST, manifestSha256: sha(MANIFEST), promptDifferences: differences, integrity: verify(info) });
    return;
  }
  const info = read(receipt); await preflight(info);
  if (process.argv[2] === '--plain') {
    comparison.claim(info.dir, 'candidate');
    fs.copyFileSync(__filename, path.join(info.dir, 'executed-candidate-plain.cjs'));
    fs.copyFileSync(path.join(__dirname, 'verify-marketing-comparison.cjs'), path.join(info.dir, 'executed-comparison.cjs'));
    fs.copyFileSync(path.join(__dirname, 'marketing-wire-recorder.cjs'), path.join(info.dir, 'executed-recorder.cjs'));
    const plain = await comparison.plain(info);
    const result = { result: 'FAIL', plain, zuri: { result: 'NOT_RUN' }, maximumSessions: 2, qaServerCleanup: 'PENDING_USER_STOP' };
    try { result.binding = plainEvidence(info); result.integrityAfter = verify(info); result.result = 'AWAITING_MANUAL_REVIEW'; }
    catch (error) { result.gateFailure = error.message; result.zuri.reason = 'Plain did not qualify; experiment ends'; }
    result.completedAt = new Date().toISOString(); save(path.join(info.dir, 'candidate-plain-result.json'), result);
    console.log(JSON.stringify({ result: result.result, dir: info.dir, gateFailure: result.gateFailure })); return;
  }
  verifyZuriGate(info); comparison.claim(info.dir, 'zuri');
  fs.copyFileSync(__filename, path.join(info.dir, 'executed-candidate-zuri.cjs'));
  const dir = path.join(info.dir, 'zuri'); fs.mkdirSync(path.join(dir, 'harness'));
  fs.writeFileSync(path.join(dir, 'idle-coordinator.cjs'), 'setInterval(() => {}, 1000); process.stdin.resume();\n', { flag: 'wx' });
  const armReceipt = path.join(dir, 'run-receipt.json');
  save(armReceipt, { ...info, dir, comparisonWorkspace: path.join(info.dir, 'project'), ollamaLogDir: info.dir });
  const log = fs.openSync(path.join(dir, 'runner.log'), 'wx');
  let exitCode, failure;
  try { exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'verify-marketing-live.cjs'), '--comparison-receipt', armReceipt], { cwd: root, windowsHide: true, stdio: ['ignore', log, log] });
    child.once('error', reject); child.once('exit', resolve);
  }); } catch (error) { failure = error.message; } finally { fs.closeSync(log); }
  save(path.join(info.dir, 'candidate-zuri-result.json'), { result: 'AWAITING_REVIEW', exitCode, failure, qaServerCleanup: 'PENDING_USER_STOP',
    zuri: fs.existsSync(path.join(dir, 'live-result.json')) ? read(path.join(dir, 'live-result.json')) : { result: 'FAIL', reason: 'Attempt consumed without final evidence' }, completedAt: new Date().toISOString() });
}
if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 1; });
module.exports = { assertCandidate, automaticGate, reviewGate, verifyZuriGate };
