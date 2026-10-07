import { isValidDirection } from './engine.js';
import { solveLevel } from './solver.js';

const MIN_BOARD_SIZE = 2;
const MAX_BOARD_SIZE = 12;

function isInteger(value) {
  return Number.isInteger(value);
}

function validateArrow(arrow, index, size, seenIds, occupied, errors) {
  const label = `Arrow #${index + 1}`;

  if (!arrow || typeof arrow !== 'object') {
    errors.push(`${label} is not an object.`);
    return;
  }

  if (typeof arrow.id !== 'string' || arrow.id.trim() === '') {
    errors.push(`${label} has a missing or empty id.`);
  } else if (seenIds.has(arrow.id)) {
    errors.push(`${label} reuses id "${arrow.id}".`);
  } else {
    seenIds.add(arrow.id);
  }

  if (!isValidDirection(arrow.direction)) {
    errors.push(`${label} has invalid direction "${arrow.direction}".`);
  }

  if (!isInteger(arrow.row) || !isInteger(arrow.col)) {
    errors.push(`${label} has a non-integer position.`);
    return;
  }

  if (arrow.row < 0 || arrow.row >= size || arrow.col < 0 || arrow.col >= size) {
    errors.push(`${label} at (${arrow.row}, ${arrow.col}) is outside the ${size}×${size} board.`);
    return;
  }

  const cellKey = `${arrow.row},${arrow.col}`;
  if (occupied.has(cellKey)) {
    errors.push(`${label} overlaps another arrow at (${arrow.row}, ${arrow.col}).`);
  } else {
    occupied.add(cellKey);
  }
}

/**
 * Checks a single level's structure and proves it can be cleared.
 * Returns `{ valid, errors }`; never throws.
 */
export function validateLevel(level) {
  const errors = [];

  if (!level || typeof level !== 'object') {
    return { valid: false, errors: ['Level is not an object.'] };
  }

  if (Array.isArray(level.issues)) errors.push(...level.issues);

  if (!isInteger(level.id) || level.id < 1) errors.push(`Invalid level id "${level.id}".`);

  const { size } = level;
  if (!isInteger(size) || size < MIN_BOARD_SIZE || size > MAX_BOARD_SIZE) {
    errors.push(`Board size must be an integer from ${MIN_BOARD_SIZE} to ${MAX_BOARD_SIZE}.`);
    return { valid: false, errors };
  }

  if (!Array.isArray(level.arrows) || level.arrows.length === 0) {
    errors.push('Level has no arrows.');
    return { valid: false, errors };
  }

  const seenIds = new Set();
  const occupied = new Set();
  level.arrows.forEach((arrow, index) => validateArrow(arrow, index, size, seenIds, occupied, errors));

  // Solving only makes sense once every arrow is well-formed.
  if (errors.length === 0) {
    const { solvable, stuck } = solveLevel(level.arrows);
    if (!solvable) errors.push(`Level is impossible: arrows ${stuck.join(', ')} can never escape.`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validates a full level pack, including sequential, unique ids. */
export function validateLevels(levels) {
  const results = [];
  const seenIds = new Set();

  levels.forEach((level, index) => {
    const { errors } = validateLevel(level);
    const expectedId = index + 1;
    if (level?.id !== expectedId) errors.push(`Expected id ${expectedId} at position ${expectedId}.`);
    if (seenIds.has(level?.id)) errors.push(`Duplicate level id ${level.id}.`);
    seenIds.add(level?.id);
    if (errors.length > 0) results.push({ id: level?.id ?? expectedId, errors });
  });

  return { valid: results.length === 0, invalidLevels: results };
}
