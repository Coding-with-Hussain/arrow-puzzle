import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decodeLevel, encodeLevel } from '../src/game/levelFormat.js';
import { validateLevel, validateLevels } from '../src/game/validator.js';

const arrow = (id, row, col, direction) => ({ id, row, col, direction });
const level = (arrows, extra = {}) => ({ id: 1, size: 3, arrows, ...extra });

describe('validateLevel', () => {
  it('accepts a good level', () => {
    assert.deepEqual(validateLevel(level([arrow('a1', 0, 0, 'up')])), { valid: true, errors: [] });
  });

  it('rejects empty boards', () => {
    assert.equal(validateLevel(level([])).valid, false);
  });

  it('rejects duplicate ids, bad directions, overlaps and out-of-bounds arrows', () => {
    const cases = [
      [arrow('a', 0, 0, 'up'), arrow('a', 1, 1, 'up')],
      [arrow('a', 0, 0, 'diagonal')],
      [arrow('a', 0, 0, 'up'), arrow('b', 0, 0, 'down')],
      [arrow('a', 3, 0, 'up')],
      [arrow('a', -1, 0, 'up')],
      [arrow('a', 0.5, 0, 'up')],
      [arrow('', 0, 0, 'up')],
      [null],
    ];
    for (const arrows of cases) {
      assert.equal(validateLevel(level(arrows)).valid, false, JSON.stringify(arrows));
    }
  });

  it('rejects impossible layouts', () => {
    const result = validateLevel(level([arrow('a', 1, 0, 'right'), arrow('b', 1, 2, 'left')]));
    assert.equal(result.valid, false);
    assert.match(result.errors[0], /impossible/);
  });

  it('rejects bad sizes and non-objects without throwing', () => {
    assert.equal(validateLevel(level([arrow('a', 0, 0, 'up')], { size: 1 })).valid, false);
    assert.equal(validateLevel(level([arrow('a', 0, 0, 'up')], { size: 'big' })).valid, false);
    assert.equal(validateLevel(null).valid, false);
  });

  it('checks level ids across a pack', () => {
    const good = level([arrow('a', 0, 0, 'up')]);
    assert.equal(validateLevels([good, { ...good, id: 2 }]).valid, true);
    assert.equal(validateLevels([good, good]).valid, false);
  });
});

describe('level format', () => {
  it('round-trips through encode/decode', () => {
    const rows = ['>.v', '...', '^.<'];
    const decoded = decodeLevel(7, rows);
    assert.deepEqual(decoded.issues, []);
    assert.equal(decoded.size, 3);
    assert.deepEqual(decoded.arrows[0], { id: 'a1', row: 0, col: 0, direction: 'right' });
    assert.deepEqual(encodeLevel(decoded.size, decoded.arrows), rows);
  });

  it('flags invalid cells and ragged rows so validation fails', () => {
    const decoded = decodeLevel(1, ['>x.', '..', '...']);
    assert.equal(decoded.issues.length, 2);
    assert.equal(validateLevel(decoded).valid, false);
  });
});
