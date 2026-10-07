import { useCallback, useEffect, useReducer, useRef } from 'react';
import { createInitialState, gameReducer } from '../game/gameState.js';

/**
 * Drives one play-through of a level. `onEvent(name, detail)` is called for
 * sound-worthy moments: "move", "blocked", "hint" and "complete".
 */
export function useGame(level, { reducedMotion = false, onEvent } = {}) {
  const [state, dispatch] = useReducer(gameReducer, level, createInitialState);
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  const { escaping, bump, hint, status, moves } = state;
  const remaining = state.arrows.length - (escaping ? 1 : 0);

  useEffect(() => {
    if (!escaping) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'escapeDone', seq: escaping.seq }), escaping.duration);
    return () => clearTimeout(timer);
  }, [escaping]);

  useEffect(() => {
    if (escaping) onEventRef.current?.('move', { progress: escaping.progress });
  }, [escaping]);

  useEffect(() => {
    if (bump) onEventRef.current?.('blocked', bump);
  }, [bump]);

  useEffect(() => {
    if (hint) onEventRef.current?.('hint', hint);
  }, [hint]);

  useEffect(() => {
    if (status === 'complete') onEventRef.current?.('complete', { moves });
  }, [status, moves]);

  const tapArrow = useCallback(
    (arrowId) => dispatch({ type: 'tap', arrowId, reducedMotion }),
    [reducedMotion],
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const restart = useCallback(() => dispatch({ type: 'restart' }), []);
  const showHint = useCallback(() => dispatch({ type: 'hint' }), []);

  return {
    arrows: state.arrows,
    moves,
    status,
    escaping,
    bump,
    hint,
    remaining,
    penaltySeq: state.penaltySeq,
    canUndo: state.history.length > 0 && !escaping && status === 'playing',
    tapArrow,
    undo,
    restart,
    showHint,
  };
}
