import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface UseAutoScrollResult {
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  toggle: () => void;
  restart: () => void;
}

/**
 * Smoothly scrolls `containerRef` at `speedPxPerSec` via requestAnimationFrame.
 * Speed changes take effect on the next frame without restarting the scroll
 * loop, so nudging speed up/down mid-song stays jitter-free.
 */
export function useAutoScroll(
  containerRef: RefObject<HTMLElement | null>,
  speedPxPerSec: number,
  onReachEnd?: () => void,
): UseAutoScrollResult {
  const [playing, setPlaying] = useState(false);
  const speedRef = useRef(speedPxPerSec);
  const onReachEndRef = useRef(onReachEnd);
  speedRef.current = speedPxPerSec;
  onReachEndRef.current = onReachEnd;

  useEffect(() => {
    if (!playing) return;
    const el = containerRef.current;
    if (!el) return;

    let rafId: number;
    let lastTs: number | null = null;
    // scrollTop only stores whole pixels, so at slow speeds (a few px/sec) each
    // frame's fractional delta would round away to nothing if we read it back
    // from the DOM. Accumulate in full precision here and only write the
    // (rounded) result out.
    let position = el.scrollTop;

    const tick = (ts: number) => {
      if (lastTs !== null) {
        const dt = (ts - lastTs) / 1000;
        position += speedRef.current * dt;
        el.scrollTop = position;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
          setPlaying(false);
          onReachEndRef.current?.();
          return;
        }
      }
      lastTs = ts;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, containerRef]);

  const toggle = useCallback(() => setPlaying((p) => !p), []);

  const restart = useCallback(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [containerRef]);

  return { playing, setPlaying, toggle, restart };
}
