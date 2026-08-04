import type { ParsedSong } from '../lib/chordpro';

interface ChordSheetProps {
  song: ParsedSong;
  fontSizePx: number;
}

/**
 * Renders a parsed song with each chord floating directly above the lyric
 * syllable it belongs to. Each [chord]text pair becomes a small column
 * (chord row + lyric row) so proportional fonts still line up correctly —
 * no monospace font or manual character-counting required.
 */
export function ChordSheet({ song, fontSizePx }: ChordSheetProps) {
  return (
    <div className="font-display" style={{ fontSize: `${fontSizePx}px` }}>
      {song.lines.map((line, i) => {
        if (line.type === 'blank') {
          return <div key={i} aria-hidden="true" style={{ height: '0.9em' }} />;
        }

        if (line.type === 'section') {
          return (
            <div
              key={i}
              className="text-stage-accent mt-[0.7em] mb-[0.15em] font-semibold tracking-wide uppercase"
              style={{ fontSize: '0.5em' }}
            >
              {line.label || '—'}
            </div>
          );
        }

        return (
          <div key={i} className="mb-[0.2em] flex flex-wrap items-start">
            {line.tokens.map((token, j) => (
              <span key={j} className="inline-flex flex-col">
                <span
                  className="text-stage-chord font-bold whitespace-pre"
                  style={{ fontSize: '0.6em', lineHeight: 1.15, minHeight: '1.15em' }}
                >
                  {token.chord ?? ''}
                </span>
                <span className="text-stage-text whitespace-pre">{token.text}</span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
