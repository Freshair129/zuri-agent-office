'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const crypto = require('node:crypto');
const contract = require('../tools/marketing-edit-contract.cjs'), repair = require('../tools/verify-marketing-edit-repair.cjs');
const comparison = require('../tools/verify-marketing-comparison.cjs'), live = require('../tools/verify-marketing-live.cjs');
// Synthetic positive fixture: never represented as model/runtime evidence.
const context = 'Product: a local desktop task organizer.\nAudience: solo consultants juggling client tasks.\nVerified fixture features: groups tasks by client; shows a daily checklist.\nPrimary action and exact CTA: View the demo\nUnknown: pricing.';
const original = 'Headline\nOrganize your client tasks\nSubheading\nA local desktop task organizer that groups tasks by client and shows a daily checklist.\nCTA\nView the demo\nSources and unknowns\nPricing unknown.\nQA_TASK_A_DONE';
function fixture() {
  return { headline: 'Organize client tasks', subheading: 'Group tasks by client with a daily checklist in a local desktop task organizer.', cta: 'View the demo',
    sources: [{ field: 'Headline', claim: 'client tasks', sources: ['solo consultants juggling client tasks.'] },
      { field: 'Subheading', claim: 'Group tasks by client with a daily checklist in a local desktop task organizer.', sources: ['groups tasks by client; shows a daily checklist.', 'a local desktop task organizer.'] },
      { field: 'CTA', claim: 'View the demo', sources: ['Primary action and exact CTA: View the demo'] }, { unknowns: ['pricing'] }],
    edits: [{ field: 'Headline', before: 'Organize your client tasks', after: 'Organize client tasks', reason: 'Removed redundant possessive.' },
      { field: 'Subheading', before: 'A local desktop task organizer that groups tasks by client and shows a daily checklist.', after: 'Group tasks by client with a daily checklist in a local desktop task organizer.', reason: 'Led with the action.' }] };
}
function render(f) { return `Headline\n${f.headline}\nSubheading\n${f.subheading}\nCTA\n${f.cta}\nSources and unknowns\n${f.sources.map(JSON.stringify).join('\n')}\nEdits\n${f.edits.map((e, i) => `${i + 1}. ${JSON.stringify(e)}`).join('\n')}\nQA_TASK_B_DONE`; }
const assess = f => contract.assess(typeof f === 'string' ? f : render(f), original, context);
test('frozen 5.0.8 failure reproduces all three rejection classes without altering historical evidence', () => {
  const dir = path.join(__dirname, 'fixtures/marketing-edit-repair');
  const provenance = JSON.parse(fs.readFileSync(path.join(dir, 'provenance.json'), 'utf8'));
  const contents = {};
  for (const [name, meta] of Object.entries(provenance.files)) { const bytes = fs.readFileSync(path.join(dir, name)); assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), meta.sha256); contents[name] = bytes.toString('utf8'); }
  const checks = contract.assess(contents['5.0.8-B.md'], contents['5.0.7-A.md'], contents['context.md']);
  assert.equal(checks.contractLayout, false); assert.equal(checks.sourceRecords, false); assert.equal(checks.actualEdits, false);
  assert.equal(checks.exactCta, true); assert.equal(checks.marker, true);
  const a = contract.sections(contents['5.0.7-A.md'], ['Headline', 'Subheading', 'CTA', 'Sources and unknowns'], 'QA_TASK_A_DONE');
  const b = contract.sections(contents['5.0.8-B.md']);
  for (const field of ['Headline', 'Subheading', 'CTA']) assert.equal(a.bodies[field], b.bodies[field]);
});
test('valid synthetic response passes mechanics without claiming semantic approval', () => {
  assert.ok(Object.values(assess(fixture())).every(v => v === true));
  const f = fixture(); f.edits[0].reason = 'This reason is inaccurate.';
  assert.equal(assess(f).actualEdits, true); // Accuracy remains an independent manual decision.
});
test('prefaces, fences, extra sections, trailing prose and missing/duplicate marker fail layout or marker', () => {
  const text = render(fixture());
  for (const bad of ['Intro\n' + text, '```\n' + text + '\n```', text + '\nAfterword', text.replace('QA_TASK_B_DONE', ''), text.replace('QA_TASK_B_DONE', 'QA_TASK_B_DONE\nQA_TASK_B_DONE'), text.replace('Headline\n', '## Headline\n')]) {
    const checks = assess(bad); assert.ok(!checks.contractLayout || !checks.marker);
  }
  assert.equal(assess(text.replace('Sources and unknowns\n', 'Unknown extra heading\nSources and unknowns\n')).exactCta, false);
  assert.equal(assess(text.replace('Organize client tasks\n', 'Organize client tasks\n## Extra section\n')).contractLayout, false);
});
test('two numbered no-op edits and whitespace-only edits fail actual diff checks', () => {
  for (const field of ['Headline', 'Subheading']) {
    const f = fixture(), e = f.edits.find(x => x.field === field);
    e.after = e.before; f[field.toLowerCase()] = e.before;
    // Update corresponding claim so the actual-edit check fails independently of source reference mechanics.
    f.sources.find(x => x.field === field).claim = e.before;
    const checks = assess(f); assert.equal(checks.editBindings, true); assert.equal(checks.actualEdits, false);
    e.after = e.before.replaceAll(' ', '  '); f[field.toLowerCase()] = e.after; assert.equal(assess(f).actualEdits, false);
  }
  const text = render(fixture()).replace(/1\. .*\n2\. .*\n/, '1. No edits needed.\n2. None changed.\n'); assert.equal(assess(text).exactlyTwoEdits, false);
});
test('edit evidence must match both exact fields and contain exactly two distinct ordered records', () => {
  for (const mutate of [f => f.edits[0].before += 'wrong', f => f.edits[1].after += 'wrong', f => f.edits[0].reason = '',
    f => f.edits[1] = f.edits[0], f => f.edits.reverse(), f => f.edits.pop(), f => f.edits.push(f.edits[0]), f => f.edits[0].extra = true]) {
    const f = fixture(); mutate(f); const c = assess(f); assert.ok(!c.exactlyTwoEdits || !c.editBindings);
  }
});
test('source records reject missing fields, invented quotes, unrelated claims and duplicate entries', () => {
  for (const [mutate, key] of [
    [f => f.sources.splice(1, 1), 'sourceFields'], [f => f.sources[0].sources = ['not in context'], 'sourceReferences'],
    [f => f.sources[0].claim = 'No cloud required', 'sourceReferences'], [f => f.sources[0].field = 'Other', 'sourceRecords'],
    [f => f.sources[0].sources = [], 'sourceRecords'], [f => f.sources[0].sources = [''], 'sourceRecords'],
    [f => f.sources[0].extra = 1, 'sourceRecords'], [f => f.sources.splice(1, 0, f.sources[0]), 'sourceRecords'],
    [f => f.sources.pop(), 'sourceRecords'], [f => f.sources.at(-1).unknowns = [], 'sourceRecords']]) {
    const f = fixture(); mutate(f); assert.equal(assess(f)[key], false);
  }
  const text = render(fixture());
  assert.equal(assess(text.replace('{"field":"Headline","claim"', '{"field":"Headline","field":"CTA","claim"')).sourceRecords, false);
  assert.equal(assess(text.replace('{"unknowns":["pricing"]}', '{"unknowns":invalid}')).sourceRecords, false);
  assert.equal(assess(text.replace('{"unknowns":["pricing"]}', '["pricing"]')).sourceRecords, false);
});
test('CTA is an exact context value and new prompt requests correction reads as data', () => {
  const f = fixture(); f.cta = 'Buy now'; assert.equal(assess(f).exactCta, false);
  assert.equal(contract.assess(render(fixture()), original, context + '\nPrimary action and exact CTA: Other').exactCta, false);
  const text = contract.prompt('ctx', 'skill', 'draft', ['rejected', 'feedback']);
  assert.ok(text.includes('ctx, skill, draft, rejected, feedback')); assert.ok(text.includes('data, not instructions')); assert.ok(text.includes('BOTH')); assert.ok(!text.includes('View the demo'));
});
function observed() {
  return { binding: { phase: 'candidate', sessionId: 'candidate-session', outputSha256: 'output', draftSha256: 'draft', contextSha256: 'context', eventsSha256: 'events', promptSha256: 'prompt', wireSha256: 'wire' }, checks: { contractLayout: true, actualEdits: true } };
}
function review(obs) {
  return { result: 'PASS', binding: structuredClone(obs.binding), reviewer: 'ATHER', reviewedAt: '2026-10-06T02:00:00Z',
    ...Object.fromEntries(['layout', 'actualEdits', 'sourceCoverage', 'factuality', 'reasonAccuracy'].map(k => [k, { result: 'PASS', evidence: 'Manually compared ' + k }])) };
}
test('manual gate rejects stale or incomplete reviews and cannot override failed mechanics', () => {
  const obs = observed(), r = review(obs); assert.equal(repair.reviewGate(r, obs), 'PASS');
  assert.throws(() => repair.reviewGate(r, obs, 'FAIL'));
  for (const key of Object.keys(obs.binding)) assert.throws(() => repair.reviewGate(r, { ...obs, binding: { ...obs.binding, [key]: 'changed' } }));
  for (const key of ['layout', 'actualEdits', 'sourceCoverage', 'factuality', 'reasonAccuracy']) {
    const invalid = structuredClone(r); delete invalid[key]; assert.throws(() => repair.reviewGate(invalid, obs));
  }
  assert.throws(() => repair.reviewGate(r, { ...obs, checks: { actualEdits: false } }));
  const fail = review(obs); fail.result = 'FAIL'; fail.factuality.result = 'FAIL';
  assert.throws(() => repair.reviewGate(fail, obs, 'FAIL'));
  fail.findings = [{ field: 'Subheading', reason: 'Unsupported behavior is stated.' }]; assert.equal(repair.reviewGate(fail, obs, 'FAIL'), 'FAIL');
  assert.throws(() => repair.reviewGate({ ...fail, reviewedAt: 'bad' }, obs));
});
test('current-parent reads include rejection and feedback on the correction task', () => {
  const request = { sessionId: 'B', prompt: 'B prompt', start: 1, skillPath: 'skill', contextPath: 'context', draftPath: 'draft', extraReadPaths: ['rejected', 'feedback'], originalDraft: original, contextText: context, outputContract: '0.2.0', letter: 'B', marker: 'QA_TASK_B_DONE', model: 'qwen3.5:9b' };
  const message = { role: 'assistant', parentID: 'userB', providerID: 'local', modelID: 'qwen3.5:9b', time: { created: 3, completed: 5 }, finish: 'tool-calls' };
  const events = [{ messageId: 'userB', sessionId: 'B', at: 2, message: { role: 'user' }, part: { type: 'text', text: request.prompt } },
    ...['skill', 'context', 'draft', 'rejected', 'feedback'].map(filePath => ({ sessionId: 'B', at: 3, messageId: 'read-' + filePath, message, part: { type: 'tool', tool: 'read', state: { status: 'completed', input: { filePath } } } })),
    { sessionId: 'B', at: 6, messageId: 'final', message: { ...message, finish: 'stop', time: { created: 6, completed: 8 } }, part: { type: 'text', text: render(fixture()) } }];
  assert.equal(live.taskFinal(events, request).result, 'AUTOMATED_CHECKS_PASS');
  for (let i = 1; i <= 5; i++) { const e = structuredClone(events); e.splice(i, 1); assert.equal(live.taskFinal(e, request).result, 'FAIL'); }
  const wrongParent = structuredClone(events); wrongParent[5].message.parentID = 'previous'; assert.equal(live.taskFinal(wrongParent, request).checks.correctionReads, false);
  const wrongSession = structuredClone(events); wrongSession[4].sessionId = 'previous'; assert.equal(live.taskFinal(wrongSession, request).checks.correctionReads, false);
});
function info(dir) { return { dir, editRepair: '0.1.0', snapshotVersion: '5.0.9', outputContract: '0.2.0', prompts: { B: {} }, draftPath: path.join(dir, 'project/.qa-drafts/task-A.md'), contextPath: path.join(dir, 'project/.agents/product-marketing.md') }; }
test('mode and attempt guards reject old modes, third phases, reused profiles and unreviewed correction', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-edit-repair-'));
  try {
    for (const phase of ['candidate', 'correction']) for (const sub of ['cli/data', 'cli/cache', 'profile/temp']) fs.mkdirSync(path.join(dir, 'plain-' + phase, sub), { recursive: true });
    const value = info(dir); repair.assertMode(value);
    for (const patch of [{ claimBound: '0.1.0' }, { taskIsolation: '0.1.0' }, { outputContract: '0.1.0' }, { editRepair: 'other' }]) assert.throws(() => repair.assertMode({ ...value, ...patch }));
    await assert.rejects(comparison.plain(value, 'B')); await assert.rejects(comparison.plain({ ...value, repairPhase: 'candidate' }, 'A'));
    assert.throws(() => repair.claimAttempt(value, 'third')); assert.throws(() => repair.claimAttempt(value, 'correction')); assert.ok(!fs.existsSync(path.join(dir, 'edit-correction.attempt')));
    const old = path.join(dir, 'plain-candidate/cli/data/old'); fs.writeFileSync(old, 'old'); assert.throws(() => repair.claimAttempt(value, 'candidate')); fs.unlinkSync(old);
    repair.claimAttempt(value, 'candidate'); assert.throws(() => repair.claimAttempt(value, 'candidate'), { code: 'EEXIST' });
  } finally { for (const relative of fs.readdirSync(dir, { recursive: true }).reverse()) { const p = path.join(dir, relative); if (fs.statSync(p).isDirectory()) fs.rmdirSync(p); else fs.unlinkSync(p); } fs.rmdirSync(dir); }
});
test('permissions add only the two correction files and preserve all mutation denials', () => {
  const p = repair.permissions('O:/fixture');
  assert.equal(p.read['.qa-drafts/rejected-output.md'], 'allow'); assert.equal(p.read['.qa-drafts/rejection-review.json'], 'allow'); assert.equal(p.read['.qa-drafts/**'], undefined);
  for (const key of ['*', 'edit', 'bash', 'webfetch', 'websearch', 'task']) assert.equal(p[key], 'deny');
});
test('correction gate binds usable rejected output, completed failed review and immutable feedback', () => {
  // Synthetic on-disk evidence exercises the gate; no CLI, server or model is started.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-repair-gate-'));
  const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const write = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof v === 'string' ? v : JSON.stringify(v)); };
  try {
    const value = { ...info(dir), model: 'qwen3.5:9b', modelDigest: 'digest', commonSkills: { 'marketing:copy-editing': { path: path.join(dir, 'skill.md') } } };
    value.prompts.B.path = path.join(dir, 'candidate-prompt.txt'); write(value.prompts.B.path, 'B prompt'); write(value.draftPath, original); write(value.contextPath, context);
    write(path.join(dir, 'reused-A-evidence.json'), { binding: { sessionId: 'originalA' } }); write(path.join(dir, 'ollama.stderr.log'), '');
    const request = { sessionId: 'candidate-session', prompt: 'B prompt', start: 1, contextPath: value.contextPath, skillPath: value.commonSkills['marketing:copy-editing'].path, draftPath: value.draftPath,
      marker: 'QA_TASK_B_DONE', model: value.model, outputContract: '0.2.0', letter: 'B', originalDraft: original, contextText: context };
    const message = { role: 'assistant', parentID: 'user', providerID: 'local', modelID: value.model, time: { created: 3, completed: 5 }, finish: 'tool-calls' };
    const output = 'Unwanted preface\n' + render(fixture());
    const events = [{ sessionId: request.sessionId, messageId: 'user', at: 2, message: { role: 'user' }, part: { type: 'text', text: 'B prompt' } },
      ...[request.contextPath, request.skillPath, request.draftPath].map((filePath, i) => ({ sessionId: request.sessionId, messageId: 'read' + i, at: 3, message,
        part: { type: 'tool', tool: 'read', state: { status: 'completed', input: { filePath } } } })),
      { sessionId: request.sessionId, messageId: 'final', at: 6, message: { ...message, finish: 'stop', time: { created: 6, completed: 8 } }, part: { type: 'text', text: output } }];
    const arm = path.join(dir, 'plain-candidate');
    const report = { result: 'FAIL', completedAt: '2026-10-06T02:00:00Z', sessionId: request.sessionId, ptyClosed: true, recorderClosed: true, errors: [], contamination: [],
      loadedModel: { digest: 'digest', context_length: 32768 }, tasks: [{ task: 'B', ...live.taskFinal(events, request) }], taskWindows: [{ start: 1 }] };
    write(path.join(arm, 'live-result.json'), report); write(path.join(arm, 'qa-session-events.json'), { sessions: [{ id: request.sessionId }], events }); write(path.join(arm, 'task-B-output.md'), output);
    write(path.join(arm, 'wire-metadata.jsonl'), JSON.stringify({ path: '/v1/chat/completions', model: value.model, mode: 'baseline', reasoningEffort: 'none', forwardedReasoningEffort: 'none', statusCode: 200, parseErrors: 0, reasoningCharacters: 0, completion: 'end' }));
    for (const file of ['verify-marketing-edit-repair.cjs', 'marketing-edit-contract.cjs', 'verify-marketing-comparison.cjs', 'verify-marketing-live.cjs', 'verify-marketing-model-candidate.cjs', 'verify-marketing-claim-bound-editing.cjs', 'verify-marketing-task-isolation.cjs', 'marketing-wire-recorder.cjs'])
      fs.copyFileSync(path.join(__dirname, '../tools', file), path.join(arm, 'executed-' + file));
    const obs = repair.evidence(value, 'candidate'); write(path.join(dir, 'candidate-result.json'), obs);
    comparison.claim(dir, 'edit-candidate'); comparison.claim(dir, 'plain-candidate');
    const r = review(obs); r.result = 'FAIL'; r.layout.result = 'FAIL'; r.findings = [{ field: 'layout', reason: 'Remove the preface; start with Headline.' }];
    const reviewFile = path.join(dir, 'candidate-review.json'); write(reviewFile, r);
    const files = ['rejected-output.md', 'rejection-review.json'].map(f => path.join(dir, 'project/.qa-drafts', f));
    const iso = require('../tools/verify-marketing-task-isolation.cjs');
    iso.writeDraft(files[0], output, sha(path.join(arm, 'task-B-output.md'))); iso.writeDraft(files[1], fs.readFileSync(reviewFile, 'utf8'), sha(reviewFile));
    const promptFile = path.join(dir, 'correction-prompt.txt'); write(promptFile, contract.prompt(value.contextPath, request.skillPath, value.draftPath, files));
    const prep = { binding: obs.binding, reviewSha256: sha(reviewFile), files: Object.fromEntries([...files, promptFile].map(f => [f, sha(f)])) };
    write(path.join(dir, 'correction-preparation.json'), prep);
    assert.equal(repair.correctionGate(value), request.sessionId);
    fs.chmodSync(files[0], 0o666); assert.throws(() => repair.correctionGate(value), /read-only/); fs.chmodSync(files[0], 0o444);
    write(promptFile, 'changed'); assert.throws(() => repair.correctionGate(value)); write(promptFile, contract.prompt(value.contextPath, request.skillPath, value.draftPath, files));
    write(reviewFile, { ...r, result: 'PASS' }); assert.throws(() => repair.correctionGate(value)); write(reviewFile, r);
    fs.unlinkSync(path.join(arm, 'task-B-output.md')); assert.throws(() => repair.correctionGate(value));
  } finally {
    for (const relative of fs.readdirSync(dir, { recursive: true }).reverse()) { const p = path.join(dir, relative); if (fs.statSync(p).isDirectory()) fs.rmdirSync(p); else { fs.chmodSync(p, 0o666); fs.unlinkSync(p); } } fs.rmdirSync(dir);
  }
});
