import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from './Icon';
import { useStore } from '@/store/store';

const destinations: { key: string; tab?: string; icon: IconName }[] = [
  { key: 'office', icon: 'mcp' },
  { key: 'tasks', tab: 'tasks', icon: 'check' },
  { key: 'human', tab: 'human', icon: 'bell' },
  { key: 'team', tab: 'floor', icon: 'sidebar' },
  { key: 'memory', tab: 'memory', icon: 'sparkle' },
  { key: 'activity', tab: 'activity', icon: 'clock' }
];

export function OfficeSidebar({ collapsed, compact, onToggle, onSettings }: {
  collapsed: boolean;
  compact: boolean;
  onToggle: () => void;
  onSettings: () => void;
}) {
  const { t } = useTranslation();
  const hasCoordinator = useStore(s => s.agents.some(a => a.isGod));
  const drawerOpen = useStore(s => s.agentDrawerOpen);
  const selectedIsGod = useStore(s => s.agents.find(a => a.id === s.selectedId)?.isGod);
  const activeTab = useStore(s => s.activeCommandCenterTab);
  const openCommandCenter = useStore(s => s.openCommandCenter);
  const setDrawerOpen = useStore(s => s.setAgentDrawerOpen);
  const active = drawerOpen && selectedIsGod ? destinations.find(d => d.tab === activeTab)?.key ?? 'office' : 'office';

  return (
    <nav className={`zuri-office-nav zuri-glass-nav${collapsed ? ' is-collapsed' : ''}`} aria-label={t('officeShell.navigation')}>
      <div className="zuri-office-nav-heading">
        {!collapsed && <span>{t('officeShell.workspace')}</span>}
        <button className="zuri-shell-icon" onClick={onToggle} disabled={compact}
          aria-label={t(compact ? 'officeShell.compactNavigation' : collapsed ? 'officeShell.expandNavigation' : 'officeShell.collapseNavigation')}
          title={t(compact ? 'officeShell.compactNavigation' : collapsed ? 'officeShell.expandNavigation' : 'officeShell.collapseNavigation')}
          aria-expanded={!collapsed}>
          <Icon name="sidebar" />
        </button>
      </div>
      <div className="zuri-office-nav-links">
        {destinations.map(d => {
          const label = t(`officeShell.${d.key}`);
          return <button key={d.key} className="zuri-office-nav-link"
            aria-label={label} aria-current={active === d.key ? 'page' : undefined}
            title={d.tab && !hasCoordinator ? t('officeShell.coordinatorPending') : label}
            disabled={!!d.tab && !hasCoordinator}
            onClick={() => d.tab ? openCommandCenter(d.tab) : setDrawerOpen(false)}>
            <Icon name={d.icon} />
            {!collapsed && <span>{label}</span>}
          </button>;
        })}
      </div>
      <button className="zuri-office-nav-link zuri-office-settings" onClick={onSettings}
        aria-label={t('officeShell.settings')} title={t('officeShell.settings')}>
        <Icon name="gear" />
        {!collapsed && <span>{t('officeShell.settings')}</span>}
      </button>
    </nav>
  );
}
