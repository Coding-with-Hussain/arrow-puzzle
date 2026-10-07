#!/usr/bin/env node
/**
 * Builds src/data/levels.js.
 *
 * Boards are grown in *reverse* solution order: every new arrow must have a
 * clear path to the edge at the moment it is placed, so removing arrows in the
 * opposite order always clears the board. Placements are biased toward the
 * paths of existing arrows to build dependency chains, many candidates are
 * scored per level, and the winner is re-checked by the independent solver
 * and validator before anything is written.
 *
 * Output is deterministic (seeded per level), so re-running only changes the
 * file when this script or the tier targets change.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DIFFICULTY_TIERS, getTierForLevel } from '../src/data/tiers.js';
import { DIRECTIONS, DIRECTION_NAMES } from '../src/game/engine.js';
import { decodeLevel, encodeLevel } from '../src/game/levelFormat.js';
import { analyzeLevel } from '../src/game/solver.js';
import { validateLevel } from '../src/game/validator.js';

const OUTPUT = fileURLToPath(new URL('../src/data/levels.js', import.meta.url));
const TOTAL_LEVELS = 100;

/** Handcrafted openers: teach tapping, then directions, then the first block. */
const HANDCRAFTED = {
  1: ['.^.', '<..', '..v'],
  2: ['^.>', '...', '<.v'],
  3: ['>>.', '.^.', '...'],
  4: ['.v.', '<<.', '.>.'],
};

/** Per-board-size targets, interpolated from the first to the last level of a tier. */
const TARGETS = {
  3: { arrows: [4, 6], depth: [2, 3], maxFree: [3, 2], candidates: 400, refineIterations: 300 },
  4: { arrows: [6, 10], depth: [3, 4], maxFree: [3, 2], candidates: 500, refineIterations: 800 },
  5: { arrows: [9, 15], depth: [3, 6], maxFree: [3, 3], candidates: 500, refineIterations: 1500 },
  6: { arrows: [14, 22], depth: [5, 8], maxFree: [4, 3], candidates: 400, refineIterations: 2500 },
  7: { arrows: [19, 30], depth: [6, 10], maxFree: [4, 4], candidates: 350, refineIterations: 3000 },
  8: { arrows: [26, 40], depth: [7, 12], maxFree: [5, 4], candidates: 300, refineIterations: 3500 },
};

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
const MIRROR = { up: 'up', down: 'down', left: 'right', right: 'left' };

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (from, to, t) => from + (to - from) * t;

function getTargets(levelId) {
  const tier = getTierForLevel(levelId);
  const spec = TARGETS[tier.size];
  const progress = (levelId - tier.firstLevel) / Math.max(1, tier.lastLevel - tier.firstLevel);
  return {
    size: tier.size,
    arrows: Math.round(lerp(...spec.arrows, progress)),
    depth: Math.round(lerp(...spec.depth, progress)),
    maxFree: Math.round(lerp(...spec.maxFree, progress)),
    candidates: spec.candidates,
    refineIterations: spec.refineIterations,
  };
}

function symmetricPartner(size, row, col, direction, symmetry) {
  if (symmetry === 'rotate') return { row: size - 1 - row, col: size - 1 - col, direction: OPPOSITE[direction] };
  if (symmetry === 'mirror') return { row, col: size - 1 - col, direction: MIRROR[direction] };
  return null;
}

function createBoard(size) {
  return {
    size,
    cells: Array(size * size).fill(null),
    // Longest chain of arrows that would be waiting on an arrow placed in this cell.
    coverTop: Array(size * size).fill(0),
    arrows: [],
  };
}

function rayIsClear(board, row, col, direction) {
  const { dRow, dCol } = DIRECTIONS[direction];
  for (let r = row + dRow, c = col + dCol; r >= 0 && c >= 0 && r < board.size && c < board.size; r += dRow, c += dCol) {
    if (board.cells[r * board.size + c]) return false;
  }
  return true;
}

function placeArrow(board, row, col, direction) {
  const { size } = board;
  const top = board.coverTop[row * size + col] + 1;
  const arrow = { row, col, direction, top };
  board.cells[row * size + col] = arrow;
  board.arrows.push(arrow);

  const { dRow, dCol } = DIRECTIONS[direction];
  for (let r = row + dRow, c = col + dCol; r >= 0 && c >= 0 && r < size && c < size; r += dRow, c += dCol) {
    const index = r * size + c;
    board.coverTop[index] = Math.max(board.coverTop[index], top);
  }
}

function listPlacements(board) {
  const placements = [];
  for (let row = 0; row < board.size; row += 1) {
    for (let col = 0; col < board.size; col += 1) {
      if (board.cells[row * board.size + col]) continue;
      for (const direction of DIRECTION_NAMES) {
        if (rayIsClear(board, row, col, direction)) placements.push({ row, col, direction });
      }
    }
  }
  return placements;
}

function pickWeighted(items, weights, random) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return items.length - 1;
}

function tryPlace(board, placement, symmetry) {
  const { size } = board;
  const partner = symmetricPartner(size, placement.row, placement.col, placement.direction, symmetry);

  if (!partner) {
    placeArrow(board, placement.row, placement.col, placement.direction);
    return true;
  }

  const samePlace = partner.row === placement.row && partner.col === placement.col;
  if (samePlace) {
    if (partner.direction !== placement.direction) return false;
    placeArrow(board, placement.row, placement.col, placement.direction);
    return true;
  }

  if (board.cells[partner.row * size + partner.col]) return false;
  // The partner is placed second, so its path must also avoid the first arrow.
  const snapshot = { cells: [...board.cells], coverTop: [...board.coverTop], arrows: [...board.arrows] };
  placeArrow(board, placement.row, placement.col, placement.direction);
  if (!rayIsClear(board, partner.row, partner.col, partner.direction)) {
    Object.assign(board, snapshot);
    return false;
  }
  placeArrow(board, partner.row, partner.col, partner.direction);
  return true;
}

function buildCandidate(targets, random, symmetry) {
  const board = createBoard(targets.size);
  const chainBias = lerp(1.2, 2.6, random());
  const overshoot = Math.round(random() * 2);

  while (board.arrows.length < targets.arrows + overshoot) {
    const placements = listPlacements(board);
    if (placements.length === 0) break;

    const weights = placements.map(({ row, col }) => {
      const waiting = board.coverTop[row * board.size + col];
      return waiting > 0 ? (waiting + 1) ** chainBias : 0.6;
    });

    let placed = false;
    while (placements.length > 0 && !placed) {
      const index = pickWeighted(placements, weights, random);
      placed = tryPlace(board, placements[index], symmetry);
      placements.splice(index, 1);
      weights.splice(index, 1);
    }
    if (!placed) break;
  }
  return board;
}

/** Same puzzle under rotation/reflection should count as a duplicate. */
function canonicalKey(size, arrows) {
  const transforms = [
    (r, c, d) => [r, c, d],
    (r, c, d) => [c, size - 1 - r, { up: 'right', right: 'down', down: 'left', left: 'up' }[d]],
    (r, c, d) => [size - 1 - r, size - 1 - c, OPPOSITE[d]],
    (r, c, d) => [size - 1 - c, r, { up: 'left', left: 'down', down: 'right', right: 'up' }[d]],
  ];
  const keys = [];
  for (const transform of transforms) {
    for (const mirror of [false, true]) {
      const mapped = arrows.map(({ row, col, direction }) => {
        const [r, c, d] = transform(row, col, direction);
        return mirror ? { row: r, col: size - 1 - c, direction: MIRROR[d] } : { row: r, col: c, direction: d };
      });
      keys.push(encodeLevel(size, mapped).join('/'));
    }
  }
  return keys.sort()[0];
}

function isOutwardEdgeArrow(size, { row, col, direction }) {
  return (
    (direction === 'up' && row === 0) ||
    (direction === 'down' && row === size - 1) ||
    (direction === 'left' && col === 0) ||
    (direction === 'right' && col === size - 1)
  );
}

function scoreCandidate(arrows, targets) {
  const level = { size: targets.size, arrows };
  const metrics = analyzeLevel(level);
  if (!metrics.solvable) return { score: -Infinity, metrics };

  const counts = Object.fromEntries(DIRECTION_NAMES.map((d) => [d, 0]));
  arrows.forEach((arrow) => (counts[arrow.direction] += 1));
  const missingDirections = DIRECTION_NAMES.filter((d) => counts[d] === 0).length;
  const dominantShare = Math.max(...Object.values(counts)) / arrows.length;

  // Same-direction neighbours ("> >") are the easiest dependencies to read.
  let straightPairs = 0;
  for (const arrow of arrows) {
    const { dRow, dCol } = DIRECTIONS[arrow.direction];
    const ahead = arrows.find((a) => a.row === arrow.row + dRow && a.col === arrow.col + dCol);
    if (ahead && ahead.direction === arrow.direction) straightPairs += 1;
  }

  // Arrows on the rim pointing straight out are free giveaways.
  const giveaways = arrows.filter((arrow) => isOutwardEdgeArrow(targets.size, arrow)).length;

  const depthGap = metrics.depth - targets.depth;
  let score = 0;
  score -= Math.abs(metrics.arrowCount - targets.arrows) * 3;
  score -= depthGap < 0 ? -depthGap * 5 : depthGap * 1.5;
  score -= Math.max(0, metrics.initialFree - targets.maxFree) * 2.5;
  score -= missingDirections * (targets.size > 3 ? 4 : 1);
  score -= Math.max(0, dominantShare - 0.35) * 20;
  score -= Math.max(0, straightPairs / arrows.length - 0.25) * 12;
  score -= Math.max(0, giveaways - Math.ceil(targets.maxFree / 2)) * 1.5;
  return { score, metrics };
}

/** Local search: nudge single arrows (turn or relocate) while the board stays solvable. */
function refine(arrows, targets, random, iterations) {
  let current = arrows;
  let { score: currentScore, metrics: currentMetrics } = scoreCandidate(current, targets);
  const { size } = targets;

  for (let i = 0; i < iterations; i += 1) {
    const index = Math.floor(random() * current.length);
    const arrow = current[index];
    const next = [...current];

    if (random() < 0.6) {
      const options = DIRECTION_NAMES.filter((d) => d !== arrow.direction);
      next[index] = { ...arrow, direction: options[Math.floor(random() * options.length)] };
    } else {
      const row = Math.floor(random() * size);
      const col = Math.floor(random() * size);
      if (current.some((a) => a.row === row && a.col === col)) continue;
      next[index] = { ...arrow, row, col, direction: DIRECTION_NAMES[Math.floor(random() * 4)] };
    }

    const { score, metrics } = scoreCandidate(next, targets);
    if (score >= currentScore) {
      current = next;
      currentScore = score;
      currentMetrics = metrics;
    }
  }
  return { arrows: current, score: currentScore, metrics: currentMetrics };
}

function generateLevel(levelId, usedKeys) {
  const targets = getTargets(levelId);
  const random = mulberry32(levelId * 7919 + targets.size * 104729);
  const symmetryRoll = random();
  // Roughly a third of boards are symmetric, which reads as deliberately designed.
  const symmetry = symmetryRoll < 0.18 ? 'rotate' : symmetryRoll < 0.34 ? 'mirror' : 'none';

  let best = null;
  for (let i = 0; i < targets.candidates; i += 1) {
    const board = buildCandidate(targets, random, i % 4 === 3 ? 'none' : symmetry);
    const arrows = board.arrows.map(({ row, col, direction }, index) => ({ id: `a${index + 1}`, row, col, direction }));
    if (arrows.length === 0) continue;
    const key = canonicalKey(targets.size, arrows);
    if (usedKeys.has(key)) continue;
    const { score, metrics } = scoreCandidate(arrows, targets);
    if (!best || score > best.score) best = { score, metrics, arrows, key };
  }

  // Symmetric boards keep their shape; free-form boards get polished further.
  if (best && symmetry === 'none') {
    const refined = refine(best.arrows, targets, random, targets.refineIterations);
    const key = canonicalKey(targets.size, refined.arrows);
    if (!usedKeys.has(key)) best = { ...refined, key };
  }

  if (!best) throw new Error(`Could not generate level ${levelId}`);
  usedKeys.add(best.key);
  return { rows: encodeLevel(targets.size, best.arrows), metrics: best.metrics, targets };
}

function main() {
  const usedKeys = new Set();
  const output = [];

  for (let id = 1; id <= TOTAL_LEVELS; id += 1) {
    let rows;
    let metrics;
    let targets = null;
    if (HANDCRAFTED[id]) {
      rows = HANDCRAFTED[id];
      const level = decodeLevel(id, rows);
      metrics = analyzeLevel(level);
      usedKeys.add(canonicalKey(level.size, level.arrows));
    } else {
      ({ rows, metrics, targets } = generateLevel(id, usedKeys));
    }

    const level = decodeLevel(id, rows);
    const { valid, errors } = validateLevel(level);
    if (!valid) throw new Error(`Level ${id} failed validation:\n  ${errors.join('\n  ')}`);

    output.push(rows);
    const target = targets ? `  (target ${targets.arrows} arrows / depth ${targets.depth})` : '  (handcrafted)';
    console.log(
      `Level ${String(id).padStart(3)}  ${level.size}×${level.size}  arrows ${String(metrics.arrowCount).padStart(2)}  ` +
        `depth ${String(metrics.depth).padStart(2)}  free ${metrics.initialFree}${target}`,
    );
  }

  const tierComment = (id) => {
    const tier = DIFFICULTY_TIERS.find((t) => t.firstLevel === id);
    return tier ? `  // ${tier.firstLevel}–${tier.lastLevel} · ${tier.name} · ${tier.size}×${tier.size}\n` : '';
  };

  const body = output
    .map((rows, index) => `${tierComment(index + 1)}  [${rows.map((row) => `'${row}'`).join(', ')}], // ${index + 1}`)
    .join('\n');

  const file = `// Generated by scripts/generate-levels.mjs — edit that script, then run \`npm run levels:generate\`.
// Each level is a square grid: "^" up, "v" down, "<" left, ">" right, "." empty.
// Every level is verified solvable by the generator, \`npm run levels:validate\` and the test suite.
import { decodeLevel } from '../game/levelFormat.js';

const LEVEL_GRIDS = [
${body}
];

export const levels = LEVEL_GRIDS.map((rows, index) => decodeLevel(index + 1, rows));

export const TOTAL_LEVELS = levels.length;

export function getLevel(id) {
  return levels[id - 1] ?? null;
}
`;

  writeFileSync(OUTPUT, file);
  console.log(`\nWrote ${output.length} levels to ${OUTPUT}`);
}

main();
