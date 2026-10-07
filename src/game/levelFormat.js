/**
 * Levels are stored as rows of characters so the data stays small and each
 * board can be read at a glance:  "^" up, "v" down, "<" left, ">" right, "." empty.
 */
const EMPTY_CELL = '.';

const CHAR_TO_DIRECTION = Object.freeze({ '^': 'up', v: 'down', '<': 'left', '>': 'right' });
const DIRECTION_TO_CHAR = Object.freeze(
  Object.fromEntries(Object.entries(CHAR_TO_DIRECTION).map(([char, dir]) => [dir, char])),
);

/**
 * Converts a grid of rows into a level object. Problems are collected in
 * `issues` (rather than thrown) so a bad level can be reported without
 * taking down the whole game.
 */
export function decodeLevel(id, rows) {
  const issues = [];
  const arrows = [];
  const size = Array.isArray(rows) ? rows.length : 0;

  if (size === 0) {
    issues.push('Grid has no rows.');
    return { id, size, arrows, issues };
  }

  rows.forEach((line, row) => {
    if (typeof line !== 'string') {
      issues.push(`Row ${row + 1} is not a string.`);
      return;
    }
    if (line.length !== size) {
      issues.push(`Row ${row + 1} has ${line.length} cells; expected ${size} (square board).`);
    }
    [...line].forEach((char, col) => {
      if (char === EMPTY_CELL) return;
      const direction = CHAR_TO_DIRECTION[char];
      if (!direction) {
        issues.push(`Invalid cell "${char}" at row ${row + 1}, column ${col + 1}.`);
        return;
      }
      arrows.push({ id: `a${arrows.length + 1}`, row, col, direction });
    });
  });

  return { id, size, arrows, issues };
}

export function encodeLevel(size, arrows) {
  const grid = Array.from({ length: size }, () => Array(size).fill(EMPTY_CELL));
  for (const arrow of arrows) grid[arrow.row][arrow.col] = DIRECTION_TO_CHAR[arrow.direction];
  return grid.map((row) => row.join(''));
}
