import { describe, expect, it } from 'vitest';
import { clampScrollSpeed, estimateScrollSpeed, MAX_SCROLL_SPEED, MIN_SCROLL_SPEED } from './scrollSpeed';

describe('clampScrollSpeed', () => {
  it('clamps below the minimum', () => {
    expect(clampScrollSpeed(0)).toBe(MIN_SCROLL_SPEED);
    expect(clampScrollSpeed(-10)).toBe(MIN_SCROLL_SPEED);
  });

  it('clamps above the maximum', () => {
    expect(clampScrollSpeed(9999)).toBe(MAX_SCROLL_SPEED);
  });

  it('rounds to the nearest whole pixel', () => {
    expect(clampScrollSpeed(20.4)).toBe(20);
    expect(clampScrollSpeed(20.6)).toBe(21);
  });
});

describe('estimateScrollSpeed', () => {
  it('increases with tempo for a fixed font size', () => {
    const slow = estimateScrollSpeed(60, 32);
    const fast = estimateScrollSpeed(140, 32);
    expect(fast).toBeGreaterThan(slow);
  });

  it('increases with font size for a fixed tempo', () => {
    const small = estimateScrollSpeed(90, 24);
    const large = estimateScrollSpeed(90, 48);
    expect(large).toBeGreaterThan(small);
  });

  it('stays within the clamped bounds', () => {
    expect(estimateScrollSpeed(1, 16)).toBeGreaterThanOrEqual(MIN_SCROLL_SPEED);
    expect(estimateScrollSpeed(400, 96)).toBeLessThanOrEqual(MAX_SCROLL_SPEED);
  });
});
