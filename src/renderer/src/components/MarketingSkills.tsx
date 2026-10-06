import { useEffect, useState, type CSSProperties } from 'react';
import { MARKETING_CATALOG, MARKETING_FOUNDATION, MARKETING_ROLES, type MarketingLibraryView } from '@shared/marketingSkills';

const field: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: 8,
  border: '1px solid var(--cth-ink-300)', background: 'var(--cth-paper-100)', color: 'var(--cth-ink-900)', font: 'inherit' };
const hint: CSSProperties = { fontSize: 12, color: 'var(--cth-ink-700)', lineHeight: 1.5 };
const card: CSSProperties = { padding: 12, borderRadius: 10, border: '1px solid var(--cth-ink-300)',
  background: 'var(--cth-paper-100)', color: 'var(--cth-ink-900)' };

export function MarketingRolePicker({ skills, onChange, onRole, cwd }: {
  skills: string[]; onChange: (skills: string[]) => void;
  onRole: (role: typeof MARKETING_ROLES[number]) => void; cwd: string;
}) {
  const [query, setQuery] = useState('');
  const [context, setContext] = useState<MarketingLibraryView | null>(null);
  const role = MARKETING_ROLES.find(r => r.skills.length === skills.length && r.skills.every(id => skills.includes(id)));
  useEffect(() => {
    let active = true;
    setContext(null);
    void window.cth.marketingSkills(undefined, cwd).then(v => { if (active) setContext(v); }).catch(() => {});
    return () => { active = false; };
  }, [cwd]);
  const toggle = (id: string) => {
    if (skills.includes(id)) onChange(skills.filter(s => s !== id));
    else onChange([...new Set([...skills, MARKETING_FOUNDATION, id])]);
  };
  return <section aria-label="Marketing role and skills" style={{ ...card, display: 'grid', gap: 10 }}>
    <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>
      Marketing role
      <select aria-label="Marketing role" style={field} value={role?.id ?? ''} onChange={e => {
        const next = MARKETING_ROLES.find(r => r.id === e.target.value);
        if (next) { onChange([...next.skills]); onRole(next); }
        else onChange(skills.filter(s => !s.startsWith('marketing:')));
      }}>
        <option value="">{skills.some(s => s.startsWith('marketing:')) ? 'Custom selection / clear preset' : 'Choose a role (optional)'}</option>
        {MARKETING_ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
    </label>
    <div style={hint}>Shared library · {MARKETING_CATALOG.skills.length} skills · v{MARKETING_CATALOG.version}. Choose up to 8; product-marketing is the shared foundation.</div>
    <div aria-live="polite" style={{ fontWeight: 600 }}>{skills.length} / 8 selected for next start</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {skills.map(id => <span key={id} style={{ fontSize: 11, borderRadius: 6, padding: '4px 7px',
        background: 'var(--cth-lemon-light)', color: 'var(--cth-ink-900)' }}>{id.replace('marketing:', '')}</span>)}
    </div>
    <details>
      <summary style={{ cursor: 'pointer', fontSize: 13 }}>Adjust selected skills</summary>
      <input aria-label="Find marketing skills" placeholder="Find a skill…" value={query} onChange={e => setQuery(e.target.value)} style={{ ...field, marginBlock: 8 }} />
      <div style={{ maxHeight: 170, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 6 }}>
        {MARKETING_CATALOG.skills.filter(s => `${s.name} ${s.description}`.toLowerCase().includes(query.toLowerCase())).map(s => {
          const checked = skills.includes(s.id);
          const nextCount = new Set([...skills, MARKETING_FOUNDATION, s.id]).size;
          const locked = (s.id === MARKETING_FOUNDATION && skills.some(id => id.startsWith('marketing:') && id !== s.id)) || (!checked && nextCount > 8);
          return <label key={s.id} title={s.description} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, opacity: locked && !checked ? .55 : 1 }}>
            <input type="checkbox" checked={checked} disabled={locked} onChange={() => toggle(s.id)} />{s.name}
          </label>;
        })}
      </div>
    </details>
    {context?.contextPath && <div style={{ ...hint, overflowWrap: 'anywhere' }}>
      Product context · {context.contextExists ? 'Available' : 'Missing — draft from project facts when assigned'}<br />{context.contextPath}
    </div>}
    {context?.error && <div role="alert" style={hint}>{context.error}</div>}
  </section>;
}

export function MarketingLibrary({ agentId, agentCwd, query }: { agentId?: string; agentCwd?: string; query: string }) {
  const [view, setView] = useState<MarketingLibraryView | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setView(null); setError('');
    void window.cth.marketingSkills(agentId, agentCwd).then(v => { if (active) setView(v); })
      .catch(e => { if (active) setError(String(e)); });
    return () => { active = false; };
  }, [agentId, agentCwd, revision]);
  const shown = MARKETING_CATALOG.skills.filter(s => `${s.name} ${s.description} ${MARKETING_ROLES.filter(r => r.skills.includes(s.id)).map(r => r.name).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return <section aria-label="Zuri Marketing library" style={{ display: 'grid', gap: 10 }}>
    <div className="zuri-glass-nav" style={{ ...card, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <strong>Zuri Marketing</strong>
        <button className="zuri-tab" onClick={() => setRevision(n => n + 1)}>Refresh status</button>
      </div>
      <div style={hint}>50 skills · 6 roles · upstream v{MARKETING_CATALOG.version}<br />
        {MARKETING_CATALOG.commit.slice(0, 12)} · MIT / Corey Haines</div>
      <div style={hint}>{view ? (view.bundled ? 'Bundled in this app' : 'Bundle unavailable') : 'Checking bundle…'} · {view?.selected.filter(id => id.startsWith('marketing:')).length ?? 0} selected for this agent</div>
      <div style={hint}>Provisioned means files were verified at the last start. It does not confirm model use or connected marketing accounts.</div>
      {view?.contextPath && <div style={{ ...hint, overflowWrap: 'anywhere' }}>Product context · {view.contextExists ? 'Available' : 'Missing'}<br />{view.contextPath}</div>}
      {(error || view?.error) && <div role="alert">{error || view?.error}</div>}
      <button className="zuri-tab" style={{ justifySelf: 'start' }} onClick={() => void window.cth.openExternal(`${MARKETING_CATALOG.repository}/tree/${MARKETING_CATALOG.commit}`)}>View pinned source</button>
    </div>
    <div style={hint}>{shown.length} matching skills</div>
    {shown.map(s => {
      const selected = view?.selected.includes(s.id);
      const entry = view?.provisioning?.entries.find(e => e.id === s.id);
      const label = entry?.status === 'failed' ? 'Provisioning failed' : selected && entry?.status === 'provisioned' ? 'Provisioned at last start' : selected ? 'Selected for agent' : view?.bundled ? 'Bundled in app' : 'Unavailable';
      return <article key={s.id} data-skill-id={s.id} style={{ ...card, display: 'grid', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <strong style={{ fontSize: 13 }}>{s.name}</strong><span style={hint}>v{s.version}</span>
        </div>
        <span style={{ ...hint, justifySelf: 'start', padding: '2px 7px', borderRadius: 5,
          background: entry?.status === 'failed' ? 'var(--cth-coral-light)' : selected ? 'var(--cth-lemon-light)' : 'var(--cth-cream-200)' }}>{label}</span>
        <p style={{ ...hint, margin: 0 }}>{s.description.length > 180 ? `${s.description.slice(0, 180)}…` : s.description}</p>
        {s.description.length > 180 && <details style={hint}>
          <summary style={{ cursor: 'pointer' }}>Usage guidance</summary>
          <p style={{ marginBlock: 8 }}>{s.description}</p>
        </details>}
        <div style={hint}>{MARKETING_ROLES.filter(r => r.skills.includes(s.id)).map(r => r.name).join(' · ') || 'Available for custom selections'}</div>
        {entry?.error && <div role="alert" style={{ ...hint, overflowWrap: 'anywhere' }}>{entry.error}</div>}
      </article>;
    })}
  </section>;
}
