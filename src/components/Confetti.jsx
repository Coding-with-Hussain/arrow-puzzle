const COLORS = ['var(--arrow-up)', 'var(--arrow-right)', 'var(--arrow-down)', 'var(--arrow-left)', 'var(--star)'];
const PIECE_COUNT = 36;
const GOLDEN_ANGLE = 137.508;

// Deterministic "random" spread so the burst looks organic but renders identically every time.
const jitter = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const PIECES = Array.from({ length: PIECE_COUNT }, (_, i) => {
  const angle = ((i * GOLDEN_ANGLE) % 360) * (Math.PI / 180);
  const distance = 110 + jitter(i + 1) * 120;
  return {
    '--x': `${Math.cos(angle) * distance}px`,
    // Pieces drift downward a little, like they have weight.
    '--y': `${Math.sin(angle) * distance * 0.8 + 40}px`,
    '--r': `${(jitter(i + 7) - 0.5) * 720}deg`,
    '--w': `${6 + Math.round(jitter(i + 3) * 4)}px`,
    '--h': `${9 + Math.round(jitter(i + 5) * 6)}px`,
    '--c': COLORS[i % COLORS.length],
    '--dur': `${750 + Math.round(jitter(i + 11) * 450)}ms`,
    '--delay': `${120 + Math.round(jitter(i + 13) * 120)}ms`,
  };
});

export default function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {PIECES.map((style, index) => (
        <span key={index} className="confetti__piece" style={style} />
      ))}
    </div>
  );
}
