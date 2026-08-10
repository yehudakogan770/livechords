const MIN_FREQ_HZ = 60; // below a guitar's low E2 (82.41 Hz), with margin
const MAX_FREQ_HZ = 1000; // well above a guitar's high E4 (329.63 Hz), covers most instruments/voice
const MIN_RMS = 0.01; // silence gate: buffers quieter than this aren't worth analyzing
// A clean tone correlates almost perfectly at integer multiples of its true period too
// (its "subharmonics"), not just at the fundamental. Picking the single strongest lag
// can lock onto one of those instead, so the shortest lag within this fraction of the
// best correlation anywhere is preferred — the fundamental is never weaker than its
// subharmonics, so this reliably favors it over an octave-down (or more) false read.
const SUBHARMONIC_THRESHOLD = 0.9;

/**
 * Estimates the fundamental frequency of a buffer of audio samples via
 * autocorrelation — for each candidate lag, how well the signal correlates
 * with a copy of itself shifted by that lag. The strongest correlation
 * (refined with parabolic interpolation for sub-sample precision) marks the
 * signal's period. Returns null on near-silence or when nothing correlates.
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const size = buffer.length;

  let sumSquares = 0;
  for (let i = 0; i < size; i++) sumSquares += buffer[i] * buffer[i];
  const rms = Math.sqrt(sumSquares / size);
  if (rms < MIN_RMS) return null;

  const minLag = Math.floor(sampleRate / MAX_FREQ_HZ);
  const maxLag = Math.min(Math.floor(sampleRate / MIN_FREQ_HZ), size - 1);
  if (maxLag <= minLag) return null;

  // Normalized by the overlap length at each lag (mean product, not raw sum) —
  // otherwise short lags win purely by having more overlapping samples to sum,
  // regardless of how well they actually correlate.
  const correlations = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const overlap = size - lag;
    for (let i = 0; i < overlap; i++) sum += buffer[i] * buffer[i + lag];
    correlations[lag] = sum / overlap;
  }

  let maxCorrelation = correlations[minLag];
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (correlations[lag] > maxCorrelation) maxCorrelation = correlations[lag];
  }
  if (maxCorrelation <= 0) return null;

  const threshold = maxCorrelation * SUBHARMONIC_THRESHOLD;
  let bestLag = minLag;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (correlations[lag] >= threshold) {
      bestLag = lag;
      break;
    }
  }

  const refinedLag = parabolicPeak(correlations, bestLag);
  return refinedLag > 0 ? sampleRate / refinedLag : null;
}

/** Refines an integer peak index to sub-sample precision by fitting a parabola through it and its neighbors. */
function parabolicPeak(values: Float32Array, peakIndex: number): number {
  const left = peakIndex > 0 ? values[peakIndex - 1] : values[peakIndex];
  const center = values[peakIndex];
  const right = peakIndex < values.length - 1 ? values[peakIndex + 1] : values[peakIndex];
  const denom = 2 * (2 * center - left - right);
  if (denom === 0) return peakIndex;
  const offset = (right - left) / denom;
  return peakIndex + offset;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface PitchInfo {
  noteName: string;
  octave: number;
  /** Cents deviation from the nearest equal-tempered note, roughly -50..+50 (negative = flat, positive = sharp). */
  cents: number;
  frequency: number;
}

/** Converts a frequency in Hz to the nearest equal-tempered note (A4 = 440Hz) and its cents deviation. */
export function frequencyToNote(frequency: number): PitchInfo {
  const midi = 69 + 12 * Math.log2(frequency / 440);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const noteName = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { noteName, octave, cents, frequency };
}

export interface GuitarString {
  label: string;
  noteName: string;
  frequency: number;
}

/** Standard 6-string guitar tuning, low to high. */
export const GUITAR_STRINGS: GuitarString[] = [
  { label: 'Low E', noteName: 'E2', frequency: 82.41 },
  { label: 'A', noteName: 'A2', frequency: 110.0 },
  { label: 'D', noteName: 'D3', frequency: 146.83 },
  { label: 'G', noteName: 'G3', frequency: 196.0 },
  { label: 'B', noteName: 'B3', frequency: 246.94 },
  { label: 'High E', noteName: 'E4', frequency: 329.63 },
];

/** The standard guitar string whose pitch is closest (in perceptual/log-frequency terms) to the given frequency. */
export function nearestGuitarString(frequency: number): GuitarString {
  return GUITAR_STRINGS.reduce((closest, s) =>
    Math.abs(Math.log2(frequency / s.frequency)) < Math.abs(Math.log2(frequency / closest.frequency)) ? s : closest,
  );
}
