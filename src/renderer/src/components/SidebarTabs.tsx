import { useTranslation } from 'react-i18next';
import { useId } from 'react';
import { motion } from 'motion/react';
import { useUiMotion } from '@/design/motion';
import { type SidebarTab } from '@/store/store';
import { type AccentColorName } from '@/design/tokens';
import { Icon, type IconName } from './Icon';

// v0.3.4: the files tab is gone — the per-agent IDE button (header) opens the
// full Monaco editor + file tree, which superseded the read-only browser.
const TABS: { key: SidebarTab; labelKey: string; icon: IconName }[] = [
  { key: 'terminal', labelKey: 'sidebar.terminal', icon: 'terminal' },
  { key: 'git',      labelKey: 'sidebar.git',      icon: 'code' },
  { key: 'messages', labelKey: 'sidebar.messages', icon: 'bell' },
  { key: 'skills', labelKey: 'commandCenter.tabs.skills', icon: 'sparkle' },
  { key: 'traces',   labelKey: 'sidebar.traces',   icon: 'web' }
];

export interface SidebarTabsProps {
  current: SidebarTab;
  accent: AccentColorName;
  onChange: (tab: SidebarTab) => void;
}

export function SidebarTabs({ current, onChange }: SidebarTabsProps) {
  const { t } = useTranslation();
  const tabScope = useId();
  const uiMotion = useUiMotion();
  return (
    <div className="zuri-glass-nav" style={{
      display: 'flex',
      gap: 4, padding: 4,
      flexWrap: 'wrap',
      flexShrink: 0
    }}>
      {TABS.map(tab => {
        const active = current === tab.key;
        return (
          <button
            key={tab.key}
            className="zuri-tab"
            aria-pressed={active}
            data-active={active}
            onClick={() => onChange(tab.key)}
            style={{
              flex: '1 0 auto', position: 'relative', isolation: 'isolate',
              height: 36,
              padding: '0 10px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              fontFamily: 'var(--cth-font-ui)',
              fontSize: 13,
              lineHeight: '18px',
              color: active ? 'var(--tab-active-text)' : 'var(--cth-ink-500)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            {active && <motion.span className="zuri-tab-indicator" layoutId={`${tabScope}-agent-tab`} transition={uiMotion.transition(180)} aria-hidden="true" />}
            <Icon name={tab.icon} /> {t(tab.labelKey).toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
