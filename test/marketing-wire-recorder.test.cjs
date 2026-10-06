'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { responseParser, createRecorder } = require('../tools/marketing-wire-recorder.cjs');

const sse = value => `data: ${JSON.stringify(value)}\r\n\r\n`;
const packet = (delta, finish_reason = null) => ({ id: 'reply-1', choices: [{ index: 0, delta, finish_reason }] });
const listen = async server => { server.listen(0, '127.0.0.1'); await once(server, 'listening'); return server.address().port; };
const close = server => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
async function fixture(t, handler, mode = 'baseline') {
  const entries = [], upstream = http.createServer(handler);
  const upstreamPort = await listen(upstream);
  const proxy = createRecorder({ upstreamPort, mode, record: row => entries.push(row), context: () => ({ phase: 'A', sessionId: 'session-fixture' }) });
  const port = await listen(proxy);
  t.after(async () => { await close(proxy); await close(upstream); });
  return { entries, port };
}
function request(port, body, { method = 'POST', route = '/v1/chat/completions', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: route, method, headers }, res => {
      const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers }));
    });
    req.on('error', reject); req.end(body);
  });
}

test('SSE parses every-byte UTF-8 and CRLF splits without retaining text or reasoning', () => {
  const parser = responseParser(true);
  const text = 'คำตอบ 😀', reasoning = 'PRIVATE_THOUGHT';
  const wire = sse(packet({ reasoning_content: reasoning })) + sse(packet({ content: text })) +
    sse(packet({}, 'stop')) + sse({ choices: [], usage: { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 } }) + 'data: [DONE]\r\n\r\n';
  for (const byte of Buffer.from(wire)) parser.write(Buffer.from([byte])); parser.end();
  assert.equal(parser.result.contentCharacters, text.length);
  assert.equal(parser.result.reasoningCharacters, reasoning.length);
  assert.deepEqual(parser.result.finishReasons, ['stop']); assert.equal(parser.result.done, true);
  assert.deepEqual(parser.result.usage, { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 });
  assert.equal(parser.result.parseErrors, 0);
  assert.ok(!JSON.stringify(parser.result).includes(reasoning));
  assert.ok(!JSON.stringify(parser.result).includes(text));
});

test('reasoning-only stop stays empty, while tool-call fragments count one call per index', () => {
  const parser = responseParser(true);
  parser.write(Buffer.from(sse(packet({ reasoning: 'hidden' })) + sse(packet({}, 'stop')))); parser.end();
  assert.equal(parser.result.contentCharacters, 0); assert.equal(parser.result.reasoningCharacters, 6);
  const tools = responseParser(true);
  tools.write(Buffer.from(sse(packet({ tool_calls: [{ index: 0, id: 'call-1', function: { name: 'read', arguments: '{' } }] })) +
    sse(packet({ tool_calls: [{ index: 0, function: { arguments: 'SECRET_PATH}' } }, { index: 1, id: 'call-2' }] }, 'tool_calls')))); tools.end();
  assert.deepEqual(tools.result.toolCalls, [{ choice: 0, index: 0, id: 'call-1' }, { choice: 0, index: 1, id: 'call-2' }]);
  assert.ok(!JSON.stringify(tools.result).includes('SECRET_PATH'));
});

test('non-stream JSON counts message fields and malformed responses log no error body', () => {
  const parser = responseParser(false);
  parser.write(Buffer.from(JSON.stringify({ choices: [{ message: { content: 'answer', reasoning_content: 'thought' }, finish_reason: 'stop' }] }))); parser.end();
  assert.equal(parser.result.contentCharacters, 6); assert.equal(parser.result.reasoningCharacters, 7);
  const bad = responseParser(false); bad.write(Buffer.from('SECRET_MALFORMED')); bad.end();
  assert.equal(bad.result.parseErrors, 1); assert.ok(!JSON.stringify(bad.result).includes('SECRET_MALFORMED'));
});

test('SSE handles comments, multiline events, trailing event and malformed data', () => {
  const parser = responseParser(true);
  parser.write(Buffer.from(': heartbeat\n\ndata: {"choices":\ndata: [{"delta":{"content":"ok"},"finish_reason":"stop"}]}\n\ndata: invalid\n\ndata: [DONE]'));
  parser.end(); assert.equal(parser.result.contentCharacters, 2); assert.equal(parser.result.parseErrors, 1); assert.equal(parser.result.done, true);
});

test('baseline forwards exact request/response bytes and headers without logging their contents', async t => {
  const body = Buffer.from('{ "model": "fixture", "messages": [{"content":"PRIVATE_PROMPT"}], "stream": true }');
  const wire = Buffer.from(sse(packet({ content: 'PRIVATE_ANSWER', reasoning_content: 'PRIVATE_REASONING' }, 'stop')) + 'data: [DONE]\n\n');
  let received;
  const { entries, port } = await fixture(t, (req, res) => {
    const chunks = []; req.on('data', c => chunks.push(c)); req.on('end', () => {
      received = { body: Buffer.concat(chunks), authorization: req.headers.authorization };
      res.writeHead(200, { 'content-type': 'text/event-stream', 'x-fixture': 'yes' });
      res.write(wire.subarray(0, 13)); res.end(wire.subarray(13));
    });
  });
  const result = await request(port, body, { headers: { authorization: 'Bearer PRIVATE_KEY', 'content-type': 'application/json' } });
  assert.deepEqual(received.body, body); assert.deepEqual(result.body, wire); assert.equal(result.headers['x-fixture'], 'yes');
  assert.equal(received.authorization, 'Bearer PRIVATE_KEY'); assert.equal(entries.length, 1);
  assert.equal(entries[0].completion, 'end'); assert.equal(entries[0].phase, 'A');
  assert.equal(entries[0].contentCharacters, 'PRIVATE_ANSWER'.length);
  assert.equal(entries[0].forwardedReasoningEffort, null);
  assert.ok(!JSON.stringify(entries).includes('PRIVATE_'));
});

test('control changes only reasoning control and records the forwarded value', async t => {
  const value = { model: 'fixture', messages: [{ role: 'user', content: 'same input' }], temperature: 0.7, tools: [], stream: false, reasoning: { effort: 'high', summary: 'auto' } };
  let received;
  const { entries, port } = await fixture(t, (req, res) => {
    let raw = ''; req.on('data', c => { raw += c; }); req.on('end', () => {
      received = JSON.parse(raw); res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ choices: [{ message: { content: 'done' }, finish_reason: 'stop' }] }));
    });
  }, 'no-thinking');
  await request(port, JSON.stringify(value));
  assert.deepEqual(received, { ...value, reasoning_effort: 'none', reasoning: { ...value.reasoning, effort: 'none' } });
  assert.equal(entries[0].reasoningEffortNested, 'high'); assert.equal(entries[0].forwardedReasoningEffort, 'none');
  assert.equal(entries[0].forwardedReasoningEffortNested, 'none'); assert.equal(entries[0].contentCharacters, 4);
});

test('model listing is forwarded; non-allowlisted routes cannot reach upstream', async t => {
  let calls = 0;
  const { port } = await fixture(t, (_req, res) => { calls++; res.end('{"data":[]}'); });
  assert.equal((await request(port, null, { method: 'GET', route: '/v1/models' })).status, 200);
  for (const route of ['/api/pull', '/v1/chat/completions?url=elsewhere', 'http://example.com/v1/models']) {
    assert.equal((await request(port, '{}', { route })).status, 404);
  }
  assert.equal(calls, 1);
});

test('API error status/body are forwarded but only the error flag is recorded', async t => {
  const body = '{"error":{"message":"PRIVATE_PROVIDER_ERROR"}}';
  const { port, entries } = await fixture(t, (_req, res) => { res.writeHead(429, { 'content-type': 'application/json' }); res.end(body); });
  const result = await request(port, '{"model":"fixture"}');
  assert.equal(result.status, 429); assert.equal(result.body.toString(), body); assert.equal(entries[0].apiError, true);
  assert.ok(!JSON.stringify(entries).includes('PRIVATE_PROVIDER_ERROR'));
});

test('invalid request is rejected before forwarding and without retaining it', async t => {
  let calls = 0;
  const { port, entries } = await fixture(t, (_req, res) => { calls++; res.end(); });
  assert.equal((await request(port, 'PRIVATE_INVALID_JSON')).status, 400);
  assert.equal(calls, 0); assert.equal(entries[0].completion, 'invalid-request');
  assert.ok(!JSON.stringify(entries).includes('PRIVATE_INVALID_JSON'));
});

test('client disconnect cancels upstream and records exactly one incomplete response', async t => {
  let upstreamClosed;
  const upstreamClosure = new Promise(resolve => { upstreamClosed = resolve; });
  const { port, entries } = await fixture(t, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.write(sse(packet({ content: 'partial' })));
    res.on('close', upstreamClosed);
  });
  const req = http.request({ hostname: '127.0.0.1', port, path: '/v1/chat/completions', method: 'POST' }, res => {
    res.on('data', () => res.destroy()); res.on('error', () => {});
  });
  req.on('error', () => {}); req.end('{"model":"fixture","stream":true}');
  await upstreamClosure;
  assert.equal(entries.length, 1); assert.equal(entries[0].completion, 'client-disconnect');
  assert.deepEqual(entries[0].finishReasons, []);
});

test('broken upstream is an error, never a successful stop', async t => {
  const { port, entries } = await fixture(t, (req) => req.socket.destroy());
  assert.equal((await request(port, '{"model":"fixture"}')).status, 502);
  assert.equal(entries.length, 1); assert.equal(entries[0].completion, 'upstream-error');
});
