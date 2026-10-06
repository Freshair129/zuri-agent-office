'use strict';
// Approved 5.0.1 validation and 5.0.2 diagnostics. Never starts a model server.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const receipt = path.join(root, 'output/marketing-live-current.json');
const appExe = path.join(root, 'dist/marketing-0.5.0/win-unpacked/Zuri.exe');
const cli = path.join(root, 'node_modules/.zuri-provider-qa/node_modules/opencode-windows-x64/bin/opencode.exe');
const expectedAsar = '582418d68c0799bdd92b2af716876e8d0c0a987d280694320f904e489100a706';
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const save = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const slash = p => p.replaceAll('\\', '/');
function prepare({ diagnostic = false, control = false, compatibility = false, outputContract = false } = {}) {
  const previous = fs.existsSync(receipt) ? read(receipt) : null;
  if (previous && !diagnostic && !control && !compatibility && !outputContract) return previous;
  if (control) {
    assert.equal(previous?.diagnosticMode, 'baseline', 'Control requires the immediately preceding diagnostic baseline');
    const baseline = read(path.join(previous.dir, 'live-result.json'));
    assert.equal(baseline.result, 'FAIL', 'Control requires a failed baseline');
    assert.ok(baseline.appClosed && baseline.recorderClosed, 'Baseline processes must be closed before comparison');
    assert.ok(baseline.emptyFinalEvidence?.length, 'Control requires correlated upstream reasoning-only and CLI empty-final evidence');
    assert.ok(previous.ollamaPid && previous.ollamaStartedAt, 'Control must retain the baseline QA server ownership');
  }
  const dir = path.join(root, 'output/playwright/marketing-live-' + Date.now());
  const info = { dir, endpoint: 'http://127.0.0.1:11438/v1', model: 'qwen3.5:4b', context: 32768,
    appVersion: '0.5.0', snapshotVersion: diagnostic || control ? '5.0.2' : '5.0.1', preparedAt: new Date().toISOString() };
  if (diagnostic || control) Object.assign(info, { diagnosticMode: control ? 'no-thinking' : 'baseline', appEndpoint: 'http://127.0.0.1:11439/v1' });
  if (control) {
    for (const key of ['ollamaPid', 'ollamaExecutable', 'ollamaStartedAt']) info[key] = previous[key];
    info.ollamaLogDir = previous.ollamaLogDir || previous.dir;
    info.baselineDir = previous.dir;
  }
  if (compatibility) {
    const exe = path.join(root, 'dist/marketing-0.5.1/win-unpacked/Zuri.exe');
    assert.ok(fs.existsSync(exe), 'Build the approved 0.5.1 package first');
    assert.ok(previous?.ollamaPid && previous?.ollamaStartedAt, 'An owned QA server receipt is required');
    const previousResult = read(path.join(previous.dir, 'live-result.json'));
    assert.ok(previousResult.appClosed && previousResult.recorderClosed, 'Previous QA app and recorder must be closed');
    Object.assign(info, { appVersion: '0.5.1', snapshotVersion: '5.0.3', compatibility: true,
      appExe: exe, asarSha256: sha(path.join(path.dirname(exe), 'resources/app.asar')),
      diagnosticMode: 'baseline', appEndpoint: 'http://127.0.0.1:11439/v1',
      ollamaPid: previous.ollamaPid, ollamaExecutable: previous.ollamaExecutable,
      ollamaStartedAt: previous.ollamaStartedAt, ollamaLogDir: previous.ollamaLogDir || previous.dir });
  }
  if (outputContract) {
    assert.equal(previous?.snapshotVersion, '5.0.3', 'This approved experiment follows snapshot 5.0.3 only');
    const exe = path.join(root, 'dist/marketing-0.5.1/win-unpacked/Zuri.exe');
    const asarSha256 = 'd6f7e8da5aec8cf2f274a53b2ff52cb8caa288f7f8aff97bb52a9990fd5d9e71';
    assert.equal(sha(path.join(path.dirname(exe), 'resources/app.asar')), asarSha256, 'Use the unchanged tested package');
    const prior = read(path.join(previous.dir, 'live-result.json'));
    assert.ok(prior.appClosed && prior.recorderClosed, 'Prior QA processes must be closed');
    Object.assign(info, { appVersion: '0.5.1', snapshotVersion: '5.0.4', compatibility: true, outputContract: '0.1.0',
      appExe: exe, asarSha256, diagnosticMode: 'baseline', appEndpoint: 'http://127.0.0.1:11439/v1', baselineDir: previous.dir });
    // Deliberately do not copy the stopped server's ownership into this fresh receipt.
  }
  for (const name of ['project/.agents', 'profile/temp', 'harness', 'cli/config', 'cli/data', 'cli/cache', 'temp', 'ollama-home']) fs.mkdirSync(path.join(dir, name), { recursive: true });
  fs.writeFileSync(path.join(dir, 'project/.agents/product-marketing.md'), `# DeskLeaf QA — fictional acceptance fixture\n\nDocument version: 0.1.0\nThis is synthetic QA data, not a real product or approved Zuri marketing.\n\nAudience: solo consultants juggling client tasks.\nProduct: a local desktop task organizer.\nVerified fixture features: groups tasks by client; shows a daily checklist.\nPage: homepage hero for visitors already interested in organizing client work.\nPrimary action and exact CTA: View the demo\nVoice: plain, calm, specific.\nUnknown: pricing, testimonials, numerical time savings and performance metrics. Do not invent them.\nContext marker: ${crypto.randomBytes(8).toString('hex')}\n`);
  if (control || outputContract) fs.copyFileSync(path.join(previous.dir, 'project/.agents/product-marketing.md'), path.join(dir, 'project/.agents/product-marketing.md'));
  const allowed = slash(dir) + '/**';
  save(path.join(dir, 'project/opencode.json'), { $schema: 'https://opencode.ai/config.json', autoupdate: false,
    permission: { '*': 'deny', read: { '*': 'deny', '.agents/product-marketing.md': 'allow', '../harness/**': 'allow' }, glob: 'allow', list: 'allow',
      external_directory: { '*': 'deny', [allowed]: 'allow' }, edit: 'deny', bash: 'deny', webfetch: 'deny', websearch: 'deny', task: 'deny' } });
  execFileSync('git', ['init', path.join(dir, 'project')], { stdio: 'ignore', windowsHide: true });
  // The coordinator is an inert process, so only the selected worker uses the model.
  fs.writeFileSync(path.join(dir, 'idle-coordinator.cjs'), 'setInterval(() => {}, 1000); process.stdin.resume();\n');
  if (previous) save(path.join(dir, 'previous-receipt.json'), previous);
  save(path.join(dir, 'run-receipt.json'), info);
  save(receipt, info); return info;
}
async function portInUse(port) {
  const net = require('node:net');
  return new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', error => { socket.destroy(); resolve(error.code !== 'ECONNREFUSED'); });
    socket.setTimeout(1000, () => { socket.destroy(); resolve(true); });
  });
}
function emptyFinalEvidence(events, records, sessionId, taskWindows) {
  const evidence = [];
  for (const task of taskWindows) {
    const messages = new Map();
    for (const event of events) {
      if (event.sessionId !== sessionId || event.message.role !== 'assistant' || event.at < task.start || event.at > task.end) continue;
      if (!messages.has(event.messageId)) messages.set(event.messageId, { message: event.message, parts: [] });
      messages.get(event.messageId).parts.push(event.part);
    }
    const last = [...messages.entries()].filter(([, m]) => m.message.time?.completed).sort((a, b) => b[1].message.time.completed - a[1].message.time.completed)[0];
    if (!last) continue;
    const [messageId, final] = last;
    if (final.message.finish !== 'stop' || final.parts.some(p => p.type === 'tool' || (p.type === 'text' && p.text?.trim()))) continue;
    const matches = records.filter(row => row.phase === task.task && row.sessionId === sessionId && row.path === '/v1/chat/completions' &&
      row.completion === 'end' && row.statusCode === 200 && row.parseErrors === 0 && row.contentCharacters === 0 && row.reasoningCharacters > 0 &&
      row.toolCalls?.length === 0 && row.finishReasons?.includes('stop') &&
      Date.parse(row.startedAt) >= final.message.time.created && Date.parse(row.completedAt) <= final.message.time.completed + 2000);
    if (matches.length === 1) evidence.push({ task: task.task, sessionId, messageId, wireSequence: matches[0].sequence,
      wireContentCharacters: 0, wireReasoningCharacters: matches[0].reasoningCharacters, cliPartTypes: final.parts.map(p => p.type), finish: 'stop' });
  }
  return evidence;
}
async function probe(info) {
  assert.equal(info.endpoint, 'http://127.0.0.1:11438/v1');
  assert.ok(path.resolve(info.dir).startsWith(path.join(root, 'output/playwright') + path.sep));
  assert.equal(sha(path.join(path.dirname(info.appExe || appExe), 'resources/app.asar')), info.asarSha256 || expectedAsar);
  assert.ok(fs.existsSync(cli), 'Existing QA OpenCode executable is missing');
  const response = await fetch(info.endpoint + '/models', { signal: AbortSignal.timeout(5000) })
    .catch(() => { throw new Error('QA endpoint unavailable at ' + info.endpoint + '; start the reviewed QA launcher first.'); });
  assert.ok(response.ok, 'QA model endpoint is not ready');
  assert.ok((await response.json()).data.some(m => m.id === info.model), 'Approved existing model is unavailable');
  assert.ok(info.ollamaPid && info.ollamaStartedAt, 'Run the reviewed QA launcher so server ownership is recorded');
}
function sessionEvents(database, workspace) {
  if (!fs.existsSync(database)) return { sessions: [], events: [] };
  const { DatabaseSync } = require('node:sqlite');
  let db;
  try {
    db = new DatabaseSync(database, { readOnly: true });
    if (db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('session','message','part')").get().n !== 3) return { sessions: [], events: [], pending: 'initializing schema' };
    const sessions = db.prepare('SELECT id,directory,title FROM session WHERE lower(replace(directory,char(92),char(47)))=?').all(slash(workspace).toLowerCase());
    const events = sessions.flatMap(s => db.prepare('SELECT p.id,p.message_id,p.time_created,p.data,m.data AS message_data FROM part p JOIN message m ON m.id=p.message_id WHERE p.session_id=? ORDER BY p.time_created,p.id').all(s.id).map(r => ({ id: r.id, messageId: r.message_id, sessionId: s.id, at: r.time_created, part: JSON.parse(r.data), message: JSON.parse(r.message_data) })));
    return { sessions, events };
  } catch (e) {
    if (e.errcode === 5 || e.errcode === 6) return { sessions: [], events: [], pending: 'database busy' };
    throw e;
  } finally { db?.close(); }
}
function contractInstructions(letter) {
  assert.ok(['A', 'B'].includes(letter));
  return `Product facts come only from the supplied product-marketing context. Selected skill files provide writing or editing methods. Their example brands, products, customer problems and benefits are not facts about this product. Use the methods without copying unrelated examples. If evidence is missing, list it under Sources and unknowns rather than inventing a claim. The current task's output requirements take precedence over a skill's default output format. The completion marker is literal text to print, not a file to read or create.
Return exactly one complete ${letter === 'A' ? 'hero draft' : 'revised hero'}, using these section labels in order with the content beneath each:
Headline
<copy>
Subheading
<copy>
CTA
<exact CTA from the context>
Sources and unknowns
<sources actually used and facts not established>
${letter === 'B' ? 'Edits\n1. <brief explanation of an actual change>\n2. <brief explanation of another actual change>\n' : ''}No extra sections or alternate drafts. Finish with the literal line QA_TASK_${letter}_DONE.`;
}
function assessOutputContract(text, letter) {
  assert.ok(['A', 'B'].includes(letter));
  const expected = ['Headline', 'Subheading', 'CTA', 'Sources and unknowns', ...(letter === 'B' ? ['Edits'] : [])];
  const marker = `QA_TASK_${letter}_DONE`, lines = text.trim().split(/\r?\n/);
  const markerLine = lines.at(-1) === marker && lines.filter(l => l.includes(marker)).length === 1;
  if (lines.at(-1) === marker) lines.pop();
  const sections = [], bodies = {}; let current, invalid = false;
  for (const line of lines) {
    const clean = line.trim().replace(/^#{1,6}\s+/, '').replace(/^\*\*(Headline|Subheading|CTA|Sources and unknowns|Edits)(:?)\*\*(?=:|\s|$)/i, '$1$2');
    const heading = /^(Headline|Subheading|CTA|Sources and unknowns|Edits)\s*(?::\s*(.*))?$/i.exec(clean);
    if (heading) {
      current = heading[1].toLowerCase(); sections.push(current);
      if (Object.hasOwn(bodies, current)) invalid = true;
      bodies[current] = heading[2] || '';
    } else if (/^\s*#{1,6}\s/.test(line) || (!current && line.trim())) invalid = true;
    else if (current) bodies[current] += '\n' + line;
  }
  const layout = !invalid && JSON.stringify(sections) === JSON.stringify(expected.map(s => s.toLowerCase()));
  const edits = (bodies.edits || '').trim();
  const items = [...edits.matchAll(/^[ \t]*(\d+)([.)])[ \t]*(.*)$/gm)];
  return { contractLayout: layout, contractContent: expected.every(s => !!bodies[s.toLowerCase()]?.trim()),
    exactCta: bodies.cta?.trim() === 'View the demo', marker: markerLine,
    ...(letter === 'B' ? { exactlyTwoEdits: items.length === 2 && items[0][1] === '1' && items[1][1] === '2' &&
      items.every(item => item[2] === '.' && !!item[3].trim()) && /^1\.\s/.test(edits) } : {}) };
}
function taskFinal(events, { sessionId, prompt, start, skillPath, contextPath, marker, model, outputContract, letter, draftPath, originalDraft, contextText, extraReadPaths = [] }) {
  const users = events.filter(e => e.sessionId === sessionId && e.at >= start && e.message.role === 'user' && e.part.type === 'text' && e.part.text === prompt);
  const parents = [...new Set(users.map(e => e.messageId))];
  if (parents.length !== 1) return null;
  const matching = events.filter(e => e.sessionId === sessionId && e.message.role === 'assistant' && e.message.parentID === parents[0] && e.at >= start);
  const messages = new Map();
  for (const e of matching) {
    if (!messages.has(e.messageId)) messages.set(e.messageId, { messageId: e.messageId, message: e.message, parts: [] });
    messages.get(e.messageId).parts.push(e.part);
  }
  const final = [...messages.values()].filter(e => e.message.time?.completed && e.message.finish &&
    !['tool-calls', 'unknown'].includes(e.message.finish) && !e.parts.some(p => p.type === 'tool'))
    .sort((a, b) => b.message.time.completed - a.message.time.completed)[0];
  if (!final) return null;
  const text = final.parts.filter(p => p.type === 'text').map(p => p.text || '').join('\n');
  const readDone = file => matching.some(e => e.message.time?.created <= final.message.time.completed && e.part.type === 'tool' &&
    e.part.tool === 'read' && e.part.state?.status === 'completed' && slash(e.part.state.input?.filePath ?? '').toLowerCase() === slash(file).toLowerCase());
  const checks = { outputPresent: !!text.trim(), terminalStop: final.message.finish === 'stop',
    skillRead: readDone(skillPath), contextRead: readDone(contextPath),
    sections: ['Headline', 'Subheading', 'CTA', 'Sources', 'unknowns'].every(s => text.toLowerCase().includes(s.toLowerCase())),
    exactCta: text.includes('View the demo'), marker: text.trimEnd().endsWith(marker),
    localModel: final.message.providerID === 'local' && final.message.modelID === model };
  if (outputContract === '0.2.0') {
    assert.equal(letter, 'B'); assert.equal(typeof originalDraft, 'string'); assert.equal(typeof contextText, 'string');
    Object.assign(checks, require('./marketing-edit-contract.cjs').assess(text, originalDraft, contextText));
    if (extraReadPaths.length) checks.correctionReads = extraReadPaths.every(readDone);
  } else if (outputContract) Object.assign(checks, assessOutputContract(text, letter));
  if (draftPath) checks.draftRead = readDone(draftPath);
  return { parentMessageId: parents[0], messageId: final.messageId, sessionId, final: text, finish: final.message.finish,
    providerID: final.message.providerID, modelID: final.message.modelID, checks, factuality: 'NOT_RUN',
    result: Object.values(checks).every(Boolean) ? 'AUTOMATED_CHECKS_PASS' : 'FAIL',
    usableDraft: checks.outputPresent && ['Headline', 'Subheading', 'CTA'].every(s => text.includes(s)) };
}
async function main() {
  const diagnostic = process.argv.includes('--prepare-diagnostic'), control = process.argv.includes('--prepare-control');
  const compatibility = process.argv.includes('--prepare-compatibility');
  const outputContract = process.argv.includes('--prepare-output-contract');
  assert.ok([diagnostic, control, compatibility, outputContract].filter(Boolean).length <= 1, 'Select one preparation mode');
  if (diagnostic || control || compatibility || outputContract) {
    assert.ok(!await portInUse(11439), 'Close the existing QA recorder before preparing a fresh run');
    if (diagnostic || outputContract) assert.ok(!await portInUse(11438), 'Stop the prior QA server before preparing a fresh baseline');
  }
  const comparisonArg = process.argv.indexOf('--comparison-receipt');
  const info = comparisonArg < 0 ? prepare({ diagnostic, control, compatibility, outputContract })
    : require('./verify-marketing-comparison.cjs').loadArmReceipt(process.argv[comparisonArg + 1]);
  assert.ok(!info.comparison || comparisonArg >= 0, 'Use node tools/verify-marketing-comparison.cjs for this receipt; the legacy launcher hint does not apply');
  const dir = info.dir, workspace = info.comparisonWorkspace || path.join(dir, 'project');
  const runExe = info.appExe || appExe, runAsar = info.asarSha256 || expectedAsar;
  assert.ok(path.resolve(dir).startsWith(path.join(root, 'output/playwright') + path.sep), 'Unexpected QA output directory');
  // A fixture repo prevents OpenCode from treating the parent app checkout as its project.
  if (!fs.existsSync(path.join(workspace, '.git'))) execFileSync('git', ['init', workspace], { stdio: 'ignore', windowsHide: true });
  if (process.argv.includes('--prepare') || diagnostic || control || compatibility || outputContract) { console.log(JSON.stringify({ result: 'PREPARED', dir, diagnosticMode: info.diagnosticMode, serverStarted: false })); return; }
  const report = { appVersion: info.appVersion, snapshotVersion: info.snapshotVersion, startedAt: new Date().toISOString(),
    result: 'NOT_RUN', asarSha256: runAsar, model: info.model, endpoint: info.endpoint, context: info.context,
    screens: [], tasks: [], taskWindows: [], errors: [], visualReview: 'NOT_RUN', contentReview: 'NOT_RUN', diagnosticMode: info.diagnosticMode, outputContract: info.outputContract };
  assert.ok(!fs.existsSync(path.join(dir, 'live-result.json')), 'Run already has evidence; explicitly prepare a fresh run');
  try { await probe(info); } catch (e) {
    report.blocker = String(e.message); save(path.join(dir, `preflight-${Date.now()}.json`), report);
    console.log(JSON.stringify({ result: report.result, dir, blocker: report.blocker })); process.exitCode = 2; return;
  }
  if (process.argv.includes('--preflight')) { console.log(JSON.stringify({ result: 'PREFLIGHT_PASS', dir })); return; }
  const playwrightPath = process.env.ZURI_PLAYWRIGHT_MODULE || 'C:/Users/freshair/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
  const { _electron } = require(playwrightPath);
  const profile = path.join(dir, 'profile'), harness = path.join(dir, 'harness');
  const database = path.join(dir, 'cli/data/opencode/opencode.db');
  const coordinator = `"${process.execPath}" "${path.join(dir, 'idle-coordinator.cjs')}"`;
  assert.ok(!fs.existsSync(path.join(profile, 'config.json')), 'Profile already used; preserve evidence and prepare a fresh run explicitly');
  save(path.join(profile, 'config.json'), { onboardingComplete: true, harnessHome: harness, registeredRepos: [workspace],
    autoMode: false, defaultCommand: coordinator, godProvider: 'custom', missions: [], opsStandupSeeded: true, heartbeatSeeded: true,
    notifications: false, telemetryEnabled: false, autoUpdate: false, semanticMemory: false, knowledgeGraph: false,
    providerBaseUrls: { opencode: info.appEndpoint || info.endpoint }, providerDefaultModels: { opencode: info.model } });
  const env = { ...process.env, ZURI_USER_DATA_DIR: profile, TEMP: path.join(dir, 'temp'), TMP: path.join(dir, 'temp'),
    HOME: path.join(dir, 'cli'), USERPROFILE: path.join(dir, 'cli'), APPDATA: path.join(dir, 'cli/appdata'), LOCALAPPDATA: path.join(dir, 'cli/localappdata'),
    XDG_CONFIG_HOME: path.join(dir, 'cli/config'), XDG_DATA_HOME: path.join(dir, 'cli/data'), XDG_CACHE_HOME: path.join(dir, 'cli/cache'),
    OPENCODE_DISABLE_MODELS_FETCH: '1', OPENCODE_DISABLE_AUTOUPDATE: '1', BUN_INSTALL_CACHE_DIR: path.join(dir, 'cli/bun-cache') };
  for (const k of Object.keys(env)) if (/TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY|^OPENCODE_CONFIG|^OPENCODE_SERVER/.test(k)) delete env[k];
  delete env.ELECTRON_RUN_AS_NODE;
  if (info.comparisonWorkspace) for (const key of Object.keys(env)) if (/^(HIVE|AGENT|ZURI_|OPENCODE_)/i.test(key) && !['ZURI_USER_DATA_DIR', 'OPENCODE_DISABLE_MODELS_FETCH', 'OPENCODE_DISABLE_AUTOUPDATE'].includes(key)) delete env[key];
  let app, page, agent, recorder, startupTimer, phase = 'bootstrap';
  const capture = async name => {
    if (info.candidate && (name === 'local-bootstrap' || /^task-[AB]-result$/.test(name))) {
      const terminalVisible = async () => page.locator('.xterm').evaluateAll(nodes => nodes.some(node => {
        const r = node.getBoundingClientRect(), top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return r.width > 0 && r.height > 0 && top && node.contains(top);
      }));
      if (!await terminalVisible()) {
        const wrong = `${String(report.screens.length + 1).padStart(2, '0')}-${name}-unverified-view.png`;
        await page.screenshot({ path: path.join(dir, wrong) });
        report.screens.push({ file: wrong, sha256: sha(path.join(dir, wrong)), at: new Date().toISOString(), terminalVisible: false });
        const dialog = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Agents & Models', exact: true }) });
        if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'close', exact: true }).click();
        const terminalTab = page.getByRole('button', { name: 'TERMINAL', exact: true }).last();
        if (await terminalTab.isVisible()) await terminalTab.click();
      }
      report.terminalCaptures ||= [];
      report.terminalCaptures.push({ phase: name, visible: await terminalVisible(), requiresImageReview: true });
    }
    const file = `${String(report.screens.length + 1).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: path.join(dir, file) }); report.screens.push({ file, sha256: sha(path.join(dir, file)), at: new Date().toISOString() });
  };
  const waitFor = async (label, predicate, timeout = 300000) => {
    const end = Date.now() + timeout; let tick = 0;
    while (Date.now() < end) {
      const result = predicate(); if (result) return result;
      if (++tick % 20 === 0) console.log(JSON.stringify({ waiting: label, secondsRemaining: Math.ceil((end - Date.now()) / 1000) }));
      await delay(1000);
    }
    throw new Error(label + ' did not finish within the bounded wait');
  };
  try {
    if (info.diagnosticMode) {
      assert.equal(info.appEndpoint, 'http://127.0.0.1:11439/v1');
      recorder = await require('./marketing-wire-recorder.cjs').startRecorder({ file: path.join(dir, 'wire-metadata.jsonl'), mode: info.diagnosticMode,
        context: () => ({ phase, sessionId: report.sessionId || null, ...(info.comparisonWorkspace ? { arm: 'zuri' } : {}) }) });
      fs.copyFileSync(path.join(__dirname, 'marketing-wire-recorder.cjs'), path.join(dir, 'executed-recorder.cjs'));
      report.recorderSha256 = sha(path.join(dir, 'executed-recorder.cjs'));
    }
    report.defaultServerBefore = await (await fetch('http://127.0.0.1:11434/api/version', { signal: AbortSignal.timeout(5000) })).json().catch(() => null);
    fs.copyFileSync(__filename, path.join(dir, 'executed-runner.cjs')); report.runnerSha256 = sha(__filename);
    if (info.comparisonWorkspace) startupTimer = setTimeout(() => {
      report.errors.push('Comparison startup exceeded 300 seconds; no retry');
      void app?.close().catch(e => report.errors.push('Startup cleanup: ' + e.message));
    }, 300000);
    app = await _electron.launch({ executablePath: runExe, env, timeout: 60000, recordVideo: { dir: path.join(dir, 'video'), size: { width: 1440, height: 960 } } });
    page = await app.firstWindow({ timeout: 20000 }); page.setDefaultTimeout(20000); page.on('pageerror', e => report.errors.push(e.message));
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 960));
    report.app = await app.evaluate(({ app }) => ({ version: app.getVersion(), packaged: app.isPackaged }));
    assert.deepEqual(report.app, { version: info.appVersion, packaged: true });
    const open = page.getByRole('button', { name: 'open', exact: true });
    await open.or(page.getByRole('button', { name: 'Settings', exact: true })).first().waitFor();
    if (await open.isVisible()) await open.click();
    await page.getByRole('button', { name: 'Settings', exact: true }).waitFor();
    if (info.compatibility) {
      const openEngines = async () => {
        await page.getByRole('button', { name: 'Settings', exact: true }).click();
        await page.getByRole('button', { name: 'Agents & Models', exact: true }).click();
      };
      const setting = page.getByRole('checkbox', { name: 'Disable thinking for this model', exact: true });
      const expected = { baseUrl: info.appEndpoint, model: info.model, reasoningEffort: 'none' };
      await openEngines();
      assert.equal(await setting.isChecked(), false);
      await setting.check();
      await waitFor('UI thinking save', () => read(path.join(profile, 'config.json')).localThinkingOverride?.reasoningEffort === 'none', 10000);
      assert.deepEqual(read(path.join(profile, 'config.json')).localThinkingOverride, expected);
      await capture('thinking-setting-enabled');
      await page.getByRole('button', { name: 'close', exact: true }).click();
      await openEngines();
      assert.equal(await setting.isChecked(), true, 'Persisted option must survive settings remount');
      const modelField = page.getByRole('textbox', { name: 'OpenCode model ID', exact: true });
      await modelField.fill('another-model');
      assert.equal(await setting.isChecked(), false, 'Changing model must not inherit the option');
      await modelField.fill(info.model);
      const endpointField = page.getByRole('textbox', { name: 'OpenCode base URL', exact: true });
      await endpointField.fill(info.endpoint);
      assert.equal(await setting.isChecked(), false, 'Changing endpoint must not inherit the option');
      await endpointField.fill(info.appEndpoint);
      await setting.uncheck();
      await waitFor('UI thinking clear', () => !read(path.join(profile, 'config.json')).localThinkingOverride, 10000);
      await setting.check();
      await waitFor('UI thinking restore', () => read(path.join(profile, 'config.json')).localThinkingOverride?.reasoningEffort === 'none', 10000);
      report.compatibilitySetting = { defaultUnchecked: true, persisted: expected, remountChecked: true, clearVerified: true, modelMismatchUnchecked: true, endpointMismatchUnchecked: true };
      await page.getByRole('button', { name: 'close', exact: true }).click();
    }
    await page.getByRole('main').getByRole('button', { name: 'Add agent', exact: true }).first().click();
    await page.getByRole('button', { name: '2 Workspace folder · isolation · resume', exact: true }).click();
    await page.getByRole('textbox', { name: '/path/to/your/project', exact: true }).fill(workspace);
    await page.getByRole('checkbox').first().uncheck();
    await page.getByRole('button', { name: '3 Engine provider · model · command', exact: true }).click();
    await page.getByRole('button', { name: 'OpenCode', exact: true }).click();
    await page.getByRole('textbox', { name: 'Command', exact: true }).fill(`"${cli}" --model local/${info.model}`);
    await page.getByRole('button', { name: '4 Briefing description · goal', exact: true }).click();
    await page.getByRole('combobox', { name: 'Marketing role', exact: true }).selectOption('content');
    await capture('content-role');
    await page.getByRole('button', { name: 'spawn', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    agent = await page.evaluate(async () => Object.values((await window.cth.hiveRegistry()).agents).find(a => a.name === 'Content & Brand'));
    assert.equal(agent.skills.length, 8); assert.ok(agent.marketing.entries.every(e => e.status === 'provisioned'));
    report.agent = { id: agent.id, skills: agent.skills, contextPath: agent.marketing.contextPath };
    if (info.comparisonWorkspace) {
      report.provisionedHashes = agent.marketing.entries.map(e => ({ id: e.id, sha256: sha(e.path) }));
      for (const e of agent.marketing.entries) assert.equal(sha(e.path), info.commonSkills[e.id].sha256);
    }
    const roster = page.getByRole('button', { name: 'Show agent roster', exact: true }); if (await roster.isVisible()) await roster.click();
    await page.getByRole('region', { name: 'Agent roster', exact: true }).getByRole('button', { name: /^CONTENT & BRAND/ }).first().click();
    await page.getByRole('button', { name: 'TERMINAL', exact: true }).last().click();
    await waitFor('initial local-model bootstrap', () => sessionEvents(database, workspace).events.some(e => e.message.role === 'assistant' && e.part.type === 'step-finish' && e.part.reason === 'stop'));
    await capture('local-bootstrap');
    const initial = sessionEvents(database, workspace); assert.equal(initial.sessions.length, 1, 'One exact QA session is required');
    report.sessionId = initial.sessions[0].id;
    clearTimeout(startupTimer);
    for (const [letter, skill, instruction] of [
      ['A', 'copywriting', 'Produce a homepage hero draft with sections Headline, Subheading, CTA and Sources and unknowns. Use only supplied facts. The primary action is stated in the context. Do not invent numbers, prices, testimonials or performance claims.'],
      ['B', 'copy-editing', 'Revise your Task A hero for clarity using the copy-editing skill. Preserve the supplied facts and exact CTA. Output the complete revised Headline, Subheading, CTA and Sources and unknowns, followed by two brief explanations of your edits.']
    ]) {
      const entry = agent.marketing.entries.find(e => e.id === 'marketing:' + skill);
      const contextPath = info.comparisonWorkspace ? info.contextPath : agent.marketing.contextPath;
      const skillPath = info.comparisonWorkspace ? info.commonSkills[entry.id].path : entry.path;
      const prompt = info.comparisonWorkspace ? fs.readFileSync(info.prompts[letter].path, 'utf8') : marketingPrompt(letter, contextPath, skillPath, instruction, info.outputContract);
      if (info.comparisonWorkspace) assert.equal(sha(info.prompts[letter].path), info.prompts[letter].sha256);
      const start = Date.now(); phase = letter; report.taskWindows.push({ task: letter, start });
      fs.writeFileSync(path.join(dir, `task-${letter}-prompt.txt`), prompt);
      report.taskWindows.at(-1).promptSha256 = sha(path.join(dir, `task-${letter}-prompt.txt`));
      await page.evaluate(async ({ id, prompt }) => { await window.cth.writePty(id, '\x1b[200~' + prompt + '\x1b[201~'); }, { id: 'pty-' + agent.id, prompt });
      await delay(350); await page.evaluate(id => window.cth.writePty(id, '\r'), 'pty-' + agent.id);
      const final = await waitFor('Task ' + letter, () => taskFinal(sessionEvents(database, workspace).events,
        { sessionId: report.sessionId, prompt, start, skillPath, contextPath, marker: `QA_TASK_${letter}_DONE`, model: info.model, outputContract: info.outputContract, letter }));
      const observed = sessionEvents(database, workspace);
      assert.equal(observed.sessions.length, 1); assert.equal(final.sessionId, report.sessionId);
      fs.writeFileSync(path.join(dir, `task-${letter}-output.md`), final.final);
      report.tasks.push({ task: letter, ...final });
      report.taskWindows.at(-1).end = Date.now();
      await capture('task-' + letter + '-result'); save(path.join(dir, 'live-result.json'), report);
      if (letter === 'A' && !final.usableDraft) {
        report.tasks.push({ task: 'B', result: 'NOT_RUN', reason: 'Task A did not produce a usable hero draft' });
        break;
      }
    }
    const loaded = await (await fetch('http://127.0.0.1:11438/api/ps')).json();
    report.loadedModel = loaded.models.find(m => m.name === info.model || m.model === info.model);
    assert.ok(report.loadedModel?.context_length >= info.context, 'Effective context not established');
    const log = path.join(info.ollamaLogDir || dir, 'ollama.stderr.log');
    assert.ok(!fs.existsSync(log) || !/truncating input prompt/i.test(fs.readFileSync(log, 'utf8')), 'Server truncated a prompt');
    assert.deepEqual(report.errors, []);
    report.result = report.tasks.every(t => t.result === 'AUTOMATED_CHECKS_PASS') ? 'AWAITING_CONTENT_AND_VISUAL_REVIEW' : 'FAIL';
  } catch (e) {
    report.result = 'FAIL'; report.failure = e.message; process.exitCode = 1;
    if (page && !page.isClosed()) await capture('failure').catch(() => {});
  } finally {
    clearTimeout(startupTimer);
    for (const task of report.taskWindows) task.end ||= Date.now();
    let observed;
    try {
      observed = sessionEvents(database, workspace);
      // Retain reasoning lengths only, never reasoning contents in exported evidence.
      save(path.join(dir, 'qa-session-events.json'), { ...observed, events: observed.events.map(e => e.part.type === 'reasoning'
        ? { ...e, part: { type: 'reasoning', characters: e.part.text?.length || 0 } } : e) });
    } catch (e) { report.errors.push('Evidence extraction: ' + e.message); }
    if (app) {
      try { const closed = app.waitForEvent('close', { timeout: 30000 }); await page.evaluate(() => { void window.cth.confirmClose(); }); await closed; report.appClosed = true; }
      catch (e) { report.errors.push('App close: ' + e.message); }
    }
    if (recorder) {
      await recorder.close(); report.recorderClosed = true;
      const records = fs.readFileSync(path.join(dir, 'wire-metadata.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
      report.emptyFinalEvidence = emptyFinalEvidence(observed?.events || [], records, report.sessionId, report.taskWindows);
      report.wireRequests = records.length;
      if (info.compatibility) {
        const requests = records.filter(r => r.path === '/v1/chat/completions');
        report.productThinkingOptionOnWire = requests.length > 0 && requests.every(r => r.reasoningEffort === 'none' && r.forwardedReasoningEffort === 'none' && r.mode === 'baseline');
        if (!report.productThinkingOptionOnWire) { report.result = 'FAIL'; report.errors.push('Product thinking option was not verified on the pass-through wire'); }
      }
    }
    if (info.diagnosticMode) report.qaServerCleanup = 'PENDING_USER_STOP_AFTER_COMPARISON';
    else {
      try { execFileSync('powershell.exe', ['-NoProfile', '-File', path.join(root, 'tools/start-marketing-live-qa.ps1'), '-Stop'], { encoding: 'utf8', windowsHide: true }); report.qaServerStopped = true; }
      catch (e) { report.errors.push('Owned QA server cleanup did not complete'); }
    }
    report.asarUnchanged = sha(path.join(path.dirname(runExe), 'resources/app.asar')) === runAsar;
    try { report.defaultServerAfter = await (await fetch('http://127.0.0.1:11434/api/version', { signal: AbortSignal.timeout(5000) })).json(); }
    catch { report.errors.push('Default Ollama endpoint was not reachable after QA'); }
    if (!report.asarUnchanged) { report.result = 'FAIL'; report.errors.push('Tested ASAR changed'); }
    if (report.errors.length && report.result === 'AWAITING_CONTENT_AND_VISUAL_REVIEW') report.result = 'PARTIAL';
    report.completedAt = new Date().toISOString(); save(path.join(dir, 'live-result.json'), report);
    console.log(JSON.stringify({ result: report.result, dir, tasks: report.tasks.length, errors: report.errors, failure: report.failure }));
  }
}
if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
function marketingPrompt(letter, contextPath, skillPath, instruction, outputContract) {
  return `QA_TASK_${letter}: Read these actual files with the read tool before answering: ${contextPath} and ${skillPath}. ${instruction} This is fictional DeskLeaf QA data, not approved Zuri marketing. Reply here only; do not write files, run shell commands, contact others or browse. Finish your final response with QA_TASK_${letter}_DONE.${outputContract ? '\n\n' + contractInstructions(letter) : ''}`;
}
module.exports = { sessionEvents, emptyFinalEvidence, taskFinal, contractInstructions, assessOutputContract, marketingPrompt, portInUse, probe };
