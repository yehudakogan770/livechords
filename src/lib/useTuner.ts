import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from './pitchDetect';

const FFT_SIZE = 2048;
const UPDATE_INTERVAL_MS = 100;

function getAudioContextCtor(): typeof AudioContext {
  return window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
}

/** Live pitch (Hz) from the device microphone, via Web Audio — no server, no upload, nothing leaves the device. */
export function useTuner() {
  const [frequency, setFrequency] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const bufferRef = useRef(new Float32Array(FFT_SIZE));

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = undefined;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setListening(false);
    setFrequency(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      // Disable processing that helps voice calls but distorts the waveform pitch detection relies on.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const ctx = new (getAudioContextCtor())();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);

      intervalRef.current = setInterval(() => {
        analyser.getFloatTimeDomainData(bufferRef.current);
        setFrequency(detectPitch(bufferRef.current, ctx.sampleRate));
      }, UPDATE_INTERVAL_MS);
      setListening(true);
    } catch {
      setError("Couldn't access the microphone — check your browser/device permissions and try again.");
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { frequency, listening, error, start, stop };
}
