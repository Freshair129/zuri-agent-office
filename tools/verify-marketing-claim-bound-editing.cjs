'use strict';
// Approved v0.1.0: reuse accepted A, allow one fresh Plain B attempt only.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const comparison = require('./verify-marketing-comparison.cjs'), candidate = require('./verify-marketing-model-candidate.cjs');
const isolation = require('./verify-marketing-task-isolation.cjs');
const root = path.resolve(__dirname, '..'), receipt = path.join(root, 'output/marketing-live-current.json');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const sha = file => hash(fs.readFileSync(file));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const save = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const A_HASH = '096ca7aa79f800710d240fc3fa13fa2e14c7715d59ab5030196ae82a2a22b0c9';
const CONTEXT_HASH = '5b061db2782a7d76725cfca02202a11737948dc97a058c2e867261c1ea792ce3';
const ARCHIVE_HASH = 'e50a3e839b2749aaf45bcec30215746128ef127df9eb4fd83f95e44a5c6ab235';
const instruction = 'Make a conservative clarity edit of the supplied draft. Shorten, reorder or remove redundant wording while preserving its supported meaning. Do not add product capabilities, dependencies, schedules, automation, comparisons or promised outcomes unless the product context explicitly establishes them. A category label does not establish additional behavior. Skill examples provide methods, not product evidence. When a benefit would need an assumption, leave it out of the hero and record the uncertainty under Sources and unknowns. In Sources and unknowns, account for every factual claim in the revised Headline and Subheading: quote the claim, then quote the exact supporting text from the product context. Also identify the context text that supplies the CTA. Keep all accounting inside that existing section; add no new sections. Exact quotation alone does not make a claim supported: preserve the scope and meaning of the source. The two Edits explanations must describe changes actually made between the supplied draft and this final copy.';
function editingInstruction(draftPath) { return isolation.editingInstruction(draftPath) + '\n\n' + instruction; }
function validateSourceReview(review, binding, text, context) {
  isolation.assertReview(review, binding);
  assert.equal(hash(text), A_HASH, 'Approved A bytes changed');
  assert.equal(hash(context), CONTEXT_HASH, 'Approved context bytes changed');
  assert.equal(binding.outputHashes.A, A_HASH); assert.equal(binding.contextSha256, CONTEXT_HASH);
}
function sourceEvidence(previous) {
  assert.equal(previous.snapshotVersion, '5.0.7'); assert.equal(previous.taskIsolation, '0.1.0'); assert.ok(!previous.claimBound);
  const binding = isolation.aGate(previous);
  const outputPath = path.join(previous.dir, 'plain-A/task-A-output.md'), reviewPath = path.join(previous.dir, 'task-A-content-review.json');
  const text = fs.readFileSync(outputPath, 'utf8');
  validateSourceReview(read(reviewPath), binding, text, fs.readFileSync(previous.contextPath));
  assert.ok(read(path.join(previous.dir, 'task-B-result.json')).completedAt, 'Prior experiment must be completed');
  const cleanupPath = path.join(previous.dir, 'cleanup-closure-20261006T005326601Z.json'), cleanup = read(cleanupPath);
  assert.equal(cleanup.result, 'PASS'); assert.equal(cleanup.pidPresent, false);
  assert.equal(cleanup.port11438Listening, false); assert.equal(cleanup.port11439Listening, false); assert.equal(cleanup.archiveUnchanged, true);
  const archive = path.join(root, 'output/playwright/Zuri-0.5.1-snapshot-5.0.7.zip');
  assert.equal(sha(archive), ARCHIVE_HASH); assert.equal(cleanup.archiveSha256, ARCHIVE_HASH);
  const files = [outputPath, reviewPath, previous.contextPath, previous.prompts.A.path, previous.prompts.B.path,
    path.join(previous.dir, 'plain-A/live-result.json'), path.join(previous.dir, 'plain-A/qa-session-events.json'),
    path.join(previous.dir, 'plain-A/wire-metadata.jsonl'), path.join(previous.dir, 'task-A-result.json'),
    path.join(previous.dir, 'task-B-result.json'), cleanupPath, archive];
  return { binding, text, hashes: Object.fromEntries(files.map(file => [file, sha(file)])), cleanupPath };
}
function prepareInputs(info, previous) {
  const source = sourceEvidence(previous);
  assert.equal(sha(info.contextPath), CONTEXT_HASH);
  isolation.writeDraft(info.draftPath, source.text, A_HASH);
  const provenancePath = path.join(info.dir, 'reused-A-evidence.json');
  save(provenancePath, { result: 'REUSED_VERIFIED_INPUT', previousDir: previous.dir, binding: source.binding,
    sourceHashes: source.hashes, cleanupPath: source.cleanupPath, draftSha256: A_HASH, contextSha256: CONTEXT_HASH });
  info.inputHashes[info.draftPath] = A_HASH; info.inputHashes[provenancePath] = sha(provenancePath);
  Object.assign(info.inputHashes, source.hashes);
  save(path.join(info.dir, 'claim-bound-controls.json'), { version: '0.1.0', maximumSessions: 1, A: 'REUSED_VERIFIED_INPUT',
    B: 'NOT_RUN', zuri: 'NOT_RUN by design', sourceBinding: source.binding,
    priorPrompt: { path: previous.prompts.B.path, sha256: sha(previous.prompts.B.path) }, preparedPrompt: info.prompts.B,
    promptDelta: instruction, permissions: comparison.permissionConfig(info.dir, true), profiles: ['plain-B'] });
  info.inputHashes[path.join(info.dir, 'claim-bound-controls.json')] = sha(path.join(info.dir, 'claim-bound-controls.json'));
}
function assertMode(info) {
  assert.ok(!info.editRepair, 'Use the edit-repair runner');
  assert.equal(info.claimBound, '0.1.0'); assert.ok(!info.taskIsolation); assert.equal(info.snapshotVersion, '5.0.8');
  assert.deepEqual(Object.keys(info.prompts), ['B']);
  assert.equal(info.draftPath, path.join(info.dir, 'project/.qa-drafts/task-A.md'));
  assert.equal(info.contextPath, path.join(info.dir, 'project/.agents/product-marketing.md'));
}
function verify(info) {
  assertMode(info);
  const integrity = candidate.verify(info);
  const previous = read(path.join(info.dir, 'previous-receipt.json')), source = sourceEvidence(previous);
  const provenance = read(path.join(info.dir, 'reused-A-evidence.json'));
  assert.equal(provenance.result, 'REUSED_VERIFIED_INPUT'); assert.deepEqual(provenance.binding, source.binding);
  assert.deepEqual(provenance.sourceHashes, source.hashes);
  isolation.verifyDraft(info.draftPath, source.text, A_HASH); assert.equal(sha(info.contextPath), CONTEXT_HASH);
  assert.deepEqual(read(path.join(info.dir, 'project/opencode.json')).permission, comparison.permissionConfig(info.dir, true));
  assert.ok(!fs.existsSync(path.join(info.dir, 'plain-A')) && !fs.existsSync(path.join(info.dir, 'zuri')), 'B-only profile required');
  const expectedPrompt = require('./verify-marketing-live.cjs').marketingPrompt('B', info.contextPath,
    info.commonSkills['marketing:copy-editing'].path, editingInstruction(info.draftPath), '0.1.0');
  assert.equal(fs.readFileSync(info.prompts.B.path, 'utf8'), expectedPrompt);
  assert.equal(sha(info.prompts.B.path), info.prompts.B.sha256);
  return { ...integrity, sourceSessionId: source.binding.sessionId, draftSha256: A_HASH };
}
function claimAttempt(info) {
  assertMode(info); isolation.assertFreshProfile(path.join(info.dir, 'plain-B'));
  assert.ok(!fs.existsSync(path.join(info.dir, 'plain-B.attempt')), 'B already attempted');
  comparison.claim(info.dir, 'claim-bound-B');
}
async function main() {
  const mode = process.argv[2];
  assert.ok(process.argv.length === 3 && ['--prepare', '--verify', '--B'].includes(mode), 'Choose --prepare, --verify or --B; no retries');
  if (mode === '--prepare') {
    const info = await comparison.prepare({ claimBound: true });
    console.log(JSON.stringify({ result: 'PREPARED', dir: info.dir, integrity: verify(info), inferenceStarted: false })); return;
  }
  const info = read(receipt), integrity = verify(info);
  if (mode === '--verify') { console.log(JSON.stringify({ result: 'VERIFIED', dir: info.dir, integrity, inferenceStarted: false })); return; }
  isolation.assertFreshProfile(path.join(info.dir, 'plain-B'));
  await candidate.preflight(info); claimAttempt(info);
  for (const file of ['verify-marketing-claim-bound-editing.cjs', 'verify-marketing-task-isolation.cjs', 'verify-marketing-comparison.cjs',
    'verify-marketing-live.cjs', 'verify-marketing-model-candidate.cjs', 'marketing-wire-recorder.cjs'])
    fs.copyFileSync(path.join(__dirname, file), path.join(info.dir, 'plain-B', 'executed-' + file), fs.constants.COPYFILE_EXCL);
  const report = await comparison.plain({ ...info, isolationPreviousSessionId: integrity.sourceSessionId }, 'B');
  const result = { result: 'FAIL', report, maximumSessions: 1, A: 'REUSED_VERIFIED_INPUT', zuri: 'NOT_RUN by design', qaServerCleanup: 'PENDING_USER_STOP' };
  try {
    result.binding = { ...isolation.evidence(info, 'B'), draftSha256: sha(info.draftPath), sourceSessionId: integrity.sourceSessionId };
    assert.notEqual(result.binding.sessionId, integrity.sourceSessionId);
    result.integrityAfter = verify(info); result.result = 'AWAITING_MANUAL_REVIEW';
  } catch (error) { result.gateFailure = error.message; }
  result.completedAt = new Date().toISOString(); save(path.join(info.dir, 'task-B-result.json'), result);
  console.log(JSON.stringify({ result: result.result, dir: info.dir, gateFailure: result.gateFailure }));
}
if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 1; });
module.exports = { instruction, editingInstruction, validateSourceReview, sourceEvidence, prepareInputs, assertMode, verify, claimAttempt };
