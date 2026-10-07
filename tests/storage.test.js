import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  STORAGE_KEY,
  clearProgress,
  createDefaultProgress,
  loadProgress,
  recordLevelResult,
  sanitizeProgress,
  saveProgress,
} from '../src/game/storage.js';

class MemoryStorage {
  constructor() {
    this.data = new Map();
  }
  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }
  setItem(key, value) {
    this.data.set(key, String(value));
  }
  removeItem(key) {
    this.data.delete(key);
  }
}

function useStorage(storage) {
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true });
}

afterEach(() => {
  delete globalThis.localStorage;
});

describe('storage', () => {
  it('round-trips progress', () => {
    useStorage(new MemoryStorage());
    const progress = { ...createDefaultProgress(), unlockedLevel: 4, completedLevels: [1, 2, 3], bestScores: { 1: 3 } };
    assert.equal(saveProgress(progress), true);
    assert.deepEqual(loadProgress(100), { ...progress, bestStars: {} });
  });

  it('falls back to defaults on corrupted JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    useStorage(storage);
    assert.deepEqual(loadProgress(100), createDefaultProgress());
  });

  it('keeps playing when localStorage throws', () => {
    useStorage({
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('denied');
      },
      removeItem() {
        throw new Error('denied');
      },
    });
    assert.deepEqual(loadProgress(100), createDefaultProgress());
    assert.equal(saveProgress(createDefaultProgress()), false);
    assert.doesNotThrow(() => clearProgress());
  });

  it('works with no localStorage at all', () => {
    assert.deepEqual(loadProgress(100), createDefaultProgress());
    assert.equal(saveProgress(createDefaultProgress()), false);
  });

  it('sanitizes tampered data', () => {
    const progress = sanitizeProgress(
      {
        unlockedLevel: 999,
        completedLevels: [1, 1, 2, 'x', -4, 500],
        bestScores: { 1: 5, 2: -1, abc: 3, 101: 4 },
        bestStars: { 1: 3, 2: 7 },
        settings: { sound: 'yes', reducedMotion: true },
      },
      100,
    );
    assert.equal(progress.unlockedLevel, 100);
    assert.deepEqual(progress.completedLevels, [1, 2]);
    assert.deepEqual(progress.bestScores, { 1: 5 });
    assert.deepEqual(progress.bestStars, { 1: 3 });
    assert.deepEqual(progress.settings, { sound: true, reducedMotion: true });
  });

  it('never lets unlocked fall behind completed levels', () => {
    assert.equal(sanitizeProgress({ unlockedLevel: 1, completedLevels: [1, 2, 3] }, 100).unlockedLevel, 4);
  });
});

describe('recordLevelResult', () => {
  it('unlocks the next level and keeps the best results', () => {
    let progress = createDefaultProgress();
    progress = recordLevelResult(progress, { levelId: 1, moves: 6, stars: 2, totalLevels: 100 });
    assert.equal(progress.unlockedLevel, 2);
    progress = recordLevelResult(progress, { levelId: 1, moves: 4, stars: 3, totalLevels: 100 });
    progress = recordLevelResult(progress, { levelId: 1, moves: 9, stars: 1, totalLevels: 100 });
    assert.equal(progress.bestScores[1], 4);
    assert.equal(progress.bestStars[1], 3);
    assert.deepEqual(progress.completedLevels, [1]);
  });

  it('does not re-lock levels when replaying an early one', () => {
    let progress = { ...createDefaultProgress(), unlockedLevel: 10 };
    progress = recordLevelResult(progress, { levelId: 2, moves: 4, stars: 3, totalLevels: 100 });
    assert.equal(progress.unlockedLevel, 10);
  });

  it('caps unlocking at the last level', () => {
    const progress = recordLevelResult(
      { ...createDefaultProgress(), unlockedLevel: 100 },
      { levelId: 100, moves: 40, stars: 3, totalLevels: 100 },
    );
    assert.equal(progress.unlockedLevel, 100);
    assert.deepEqual(progress.completedLevels, [100]);
  });
});
