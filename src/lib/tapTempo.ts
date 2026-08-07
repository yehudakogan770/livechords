const MAX_GAP_MS = 2000;
const MAX_SAMPLES = 8;
const MIN_BPM = 30;
const MAX_BPM = 300;

/** Rolling tap-tempo estimator: feed it each tap's timestamp, get back the estimated BPM. */
export function createTapTempo() {
  let timestamps: number[] = [];

  return {
    /** Records a tap and returns the estimated BPM, or null until there are at least two taps. */
    tap(now: number = Date.now()): number | null {
      if (timestamps.length > 0 && now - timestamps[timestamps.length - 1] > MAX_GAP_MS) {
        timestamps = [];
      }
      timestamps.push(now);
      if (timestamps.length > MAX_SAMPLES) timestamps.shift();
      if (timestamps.length < 2) return null;

      const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(60000 / avgMs)));
    },
    reset(): void {
      timestamps = [];
    },
  };
}
