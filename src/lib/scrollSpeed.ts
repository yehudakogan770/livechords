export const MIN_SCROLL_SPEED = 4;
export const MAX_SCROLL_SPEED = 200;
export const SCROLL_SPEED_STEP = 4;

export function clampScrollSpeed(px: number): number {
  return Math.min(MAX_SCROLL_SPEED, Math.max(MIN_SCROLL_SPEED, Math.round(px)));
}

/**
 * Starting-point auto-scroll speed derived from tempo, assuming ~2 bars (8
 * beats) of 4/4 music per rendered lyric line — a reasonable average across
 * verse/chorus charts. This gives the scroll a tempo-aware starting point;
 * the performer fine-tunes from there with +/- controls (or a footswitch)
 * and the result is remembered per song. True beat-locked sync would need
 * bar-by-bar markup the chart doesn't carry, so we don't pretend to offer it.
 */
export function estimateScrollSpeed(bpm: number, fontSizePx: number): number {
  const approxLineHeightPx = fontSizePx * 2.55;
  const secondsPerLine = (8 * 60) / bpm;
  return clampScrollSpeed(approxLineHeightPx / secondsPerLine);
}
