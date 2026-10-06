import { validateBaseUrl } from './integrations';

export interface LocalThinkingOverride { baseUrl: string; model: string; reasoningEffort: 'none' }
export interface LocalProviderProbeRequest { baseUrl: string; model: string; localThinkingOverride?: LocalThinkingOverride }
export interface LocalProviderProbeResult {
  ok: boolean;
  code: 'ready' | 'invalid_config' | 'unreachable' | 'authentication' | 'model_missing' | 'tools_unverified' | 'endpoint_error';
  message: string;
}

export function validateLocalProvider(input: LocalProviderProbeRequest):
  { ok: true; baseUrl: string; model: string } | { ok: false; error: string } {
  const baseUrl = typeof input?.baseUrl === 'string' ? input.baseUrl.trim().replace(/\/+$/, '') : '';
  const url = validateBaseUrl(baseUrl);
  if (!url.ok) return { ok: false, error: url.error };
  const model = typeof input?.model === 'string' ? input.model.trim().replace(/^local\//, '') : '';
  if (!model || /[\s\x00-\x1f]/.test(model)) return { ok: false, error: 'Enter an exact model ID without spaces.' };
  return { ok: true, baseUrl, model };
}

/** Ignore stale or malformed persisted overrides; never carry an option to another target. */
export function localThinkingDisabled(input: LocalProviderProbeRequest): boolean {
  const target = validateLocalProvider(input);
  const override = input?.localThinkingOverride;
  if (!target.ok || !override || override.reasoningEffort !== 'none') return false;
  const saved = validateLocalProvider(override);
  return saved.ok && saved.baseUrl === target.baseUrl && saved.model === target.model;
}

/** Local mode pins both foreground and background requests; no cloud fallback. */
export function buildOpenCodeLocalConfig(input: LocalProviderProbeRequest & { autoMode: boolean; hasKey: boolean }): Record<string, unknown> {
  const config = validateLocalProvider(input);
  if (!config.ok) throw new Error(config.error);
  return {
    autoupdate: false,
    enabled_providers: ['local'],
    model: `local/${config.model}`,
    small_model: `local/${config.model}`,
    ...(input.autoMode ? { permission: { edit: 'allow', bash: 'allow', webfetch: 'allow' } } : {}),
    provider: {
      local: {
        npm: '@ai-sdk/openai-compatible', name: 'Local (self-hosted)',
        options: { baseURL: config.baseUrl, ...(input.hasKey ? { apiKey: '{env:ZURI_LOCAL_API_KEY}' } : {}) },
        models: { [config.model]: { name: config.model, ...(localThinkingDisabled(input) ? { options: { reasoningEffort: 'none' } } : {}) } }
      }
    }
  };
}
