import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPotentialStars, getStarRating, getStarThresholds } from '../src/game/scoring.js';

describe('scoring', () => {
  it('gives three stars for a flawless clear and leaves slack', () => {
    for (const arrows of [3, 6, 10, 25, 40]) {
      assert.equal(getStarRating(arrows, arrows), 3);
      assert.equal(getStarRating(arrows + 1, arrows), 3);
    }
  });

  it('steps down as wasted moves pile up', () => {
    const { three, two } = getStarThresholds(12);
    assert.ok(two > three);
    assert.equal(getStarRating(three + 1, 12), 2);
    assert.equal(getStarRating(two, 12), 2);
    assert.equal(getStarRating(two + 1, 12), 1);
  });

  it('predicts the best reachable rating mid-level', () => {
    assert.equal(getPotentialStars(0, 10, 10), 3);
    const { two } = getStarThresholds(10);
    assert.equal(getPotentialStars(two, 1, 10), 1);
  });
});
