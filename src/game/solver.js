import { getValidMoves } from './engine.js';

/**
 * Solves a board by repeatedly removing every arrow that can currently escape.
 *
 * Removing an arrow can only ever clear paths, never block them, so an arrow
 * that is free stays free. That makes greedy peeling complete: if this gets
 * stuck, no order of moves can clear the board.
 *
 * Returns the solution order, the peel layers (arrows freed together) and,
 * for impossible boards, the arrows that can never escape.
 */
export function solveLevel(arrows) {
  let remaining = arrows;
  const layers = [];

  while (remaining.length > 0) {
    const free = getValidMoves(remaining);
    if (free.length === 0) break;

    const freeIds = new Set(free.map((arrow) => arrow.id));
    layers.push(free.map((arrow) => arrow.id));
    remaining = remaining.filter((arrow) => !freeIds.has(arrow.id));
  }

  return {
    solvable: remaining.length === 0,
    order: layers.flat(),
    layers,
    stuck: remaining.map((arrow) => arrow.id),
  };
}

export function isSolvable(arrows) {
  return solveLevel(arrows).solvable;
}

/** Difficulty metrics used by the level generator and validator. */
export function analyzeLevel(level) {
  const { solvable, layers } = solveLevel(level.arrows);
  return {
    solvable,
    arrowCount: level.arrows.length,
    depth: layers.length,
    initialFree: layers[0]?.length ?? 0,
    density: level.arrows.length / (level.size * level.size),
  };
}
