'use strict';
// Approved comparison v0.1.0. Two attempts maximum; never starts Ollama.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const live = require('./verify-marketing-live.cjs');
const root = path.resolve(__dirname, '..');
const receipt = path.join(root, 'output/marketing-live-current.json');
const cli = path.join(root, 'node_modules/.zuri-provider-qa/node_modules/opencode-windows-x64/bin/opencode.exe');
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const save = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const slash = p => p.replaceAll('\\', '/');
const instructions = {
  A: 'Produce a homepage hero draft with sections Headline, Subheading, CTA and Sources and unknowns. Use only supplied facts. The primary action is stated in the context. Do not invent numbers, prices, testimonials or performance claims.',
  B: 'Revise your Task A hero for clarity using the copy-editing skill. Preserve the supplied facts and exact CTA. Output the complete revised Headline, Subheading, CTA and Sources and unknowns, followed by two brief explanations of your edits.'
};
function isolatedEnv(dir, inherited = process.env) {
  const env = { ...inherited };
  for (const key of Object.keys(env)) if (/TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY|^(OPENCODE|HIVE|AGENT|ZURI_)|^ELECTRON_RUN_AS_NODE$/i.test(key)) delete env[key];
  return { ...env, HOME: path.join(dir, 'cli'), USERPROFILE: path.join(dir, 'cli'),
    APPDATA: path.join(dir, 'cli/appdata'), LOCALAPPDATA: path.join(dir, 'cli/localappdata'),
    XDG_CONFIG_HOME: path.join(dir, 'cli/config'), XDG_DATA_HOME: path.join(dir, 'cli/data'), XDG_CACHE_HOME: path.join(dir, 'cli/cache'),
    TEMP: path.join(dir, 'temp'), TMP: path.join(dir, 'temp'), BUN_INSTALL_CACHE_DIR: path.join(dir, 'cli/bun-cache'),
    OPENCODE_DISABLE_MODELS_FETCH: '1', OPENCODE_DISABLE_AUTOUPDATE: '1' };
}
function permissionConfig(dir, taskIsolation = false) {
  return { '*': 'deny', read: { '*': 'deny', '.agents/product-marketing.md': 'allow', '.qa-skills/**': 'allow', ...(taskIsolation ? { '.qa-drafts/task-A.md': 'allow' } : { '../zuri/harness/**': 'allow' }) },
    glob: 'allow', list: 'allow', external_directory: { '*': 'deny', [slash(path.join(dir, 'project')) + '/**']: 'allow', ...(!taskIsolation ? { [slash(path.join(dir, 'zuri/harness')) + '/**']: 'allow' } : {}) },
    edit: 'deny', bash: 'deny', webfetch: 'deny', websearch: 'deny', task: 'deny' };
}
function claim(dir, name) { fs.writeFileSync(path.join(dir, name + '.attempt'), new Date().toISOString(), { flag: 'wx' }); }
function schemaMetadataOnly(actual, original) {
  const { $schema, ...rest } = actual;
  assert.equal($schema, 'https://opencode.ai/config.json');
  assert.deepEqual(rest, original, 'CLI config changed beyond schema metadata');
}
async function bounded(label, predicate, timeout = 300000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = await predicate(); if (value) return value; await delay(Math.min(500, Math.max(1, end - Date.now()))); }
  throw new Error(label + ' timed out; no retry authorized');
}
function verifyInputs(info) {
  assert.equal(info.comparison, '0.1.0');
  assert.ok(path.resolve(info.dir).startsWith(path.join(root, 'output/playwright/' + (info.editRepair ? 'marketing-edit-repair-' : info.claimBound ? 'marketing-claim-bound-' : info.taskIsolation ? 'marketing-isolation-' : info.candidate ? 'marketing-candidate-' : 'marketing-comparison-'))));
  assert.equal(sha(cli), info.cliSha256);
  assert.equal(sha(path.join(path.dirname(info.appExe), 'resources/app.asar')), info.asarSha256);
  const migrations = [];
  for (const [p, hash] of Object.entries(info.inputHashes)) {
    const actual = sha(p);
    if (actual !== hash && (info.editRepair ? ['plain-candidate', 'plain-correction'] : info.claimBound ? ['plain-B'] : info.taskIsolation ? ['plain-A', 'plain-B'] : ['plain']).some(arm => p === path.join(info.dir, arm, 'cli/config/opencode/opencode.json'))) {
      const original = path.join(info.dir, 'provider-control.json');
      assert.equal(sha(original), hash, 'Original provider control changed');
      schemaMetadataOnly(read(p), read(original));
      migrations.push({ file: p, originalSha256: hash, observedSha256: actual, change: 'schema metadata only' });
    } else assert.equal(actual, hash, 'Changed comparison input: ' + p);
  }
  const source = read(path.join(root, 'output/thinking-0.5.1-source.json'));
  let count = 0;
  const sourceUpdates = [];
  for (const [p, hash] of Object.entries(source.files)) if (!p.startsWith('tools/')) {
    const actual = sha(path.join(root, p));
    if ((info.taskIsolation || info.claimBound || info.editRepair) && p === 'UPSTREAM.md' && actual === 'cb9051570e12e2e7c4979726be6b13e3c0400cc905463ca30724d70780f755b9')
      sourceUpdates.push({ file: p, originalSha256: hash, observedSha256: actual, change: 'Approved public-source publication metadata; app unchanged' });
    else { assert.equal(actual, hash, 'Product input changed: ' + p); count++; }
  }
  return { unchangedProductInputs: count, inputFiles: Object.keys(info.inputHashes).length, asarUnchanged: true, migrations, ...(info.taskIsolation || info.claimBound || info.editRepair ? { sourceUpdates } : {}) };
}
function loadArmReceipt(file) {
  const current = read(receipt);
  assert.ok(!current.taskIsolation && !current.claimBound && !current.editRepair, 'Plain-only experiments have no Zuri arm');
  verifyInputs(current);
  if (current.candidate) require('./verify-marketing-model-candidate.cjs').verifyZuriGate(current);
  assert.equal(path.resolve(file), path.join(current.dir, 'zuri/run-receipt.json'));
  assert.ok(fs.existsSync(path.join(current.dir, 'zuri.attempt')), 'Orchestrator must claim this arm');
  const info = read(file);
  assert.equal(info.dir, path.join(current.dir, 'zuri'));
  assert.equal(info.comparisonWorkspace, path.join(current.dir, 'project'));
  assert.deepEqual(info.prompts, current.prompts);
  assert.deepEqual(info.commonSkills, current.commonSkills);
  for (const key of ['candidate', 'model', 'modelDigest', 'context', 'endpoint', 'appEndpoint', 'appExe', 'asarSha256']) assert.equal(info[key], current[key]);
  claim(info.dir, 'runner');
  return info;
}
async function prepare({ candidate = false, taskIsolation = false, claimBound = false } = {}) {
  assert.ok([candidate, taskIsolation, claimBound].filter(Boolean).length <= 1, 'Select one experiment');
  assert.ok(!await live.portInUse(11438) && !await live.portInUse(11439), 'Stop prior QA services first');
  const previous = read(receipt);
  assert.equal(previous.snapshotVersion, claimBound ? '5.0.7' : taskIsolation ? '5.0.6' : candidate ? '5.0.5' : '5.0.4', 'Only one preparation is authorized');
  if (claimBound) require('./verify-marketing-claim-bound-editing.cjs').sourceEvidence(previous);
  const dir = path.join(root, 'output/playwright/' + (claimBound ? 'marketing-claim-bound-' : taskIsolation ? 'marketing-isolation-' : candidate ? 'marketing-candidate-' : 'marketing-comparison-') + Date.now());
  const arms = claimBound ? ['plain-B'] : taskIsolation ? ['plain-A', 'plain-B'] : ['plain', 'zuri'];
  for (const sub of ['project/.agents', 'temp', 'ollama-home', ...arms.flatMap(a => ['profile/temp', 'cli/config/opencode', 'cli/data', 'cli/cache', 'temp'].map(p => a + '/' + p))]) fs.mkdirSync(path.join(dir, sub), { recursive: true });
  const workspace = path.join(dir, 'project'), contextPath = path.join(workspace, '.agents/product-marketing.md');
  fs.copyFileSync(path.join(previous.dir, 'project/.agents/product-marketing.md'), contextPath);
  execFileSync('git', ['init', workspace], { stdio: 'ignore', windowsHide: true });
  const loadTs = require('../test/load-ts.cjs');
  const skills = loadTs('src/shared/marketingSkills.ts').MARKETING_ROLES.find(r => r.id === 'content').skills;
  const provisioned = loadTs('src/main/marketingSkills.ts').provisionMarketingSkills(path.join(root, 'resources/marketing-skills'), path.join(workspace, '.qa-skills'), skills, workspace);
  assert.ok(provisioned.entries.length === 8 && provisioned.entries.every(e => e.status === 'provisioned'));
  const commonSkills = Object.fromEntries(provisioned.entries.map(e => [e.id, { path: e.path, sha256: sha(e.path) }]));
  const info = { dir, comparison: '0.1.0', endpoint: 'http://127.0.0.1:11438/v1', appEndpoint: 'http://127.0.0.1:11439/v1',
    model: 'qwen3.5:4b', context: 32768, modelDigest: '2a654d98e6fba55d452b7043684e9b57a947e393bbffa62485a7aac05ee4eefd',
    appVersion: '0.5.1', snapshotVersion: '5.0.5', compatibility: true, outputContract: '0.1.0', diagnosticMode: 'baseline',
    appExe: path.join(root, 'dist/marketing-0.5.1/win-unpacked/Zuri.exe'), asarSha256: 'd6f7e8da5aec8cf2f274a53b2ff52cb8caa288f7f8aff97bb52a9990fd5d9e71',
    cliSha256: sha(cli), cliVersion: execFileSync(cli, ['--version'], { encoding: 'utf8', windowsHide: true }).trim(),
    contextPath, commonSkills, prompts: {}, inputHashes: {}, preparedAt: new Date().toISOString(), previousDir: previous.dir };
  assert.equal(info.cliVersion, '1.18.34');
  if (candidate || taskIsolation || claimBound) Object.assign(info, { candidate: '0.1.0', snapshotVersion: claimBound ? '5.0.8' : taskIsolation ? '5.0.7' : '5.0.6', model: 'qwen3.5:9b', modelDigest: '6488c96fa5faab64bb65cbd30d4289e20e6130ef535a93ef9a49f42eda893ea7' });
  if (taskIsolation) Object.assign(info, { taskIsolation: '0.1.0', draftPath: path.join(workspace, '.qa-drafts/task-A.md') });
  if (claimBound) Object.assign(info, { claimBound: '0.1.0', draftPath: path.join(workspace, '.qa-drafts/task-A.md') });
  const provider = loadTs('src/shared/localProvider.ts').buildOpenCodeLocalConfig({ baseUrl: info.appEndpoint, model: info.model, autoMode: false, hasKey: false,
    localThinkingOverride: { baseUrl: info.appEndpoint, model: info.model, reasoningEffort: 'none' } });
  save(path.join(workspace, 'opencode.json'), { $schema: 'https://opencode.ai/config.json', autoupdate: false, permission: permissionConfig(dir, taskIsolation || claimBound) });
  const providerFiles = (taskIsolation || claimBound ? arms : ['plain']).map(arm => path.join(dir, arm, 'cli/config/opencode/opencode.json'));
  for (const file of providerFiles) save(file, provider);
  save(path.join(dir, 'provider-control.json'), provider);
  for (const letter of claimBound ? ['B'] : ['A', 'B']) {
    const file = path.join(dir, `task-${letter}-prompt.txt`), skill = letter === 'A' ? 'copywriting' : 'copy-editing';
    const instruction = claimBound ? require('./verify-marketing-claim-bound-editing.cjs').editingInstruction(info.draftPath) : taskIsolation && letter === 'B' ? require('./verify-marketing-task-isolation.cjs').editingInstruction(info.draftPath) : instructions[letter];
    fs.writeFileSync(file, live.marketingPrompt(letter, contextPath, commonSkills['marketing:' + skill].path, instruction, '0.1.0'));
    info.prompts[letter] = { path: file, sha256: sha(file) };
  }
  for (const p of [contextPath, path.join(workspace, 'opencode.json'), ...providerFiles, ...Object.values(info.prompts).map(p => p.path)]) info.inputHashes[p] = sha(p);
  const bundle = path.dirname(path.dirname(path.dirname(provisioned.entries[0].path)));
  const provenance = read(path.join(bundle, 'receipt.json'));
  for (const p of Object.keys(provenance.files)) { const file = path.join(bundle, p); assert.equal(sha(file), provenance.files[p]); info.inputHashes[file] = sha(file); }
  if (claimBound) require('./verify-marketing-claim-bound-editing.cjs').prepareInputs(info, previous);
  info.integrity = verifyInputs(info);
  save(path.join(dir, 'previous-receipt.json'), previous); save(path.join(dir, 'run-receipt.json'), info); save(receipt, info);
  console.log(JSON.stringify({ result: 'PREPARED', dir, serverStarted: false, integrity: info.integrity }));
  return info;
}
async function plain(info, isolatedLetter) {
  assert.ok(info.editRepair ? isolatedLetter === 'B' && !info.taskIsolation && !info.claimBound && ['candidate', 'correction'].includes(info.repairPhase) : info.claimBound ? isolatedLetter === 'B' && !info.taskIsolation : info.taskIsolation ? ['A', 'B'].includes(isolatedLetter) : isolatedLetter === undefined);
  const arm = info.editRepair ? 'plain-' + info.repairPhase : isolatedLetter ? 'plain-' + isolatedLetter : 'plain';
  const dir = path.join(info.dir, arm), workspace = path.join(info.dir, 'project');
  const database = path.join(dir, 'cli/data/opencode/opencode.db');
  const report = { arm, result: 'NOT_RUN', tasks: [], taskWindows: [], errors: [], startedAt: new Date().toISOString() };
  let terminal, recorder, phase = 'startup', exited = false, disposed = false, transcript = '';
  try {
    assert.ok(!fs.existsSync(path.join(info.dir, 'zuri/harness')), 'Plain must precede Hive creation');
    recorder = await require('./marketing-wire-recorder.cjs').startRecorder({ file: path.join(dir, 'wire-metadata.jsonl'), mode: 'baseline', context: () => ({ arm, phase, sessionId: report.sessionId || null }) });
    claim(info.dir, arm);
    terminal = require('node-pty').spawn(cli, ['--model', 'local/' + info.model], { cwd: workspace, env: isolatedEnv(dir), cols: 150, rows: 45, name: 'xterm-256color' });
    terminal.onExit(() => { exited = true; });
    terminal.onData(data => { transcript += data; fs.appendFileSync(path.join(dir, 'terminal.ansi.txt'), data); });
    await bounded('Plain interactive prompt', () => { if (exited) throw new Error('CLI exited before ready'); return /Ask anything/i.test(transcript.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '')); });
    // TUI must be rendered, not merely a process successfully spawned.
    await delay(1000);
    for (const letter of isolatedLetter ? [isolatedLetter] : ['A', 'B']) {
      const prompt = fs.readFileSync(info.prompts[letter].path, 'utf8'), start = Date.now();
      phase = letter; report.taskWindows.push({ task: letter, start, promptSha256: sha(info.prompts[letter].path) });
      claim(dir, 'task-' + letter);
      terminal.write('\x1b[200~' + prompt + '\x1b[201~'); await delay(350); terminal.write('\r');
      const final = await bounded('Plain task ' + letter, () => {
        if (exited) throw new Error('CLI exited during task');
        const observed = live.sessionEvents(database, workspace);
        assert.ok(observed.sessions.length <= 1, 'Unexpected additional plain session');
        if (!observed.sessions.length) return false;
        report.sessionId ||= observed.sessions[0].id;
        assert.equal(report.sessionId, observed.sessions[0].id);
        if ((info.taskIsolation || info.claimBound || info.editRepair) && isolatedLetter === 'B') assert.notEqual(report.sessionId, info.isolationPreviousSessionId, 'B must use a new session');
        return live.taskFinal(observed.events, { sessionId: report.sessionId, prompt, start, skillPath: info.commonSkills['marketing:' + (letter === 'A' ? 'copywriting' : 'copy-editing')].path,
          contextPath: info.contextPath, marker: `QA_TASK_${letter}_DONE`, model: info.model, outputContract: info.outputContract, letter,
          ...(isolatedLetter === 'B' ? { draftPath: info.draftPath } : {}),
          ...(info.editRepair ? { originalDraft: fs.readFileSync(info.draftPath, 'utf8'), contextText: fs.readFileSync(info.contextPath, 'utf8'), extraReadPaths: info.extraReadPaths || [] } : {}) });
      });
      report.taskWindows.at(-1).end = Date.now(); report.tasks.push({ task: letter, ...final });
      fs.writeFileSync(path.join(dir, `task-${letter}-output.md`), final.final);
      save(path.join(dir, 'live-result.json'), report);
      if (!isolatedLetter && letter === 'A' && !final.usableDraft) { report.tasks.push({ task: 'B', result: 'NOT_RUN', reason: 'A unusable' }); break; }
    }
    report.result = report.tasks.every(t => t.result === 'AUTOMATED_CHECKS_PASS') ? 'AWAITING_CONTENT_AND_VISUAL_REVIEW' : 'FAIL';
    const loaded = await (await fetch('http://127.0.0.1:11438/api/ps', { signal: AbortSignal.timeout(5000) })).json();
    report.loadedModel = loaded.models.find(m => m.name === info.model || m.model === info.model);
    assert.ok(report.loadedModel?.context_length >= info.context, 'Effective context not established');
    assert.ok(!/truncating input prompt/i.test(fs.readFileSync(path.join(info.dir, 'ollama.stderr.log'), 'utf8')), 'Server truncated a prompt');
  } catch (error) { report.result = 'FAIL'; report.errors.push(error.message); }
  finally {
    try {
      const observed = live.sessionEvents(database, workspace);
      save(path.join(dir, 'qa-session-events.json'), { ...observed, events: observed.events.map(e => e.part.type === 'reasoning' ? { ...e, part: { type: 'reasoning', characters: e.part.text?.length || 0 } } : e) });
      report.contamination = observed.events.filter(e => e.part.type === 'tool' && /hive|PROTOCOL\.md|memory\.md/i.test(JSON.stringify(e.part.state?.input || {}))).map(e => ({ messageId: e.messageId, tool: e.part.tool }));
    } catch (error) { report.errors.push(error.message); }
    if (terminal && !exited) { terminal.write('\x03'); try { await bounded('PTY exit', () => exited, 5000); } catch { terminal.kill(); disposed = true; await bounded('Owned PTY termination', () => exited, 10000).catch(e => report.errors.push(e.message)); } }
    report.ptyClosed = !terminal || exited;
    if (terminal && exited && !disposed) terminal.kill(); // Dispose owned console resources after normal child exit too.
    if (recorder) {
      await recorder.close(); report.recorderClosed = true;
      const records = fs.readFileSync(path.join(dir, 'wire-metadata.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
      const requests = records.filter(r => r.path === '/v1/chat/completions');
      report.wireRequests = requests.length;
      report.thinkingOptionOnWire = requests.length > 0 && requests.every(r => r.reasoningEffort === 'none' && r.forwardedReasoningEffort === 'none' && r.mode === 'baseline');
      if (!report.thinkingOptionOnWire) { report.result = 'FAIL'; report.errors.push('Thinking option not verified on pass-through wire'); }
    }
    for (const task of report.taskWindows) task.end ||= Date.now();
    report.completedAt = new Date().toISOString(); save(path.join(dir, 'live-result.json'), report);
  }
  return report;
}
async function main() {
  if (process.argv.includes('--prepare')) return prepare();
  const info = read(receipt); assert.ok(!info.candidate, 'Use the candidate runner and its manual review gate'); verifyInputs(info); await live.probe(info);
  const version = await (await fetch('http://127.0.0.1:11438/api/version', { signal: AbortSignal.timeout(5000) })).json();
  assert.equal(version.version, '0.35.1');
  const models = await (await fetch('http://127.0.0.1:11438/api/tags', { signal: AbortSignal.timeout(5000) })).json();
  assert.equal(models.models.find(m => m.name === info.model)?.digest, info.modelDigest);
  assert.ok(!await live.portInUse(11439));
  let report;
  if (process.argv.includes('--continue-zuri')) {
    report = read(path.join(info.dir, 'comparison-result.json'));
    assert.ok(fs.existsSync(path.join(info.dir, 'comparison.attempt')) && fs.existsSync(path.join(info.dir, 'plain.attempt')));
    assert.ok(report.plain.ptyClosed && report.plain.recorderClosed && report.plain.completedAt, 'Plain must be finalized and closed');
    assert.ok(!fs.existsSync(path.join(info.dir, 'zuri.attempt')), 'Never repeat a Zuri attempt');
    claim(info.dir, 'continuation');
    fs.copyFileSync(__filename, path.join(info.dir, 'executed-comparison-continuation.cjs'));
    report.continuation = { at: new Date().toISOString(), reason: 'Schema metadata-only migration; no plain retry', integrity: verifyInputs(info) };
  } else {
    claim(info.dir, 'comparison');
    fs.copyFileSync(__filename, path.join(info.dir, 'executed-comparison.cjs'));
    report = { result: 'INCONCLUSIVE', startedAt: new Date().toISOString(), maximumSessions: 2, plain: await plain(info), zuri: { result: 'NOT_RUN' } };
  }
  save(path.join(info.dir, 'comparison-result.json'), report);
  if (report.plain.ptyClosed && report.plain.recorderClosed && !await live.portInUse(11439)) {
    verifyInputs(info);
    const dir = path.join(info.dir, 'zuri'); fs.mkdirSync(path.join(dir, 'harness'));
    fs.writeFileSync(path.join(dir, 'idle-coordinator.cjs'), 'setInterval(() => {}, 1000); process.stdin.resume();\n');
    const arm = { ...info, dir, comparisonWorkspace: path.join(info.dir, 'project'), ollamaLogDir: info.dir };
    const armReceipt = path.join(dir, 'run-receipt.json'); save(armReceipt, arm); claim(info.dir, 'zuri');
    const log = fs.openSync(path.join(dir, 'runner.log'), 'wx');
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(__dirname, 'verify-marketing-live.cjs'), '--comparison-receipt', armReceipt], { cwd: root, windowsHide: true, stdio: ['ignore', log, log] });
      child.once('error', reject); child.once('exit', resolve);
    }).finally(() => fs.closeSync(log));
    report.zuri = fs.existsSync(path.join(dir, 'live-result.json')) ? read(path.join(dir, 'live-result.json')) : { result: 'NOT_RUN', reason: 'No final runner evidence; inspect runner.log' };
  }
  report.integrityAfter = verifyInputs(info); report.qaServerCleanup = 'PENDING_USER_STOP'; report.completedAt = new Date().toISOString();
  report.review = 'NOT_RUN: inspect exact outputs, reads, configuration differences and wire metadata before interpreting routes';
  save(path.join(info.dir, 'comparison-result.json'), report); console.log(JSON.stringify({ result: report.result, dir: info.dir, plain: report.plain.result, zuri: report.zuri.result }));
}
if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 1; });
module.exports = { isolatedEnv, permissionConfig, claim, bounded, verifyInputs, loadArmReceipt, instructions, schemaMetadataOnly, prepare, plain };
