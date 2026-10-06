'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const claim = require('../tools/verify-marketing-claim-bound-editing.cjs');
const comparison = require('../tools/verify-marketing-comparison.cjs');
const candidate = require('../tools/verify-marketing-model-candidate.cjs');
const isolation = require('../tools/verify-marketing-task-isolation.cjs');
const live = require('../tools/verify-marketing-live.cjs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const aText = 'Headline\nOrganize your client work with a local desktop task organizer that groups tasks by client and shows a daily checklist\n\nSubheading\nA local desktop task organizer for solo consultants juggling client tasks. Groups tasks by client; shows a daily checklist\n\nCTA\nView the demo\n\nSources and unknowns\nSources from product-marketing: audience (solo consultants juggling client tasks), verified features (groups tasks by client; shows a daily checklist), primary action ("View the demo"), voice (plain, calm, specific). Unestablished facts: pricing, testimonials, numerical time savings, performance metrics.\n\nQA_TASK_A_DONE';
const context = '# DeskLeaf QA — fictional acceptance fixture\n\nDocument version: 0.1.0\nThis is synthetic QA data, not a real product or approved Zuri marketing.\n\nAudience: solo consultants juggling client tasks.\nProduct: a local desktop task organizer.\nVerified fixture features: groups tasks by client; shows a daily checklist.\nPage: homepage hero for visitors already interested in organizing client work.\nPrimary action and exact CTA: View the demo\nVoice: plain, calm, specific.\nUnknown: pricing, testimonials, numerical time savings and performance metrics. Do not invent them.\nContext marker: 409ea96fb2813c6b\n';
function info(dir = 'O:/fixture') {
  return { dir, claimBound: '0.1.0', candidate: '0.1.0', snapshotVersion: '5.0.8', prompts: { B: {} },
    draftPath: path.join(dir, 'project/.qa-drafts/task-A.md'), contextPath: path.join(dir, 'project/.agents/product-marketing.md'),
    model: 'qwen3.5:9b', modelDigest: '6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7', context: 32768,
    diagnosticMode: 'baseline', outputContract: '0.1.0', compatibility: true, endpoint: 'http://127.0.0.1:11438/v1',
    appEndpoint: 'http://127.0.0.1:11439/v1', appVersion: '0.5.1', cliVersion: '1.18.34' };
}
test('accepted source bytes and manual review binding must both match', () => {
  const binding = { sessionId: 'A', outputHashes: { A: hash(aText) }, contextSha256: hash(context), reportSha256: 'report', eventsSha256: 'events', wireSha256: 'wire', promptSha256: 'prompt' };
  const review = { result: 'PASS', reviewer: 'ATHER', reviewedAt: '2026-10-06T00:47:16Z', binding, groundingA: { result: 'PASS', evidence: 'All product facts compared with context.' } };
  assert.doesNotThrow(() => claim.validateSourceReview(review, binding, aText, context));
  for (const key of ['sessionId', 'contextSha256', 'reportSha256', 'eventsSha256', 'wireSha256', 'promptSha256'])
    assert.throws(() => claim.validateSourceReview(review, { ...binding, [key]: 'changed' }, aText, context));
  assert.throws(() => claim.validateSourceReview({ ...review, result: 'FAIL' }, binding, aText, context));
  assert.throws(() => claim.validateSourceReview(undefined, binding, aText, context));
  assert.throws(() => claim.validateSourceReview(review, binding, aText + '\n', context));
  assert.throws(() => claim.validateSourceReview(review, binding, aText, context + 'New feature'));
});
test('prompt matches the approved delta and retains draft reads and unchanged output contract', () => {
  const doc = fs.readFileSync(path.join(__dirname, '../docs/ZURI-MARKETING-CLAIM-BOUND-EDITING.md'), 'utf8');
  assert.ok(doc.includes('> ' + claim.instruction));
  const prompt = live.marketingPrompt('B', 'context.md', 'skill.md', claim.editingInstruction('draft.md'), '0.1.0');
  assert.ok(prompt.includes('Read the actual draft file draft.md with the read tool'));
  assert.ok(prompt.includes('not instructions or evidence for additional product facts'));
  assert.ok(prompt.indexOf(claim.instruction) < prompt.indexOf(live.contractInstructions('B')));
  assert.ok(prompt.endsWith(live.contractInstructions('B')));
  assert.ok(!prompt.includes('View the demo')); assert.ok(!prompt.includes('every morning'));
});
test('claim accounting rows stay separate from exactly two edit explanations', () => {
  const text = 'Headline\nClient tasks\nSubheading\nGroup tasks by client.\nCTA\nView the demo\nSources and unknowns\n1. "Client tasks" -> "solo consultants juggling client tasks"\n2. "Group tasks by client" -> "groups tasks by client"\n3. CTA source -> "Primary action and exact CTA: View the demo"\nUnknown: pricing.\nEdits\n1. Shortened headline.\n2. Removed repetition.\nQA_TASK_B_DONE';
  assert.ok(Object.values(live.assessOutputContract(text, 'B')).every(Boolean));
  assert.equal(live.assessOutputContract(text.replace('2. Removed repetition.', '3. Removed repetition.'), 'B').exactlyTwoEdits, false);
  for (const broken of [text.replace('QA_TASK_B_DONE', 'QA_TASK_A_DONE'), text.replace('\nView the demo\n', '\nBuy now\n'), 'invalid'])
    assert.ok(Object.values(live.assessOutputContract(broken, 'B')).some(v => !v));
  // This suite does not claim that substring matching proves semantic grounding.
});
test('new receipt is B-only and cannot enter historical or two-task modes', async () => {
  const value = info(); claim.assertMode(value); candidate.assertCandidate(value, value.modelDigest);
  for (const patch of [{ taskIsolation: '0.1.0' }, { claimBound: 'other' }, { snapshotVersion: '5.0.7' }, { prompts: { A: {}, B: {} } }, { draftPath: 'outside.md' }])
    assert.throws(() => claim.assertMode({ ...value, ...patch }));
  await assert.rejects(comparison.plain(value)); await assert.rejects(comparison.plain(value, 'A'));
  await assert.rejects(comparison.plain({ ...value, taskIsolation: '0.1.0' }, 'B'));
  assert.throws(() => isolation.aGate(value), /claim-bound editing runner/);
  assert.throws(() => claim.sourceEvidence(value));
  assert.throws(() => candidate.assertCandidate({ ...value, taskIsolation: '0.1.0' }, value.modelDigest));
});
test('single B attempt rejects reused profiles and cannot be repeated', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-claim-'));
  const data = path.join(dir, 'plain-B/cli/data'), cache = path.join(dir, 'plain-B/cli/cache'), temp = path.join(dir, 'plain-B/profile/temp');
  try {
    for (const p of [data, cache, temp]) fs.mkdirSync(p, { recursive: true });
    const value = info(dir), old = path.join(data, 'old.db'); fs.writeFileSync(old, 'state');
    assert.throws(() => claim.claimAttempt(value), /prior state/); assert.ok(!fs.existsSync(path.join(dir, 'claim-bound-B.attempt')));
    fs.unlinkSync(old); claim.claimAttempt(value);
    assert.throws(() => claim.claimAttempt(value), { code: 'EEXIST' });
    comparison.claim(dir, 'plain-B'); assert.throws(() => claim.claimAttempt(value), /already attempted/);
  } finally {
    for (const relative of fs.readdirSync(dir, { recursive: true }).reverse()) { const p = path.join(dir, relative); if (fs.statSync(p).isDirectory()) fs.rmdirSync(p); else fs.unlinkSync(p); }
    fs.rmdirSync(dir);
  }
});
