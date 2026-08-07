import { useCallback, useEffect, useRef, useState } from 'react';

const ACCENT_FREQ_HZ = 1500;
const CLICK_FREQ_HZ = 1000;
const CLICK_DURATION_S = 0.05;

function getAudioContextCtor(): typeof AudioContext {
  return window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
}

/** A simple Web Audio click track, accenting beat 1 of every bar, for rehearsing tempo without a physical metronome. */
export function useMetronome(bpm: number, beatsPerBar = 4) {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback((): AudioContext => {
    if (!audioCtxRef.current) audioCtxRef.current = new (getAudioContextCtor())();
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback(
    (accent: boolean) => {
      const ctx = ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = accent ? ACCENT_FREQ_HZ : CLICK_FREQ_HZ;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + CLICK_DURATION_S);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + CLICK_DURATION_S + 0.01);
    },
    [ensureContext],
  );

  useEffect(() => {
    if (!playing || bpm <= 0) return;
    ensureContext().resume();
    let beat = 1;
    playClick(true);
    const id = setInterval(() => {
      playClick(beat % beatsPerBar === 0);
      beat += 1;
    }, 60000 / bpm);
    return () => clearInterval(id);
  }, [playing, bpm, beatsPerBar, playClick, ensureContext]);

  useEffect(
    () => () => {
      audioCtxRef.current?.close();
    },
    [],
  );

  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const stop = useCallback(() => setPlaying(false), []);

  return { playing, toggle, stop };
}
