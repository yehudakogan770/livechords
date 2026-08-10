import { useEffect, useState } from 'react';

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
}

const COLORS = ['#4fd1c5', '#ffb454', '#f472b6', '#60a5fa', '#facc15'];
const PIECE_COUNT = 28;
const LIFETIME_MS = 2400;

export function Confetti({ onDone }: { onDone: () => void }) {
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: PIECE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.3,
      duration: 1.4 + Math.random() * 0.8,
      rotate: Math.random() * 360,
    })),
  );

  useEffect(() => {
    const timer = setTimeout(onDone, LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden print:hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-5%',
            width: 8,
            height: 8,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
