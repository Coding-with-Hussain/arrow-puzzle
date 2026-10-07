/**
 * Every arrow needs exactly one move to escape, so the perfect score for a
 * level equals its arrow count. Bumping a blocked arrow or asking for a hint
 * costs one extra move; the star thresholds leave room for a few of those.
 */
export const MAX_STARS = 3;

export function getStarThresholds(arrowCount) {
  return {
    three: arrowCount + Math.max(1, Math.round(arrowCount / 6)),
    two: arrowCount + Math.max(3, Math.round(arrowCount / 2.5)),
  };
}

export function getStarRating(moves, arrowCount) {
  const { three, two } = getStarThresholds(arrowCount);
  if (moves <= three) return 3;
  if (moves <= two) return 2;
  return 1;
}

/** The best rating still reachable mid-level, assuming no more mistakes. */
export function getPotentialStars(moves, arrowsRemaining, arrowCount) {
  return getStarRating(moves + arrowsRemaining, arrowCount);
}

const PRAISE = { 3: 'Perfect!', 2: 'Great job!', 1: 'Cleared!' };

export function getPraise(stars) {
  return PRAISE[stars] ?? PRAISE[1];
}
