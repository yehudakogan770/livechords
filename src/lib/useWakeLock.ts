import { useEffect, useState } from 'react';

/**
 * Keeps the screen from sleeping mid-song via the Screen Wake Lock API.
 * The browser force-releases the lock whenever the tab is backgrounded, so
 * we re-acquire on visibilitychange — e.g. after a performer briefly
 * switches apps to silence a call, then comes back to Stage View.
 * Silently no-ops (returns false) on browsers without wake lock support.
 */
export function useWakeLock(enabled: boolean): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      setActive(false);
      return;
    }

    let cancelled = false;
    let sentinel: WakeLockSentinel | null = null;

    async function acquire() {
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void s.release();
          return;
        }
        sentinel = s;
        setActive(true);
        s.addEventListener('release', () => setActive(false));
      } catch {
        setActive(false);
      }
    }

    void acquire();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && !sentinel) {
        void acquire();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void sentinel?.release();
      sentinel = null;
    };
  }, [enabled]);

  return active;
}
