import type { ChordShape } from '../lib/chordShapes';

const VISIBLE_FRETS = 4;
const WIDTH = 72;
const HEIGHT = 88;
const LEFT = 10;
const TOP = 16;
const STRING_GAP = (WIDTH - LEFT * 2) / 5;
const FRET_GAP = (HEIGHT - TOP - 6) / VISIBLE_FRETS;

interface ChordDiagramProps {
  shape: ChordShape;
  label: string;
}

/** A small fretboard diagram (6 strings, low E to high e, left to right) for one chord shape. */
export function ChordDiagram({ shape, label }: ChordDiagramProps) {
  const stringX = (i: number) => LEFT + i * STRING_GAP;
  const fretY = (slot: number) => TOP + slot * FRET_GAP;
  const barreSlot = shape.barre ? shape.barre.fret - shape.baseFret : null;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-24 w-[4.5rem] shrink-0" role="img" aria-label={`${label} chord diagram`}>
      <text x={WIDTH / 2} y={10} textAnchor="middle" fontSize="9" fontWeight={700} fill="currentColor">
        {label}
      </text>

      {shape.baseFret > 1 && (
        <text x={LEFT - 4} y={TOP + FRET_GAP * 0.75} textAnchor="end" fontSize="6.5" fill="currentColor">
          {shape.baseFret}fr
        </text>
      )}

      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`s${i}`}
          x1={stringX(i)}
          y1={TOP}
          x2={stringX(i)}
          y2={TOP + FRET_GAP * VISIBLE_FRETS}
          stroke="currentColor"
          strokeWidth={0.75}
        />
      ))}

      {Array.from({ length: VISIBLE_FRETS + 1 }, (_, row) => (
        <line
          key={`f${row}`}
          x1={LEFT}
          y1={TOP + row * FRET_GAP}
          x2={stringX(5)}
          y2={TOP + row * FRET_GAP}
          stroke="currentColor"
          strokeWidth={row === 0 && shape.baseFret === 1 ? 2.25 : 0.75}
        />
      ))}

      {shape.barre && barreSlot !== null && (
        <line
          x1={stringX(shape.barre.fromString)}
          y1={fretY(barreSlot + 0.5)}
          x2={stringX(shape.barre.toString)}
          y2={fretY(barreSlot + 0.5)}
          stroke="currentColor"
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}

      {shape.frets.map((f, i) => {
        if (f === null) {
          return (
            <text key={`m${i}`} x={stringX(i)} y={TOP - 4} textAnchor="middle" fontSize="7" fill="currentColor">
              ×
            </text>
          );
        }
        if (f === 0) {
          return <circle key={`o${i}`} cx={stringX(i)} cy={TOP - 5} r={2} fill="none" stroke="currentColor" strokeWidth={0.75} />;
        }
        const coveredByBarre = shape.barre && f === shape.barre.fret && i >= shape.barre.fromString && i <= shape.barre.toString;
        if (coveredByBarre) return null;
        return <circle key={`d${i}`} cx={stringX(i)} cy={fretY(f - shape.baseFret + 0.5)} r={3.2} fill="currentColor" />;
      })}
    </svg>
  );
}
