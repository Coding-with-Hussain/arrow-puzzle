import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canArrowEscape,
  getBlockingArrow,
  getEscapeDistance,
  getHintMove,
  getValidMoves,
  isLevelComplete,
  moveArrow,
} from '../src/game/engine.js';

const arrow = (id, row, col, direction) => ({ id, row, col, direction });

describe('canArrowEscape / getBlockingArrow', () => {
  it('lets a lone arrow escape in every direction', () => {
    for (const direction of ['up', 'down', 'left', 'right']) {
      const a = arrow('a', 1, 1, direction);
      assert.equal(canArrowEscape([a], a), true);
    }
  });

  it('blocks on any arrow in front, not only adjacent ones', () => {
    const shooter = arrow('a', 0, 0, 'right');
    const far = arrow('b', 0, 3, 'up');
    assert.equal(canArrowEscape([shooter, far], shooter), false);
    assert.equal(getBlockingArrow([shooter, far], shooter), far);
  });

  it('ignores arrows behind or beside the path', () => {
    const shooter = arrow('a', 2, 2, 'right');
    const others = [arrow('b', 2, 0, 'left'), arrow('c', 1, 3, 'down'), arrow('d', 3, 4, 'up')];
    assert.equal(canArrowEscape([shooter, ...others], shooter), true);
  });

  it('reports the nearest blocker', () => {
    const shooter = arrow('a', 4, 1, 'up');
    const near = arrow('b', 2, 1, 'left');
    const far = arrow('c', 0, 1, 'up');
    assert.equal(getBlockingArrow([shooter, far, near], shooter), near);
  });

  it('detects head-on deadlocks from both sides', () => {
    const left = arrow('a', 0, 0, 'right');
    const right = arrow('b', 0, 1, 'left');
    assert.equal(canArrowEscape([left, right], left), false);
    assert.equal(canArrowEscape([left, right], right), false);
  });
});

describe('moveArrow', () => {
  it('removes a free arrow without mutating the input', () => {
    const a = arrow('a', 0, 0, 'up');
    const b = arrow('b', 1, 0, 'up');
    const arrows = [a, b];
    const result = moveArrow(arrows, a);
    assert.equal(result.moved, true);
    assert.deepEqual(result.arrows, [b]);
    assert.equal(arrows.length, 2);
  });

  it('refuses a blocked arrow and returns the blocker', () => {
    const a = arrow('a', 0, 0, 'up');
    const b = arrow('b', 1, 0, 'up');
    const result = moveArrow([a, b], b);
    assert.equal(result.moved, false);
    assert.equal(result.blocker, a);
    assert.equal(result.arrows.length, 2);
  });
});

describe('helpers', () => {
  it('measures escape distance to just past the edge', () => {
    assert.equal(getEscapeDistance(5, arrow('a', 0, 2, 'up')), 1);
    assert.equal(getEscapeDistance(5, arrow('a', 0, 2, 'down')), 5);
    assert.equal(getEscapeDistance(5, arrow('a', 3, 4, 'right')), 1);
    assert.equal(getEscapeDistance(5, arrow('a', 3, 4, 'left')), 5);
  });

  it('knows when the board is clear', () => {
    assert.equal(isLevelComplete([]), true);
    assert.equal(isLevelComplete([arrow('a', 0, 0, 'up')]), false);
  });

  it('lists only free arrows as valid moves', () => {
    const arrows = [arrow('a', 0, 0, 'right'), arrow('b', 0, 1, 'right'), arrow('c', 2, 2, 'down')];
    assert.deepEqual(getValidMoves(arrows).map((a) => a.id), ['b', 'c']);
  });

  it('hints the free arrow that unblocks the most', () => {
    const arrows = [
      arrow('a', 0, 0, 'right'),
      arrow('b', 1, 1, 'up'),
      arrow('c', 0, 1, 'right'),
      arrow('d', 3, 3, 'down'),
    ];
    assert.equal(getHintMove(arrows).id, 'c');
  });

  it('gives no hint when nothing can move', () => {
    assert.equal(getHintMove([arrow('a', 0, 0, 'right'), arrow('b', 0, 1, 'left')]), null);
    assert.equal(getHintMove([]), null);
  });
});
