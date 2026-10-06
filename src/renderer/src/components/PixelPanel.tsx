import { CSSProperties, ReactNode } from 'react';
import { AccentColorName } from '@/design/tokens';

type Variant = 'default' | 'inset' | 'active' | 'terminal' | 'dialog';

export interface PixelPanelProps {
  variant?: Variant;
  title?: string;
  accent?: AccentColorName;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  noPadding?: boolean;
}

const borderByVariant: Record<Variant, string> = {
  default:  'var(--cth-panel-border)',
  inset:    'var(--cth-panel-border-inset)',
  active:   'var(--cth-panel-border)',  // accent overlay added separately
  terminal: 'var(--cth-panel-border-terminal)',
  dialog:   'var(--cth-panel-border-dialog)'
};

const fillByVariant: Record<Variant, string> = {
  default:  'var(--cth-cream-100)',
  inset:    'var(--cth-cream-200)',
  active:   'var(--cth-cream-100)',
  terminal: 'var(--cth-paper-100)',
  dialog:   'var(--cth-cream-50)'
};

export function PixelPanel({
  variant = 'default',
  title,
  accent,
  children,
  style,
  className,
  noPadding = false
}: PixelPanelProps) {
  const baseStyle: CSSProperties = {
    background: fillByVariant[variant],
    boxShadow: borderByVariant[variant],
    padding: noPadding ? 0 : 'var(--cth-space-3)',
    position: 'relative',
    borderRadius: variant === 'terminal' ? 0 : `var(--radius-${variant === 'dialog' ? 'dialog' : 'card'})`,
    fontSize: 'var(--text-body-size)',
    lineHeight: '22px',
    ...style
  };

  // Active variant: paint accent over the middle border slot (3px ring at 1px inset)
  if (variant === 'active' && accent) {
    baseStyle.boxShadow = `
      inset 0 0 0 1px var(--cth-ink-100),
      inset 0 0 0 3px var(--cth-${accent}),
      inset 0 0 0 5px var(--cth-ink-900)`;
  }

  return (
    <div className={[
      'zuri-panel',
      variant === 'dialog' ? 'zuri-glass-dialog' : '',
      variant === 'terminal' ? 'zuri-panel-terminal' : '',
      className
    ].filter(Boolean).join(' ')} style={baseStyle}>
      {title && (
        <div
          style={{
            margin: noPadding ? 0 : '-12px -12px 12px',
            padding: '8px 12px',
            background: accent ? `var(--cth-${accent})` : variant === 'dialog' ? 'transparent' : 'var(--cth-cream-200)',
            color: accent ? 'var(--cth-on-accent)' : 'var(--text-primary)',
            fontFamily: 'var(--cth-font-ui)',
            fontSize: 'var(--text-label-size)',
            fontWeight: 600,
            lineHeight: '20px',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
            boxShadow: 'inset 0 -1px 0 var(--border-subtle)'
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
