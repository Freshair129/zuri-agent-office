import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

/** Hide the panel without unmounting its terminal, attachments or local tab state. */
export function AgentDrawer({ open, overlay, width, onClose, children }: {
  open: boolean;
  overlay: boolean;
  width: number;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <aside id="agent-drawer" aria-label={t('officeShell.agentDrawer')}
      className={`zuri-agent-drawer${overlay ? ' is-overlay' : ''}`}
      style={{ width, display: open ? 'flex' : 'none' }}>
      <div className="zuri-agent-drawer-heading zuri-glass-toolbar">
        <span>{t('officeShell.agentDrawer')}</span>
        <button className="zuri-shell-icon" onClick={onClose}
          aria-label={t('officeShell.closeDrawer')} title={t('officeShell.closeDrawer')}>
          <Icon name="x" />
        </button>
      </div>
      <div className="zuri-agent-drawer-body">{children}</div>
    </aside>
  );
}
