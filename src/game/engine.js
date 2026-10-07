export const DIRECTIONS = Object.freeze({
  up: Object.freeze({ dRow: -1, dCol: 0 }),
  down: Object.freeze({ dRow: 1, dCol: 0 }),
  left: Object.freeze({ dRow: 0, dCol: -1 }),
  right: Object.freeze({ dRow: 0, dCol: 1 }),
});

export const DIRECTION_NAMES = Object.freeze(Object.keys(DIRECTIONS));

export function isValidDirection(direction) {
  return Object.hasOwn(DIRECTIONS, direction);
}

/**
 * Distance (in cells) from `arrow` to `other` if `other` sits in front of it,
 * otherwise null.
 */
function distanceAhead(arrow, other) {
  const { dRow, dCol } = DIRECTIONS[arrow.direction];
  const rowDelta = other.row - arrow.row;
  const colDelta = other.col - arrow.col;

  if (dRow === 0) {
    if (rowDelta !== 0 || Math.sign(colDelta) !== dCol) return null;
    return Math.abs(colDelta);
  }
  if (colDelta !== 0 || Math.sign(rowDelta) !== dRow) return null;
  return Math.abs(rowDelta);
}

/** The nearest arrow standing in the path of `arrow`, or null if the path is clear. */
export function getBlockingArrow(arrows, arrow) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const other of arrows) {
    if (other.id === arrow.id) continue;
    const distance = distanceAhead(arrow, other);
    if (distance !== null && distance < nearestDistance) {
      nearest = other;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function canArrowEscape(arrows, arrow) {
  return getBlockingArrow(arrows, arrow) === null;
}

/** Number of cells an arrow travels before it is fully outside a board of `size`. */
export function getEscapeDistance(size, arrow) {
  switch (arrow.direction) {
    case 'up':
      return arrow.row + 1;
    case 'down':
      return size - arrow.row;
    case 'left':
      return arrow.col + 1;
    case 'right':
      return size - arrow.col;
    default:
      return 0;
  }
}

/**
 * Attempts to move `arrow` off the board.
 * Returns the next arrow list plus the blocker (if any). The input is never mutated.
 */
export function moveArrow(arrows, arrow) {
  const blocker = getBlockingArrow(arrows, arrow);
  if (blocker) return { moved: false, arrows, blocker };
  return { moved: true, arrows: arrows.filter((a) => a.id !== arrow.id), blocker: null };
}

export function isLevelComplete(arrows) {
  return arrows.length === 0;
}

export function getValidMoves(arrows) {
  return arrows.filter((arrow) => canArrowEscape(arrows, arrow));
}

/** How many arrows currently have `arrow` somewhere in their path. */
function countArrowsWaitingOn(arrows, arrow) {
  let count = 0;
  for (const other of arrows) {
    if (other.id !== arrow.id && distanceAhead(other, arrow) !== null) count += 1;
  }
  return count;
}

function readingOrder(a, b) {
  return a.row - b.row || a.col - b.col;
}

/**
 * Suggests the most useful free arrow: the one that frees up the most of the
 * board, falling back to reading order so hints are stable.
 */
export function getHintMove(arrows) {
  const validMoves = getValidMoves(arrows);
  if (validMoves.length === 0) return null;

  let best = null;
  let bestScore = -1;
  for (const arrow of [...validMoves].sort(readingOrder)) {
    const score = countArrowsWaitingOn(arrows, arrow);
    if (score > bestScore) {
      best = arrow;
      bestScore = score;
    }
  }
  return best;
}
