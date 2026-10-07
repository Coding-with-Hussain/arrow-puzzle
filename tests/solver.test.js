import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canArrowEscape } from '../src/game/engine.js';
import { analyzeLevel, isSolvable, solveLevel } from '../src/game/solver.js';

const arrow = (id, row, col, direction) => ({ id, row, col, direction });

describe('solver', () => {
  it('returns a move order that actually clears the board', () => {
    const arrows = [
      arrow('a', 0, 1, 'down'),
      arrow('b', 1, 0, 'left'),
      arrow('c', 1, 1, 'left'),
      arrow('d', 2, 1, 'right'),
    ];
    const { solvable, order } = solveLevel(arrows);
    assert.equal(solvable, true);

    let remaining = arrows;
    for (const id of order) {
      const next = remaining.find((a) => a.id === id);
      assert.ok(canArrowEscape(remaining, next), `${id} should be free when played`);
      remaining = remaining.filter((a) => a.id !== id);
    }
    assert.equal(remaining.length, 0);
  });

  it('detects impossible boards and names the stuck arrows', () => {
    const arrows = [arrow('a', 0, 0, 'right'), arrow('b', 0, 2, 'left'), arrow('c', 2, 2, 'down')];
    const result = solveLevel(arrows);
    assert.equal(result.solvable, false);
    assert.deepEqual(result.stuck, ['a', 'b']);
  });

  it('detects longer cycles', () => {
    // Four arrows chasing each other around a square.
    const arrows = [
      arrow('a', 0, 0, 'right'),
      arrow('b', 0, 1, 'down'),
      arrow('c', 1, 1, 'left'),
      arrow('d', 1, 0, 'up'),
    ];
    assert.equal(isSolvable(arrows), false);
  });

  it('reports depth and initially free arrows', () => {
    const level = { size: 3, arrows: [arrow('a', 0, 0, 'right'), arrow('b', 0, 1, 'right'), arrow('c', 1, 1, 'up')] };
    const metrics = analyzeLevel(level);
    assert.equal(metrics.depth, 2);
    assert.equal(metrics.initialFree, 1);
    assert.equal(metrics.solvable, true);
  });
});
