'use strict';
// QA-only: fixed loopback upstream, metadata only, no model-server startup.
const http = require('node:http');
const fs = require('node:fs');
const { StringDecoder } = require('node:string_decoder');

function responseSummary() {
  const result = { contentCharacters: 0, reasoningCharacters: 0, toolCalls: [], finishReasons: [], usage: {}, parseErrors: 0, done: false };
  const calls = new Map();
  const count = value => typeof value === 'string' ? value.length : 0;
  function consume(value) {
    if (!value || typeof value !== 'object') { result.parseErrors++; return; }
    if (value.error) result.apiError = true; // Never retain error bodies.
    if (typeof value.id === 'string') result.responseId = value.id.slice(0, 200);
    for (const key of ['prompt_tokens', 'completion_tokens', 'total_tokens']) {
      if (Number.isFinite(value.usage?.[key])) result.usage[key] = value.usage[key];
    }
    for (const choice of Array.isArray(value.choices) ? value.choices : []) {
      const message = choice.delta || choice.message || {};
      result.contentCharacters += count(message.content);
      result.reasoningCharacters += count(message.reasoning_content) + count(message.reasoning);
      if (typeof choice.finish_reason === 'string' && !result.finishReasons.includes(choice.finish_reason)) result.finishReasons.push(choice.finish_reason.slice(0, 80));
      for (const [position, call] of (Array.isArray(message.tool_calls) ? message.tool_calls : []).entries()) {
        const index = Number.isInteger(call.index) ? call.index : position;
        const key = `${choice.index ?? 0}:${index}`;
        if (!calls.has(key)) { const item = { choice: choice.index ?? 0, index }; calls.set(key, item); result.toolCalls.push(item); }
        if (typeof call.id === 'string') calls.get(key).id = call.id.slice(0, 200);
      }
    }
  }
  return { result, consume };
}

function responseParser(streamed) {
  const summary = responseSummary(), decoder = new StringDecoder('utf8');
  let buffer = '', data = [], overflow = false;
  function parse(text) {
    if (text === '[DONE]') { summary.result.done = true; return; }
    try { summary.consume(JSON.parse(text)); } catch { summary.result.parseErrors++; }
  }
  function dispatch() { if (data.length) { parse(data.join('\n')); data = []; } }
  function feed(text) {
    if (overflow) return;
    buffer += text;
    if (streamed) {
      let at;
      while ((at = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, at).replace(/\r$/, ''); buffer = buffer.slice(at + 1);
        if (!line) dispatch();
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
    }
    if (buffer.length + data.reduce((n, s) => n + s.length, 0) > 8 * 1024 * 1024) {
      summary.result.parseErrors++; overflow = true; buffer = ''; data = [];
    }
  }
  return {
    result: summary.result,
    write(chunk) { feed(decoder.write(chunk)); },
    end() {
      feed(decoder.end());
      if (!overflow) {
        if (streamed) { feed('\n'); dispatch(); }
        else if (buffer) parse(buffer);
        else summary.result.parseErrors++;
      }
    }
  };
}

function requestMetadata(body) {
  const value = JSON.parse(body.toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid JSON request');
  const effort = item => ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'].includes(item) ? item : null;
  return { value, metadata: { model: typeof value.model === 'string' ? value.model.slice(0, 200) : null,
    stream: value.stream === true, reasoningEffort: effort(value.reasoning_effort), reasoningEffortNested: effort(value.reasoning?.effort) } };
}

function createRecorder({ record, context = () => ({}), mode = 'baseline', upstreamPort = 11438 }) {
  if (!['baseline', 'no-thinking'].includes(mode)) throw new Error('Invalid diagnostic mode');
  let sequence = 0;
  const server = http.createServer((req, res) => {
    if (!((req.method === 'GET' && req.url === '/v1/models') || (req.method === 'POST' && req.url === '/v1/chat/completions'))) {
      res.writeHead(404); res.end(); req.resume(); return;
    }
    const start = Date.now();
    const entry = { sequence: ++sequence, ...context(), mode, method: req.method, path: req.url, startedAt: new Date(start).toISOString() };
    const chunks = []; let bytes = 0, upstream, reply, parser, finished = false;
    const finish = completion => {
      if (finished) return; finished = true;
      record({ ...entry, ...(parser?.result || {}), completion, completedAt: new Date().toISOString(), elapsedMs: Date.now() - start });
    };
    req.on('aborted', () => { upstream?.destroy(); finish('client-disconnect'); });
    req.on('error', () => { upstream?.destroy(); finish('client-error'); });
    res.on('close', () => {
      if (!res.writableFinished) { finish('client-disconnect'); reply?.destroy(); upstream?.destroy(); }
    });
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes <= 8 * 1024 * 1024) chunks.push(chunk);
      else if (!finished) { res.writeHead(413); res.end(); finish('request-too-large'); }
    });
    req.on('end', () => {
      if (finished) return;
      let body = Buffer.concat(chunks);
      if (req.method === 'POST') {
        try {
          const { value, metadata } = requestMetadata(body); Object.assign(entry, metadata);
          if (mode === 'no-thinking') {
            value.reasoning_effort = 'none';
            if (value.reasoning && typeof value.reasoning === 'object') value.reasoning = { ...value.reasoning, effort: 'none' };
            body = Buffer.from(JSON.stringify(value));
          }
          entry.forwardedReasoningEffort = mode === 'no-thinking' ? 'none' : metadata.reasoningEffort;
          entry.forwardedReasoningEffortNested = mode === 'no-thinking' && value.reasoning ? 'none' : metadata.reasoningEffortNested;
        } catch { res.writeHead(400); res.end(); finish('invalid-request'); return; }
      }
      const headers = { ...req.headers, host: `127.0.0.1:${upstreamPort}`, 'content-length': body.length };
      delete headers['transfer-encoding'];
      upstream = http.request({ hostname: '127.0.0.1', port: upstreamPort, path: req.url, method: req.method, headers }, incoming => {
        reply = incoming; entry.statusCode = reply.statusCode; entry.firstByteMs = Date.now() - start;
        if (req.method === 'POST') parser = responseParser(String(reply.headers['content-type']).includes('text/event-stream'));
        res.writeHead(reply.statusCode, reply.headers);
        reply.on('data', chunk => parser?.write(chunk));
        reply.on('end', () => { parser?.end(); finish('end'); });
        reply.on('aborted', () => { finish('upstream-aborted'); res.destroy(); });
        reply.on('error', () => { finish('upstream-error'); res.destroy(); });
        reply.pipe(res);
      });
      upstream.setTimeout(310000, () => { finish('upstream-timeout'); upstream.destroy(); res.destroy(); });
      upstream.on('error', () => { finish('upstream-error'); if (!res.headersSent) res.writeHead(502); res.end(); });
      upstream.end(body);
    });
  });
  return server;
}

async function startRecorder({ file, mode, context }) {
  // Exclusive output prevents replacing prior diagnostic evidence.
  const fd = fs.openSync(file, 'wx');
  const server = createRecorder({ mode, context, record: row => fs.writeSync(fd, JSON.stringify(row) + '\n') });
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(11439, '127.0.0.1', resolve); });
  } catch (error) { fs.closeSync(fd); throw error; }
  return { async close() {
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    fs.closeSync(fd);
  } };
}

module.exports = { responseParser, createRecorder, startRecorder };
