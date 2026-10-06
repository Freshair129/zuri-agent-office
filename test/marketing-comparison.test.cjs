'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { isolatedEnv, permissionConfig, claim, bounded, instructions, schemaMetadataOnly } = require('../tools/verify-marketing-comparison.cjs');
const { marketingPrompt, taskFinal } = require('../tools/verify-marketing-live.cjs');

test('plain profile removes inherited integration and credentials, isolates data', () => {
  const env = isolatedEnv('O:/qa/plain', { PATH: 'tools', Hive_HOME: 'old', AGENT_ID: 'old', OPENCODE_CONFIG_CONTENT: 'old', ZURI_USER_DATA_DIR: 'old', OPENAI_API_KEY: 'secret', ELECTRON_RUN_AS_NODE: '1' });
  assert.equal(env.PATH, 'tools');
  for (const key of ['Hive_HOME', 'AGENT_ID', 'OPENCODE_CONFIG_CONTENT', 'ZURI_USER_DATA_DIR', 'OPENAI_API_KEY', 'ELECTRON_RUN_AS_NODE']) assert.equal(env[key], undefined);
  assert.notEqual(env.XDG_DATA_HOME, isolatedEnv('O:/qa/zuri', {}).XDG_DATA_HOME);
  assert.equal(env.OPENCODE_DISABLE_AUTOUPDATE, '1');
});
test('only exact CLI schema metadata migration is permitted', () => {
  const original = { model: 'local/qwen3.5:4b', provider: { local: { options: { baseURL: 'http://127.0.0.1:11439/v1' } } } };
  assert.doesNotThrow(() => schemaMetadataOnly({ $schema: 'https://opencode.ai/config.json', ...original }, original));
  assert.throws(() => schemaMetadataOnly({ $schema: 'other', ...original }, original));
  assert.throws(() => schemaMetadataOnly({ $schema: 'https://opencode.ai/config.json', ...original, model: 'other' }, original));
  assert.throws(() => schemaMetadataOnly({ $schema: 'https://opencode.ai/config.json', ...original, permission: 'allow' }, original));
});
test('common permissions deny mutations and only allow reviewed read roots', () => {
  const p = permissionConfig('O:/qa');
  for (const key of ['*', 'edit', 'bash', 'webfetch', 'websearch', 'task']) assert.equal(p[key], 'deny');
  assert.equal(p.read['*'], 'deny'); assert.equal(p.read['.qa-skills/**'], 'allow');
  assert.equal(p.external_directory['*'], 'deny');
  assert.equal(Object.values(p.external_directory).filter(v => v === 'allow').length, 2);
});
test('shared prompt bytes retain exact task contract without route labels', () => {
  for (const letter of ['A', 'B']) {
    const a = marketingPrompt(letter, 'O:/qa/context.md', 'O:/qa/SKILL.md', instructions[letter], '0.1.0');
    assert.equal(Buffer.compare(Buffer.from(a), Buffer.from(marketingPrompt(letter, 'O:/qa/context.md', 'O:/qa/SKILL.md', instructions[letter], '0.1.0'))), 0);
    assert.match(a, /actual files with the read tool/); assert.match(a, /completion marker is literal text/);
    assert.ok(a.includes(`QA_TASK_${letter}_DONE`)); assert.ok(!a.includes('arm:'));
  }
});
test('exclusive claims prohibit repeated arm and task dispatch', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zuri-comparison-'));
  try { claim(dir, 'plain'); assert.throws(() => claim(dir, 'plain'), { code: 'EEXIST' }); claim(dir, 'zuri'); claim(dir, 'task-A'); assert.throws(() => claim(dir, 'task-A'), { code: 'EEXIST' }); }
  finally { for (const file of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, file)); fs.rmdirSync(dir); }
});
test('bounded wait preserves failure and never submits replacement work', async () => {
  let calls = 0;
  await assert.rejects(bounded('fixture', () => { calls++; return false; }, 15), /timed out; no retry/);
  assert.ok(calls >= 1); assert.equal(await bounded('ready', () => 'ready', 100), 'ready');
  await assert.rejects(bounded('failure', () => { throw new Error('broken'); }, 100), /broken/);
});
test('other arm or earlier task evidence cannot satisfy a final', () => {
  assert.equal(taskFinal([{ sessionId: 'plain', at: 10, messageId: 'p', message: { role: 'user' }, part: { type: 'text', text: 'task' } }],
    { sessionId: 'zuri', prompt: 'task', start: 0, skillPath: 's', contextPath: 'c', marker: 'done', model: 'qwen3.5:4b' }), null);
});
test('existing native PTY can execute and clean up an inert fixture without a model', async () => {
  const pty = require('node-pty');
  let text = '', exited = false;
  const terminal = pty.spawn(process.execPath, ['-e', 'console.log("ZURI_PTY_FIXTURE_OK")'], { cwd: process.cwd(), env: process.env, cols: 80, rows: 24, name: 'xterm-256color' });
  terminal.onData(data => { text += data; }); terminal.onExit(() => { exited = true; });
  try { await bounded('inert PTY', () => exited, 10000); assert.match(text, /ZURI_PTY_FIXTURE_OK/); }
  finally { terminal.kill(); }
});
