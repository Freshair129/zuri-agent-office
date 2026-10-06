import { useEffect, useState } from 'react';

/** Local install identity. No remote promotion payload or upstream release link. */
export function SettingsHeroCard() {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void window.cth.appInfo().then(info => { if (active) setVersion(info.version); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return (
    <section aria-label="About Zuri" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <strong style={{ fontSize: 22, color: 'var(--text-primary)' }}>Zuri</strong>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--cth-font-mono)', fontSize: 12 }}>{version ? 'v' + version : 'Desktop'}</span>
      </div>
      <p style={{ margin: '8px 0', color: 'var(--text-primary)' }}>Your workspace. Your team of agents.</p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>Local desktop edition · Updates are managed manually.</p>
      <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text-tertiary)' }}>Built on the MIT-licensed Munder Difflin project. Original Zuri office art; bundled fonts retain their respective licenses.</p>
    </section>
  );
}
