import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, useIsPresent } from 'motion/react';
import { UI_MOTION, useUiMotion } from '@/design/motion';
import { isComposingKey } from '@shared/imeGuard';

interface MotionDialogProps {
  children: ReactNode;
  onClose: () => void;
  label: string;
  style?: CSSProperties;
  className?: string;
}

/** Shared overlay lifecycle: exiting dialogs are inert and return focus immediately. */
export function MotionDialog({ children, onClose, label, style, className }: MotionDialogProps) {
  const present = useIsPresent();
  const { reduced, transition } = useUiMotion();
  const content = useRef<HTMLDivElement>(null);
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  const close = useRef(onClose);
  close.current = onClose;

  useLayoutEffect(() => {
    const node = content.current;
    if (!node) return;
    node.inert = !present;
    const restore = () => {
      const target = previousFocus.current;
      if (target?.isConnected && !target.closest('[inert]')) target.focus();
    };
    if (!present) { restore(); return; }
    const focusable = () => Array.from(node.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.getClientRects().length > 0 && !el.closest('[inert]'));
    const topmost = () => [...document.querySelectorAll('[data-zuri-dialog]:not([aria-hidden="true"])')].at(-1) === node;
    if (!node.contains(document.activeElement)) (focusable()[0] ?? node).focus();
    const onKey = (event: KeyboardEvent) => {
      if (!topmost() || event.defaultPrevented || isComposingKey(event)) return;
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); close.current();
      } else if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0] ?? node;
        const last = items.at(-1) ?? node;
        if (!items.length || !node.contains(document.activeElement)
          || (event.shiftKey && document.activeElement === first)
          || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault(); (event.shiftKey ? last : first).focus();
        }
      }
    };
    const containFocus = (event: FocusEvent) => {
      if (topmost() && !node.contains(event.target as Node)) (focusable()[0] ?? node).focus();
    };
    const repairFocus = new MutationObserver(() => {
      if (topmost() && !node.contains(document.activeElement)) (focusable()[0] ?? node).focus();
    });
    repairFocus.observe(node, { childList: true, subtree: true });
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', containFocus);
    return () => {
      repairFocus.disconnect();
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', containFocus);
      restore();
    };
  }, [present]);

  return (
    <motion.div
      className={className}
      initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={transition(present ? UI_MOTION.enter : UI_MOTION.exit)}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24, background: 'var(--overlay-scrim)',
        ...style, pointerEvents: present ? 'auto' : 'none' }}
      onMouseDown={event => { if (present && event.target === event.currentTarget) close.current(); }}
    >
      <motion.div
        ref={content} role="dialog" aria-modal={present ? true : undefined} aria-label={label}
        aria-hidden={!present} data-zuri-dialog="" tabIndex={-1}
        initial={{ y: reduced ? 0 : 8 }} animate={{ y: 0 }} exit={{ y: reduced ? 0 : 8 }}
        transition={transition(present ? UI_MOTION.enter : UI_MOTION.exit)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%',
          width: '100%', maxHeight: '100%', outline: 'none' }}
        onMouseDown={event => { if (present && event.target === event.currentTarget) close.current(); }}
      >{children}</motion.div>
    </motion.div>
  );
}
