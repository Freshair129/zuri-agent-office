import { useState, useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { HarnessConfig, AgentProvider } from '@/store/config';
import { PixelButton } from './PixelButton';
import { ProviderLogo } from './ProviderLogo';
import { localThinkingDisabled, validateLocalProvider, type LocalProviderProbeResult } from '@shared/localProvider';
import { useStore } from '@/store/store';

/**
 * AiEnginesSettings — the v0.3.1 per-provider config surface for the BYOK CLI
 * engines (OpenCode · Crush · pi.dev · Qwen). Two stores by what the datum is:
 *  - API keys → WRITE-ONLY in the secret broker (`providerKey:*` IPC). Keyed by the
 *    BACKEND model-provider (anthropic/openai/…). The field shows only set/not-set;
 *    the plaintext is never read back to the renderer (materialized MAIN-only at spawn).
 *  - Local base-URL + default model → HarnessConfig (`providerBaseUrls` /
 *    `providerDefaultModels`), keyed by CLI provider. Non-secret; normal config save.
 * See hive/shared/cli-agents/settings-ui-schema.md.
 */

/** Backend model-providers whose keys the CLIs read from standard env vars. Must
 *  match BACKEND_KEY_ENV in src/main/index.ts. */
const BACKENDS: Array<{ id: string; label: string; envVar: string }> = [
  { id: 'local', label: 'Local endpoint · OpenCode', envVar: 'optional endpoint key' },
  { id: 'anthropic', label: 'Anthropic', envVar: 'ANTHROPIC_API_KEY' },
  { id: 'openai', label: 'OpenAI', envVar: 'OPENAI_API_KEY' },
  { id: 'google', label: 'Google · Gemini', envVar: 'GEMINI_API_KEY' },
  { id: 'openrouter', label: 'OpenRouter', envVar: 'OPENROUTER_API_KEY' },
  { id: 'groq', label: 'Groq', envVar: 'GROQ_API_KEY' }
];

/** CLI engines that take a per-provider local base-URL + default model. `hint`
 *  values are technical endpoint descriptions — kept English (technical data). */
const CLIS: Array<{ id: AgentProvider; label: string; hint: string }> = [
  { id: 'opencode', label: 'OpenCode', hint: 'http://localhost:11434/v1 (Ollama) — injected as a local provider' },
  { id: 'crush', label: 'Crush', hint: 'OpenAI-compatible endpoint — used as the proxy upstream' },
  { id: 'pi', label: 'Pi', hint: 'local models are file-based (models.json); base-URL reserved' },
  { id: 'qwen', label: 'Qwen', hint: 'OpenAI-compatible endpoint — used as the proxy upstream' }
];

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px 4px',
  background: 'var(--cth-paper-100)',
  border: 'none',
  boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)',
  fontFamily: 'var(--cth-font-ui)',
  fontSize: 13,
  color: 'var(--cth-ink-900)',
  outline: 'none'
};
const labelStyle: CSSProperties = {
  fontFamily: 'var(--cth-font-display)',
  fontSize: 8,
  lineHeight: '12px',
  color: 'var(--cth-ink-700)',
  textTransform: 'uppercase'
};
const headStyle: CSSProperties = {
  fontFamily: 'var(--cth-font-display)', fontSize: 8, lineHeight: '12px',
  color: 'var(--cth-ink-500)', textTransform: 'uppercase', marginBottom: 2
};

export function AiEnginesSettings({ config }: { config: HarnessConfig }) {
  const { t } = useTranslation();
  // Keep the global "OpenAI key present" signal (boolean only) live so the Talk
  // button's missing-key warning clears the instant the user saves their OpenAI key
  // here — without it the gate only refreshes on next app start. apikey:openai is
  // the same key the Realtime mint reads; saving/clearing it flips the gate.
  const setHasOpenAiKey = useStore((s) => s.setHasOpenAiKey);
  // Which backends already have a key stored (boolean only — never the value).
  const [hasKey, setHasKey] = useState<Record<string, boolean>>({});
  const [draftKey, setDraftKey] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [probe, setProbe] = useState<LocalProviderProbeResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [thinkingOverride, setThinkingOverride] = useState(config.localThinkingOverride);
  const [savingThinking, setSavingThinking] = useState(false);
  const [cliFound, setCliFound] = useState<boolean | null>(null);
  // Base-URL + default-model drafts, seeded from config.
  const [baseUrls, setBaseUrls] = useState<Partial<Record<AgentProvider, string>>>(
    config.providerBaseUrls ?? {}
  );
  const [models, setModels] = useState<Partial<Record<AgentProvider, string>>>(
    config.providerDefaultModels ?? {}
  );

  // Reseed set/not-set flags on mount (write-only — only the boolean is fetched).
  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Record<string, boolean> = {};
      for (const b of BACKENDS) {
        try { out[b.id] = await window.cth.providerKeyHas(b.id); } catch { out[b.id] = false; }
      }
      if (alive) setHasKey(out);
      try {
        const tools = await window.cth.toolsStatus();
        const cli = tools.find((tool) => tool.bin === 'opencode');
        if (alive) setCliFound(cli?.found ?? false);
      } catch { /* unknown is shown separately from missing */ }
    })();
    return () => { alive = false; };
  }, []);

  const saveKey = async (backend: string) => {
    const key = (draftKey[backend] ?? '').trim();
    if (!key) return;
    try {
      const r = await window.cth.providerKeySet({ backend, key });
      if (r.ok) {
        if (backend === 'local') setProbe(null);
        setHasKey((s) => ({ ...s, [backend]: true }));
        setDraftKey((s) => ({ ...s, [backend]: '' }));
        setNote((s) => ({ ...s, [backend]: t('aiEngines.saved') }));
        // OpenAI key gates Talk — mirror presence to the store so the warning clears now.
        if (backend === 'openai') setHasOpenAiKey(true);
      } else setNote((s) => ({ ...s, [backend]: r.error ?? t('aiEngines.failed') }));
    } catch (e) { setNote((s) => ({ ...s, [backend]: e instanceof Error ? e.message : String(e) })); }
  };
  const clearKey = async (backend: string) => {
    try {
      const result = await window.cth.providerKeyClear(backend);
      if (!result.ok) throw new Error(result.error ?? 'Could not delete the key.');
      if (backend === 'local') setProbe(null);
      setHasKey((s) => ({ ...s, [backend]: false }));
      setNote((s) => ({ ...s, [backend]: t('aiEngines.cleared') }));
      // OpenAI key gates Talk — clearing it disables Talk; reflect that immediately.
      if (backend === 'openai') setHasOpenAiKey(false);
    } catch { setNote((s) => ({ ...s, [backend]: 'Could not delete the key. Try again.' })); }
  };

  const saveBaseUrl = async (id: AgentProvider, value: string) => {
    const next = { ...baseUrls, [id]: value.trim() || undefined };
    setBaseUrls(next);
    try { await window.cth.updateConfig({ providerBaseUrls: next }); }
    catch { setNote((s) => ({ ...s, settings: 'Could not save the endpoint. Try again.' })); }
  };
  const saveModel = async (id: AgentProvider, value: string) => {
    const next = { ...models, [id]: value.trim() || undefined };
    setModels(next);
    try { await window.cth.updateConfig({ providerDefaultModels: next }); }
    catch { setNote((s) => ({ ...s, settings: 'Could not save the model. Try again.' })); }
  };

  const saveThinking = async (disabled: boolean) => {
    const target = validateLocalProvider({ baseUrl: baseUrls.opencode ?? '', model: models.opencode ?? '' });
    if (disabled && !target.ok) {
      setNote((s) => ({ ...s, settings: target.error }));
      return;
    }
    setSavingThinking(true);
    setProbe(null);
    try {
      const next = disabled && target.ok ? { baseUrl: target.baseUrl, model: target.model, reasoningEffort: 'none' as const } : undefined;
      const saved = await window.cth.updateConfig({ localThinkingOverride: next });
      setThinkingOverride(saved.localThinkingOverride);
      setNote((s) => ({ ...s, settings: 'Thinking setting saved. Restart existing agents to apply it.' }));
    } catch { setNote((s) => ({ ...s, settings: 'Could not save the thinking setting. Try again.' })); }
    finally { setSavingThinking(false); }
  };

  const testLocal = async () => {
    setTesting(true);
    setProbe(null);
    try {
      setProbe(await window.cth.localProviderTest({ baseUrl: baseUrls.opencode ?? '', model: models.opencode ?? '', localThinkingOverride: thinkingOverride }));
      const tools = await window.cth.toolsStatus();
      setCliFound(tools.find((tool) => tool.bin === 'opencode')?.found ?? false);
    } catch {
      setProbe({ ok: false, code: 'endpoint_error', message: 'Connection test failed. Check the server and try again.' });
    } finally { setTesting(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={headStyle}>{t('aiEngines.providers')}</div>
        <div style={{ fontSize: 12, color: 'var(--cth-ink-700)', lineHeight: '18px' }}>
          {t('aiEngines.providersDesc')}
        </div>
      </div>

      {/* Backend API keys (write-only) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={headStyle}>{t('aiEngines.apiKeys')}</div>
        {BACKENDS.map((b) => (
          <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>
              {b.label} {hasKey[b.id] ? `· ${t('aiEngines.setCheck')}` : ''} <span style={{ opacity: 0.6 }}>({b.envVar})</span>
            </label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="password"
                aria-label={`${b.label} API key`}
                autoComplete="off"
                placeholder={hasKey[b.id] ? t('aiEngines.keyStoredPlaceholder') : t('aiEngines.keyPlaceholder', { label: b.label })}
                value={draftKey[b.id] ?? ''}
                onChange={(e) => setDraftKey((s) => ({ ...s, [b.id]: e.target.value }))}
                style={inputStyle}
              />
              <PixelButton variant="secondary" size="sm" onClick={() => saveKey(b.id)}>{t('common.save')}</PixelButton>
              {hasKey[b.id] && (
                <PixelButton variant="secondary" size="sm" onClick={() => clearKey(b.id)}>{t('common.delete')}</PixelButton>
              )}
            </div>
            {note[b.id] && <div style={{ fontSize: 11, color: 'var(--cth-ink-500)' }}>{note[b.id]}</div>}
          </div>
        ))}
      </div>

      {/* Per-CLI local endpoint + default model */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={headStyle}>{t('aiEngines.localEndpoint')}</div>
        {CLIS.map((c) => (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ProviderLogo provider={c.id} size={12} /> {c.label}
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                aria-label={`${c.label} base URL`}
                placeholder={`base-URL — ${c.hint}`}
                value={baseUrls[c.id] ?? ''}
                onChange={(e) => { setBaseUrls((s) => ({ ...s, [c.id]: e.target.value })); setProbe(null); }}
                onBlur={(e) => saveBaseUrl(c.id, e.target.value)}
                style={inputStyle}
              />
              <input
                aria-label={`${c.label} model ID`}
                placeholder={t('aiEngines.defaultModelPlaceholder')}
                value={models[c.id] ?? ''}
                onChange={(e) => { setModels((s) => ({ ...s, [c.id]: e.target.value })); setProbe(null); }}
                onBlur={(e) => saveModel(c.id, e.target.value)}
                style={{ ...inputStyle, maxWidth: 220 }}
              />
            </div>
            {c.id === 'opencode' && (
              <div style={{ fontSize: 12, lineHeight: '18px' }}>
                <p>Use the server's exact model ID. Examples: Ollama http://127.0.0.1:11434/v1, LM Studio http://127.0.0.1:1234/v1, vLLM http://127.0.0.1:8000/v1. Save a Local endpoint key above only if your server requires one.</p>
                <p>With an endpoint configured, OpenCode uses only that local provider. New agents use these settings; restart existing agents to apply changes.</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" disabled={savingThinking || testing}
                    checked={localThinkingDisabled({ baseUrl: baseUrls.opencode ?? '', model: models.opencode ?? '', localThinkingOverride: thinkingOverride })}
                    onChange={(e) => { void saveThinking(e.target.checked); }} />
                  Disable thinking for this model
                </label>
                <p>For compatible local servers. Tested with Ollama 0.35.1 / qwen3.5:4b. Applies only to this endpoint and model for newly started agents. Unchecked uses the server default; unsupported options may return a server error.</p>
                <p role="status">{cliFound === null ? 'OpenCode installation status unknown.' : cliFound ? 'OpenCode CLI found.' : 'OpenCode CLI is not installed or not on PATH. Install it from Settings → Tools before starting an agent.'}</p>
                <PixelButton variant="secondary" size="sm" disabled={testing || savingThinking} onClick={() => { void testLocal(); }}>{testing ? 'Testing…' : 'Test connection and tools'}</PixelButton>
                <p>The test sends a small model request and checks one tool call without executing it.</p>
                {probe && <p role="status" style={{ color: probe.ok ? 'var(--cth-ink-700)' : 'var(--cth-danger, #b42318)' }}>{probe.message}</p>}
              </div>
            )}
          </div>
        ))}
        {note.settings && <div role="status">{note.settings}</div>}
      </div>

      {/* Unsandboxed-in-auto caveat (Pam guardrail #6) */}
      <div style={{
        fontSize: 12, color: 'var(--cth-ink-700)', lineHeight: '17px',
        padding: 8, boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)', background: 'var(--cth-paper-100)'
      }}>
        {t('aiEngines.autoModeCaveat')}
      </div>
    </div>
  );
}
