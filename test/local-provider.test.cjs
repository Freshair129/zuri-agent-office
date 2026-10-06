'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const loadTs = require('./load-ts.cjs');
const { probeLocalProvider } = loadTs('src/main/localProvider.ts');
const { buildOpenCodeLocalConfig, validateLocalProvider } = loadTs('src/shared/localProvider.ts');

const input = { baseUrl: 'http://127.0.0.1:11434/v1', model: 'local/org/model' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
const catalog = () => json({ data: [{ id: 'org/model' }] });
const toolReply = () => json({ choices: [{ message: { tool_calls: [{ function: { name: 'zuri_connection_test', arguments: '{"ok":true}' } }] } }] });

test('thinking override applies only to the normalized endpoint and exact model, without changing permissions or keys', () => {
  const baseline = buildOpenCodeLocalConfig({ ...input, autoMode: false, hasKey: true });
  const localThinkingOverride = { baseUrl: input.baseUrl + '/', model: 'org/model', reasoningEffort: 'none' };
  const actual = buildOpenCodeLocalConfig({ ...input, autoMode: false, hasKey: true, localThinkingOverride });
  const expected = structuredClone(baseline);
  expected.provider.local.models['org/model'].options = { reasoningEffort: 'none' };
  assert.deepEqual(actual, expected);
  for (const override of [undefined, null, {}, 'none', { ...localThinkingOverride, baseUrl: 'http://localhost:11434/v1' },
    { ...localThinkingOverride, model: 'ORG/model' }, { ...localThinkingOverride, model: '' },
    { ...localThinkingOverride, reasoningEffort: true }, { ...localThinkingOverride, reasoningEffort: 'low' }]) {
    assert.deepEqual(buildOpenCodeLocalConfig({ ...input, autoMode: false, hasKey: true, localThinkingOverride: override }), baseline);
  }
});

test('probe uses the same effective thinking option and does not silently retry a rejecting server', async () => {
  const override = { baseUrl: input.baseUrl, model: 'org/model', reasoningEffort: 'none' };
  for (const localThinkingOverride of [undefined, override, { ...override, model: 'different' }]) {
    const bodies = [];
    const result = await probeLocalProvider({ ...input, localThinkingOverride }, undefined, async (_url, options) => {
      if (!options.body) return catalog();
      bodies.push(JSON.parse(options.body));
      return json({}, 400);
    });
    assert.equal(bodies.length, 1);
    assert.equal(bodies[0].reasoning_effort, localThinkingOverride === override ? 'none' : undefined);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'tools_unverified');
  }
});

test('local config pins foreground/background model without cloud fallback or permission expansion', () => {
  const config = buildOpenCodeLocalConfig({ ...input, autoMode: false, hasKey: true });
  assert.deepEqual(config.enabled_providers, ['local']);
  assert.equal(config.model, 'local/org/model');
  assert.equal(config.small_model, 'local/org/model');
  assert.equal(config.permission, undefined);
  assert.equal(config.provider.local.options.apiKey, '{env:ZURI_LOCAL_API_KEY}');
  assert.deepEqual(Object.keys(config.provider.local.models), ['org/model']);
  const auto = buildOpenCodeLocalConfig({ ...input, autoMode: true, hasKey: false });
  assert.equal(auto.permission.bash, 'allow');
  assert.equal(auto.provider.local.options.apiKey, undefined);
});

test('invalid local URL/model fails before any network request', async () => {
  assert.equal((await probeLocalProvider(null)).code, 'invalid_config');
  for (const baseUrl of ['http://external.example/v1', 'http://user:secret@localhost/v1', 'http://localhost/v1?secret=x', 'not-a-url']) {
    assert.equal(validateLocalProvider({ ...input, baseUrl }).ok, false);
    const result = await probeLocalProvider({ ...input, baseUrl }, undefined, () => { throw new Error('must not fetch'); });
    assert.equal(result.code, 'invalid_config');
  }
  assert.equal(validateLocalProvider({ ...input, model: '' }).ok, false);
});

test('probe makes authenticated bounded requests and checks exact tool arguments', async () => {
  const calls = [];
  const result = await probeLocalProvider(input, 'fixture-only-token', async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? catalog() : toolReply();
  });
  assert.equal(result.ok, true);
  assert.equal(calls[0].url, input.baseUrl + '/models');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer fixture-only-token');
  assert.equal(calls[1].options.redirect, 'error');
  assert.equal(JSON.parse(calls[1].options.body).model, 'org/model');
  assert.ok(!JSON.stringify(result).includes('fixture-only-token'));
});

test('authentication failure is distinct and response bodies are not exposed', async () => {
  for (const status of [401, 403]) {
    const result = await probeLocalProvider(input, undefined, async () => json({ error: 'sensitive-body' }, status));
    assert.equal(result.code, 'authentication');
    assert.ok(!JSON.stringify(result).includes('sensitive-body'));
  }
});

test('missing model stops before inference', async () => {
  let count = 0;
  const result = await probeLocalProvider(input, undefined, async () => { count++; return json({ data: [{ id: 'other' }] }); });
  assert.equal(result.code, 'model_missing');
  assert.equal(count, 1);
});

test('text-only, malformed tools and rejected tools never pass', async () => {
  for (const response of [json({ choices: [{ message: { content: 'done' } }] }), json({ choices: [{ message: { tool_calls: [{ function: { name: 'zuri_connection_test', arguments: 'broken' } }] } }] }), json({}, 400), json({}, 422)]) {
    let count = 0;
    const result = await probeLocalProvider(input, undefined, async () => ++count === 1 ? catalog() : response);
    assert.equal(result.code, 'tools_unverified');
    assert.equal(result.ok, false);
  }
});

test('network errors are sanitized', async () => {
  const result = await probeLocalProvider(input, undefined, async () => { throw new Error('secret request detail'); });
  assert.equal(result.code, 'unreachable');
  assert.ok(!JSON.stringify(result).includes('secret request detail'));
});

test('a stalled endpoint is aborted at the probe deadline', async () => {
  const result = await probeLocalProvider(input, undefined, (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }), 20);
  assert.equal(result.code, 'unreachable');
});

test('real loopback HTTP transport uses exact routes and auth; fixture is not live model proof', async () => {
  const routes = [];
  const server = http.createServer(async (req, res) => {
    routes.push(req.url);
    assert.equal(req.headers.authorization, 'Bearer fixture-only-token');
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/v1/models') res.end(JSON.stringify({ data: [{ id: 'org/model' }] }));
    else res.end(await toolReply().text());
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const result = await probeLocalProvider({ ...input, baseUrl: `http://127.0.0.1:${server.address().port}/v1` }, 'fixture-only-token');
    assert.equal(result.ok, true);
    assert.deepEqual(routes, ['/v1/models', '/v1/chat/completions']);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
