import { useCallback, useSyncExternalStore } from 'react';
import { motionTokens } from './tokens';

const preference = typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (notify: () => void) => {
  preference?.addEventListener('change', notify);
  return () => preference?.removeEventListener('change', notify);
};
const readPreference = () => preference?.matches ?? false;

// Milliseconds at the API boundary; Motion consumes seconds.
export const UI_MOTION = {
  ...motionTokens, content: motionTokens.selection
};

export function useUiMotion() {
  const reduced = useSyncExternalStore(subscribe, readPreference, () => false);
  const transition = useCallback((durationMs: number) => ({
    type: 'tween' as const,
    duration: reduced ? 0 : durationMs / 1000,
    ease: [...UI_MOTION.ease] as [number, number, number, number]
  }), [reduced]);
  return {
    reduced,
    transition,
    content: {
      initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 },
      animate: { opacity: 1, y: 0 },
      transition: transition(UI_MOTION.content)
    }
  };
}
