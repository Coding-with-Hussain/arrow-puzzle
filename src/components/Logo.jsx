const TILE = 34;

function Tile({ x, y, color, dark, rotation }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={TILE} height={TILE} rx="9" fill={dark} />
      <rect width={TILE} height={TILE - 3.5} rx="9" fill={color} />
      <g
        transform={`rotate(${rotation} ${TILE / 2} ${TILE / 2 - 1.5})`}
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d={`M${TILE / 2} 25V9`} />
        <path d={`M${TILE / 2 - 7} 15.5l7-7 7 7`} />
      </g>
    </g>
  );
}

/** Arrow Escape mark: a 2×2 board with one arrow breaking out of it. */
export default function Logo({ className = 'logo', animated = true }) {
  return (
    <svg className={className} viewBox="0 0 140 120" role="img" aria-label="Arrow Escape logo">
      <rect x="6" y="18" width="96" height="96" rx="24" fill="var(--surface)" />
      <rect x="19" y="31" width={TILE} height={TILE} rx="9" fill="var(--cell)" />
      <rect x="55" y="31" width={TILE} height={TILE} rx="9" fill="var(--cell)" />
      <Tile x={19} y={67} color="var(--arrow-left)" dark="var(--arrow-left-dark)" rotation={270} />
      <Tile x={55} y={67} color="var(--arrow-up)" dark="var(--arrow-up-dark)" rotation={0} />
      <Tile x={19} y={31} color="var(--arrow-down)" dark="var(--arrow-down-dark)" rotation={180} />
      <g className={animated ? 'logo__trail' : undefined} stroke="var(--arrow-right)" strokeLinecap="round" strokeWidth="3.5">
        <path d="M86 40h8" opacity="0.3" />
        <path d="M78 48h16" opacity="0.55" />
        <path d="M86 56h8" opacity="0.3" />
      </g>
      <g className={animated ? 'logo__escapee' : undefined}>
        <Tile x={100} y={31} color="var(--arrow-right)" dark="var(--arrow-right-dark)" rotation={90} />
      </g>
    </svg>
  );
}
