import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TOTAL_LEVELS, getLevel, levels } from '../src/data/levels.js';
import { DIFFICULTY_TIERS } from '../src/data/tiers.js';
import { canArrowEscape } from '../src/game/engine.js';
import { solveLevel } from '../src/game/solver.js';
import { validateLevel, validateLevels } from '../src/game/validator.js';

describe('level pack', () => {
  it('ships exactly 100 levels', () => {
    assert.equal(TOTAL_LEVELS, 100);
    assert.equal(getLevel(1).id, 1);
    assert.equal(getLevel(100).id, 100);
    assert.equal(getLevel(101), null);
  });

  it('passes validation as a whole', () => {
    const { valid, invalidLevels } = validateLevels(levels);
    assert.equal(valid, true, JSON.stringify(invalidLevels, null, 2));
  });

  it('can replay a full solution for every level', () => {
    for (const level of levels) {
      assert.equal(validateLevel(level).valid, true, `level ${level.id}`);
      let remaining = level.arrows;
      for (const id of solveLevel(level.arrows).order) {
        const arrow = remaining.find((a) => a.id === id);
        assert.ok(canArrowEscape(remaining, arrow), `level ${level.id}: ${id} blocked`);
        remaining = remaining.filter((a) => a.id !== id);
      }
      assert.equal(remaining.length, 0, `level ${level.id} not cleared`);
    }
  });

  it('follows the board-size progression', () => {
    for (const tier of DIFFICULTY_TIERS) {
      for (let id = tier.firstLevel; id <= tier.lastLevel; id += 1) {
        assert.equal(getLevel(id).size, tier.size, `level ${id}`);
      }
    }
  });

  it('gets busier as levels progress', () => {
    const average = (from, to) =>
      levels.slice(from - 1, to).reduce((sum, level) => sum + level.arrows.length, 0) / (to - from + 1);
    let previous = 0;
    for (const tier of DIFFICULTY_TIERS) {
      const current = average(tier.firstLevel, tier.lastLevel);
      assert.ok(current > previous, `${tier.name} should have more arrows than the tier before`);
      previous = current;
    }
  });
});
