import { describe, expect, it } from 'vitest';
import { createTapTempo } from './tapTempo';

describe('createTapTempo', () => {
  it('returns null until at least two taps have been recorded', () => {
    const tempo = createTapTempo();
    expect(tempo.tap(0)).toBeNull();
  });

  it('estimates BPM from evenly spaced taps (500ms apart = 120 BPM)', () => {
    const tempo = createTapTempo();
    tempo.tap(0);
    tempo.tap(500);
    expect(tempo.tap(1000)).toBe(120);
  });

  it('averages over uneven taps rather than using only the last interval', () => {
    const tempo = createTapTempo();
    tempo.tap(0);
    tempo.tap(600); // 600ms
    expect(tempo.tap(1100)).toBe(Math.round(60000 / 550)); // avg(600, 500) = 550ms
  });

  it('resets the rolling window after a long pause', () => {
    const tempo = createTapTempo();
    tempo.tap(0);
    tempo.tap(500);
    tempo.tap(1000); // 120 BPM established
    // >2s since the last tap: this tap starts a fresh window with only one sample so far.
    expect(tempo.tap(10000)).toBeNull();
  });

  it('clamps to a sane BPM range', () => {
    const tempo = createTapTempo();
    tempo.tap(0);
    expect(tempo.tap(50)).toBe(300); // absurdly fast (accidental double-tap) clamps to the maximum
  });

  it('reset() clears the tap history', () => {
    const tempo = createTapTempo();
    tempo.tap(0);
    tempo.tap(500);
    tempo.reset();
    expect(tempo.tap(1000)).toBeNull();
  });
});
