import type { HarnessConfig } from '@/store/config';

/** One supported studio; legacy saved theme IDs resolve to this same map. */
export function OfficeThemePicker(_props: { config: HarnessConfig }) {
  return (
    <section aria-label="Office appearance">
      <strong style={{ fontSize: 13 }}>Zuri Studio</strong>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>A warm 2.5D miniature office with detailed oak workstations, a meeting area and a cafe.</p>
    </section>
  );
}
