import { DIRECTIONS, getEscapeDistance, getHintMove, isLevelComplete, moveArrow } from './engine.js';

const ESCAPE_TIMING = Object.freeze({ minMs: 240, maxMs: 340, perCellMs: 22, reducedMs: 150 });

function getEscapeDuration(distance, reducedMotion) {
  if (reducedMotion) return ESCAPE_TIMING.reducedMs;
  const duration = ESCAPE_TIMING.minMs + (distance - 1) * ESCAPE_TIMING.perCellMs;
  return Math.min(ESCAPE_TIMING.maxMs, duration);
}

export function createInitialState(level) {
  return {
    level,
    arrows: level.arrows,
    moves: 0,
    history: [],
    status: 'playing',
    escaping: null,
    queuedTap: null,
    bump: null,
    hint: null,
    // Last event that cost an extra move (a bump or a hint), for the "+1" feedback.
    penaltySeq: 0,
    // Monotonic counter that gives every animation/sound event a unique key.
    seq: 0,
  };
}

function tap(state, arrowId, reducedMotion) {
  if (state.status !== 'playing') return state;

  // One move at a time: remember the latest tap and replay it once the board settles.
  if (state.escaping) {
    if (arrowId === state.escaping.id) return state;
    return { ...state, queuedTap: { arrowId, reducedMotion } };
  }

  const arrow = state.arrows.find((a) => a.id === arrowId);
  if (!arrow) return state;

  const seq = state.seq + 1;
  const result = moveArrow(state.arrows, arrow);

  if (!result.moved) {
    return {
      ...state,
      seq,
      moves: state.moves + 1,
      penaltySeq: seq,
      hint: null,
      bump: { arrowId, blockerId: result.blocker.id, seq },
    };
  }

  const distance = getEscapeDistance(state.level.size, arrow);
  const { dRow, dCol } = DIRECTIONS[arrow.direction];
  const progress = 1 - result.arrows.length / state.level.arrows.length;
  return {
    ...state,
    seq,
    moves: state.moves + 1,
    history: [...state.history, state.arrows],
    hint: null,
    bump: null,
    escaping: {
      id: arrow.id,
      dRow,
      dCol,
      distance,
      duration: getEscapeDuration(distance, reducedMotion),
      progress,
      seq,
    },
  };
}

/** Pure state machine for one play-through of a level. */
export function gameReducer(state, action) {
  switch (action.type) {
    case 'tap':
      return tap(state, action.arrowId, action.reducedMotion);

    case 'escapeDone': {
      if (state.escaping?.seq !== action.seq) return state;
      const arrows = state.arrows.filter((a) => a.id !== state.escaping.id);
      const settled = { ...state, arrows, escaping: null, queuedTap: null };
      if (isLevelComplete(arrows)) return { ...settled, status: 'complete' };
      const { queuedTap } = state;
      return queuedTap ? tap(settled, queuedTap.arrowId, queuedTap.reducedMotion) : settled;
    }

    case 'undo': {
      if (state.escaping || state.history.length === 0 || state.status !== 'playing') return state;
      // Undo takes back the last escape (and its move). Bumps and hints stay on the scoreboard.
      return {
        ...state,
        arrows: state.history[state.history.length - 1],
        history: state.history.slice(0, -1),
        moves: Math.max(0, state.moves - 1),
        bump: null,
        hint: null,
        seq: state.seq + 1,
      };
    }

    case 'hint': {
      if (state.status !== 'playing') return state;
      const seq = state.seq + 1;
      const onBoard = state.escaping ? state.arrows.filter((a) => a.id !== state.escaping.id) : state.arrows;
      // Asking again while a hint is showing just replays the glow, at no cost.
      if (state.hint && onBoard.some((a) => a.id === state.hint.arrowId)) {
        return { ...state, seq, hint: { ...state.hint, seq } };
      }
      const suggestion = getHintMove(onBoard);
      if (!suggestion) return state;
      return { ...state, seq, moves: state.moves + 1, penaltySeq: seq, bump: null, hint: { arrowId: suggestion.id, seq } };
    }

    case 'restart':
      return { ...createInitialState(state.level), seq: state.seq + 1 };

    default:
      return state;
  }
}
