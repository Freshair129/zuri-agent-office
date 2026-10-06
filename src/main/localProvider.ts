import { localThinkingDisabled, validateLocalProvider, type LocalProviderProbeRequest, type LocalProviderProbeResult } from '../shared/localProvider';

/** Explicit user-triggered probe. Never echoes upstream response bodies or secrets. */
export async function probeLocalProvider(
  input: LocalProviderProbeRequest,
  apiKey?: string,
  request: typeof fetch = fetch,
  timeoutMs = 30_000
): Promise<LocalProviderProbeResult> {
  const config = validateLocalProvider(input);
  if (!config.ok) return { ok: false, code: 'invalid_config', message: config.error };
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const statusError = (status: number): LocalProviderProbeResult => status === 401 || status === 403
    ? { ok: false, code: 'authentication', message: 'Authentication rejected. Save the endpoint API key and test again.' }
    : { ok: false, code: 'endpoint_error', message: `Endpoint returned HTTP ${status}. Check the base URL, model and server configuration.` };
  try {
    const models = await request(`${config.baseUrl}/models`, { headers, signal: ac.signal, redirect: 'error' });
    if (!models.ok) return statusError(models.status);
    const catalog = await models.json() as { data?: Array<{ id?: unknown }> };
    if (!Array.isArray(catalog.data)) return { ok: false, code: 'endpoint_error', message: 'Endpoint did not return an OpenAI-compatible model list.' };
    if (!catalog.data.some((m) => m?.id === config.model)) return { ok: false, code: 'model_missing', message: 'Model ID was not found at this endpoint. Copy its exact ID from the server.' };
    const result = await request(`${config.baseUrl}/chat/completions`, {
      method: 'POST', headers, signal: ac.signal, redirect: 'error',
      body: JSON.stringify({
        model: config.model, stream: false, max_tokens: 128,
        ...(localThinkingDisabled(input) ? { reasoning_effort: 'none' } : {}),
        messages: [{ role: 'user', content: 'Call zuri_connection_test with ok set to true. Do not write text.' }],
        tools: [{ type: 'function', function: { name: 'zuri_connection_test', description: 'A connection test; performs no action.', parameters: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] } } }],
        tool_choice: { type: 'function', function: { name: 'zuri_connection_test' } }
      })
    });
    if (!result.ok) {
      if (result.status === 400 || result.status === 422) return { ok: false, code: 'tools_unverified', message: 'The server rejected the tool-calling probe. Check model tool support and the server chat template.' };
      return statusError(result.status);
    }
    const data = await result.json() as { choices?: Array<{ message?: { tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> } }> };
    const call = data.choices?.[0]?.message?.tool_calls?.find((c) => c.function?.name === 'zuri_connection_test');
    let valid = false;
    try { valid = JSON.parse(call?.function?.arguments ?? '{}').ok === true; } catch { /* invalid tool arguments */ }
    return valid
      ? { ok: true, code: 'ready', message: 'Endpoint, model and a basic tool call passed. Start an agent to verify the full workflow.' }
      : { ok: false, code: 'tools_unverified', message: 'Endpoint responded, but the model did not return the expected tool call. Agent tool support is unverified.' };
  } catch {
    return { ok: false, code: 'unreachable', message: 'Endpoint unreachable, timed out, redirected, or returned invalid JSON. Check the server and base URL.' };
  } finally { clearTimeout(timer); }
}
