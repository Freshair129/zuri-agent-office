'use strict';
// Approved v0.1.0: one candidate and at most one reviewed correction.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const comparison = require('./verify-marketing-comparison.cjs'), candidate = require('./verify-marketing-model-candidate.cjs');
const claimBound = require('./verify-marketing-claim-bound-editing.cjs'), isolation = require('./verify-marketing-task-isolation.cjs');
const live = require('./verify-marketing-live.cjs'), contract = require('./marketing-edit-contract.cjs');
const root = path.resolve(__dirname, '..'), receipt = path.join(root, 'output/marketing-live-current.json');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));
const hash = v => crypto.createHash('sha256').update(v).digest('hex'), sha = f => hash(fs.readFileSync(f));
const save = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n', { flag: 'wx' });
const phases = ['candidate', 'correction'];
const reviewKeys = ['layout', 'actualEdits', 'sourceCoverage', 'factuality', 'reasonAccuracy'];
const archiveHash = '6ed1c14ea0eaebd219ef504333b2ea0e54c9cd859be2c9334e3c17a648b9e2c8';
const runners = ['verify-marketing-edit-repair.cjs', 'marketing-edit-contract.cjs', 'verify-marketing-comparison.cjs', 'verify-marketing-live.cjs', 'verify-marketing-model-candidate.cjs', 'verify-marketing-claim-bound-editing.cjs', 'verify-marketing-task-isolation.cjs', 'marketing-wire-recorder.cjs'];
function extraPaths(info) { return ['rejected-output.md', 'rejection-review.json'].map(f => path.join(info.dir, 'project/.qa-drafts', f)); }
function permissions(dir) {
  const value = comparison.permissionConfig(dir, true);
  for (const f of ['rejected-output.md', 'rejection-review.json']) value.read['.qa-drafts/' + f] = 'allow';
  return value;
}
function assertMode(info) {
  assert.equal(info.editRepair, '0.1.0'); assert.equal(info.snapshotVersion, '5.0.9'); assert.equal(info.outputContract, '0.2.0');
  assert.ok(!info.claimBound && !info.taskIsolation); assert.deepEqual(Object.keys(info.prompts), ['B']);
  assert.equal(info.draftPath, path.join(info.dir, 'project/.qa-drafts/task-A.md'));
  assert.equal(info.contextPath, path.join(info.dir, 'project/.agents/product-marketing.md'));
}
function priorEvidence(previous) {
  claimBound.verify(previous); assert.equal(previous.snapshotVersion, '5.0.8');
  assert.ok(read(path.join(previous.dir, 'task-B-result.json')).completedAt);
  const cleanupPath = path.join(previous.dir, 'cleanup-closure-20261006T011510558Z.json'), cleanup = read(cleanupPath);
  assert.equal(cleanup.result, 'PASS'); assert.equal(cleanup.pidPresent, false);
  assert.equal(cleanup.port11438Listening, false); assert.equal(cleanup.port11439Listening, false);
  const archive = path.join(root, 'output/playwright/Zuri-0.5.1-snapshot-5.0.8.zip'); assert.equal(sha(archive), archiveHash);
  assert.equal(cleanup.archiveSha256, archiveHash); assert.equal(cleanup.archiveUnchanged, true);
  const source = read(path.join(previous.dir, 'reused-A-evidence.json'));
  return { source, cleanupPath, archive };
}
async function prepare() {
  assert.ok(!await live.portInUse(11438) && !await live.portInUse(11439), 'Stop prior QA services first');
  const previous = read(receipt), prior = priorEvidence(previous);
  const dir = path.join(root, 'output/playwright/marketing-edit-repair-' + Date.now());
  fs.mkdirSync(dir); // New directory, never overwrite a previous run.
  for (const sub of ['project', 'temp', 'ollama-home', ...phases.flatMap(p => ['cli/config/opencode', 'cli/data', 'cli/cache', 'profile/temp', 'temp'].map(s => 'plain-' + p + '/' + s))]) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  const info = { ...previous, dir, previousDir: previous.dir, preparedAt: new Date().toISOString(), editRepair: '0.1.0', snapshotVersion: '5.0.9', outputContract: '0.2.0',
    contextPath: path.join(dir, 'project/.agents/product-marketing.md'), draftPath: path.join(dir, 'project/.qa-drafts/task-A.md'), commonSkills: {}, prompts: {}, inputHashes: {} };
  for (const key of ['claimBound', 'integrity', 'ollamaPid', 'ollamaExecutable', 'ollamaStartedAt']) delete info[key];
  const oldProject = path.join(previous.dir, 'project') + path.sep;
  for (const [file, expected] of Object.entries(previous.inputHashes)) if (file.startsWith(oldProject) && file !== path.join(previous.dir, 'project/opencode.json')) {
    assert.equal(sha(file), expected); const target = path.join(dir, 'project', path.relative(oldProject, file));
    fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(file, target, fs.constants.COPYFILE_EXCL); info.inputHashes[target] = sha(target);
  }
  fs.chmodSync(info.draftPath, 0o444);
  for (const [id, entry] of Object.entries(previous.commonSkills)) info.commonSkills[id] = { ...entry, path: path.join(dir, path.relative(previous.dir, entry.path)) };
  execFileSync('git', ['init', path.join(dir, 'project')], { stdio: 'ignore', windowsHide: true });
  const provider = read(path.join(previous.dir, 'provider-control.json'));
  for (const file of [path.join(dir, 'provider-control.json'), ...phases.map(p => path.join(dir, 'plain-' + p, 'cli/config/opencode/opencode.json'))]) { save(file, provider); info.inputHashes[file] = sha(file); }
  const config = path.join(dir, 'project/opencode.json'); save(config, { $schema: 'https://opencode.ai/config.json', autoupdate: false, permission: permissions(dir) }); info.inputHashes[config] = sha(config);
  const promptFile = path.join(dir, 'candidate-prompt.txt'); fs.writeFileSync(promptFile, contract.prompt(info.contextPath, info.commonSkills['marketing:copy-editing'].path, info.draftPath), { flag: 'wx' });
  info.prompts.B = { path: promptFile, sha256: sha(promptFile) }; info.inputHashes[promptFile] = sha(promptFile);
  const previousFile = path.join(dir, 'previous-receipt.json'); save(previousFile, previous); info.inputHashes[previousFile] = sha(previousFile);
  for (const f of [prior.cleanupPath, prior.archive, ...Object.keys(prior.source.sourceHashes), previous.draftPath, previous.contextPath]) info.inputHashes[f] = sha(f);
  const provenance = path.join(dir, 'reused-A-evidence.json'); save(provenance, prior.source); info.inputHashes[provenance] = sha(provenance);
  const controls = path.join(dir, 'edit-repair-controls.json');
  save(controls, { version: '0.1.0', outputContract: '0.2.0', maximumSessions: 2, phases, A: 'REUSED_VERIFIED_INPUT', zuri: 'NOT_RUN by design', permissions: permissions(dir), candidatePrompt: info.prompts.B,
    correction: 'Only after a hash-bound FAIL review; files do not exist before that gate', sourceBinding: prior.source.binding }); info.inputHashes[controls] = sha(controls);
  info.integrity = verify(info); save(path.join(dir, 'run-receipt.json'), info);
  fs.writeFileSync(receipt, JSON.stringify(info, null, 2) + '\n');
  console.log(JSON.stringify({ result: 'PREPARED', dir, integrity: info.integrity, inferenceStarted: false })); return info;
}
function verify(info) {
  assertMode(info); const integrity = candidate.verify(info), source = read(path.join(info.dir, 'reused-A-evidence.json'));
  priorEvidence(read(path.join(info.dir, 'previous-receipt.json')));
  isolation.verifyDraft(info.draftPath, fs.readFileSync(info.draftPath, 'utf8'), source.draftSha256);
  assert.equal(sha(info.contextPath), source.contextSha256);
  assert.deepEqual(read(path.join(info.dir, 'project/opencode.json')).permission, permissions(info.dir));
  assert.equal(fs.readFileSync(info.prompts.B.path, 'utf8'), contract.prompt(info.contextPath, info.commonSkills['marketing:copy-editing'].path, info.draftPath));
  assert.equal(sha(info.prompts.B.path), info.prompts.B.sha256);
  isolation.distinctProfiles(path.join(info.dir, 'plain-candidate'), path.join(info.dir, 'plain-correction'));
  return { ...integrity, sourceSessionId: source.binding.sessionId, draftSha256: source.draftSha256 };
}
function phaseInfo(info, phase) {
  assert.ok(phases.includes(phase));
  return { ...info, repairPhase: phase, ...(phase === 'correction' ? { prompts: { B: { path: path.join(info.dir, 'correction-prompt.txt') } }, extraReadPaths: extraPaths(info) } : {}) };
}
function evidence(info, phase) {
  const runtime = phaseInfo(info, phase), arm = path.join(info.dir, 'plain-' + phase), report = read(path.join(arm, 'live-result.json'));
  assert.ok(report.completedAt && report.ptyClosed && report.recorderClosed); assert.deepEqual(report.errors, []); assert.deepEqual(report.contamination, []);
  assert.equal(report.loadedModel?.digest, info.modelDigest); assert.equal(report.loadedModel?.context_length, 32768);
  const events = read(path.join(arm, 'qa-session-events.json')), users = events.events.filter(e => e.message.role === 'user' && e.part.type === 'text');
  assert.equal(events.sessions.length, 1); assert.equal(events.sessions[0].id, report.sessionId); assert.equal(users.length, 1);
  const prompt = fs.readFileSync(runtime.prompts.B.path, 'utf8'); assert.equal(users[0].part.text, prompt);
  const records = fs.readFileSync(path.join(arm, 'wire-metadata.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse).filter(r => r.path === '/v1/chat/completions');
  assert.ok(records.length > 0);
  for (const r of records) { assert.equal(r.model, info.model); assert.equal(r.mode, 'baseline'); assert.equal(r.reasoningEffort, 'none'); assert.equal(r.forwardedReasoningEffort, 'none'); assert.equal(r.statusCode, 200); assert.equal(r.parseErrors, 0); assert.equal(r.reasoningCharacters, 0); assert.equal(r.completion, 'end'); }
  assert.ok(!/truncating input prompt/i.test(fs.readFileSync(path.join(info.dir, 'ollama.stderr.log'), 'utf8')));
  assert.equal(report.tasks.length, 1); assert.equal(report.tasks[0].task, 'B'); assert.equal(report.taskWindows.length, 1);
  const final = live.taskFinal(events.events, { sessionId: report.sessionId, prompt, start: report.taskWindows[0].start, skillPath: info.commonSkills['marketing:copy-editing'].path,
    contextPath: info.contextPath, draftPath: info.draftPath, model: info.model, marker: 'QA_TASK_B_DONE', letter: 'B', outputContract: '0.2.0',
    originalDraft: fs.readFileSync(info.draftPath, 'utf8'), contextText: fs.readFileSync(info.contextPath, 'utf8'), extraReadPaths: runtime.extraReadPaths || [] });
  assert.ok(final && final.final.trim() && final.usableDraft, 'No usable answer for content correction');
  assert.deepEqual({ task: 'B', ...final }, report.tasks[0]); assert.equal(fs.readFileSync(path.join(arm, 'task-B-output.md'), 'utf8'), final.final);
  for (const file of runners) assert.equal(sha(path.join(arm, 'executed-' + file)), sha(path.join(__dirname, file)), 'Executed runner changed');
  const binding = { phase, sessionId: report.sessionId, outputSha256: sha(path.join(arm, 'task-B-output.md')), reportSha256: sha(path.join(arm, 'live-result.json')),
    eventsSha256: sha(path.join(arm, 'qa-session-events.json')), wireSha256: sha(path.join(arm, 'wire-metadata.jsonl')), promptSha256: sha(runtime.prompts.B.path),
    draftSha256: sha(info.draftPath), contextSha256: sha(info.contextPath), ...(phase === 'correction' ? { correctionInputs: Object.fromEntries(extraPaths(info).map(f => [f, sha(f)])) } : {}) };
  assert.notEqual(binding.sessionId, read(path.join(info.dir, 'reused-A-evidence.json')).binding.sessionId);
  if (phase === 'correction') assert.notEqual(binding.sessionId, read(path.join(info.dir, 'candidate-result.json')).binding.sessionId);
  return { binding, checks: final.checks, automatic: final.result };
}
function reviewGate(review, observed, required) {
  assert.deepEqual(review.binding, observed.binding); assert.ok(typeof review.reviewer === 'string' && review.reviewer.trim());
  assert.ok(typeof review.reviewedAt === 'string' && Number.isFinite(Date.parse(review.reviewedAt)));
  assert.ok(['PASS', 'FAIL'].includes(review.result)); if (required) assert.equal(review.result, required);
  for (const key of reviewKeys) { assert.ok(['PASS', 'FAIL'].includes(review[key]?.result)); assert.ok(typeof review[key].evidence === 'string' && review[key].evidence.trim()); }
  const pass = Object.values(observed.checks).every(v => v === true) && reviewKeys.every(k => review[k].result === 'PASS');
  assert.equal(review.result, pass ? 'PASS' : 'FAIL', 'Review cannot override failed gates');
  if (!pass) { assert.ok(Array.isArray(review.findings) && review.findings.length > 0); for (const f of review.findings) { assert.ok(typeof f.field === 'string' && f.field.trim()); assert.ok(typeof f.reason === 'string' && f.reason.trim()); } }
  return review.result;
}
function reviewed(info, phase, required) {
  const observed = evidence(info, phase), result = read(path.join(info.dir, phase + '-result.json'));
  assert.deepEqual(result.binding, observed.binding); assert.deepEqual(result.checks, observed.checks);
  assert.ok(fs.existsSync(path.join(info.dir, 'edit-' + phase + '.attempt')) && fs.existsSync(path.join(info.dir, 'plain-' + phase + '.attempt')));
  const file = path.join(info.dir, phase + '-review.json'), review = read(file);
  reviewGate(review, observed, required); return { observed, review, file };
}
function prepareCorrection(info) {
  verify(info); const rejected = reviewed(info, 'candidate', 'FAIL');
  isolation.assertFreshProfile(path.join(info.dir, 'plain-correction')); comparison.claim(info.dir, 'prepare-correction');
  const files = extraPaths(info), output = path.join(info.dir, 'plain-candidate/task-B-output.md');
  isolation.writeDraft(files[0], fs.readFileSync(output, 'utf8'), sha(output));
  isolation.writeDraft(files[1], fs.readFileSync(rejected.file, 'utf8'), sha(rejected.file));
  const promptFile = path.join(info.dir, 'correction-prompt.txt'); fs.writeFileSync(promptFile, contract.prompt(info.contextPath, info.commonSkills['marketing:copy-editing'].path, info.draftPath, files), { flag: 'wx' });
  save(path.join(info.dir, 'correction-preparation.json'), { binding: rejected.observed.binding, reviewSha256: sha(rejected.file), files: Object.fromEntries([...files, promptFile].map(f => [f, sha(f)])) });
}
function correctionGate(info) {
  const rejected = reviewed(info, 'candidate', 'FAIL'), prepared = read(path.join(info.dir, 'correction-preparation.json'));
  assert.deepEqual(prepared.binding, rejected.observed.binding); assert.equal(prepared.reviewSha256, sha(rejected.file));
  const files = extraPaths(info), output = path.join(info.dir, 'plain-candidate/task-B-output.md');
  isolation.verifyDraft(files[0], fs.readFileSync(output, 'utf8'), sha(output)); isolation.verifyDraft(files[1], fs.readFileSync(rejected.file, 'utf8'), sha(rejected.file));
  const prompt = path.join(info.dir, 'correction-prompt.txt');
  assert.deepEqual(Object.keys(prepared.files), [...files, prompt]); for (const [f, h] of Object.entries(prepared.files)) assert.equal(sha(f), h);
  assert.equal(fs.readFileSync(prompt, 'utf8'), contract.prompt(info.contextPath, info.commonSkills['marketing:copy-editing'].path, info.draftPath, files));
  return rejected.observed.binding.sessionId;
}
function claimAttempt(info, phase) {
  assertMode(info); assert.ok(phases.includes(phase)); isolation.assertFreshProfile(path.join(info.dir, 'plain-' + phase));
  assert.ok(!fs.existsSync(path.join(info.dir, 'plain-' + phase + '.attempt')));
  if (phase === 'candidate') assert.ok(!fs.existsSync(path.join(info.dir, 'prepare-correction.attempt')));
  else correctionGate(info);
  comparison.claim(info.dir, 'edit-' + phase);
}
async function main() {
  const mode = process.argv[2]; assert.ok(process.argv.length === 3 && ['--prepare', '--verify', '--candidate', '--prepare-correction', '--correction', '--finalize-candidate', '--finalize-correction'].includes(mode), 'Choose an explicit approved mode');
  if (mode === '--prepare') return prepare();
  const info = read(receipt), integrity = verify(info);
  if (mode === '--verify') { console.log(JSON.stringify({ result: 'VERIFIED', integrity, inferenceStarted: false })); return; }
  if (mode === '--prepare-correction') { prepareCorrection(info); console.log('CORRECTION_PREPARED; no inference'); return; }
  const phase = mode.endsWith('candidate') ? 'candidate' : 'correction';
  if (mode.startsWith('--finalize-')) {
    if (phase === 'correction') correctionGate(info);
    const reviewedResult = reviewed(info, phase);
    save(path.join(info.dir, phase + '-acceptance.json'), { result: reviewedResult.review.result, binding: reviewedResult.observed.binding, reviewSha256: sha(reviewedResult.file),
      completedAt: new Date().toISOString(), next: phase === 'candidate' && reviewedResult.review.result === 'FAIL' ? 'ONE_REVIEWED_CORRECTION_ALLOWED' : 'STOP', qaServerCleanup: 'PENDING_USER_STOP' });
    console.log(JSON.stringify({ phase, result: reviewedResult.review.result })); return;
  }
  const previousSessionId = phase === 'correction' ? correctionGate(info) : integrity.sourceSessionId;
  isolation.assertFreshProfile(path.join(info.dir, 'plain-' + phase)); await candidate.preflight(info); claimAttempt(info, phase);
  for (const f of runners) fs.copyFileSync(path.join(__dirname, f), path.join(info.dir, 'plain-' + phase, 'executed-' + f), fs.constants.COPYFILE_EXCL);
  const report = await comparison.plain({ ...phaseInfo(info, phase), isolationPreviousSessionId: previousSessionId }, 'B');
  const result = { result: 'FAIL', report, maximumSessions: 2, qaServerCleanup: 'PENDING_USER_STOP' };
  try { Object.assign(result, evidence(info, phase)); result.integrityAfter = verify(info); if (phase === 'correction') correctionGate(info); result.result = 'AWAITING_MANUAL_REVIEW'; }
  catch (error) { result.gateFailure = error.message; }
  result.completedAt = new Date().toISOString(); save(path.join(info.dir, phase + '-result.json'), result);
  console.log(JSON.stringify({ phase, result: result.result, automatic: result.automatic, gateFailure: result.gateFailure, dir: info.dir }));
}
if (require.main === module) main().catch(e => { console.error(e.stack); process.exitCode = 1; });
module.exports = { prepare, verify, assertMode, permissions, phaseInfo, evidence, reviewGate, prepareCorrection, correctionGate, claimAttempt };
