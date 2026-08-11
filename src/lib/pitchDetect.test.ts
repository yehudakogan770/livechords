import { describe, expect, it } from 'vitest';
import { detectPitch, frequencyToNote, GUITAR_STRINGS, nearestGuitarString } from './pitchDetect';

const SAMPLE_RATE = 44100;

function sineWave(frequency: number, sampleRate: number, length: number, amplitude = 0.5): Float32Array {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }
  return buffer;
}

describe('detectPitch', () => {
  it('recovers the frequency of a pure sine wave within 1%', () => {
    const buffer = sineWave(220, SAMPLE_RATE, 2048); // A3
    const freq = detectPitch(buffer, SAMPLE_RATE);
    expect(freq).not.toBeNull();
    expect(freq!).toBeGreaterThan(220 * 0.99);
    expect(freq!).toBeLessThan(220 * 1.01);
  });

  it('recovers a low guitar frequency (E2, 82.41 Hz)', () => {
    const buffer = sineWave(82.41, SAMPLE_RATE, 2048);
    const freq = detectPitch(buffer, SAMPLE_RATE);
    expect(freq).not.toBeNull();
    expect(Math.abs(freq! - 82.41)).toBeLessThan(1);
  });

  it('recovers a high guitar frequency (E4, 329.63 Hz)', () => {
    const buffer = sineWave(329.63, SAMPLE_RATE, 2048);
    const freq = detectPitch(buffer, SAMPLE_RATE);
    expect(freq).not.toBeNull();
    expect(Math.abs(freq! - 329.63)).toBeLessThan(2);
  });

  it('returns null for silence', () => {
    const buffer = new Float32Array(2048);
    expect(detectPitch(buffer, SAMPLE_RATE)).toBeNull();
  });

  it('returns null for a near-silent noise floor', () => {
    const buffer = new Float32Array(2048).map(() => (Math.random() - 0.5) * 0.001);
    expect(detectPitch(buffer, SAMPLE_RATE)).toBeNull();
  });
});

describe('frequencyToNote', () => {
  it('identifies A4 = 440Hz exactly', () => {
    expect(frequencyToNote(440)).toEqual({ noteName: 'A', octave: 4, cents: 0, frequency: 440 });
  });

  it('identifies E2 (low guitar string)', () => {
    const info = frequencyToNote(82.41);
    expect(info.noteName).toBe('E');
    expect(info.octave).toBe(2);
    expect(Math.abs(info.cents)).toBeLessThan(2);
  });

  it('reports a positive cents value when sharp of the nearest note', () => {
    const info = frequencyToNote(442); // slightly sharp of A4
    expect(info.noteName).toBe('A');
    expect(info.cents).toBeGreaterThan(0);
  });

  it('reports a negative cents value when flat of the nearest note', () => {
    const info = frequencyToNote(438); // slightly flat of A4
    expect(info.noteName).toBe('A');
    expect(info.cents).toBeLessThan(0);
  });
});

describe('nearestGuitarString', () => {
  it('matches each standard string to itself exactly', () => {
    for (const s of GUITAR_STRINGS) {
      expect(nearestGuitarString(s.frequency)).toEqual(s);
    }
  });

  it('picks the perceptually closer string for a frequency in between two strings', () => {
    // Between A2 (110.00) and D3 (146.83); closer to A2 on a log scale.
    expect(nearestGuitarString(120)).toEqual(GUITAR_STRINGS[1]); // A
  });
});
