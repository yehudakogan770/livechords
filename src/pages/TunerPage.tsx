import { IconGuitar, IconMic } from '../components/icons';
import { frequencyToNote, GUITAR_STRINGS, nearestGuitarString } from '../lib/pitchDetect';
import { useTuner } from '../lib/useTuner';

const IN_TUNE_CENTS = 5;
const CLOSE_CENTS = 20;

function meterColorClass(cents: number): string {
  const abs = Math.abs(cents);
  if (abs <= IN_TUNE_CENTS) return 'text-green-400';
  if (abs <= CLOSE_CENTS) return 'text-stage-chord';
  return 'text-red-400';
}

export default function TunerPage() {
  const { frequency, listening, error, start, stop } = useTuner();
  const info = frequency ? frequencyToNote(frequency) : null;
  const nearestString = frequency ? nearestGuitarString(frequency) : null;
  const meterPercent = info ? Math.min(100, Math.max(0, 50 + info.cents)) : 50;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold">
        <IconGuitar className="h-5 w-5" />
        Tuner
      </h1>
      <p className="text-stage-muted mb-6 text-sm">
        Uses your microphone to detect pitch, entirely on-device — nothing is recorded or sent anywhere.
      </p>

      {!listening ? (
        <button
          type="button"
          onClick={start}
          className="bg-stage-accent text-stage-bg flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
        >
          <IconMic className="h-4 w-4" />
          Start tuning
        </button>
      ) : (
        <button
          type="button"
          onClick={stop}
          className="border-stage-edge text-stage-muted w-full rounded-full border px-4 py-3 text-sm font-semibold"
        >
          Stop
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {listening && (
        <div className="border-stage-edge bg-stage-panel/40 mt-6 rounded-xl border p-6 text-center">
          {info ? (
            <>
              <div className={`text-6xl font-bold tabular-nums ${meterColorClass(info.cents)}`}>
                {info.noteName}
                <span className="text-stage-muted text-2xl align-top">{info.octave}</span>
              </div>
              <p className="text-stage-muted mt-1 text-sm tabular-nums">
                {info.frequency.toFixed(1)} Hz · {info.cents > 0 ? '+' : ''}
                {info.cents}¢
              </p>

              <div className="bg-stage-bg relative mt-5 h-3 overflow-hidden rounded-full">
                <div className="bg-stage-edge absolute inset-y-0 left-1/2 w-px" aria-hidden="true" />
                <div
                  className={`absolute top-0 h-full w-1.5 -translate-x-1/2 rounded-full transition-all duration-150 ${
                    Math.abs(info.cents) <= IN_TUNE_CENTS ? 'bg-green-400' : 'bg-stage-chord'
                  }`}
                  style={{ left: `${meterPercent}%` }}
                />
              </div>
              <div className="text-stage-muted mt-1 flex justify-between text-xs">
                <span>flat</span>
                <span>in tune</span>
                <span>sharp</span>
              </div>

              {nearestString && (
                <p className="text-stage-muted mt-4 text-xs">
                  Closest standard string: <span className="text-stage-text font-medium">{nearestString.label}</span> (
                  {nearestString.noteName})
                </p>
              )}
            </>
          ) : (
            <p className="text-stage-muted py-8 text-sm">Listening… play a single note.</p>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-center gap-3">
        {GUITAR_STRINGS.map((s) => (
          <div
            key={s.noteName}
            className={`border-stage-edge flex h-12 w-12 flex-col items-center justify-center rounded-full border text-xs font-semibold ${
              nearestString?.noteName === s.noteName ? 'border-stage-accent text-stage-accent' : 'text-stage-muted'
            }`}
          >
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
