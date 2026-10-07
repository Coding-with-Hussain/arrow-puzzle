import { useLayoutEffect, useMemo, useRef } from 'react';
import Arrow from './Arrow.jsx';

export default function GameBoard({ size, arrows, escaping, bump, hint, reducedMotion, onTap, label, className = '' }) {
  const boardRef = useRef(null);
  const focusedIndexRef = useRef(-1);

  const cells = useMemo(
    () =>
      Array.from({ length: size * size }, (_, index) => (
        <span
          key={index}
          className="board__cell"
          style={{ gridRow: Math.floor(index / size) + 1, gridColumn: (index % size) + 1 }}
          aria-hidden="true"
        />
      )),
    [size],
  );

  // When the focused arrow leaves the board, keep keyboard focus on a nearby arrow.
  useLayoutEffect(() => {
    const board = boardRef.current;
    const focusWasLost = !document.activeElement || document.activeElement === document.body;
    if (!board || focusedIndexRef.current < 0 || !focusWasLost) return;
    const buttons = [...board.querySelectorAll('.arrow:not(.is-escaping)')];
    if (buttons.length === 0) return;
    buttons[Math.min(focusedIndexRef.current, buttons.length - 1)].focus({ preventScroll: true });
  }, [arrows]);

  const handleFocus = (event) => {
    const buttons = [...boardRef.current.querySelectorAll('.arrow')];
    focusedIndexRef.current = buttons.indexOf(event.target);
  };

  const handleBlur = (event) => {
    // Focus moving somewhere else on purpose (not an arrow being removed) ends tracking.
    if (event.relatedTarget && !boardRef.current.contains(event.relatedTarget)) focusedIndexRef.current = -1;
  };

  return (
    <div
      ref={boardRef}
      className={`board ${className}`}
      style={{ '--grid-size': size }}
      role="group"
      aria-label={label}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {cells}
      {arrows.map((arrow) => (
        <Arrow
          key={arrow.id}
          arrow={arrow}
          size={size}
          order={arrow.row + arrow.col}
          escaping={escaping?.id === arrow.id ? escaping : null}
          bumpSeq={bump?.arrowId === arrow.id ? bump.seq : 0}
          blockerSeq={bump?.blockerId === arrow.id ? bump.seq : 0}
          hintSeq={hint?.arrowId === arrow.id ? hint.seq : 0}
          reducedMotion={reducedMotion}
          onTap={onTap}
        />
      ))}
    </div>
  );
}
