import { memo, useEffect, useRef } from 'react';
import { DIRECTIONS } from '../game/engine.js';

const ROTATION = { up: 0, right: 90, down: 180, left: 270 };
const BUMP_NUDGE_PX = 6;
const BUMP_MS = 200;

/** Shaft + head drawn pointing up, then rotated, so every direction is the same shape. */
function ArrowGlyph({ direction }) {
  return (
    <svg className="arrow__glyph" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g
        transform={`rotate(${ROTATION[direction]} 50 50)`}
        fill="none"
        stroke="#fff"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M50 80V24" />
        <path d="M27 46l23-23 23 23" />
      </g>
    </svg>
  );
}

function Arrow({ arrow, size, order, escaping, bumpSeq, blockerSeq, hintSeq, reducedMotion, onTap }) {
  const tileRef = useRef(null);
  const flashRef = useRef(null);
  const { direction, row, col } = arrow;

  // Blocked: nudge toward the obstacle and flash red. Uses WAAPI so repeated bumps replay.
  useEffect(() => {
    if (!bumpSeq) return;
    flashRef.current?.animate?.([{ opacity: 0 }, { opacity: 0.35 }, { opacity: 0 }], { duration: 320 });
    if (reducedMotion) return;
    const { dRow, dCol } = DIRECTIONS[direction];
    const nudge = `translate(${dCol * BUMP_NUDGE_PX}px, ${dRow * BUMP_NUDGE_PX}px)`;
    const recoil = `translate(${dCol * -2}px, ${dRow * -2}px)`;
    tileRef.current?.animate?.(
      [{ transform: 'none' }, { transform: `${nudge} scale(0.97)` }, { transform: recoil }, { transform: 'none' }],
      { duration: BUMP_MS, easing: 'ease-out' },
    );
  }, [bumpSeq, direction, reducedMotion]);

  // The arrow in the way gives a small pulse so players learn what blocked them.
  useEffect(() => {
    if (!blockerSeq || reducedMotion) return;
    tileRef.current?.animate?.([{ transform: 'none' }, { transform: 'scale(1.1)' }, { transform: 'none' }], {
      duration: 260,
      delay: 70,
      easing: 'ease-out',
    });
  }, [blockerSeq, reducedMotion]);

  useEffect(() => {
    if (!hintSeq || reducedMotion) return;
    tileRef.current?.animate?.([{ transform: 'none' }, { transform: 'scale(1.12)' }, { transform: 'none' }], {
      duration: 320,
      easing: 'ease-out',
    });
  }, [hintSeq, reducedMotion]);

  const classes = ['arrow', `arrow--${direction}`];
  if (escaping) classes.push('is-escaping');
  if (hintSeq) classes.push('is-hinted');

  const style = {
    gridRow: row + 1,
    gridColumn: col + 1,
    '--order': order,
  };
  if (escaping) {
    // Travel just past the board edge (the board clips it), in this arrow's direction.
    Object.assign(style, {
      '--dx': escaping.dCol,
      '--dy': escaping.dRow,
      '--travel': escaping.distance + 0.5,
      '--escape-ms': `${escaping.duration}ms`,
    });
  }

  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={style}
      aria-label={`Arrow pointing ${direction}, row ${row + 1} of ${size}, column ${col + 1}${hintSeq ? ' (hint)' : ''}`}
      tabIndex={escaping ? -1 : undefined}
      onClick={() => onTap(arrow.id)}
    >
      <span className="arrow__tile" ref={tileRef}>
        <ArrowGlyph direction={direction} />
        <span className="arrow__flash" ref={flashRef} />
      </span>
    </button>
  );
}

export default memo(Arrow);
