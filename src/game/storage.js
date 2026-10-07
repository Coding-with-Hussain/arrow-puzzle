export const STORAGE_KEY = 'arrowEscape_v1';

const DEFAULT_SETTINGS = Object.freeze({ sound: true, reducedMotion: false });

export function createDefaultProgress() {
  return {
    unlockedLevel: 1,
    completedLevels: [],
    bestScores: {},
    bestStars: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

function sanitizeScoreMap(value, totalLevels, isValidScore) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const clean = {};
  for (const [key, score] of Object.entries(value)) {
    const levelId = Number(key);
    if (isPositiveInteger(levelId) && levelId <= totalLevels && isValidScore(score)) clean[levelId] = score;
  }
  return clean;
}

/**
 * Turns anything read from storage into a well-formed progress object,
 * keeping whatever parts are still usable.
 */
export function sanitizeProgress(raw, totalLevels) {
  const progress = createDefaultProgress();
  if (!raw || typeof raw !== 'object') return progress;

  if (Array.isArray(raw.completedLevels)) {
    const unique = new Set(raw.completedLevels.filter((id) => isPositiveInteger(id) && id <= totalLevels));
    progress.completedLevels = [...unique].sort((a, b) => a - b);
  }

  progress.bestScores = sanitizeScoreMap(raw.bestScores, totalLevels, isPositiveInteger);
  progress.bestStars = sanitizeScoreMap(raw.bestStars, totalLevels, (stars) => [1, 2, 3].includes(stars));

  const highestCompleted = progress.completedLevels.at(-1) ?? 0;
  const storedUnlocked = isPositiveInteger(raw.unlockedLevel) ? raw.unlockedLevel : 1;
  progress.unlockedLevel = Math.min(totalLevels, Math.max(storedUnlocked, highestCompleted + 1));

  if (raw.settings && typeof raw.settings === 'object') {
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (typeof raw.settings[key] === 'boolean') progress.settings[key] = raw.settings[key];
    }
  }

  return progress;
}

function getStorage() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    const probe = `${STORAGE_KEY}__probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    // Private mode, disabled cookies or a sandboxed iframe: play on without saving.
    return null;
  }
}

export function loadProgress(totalLevels) {
  const storage = getStorage();
  if (!storage) return createDefaultProgress();
  try {
    const stored = storage.getItem(STORAGE_KEY);
    return sanitizeProgress(stored ? JSON.parse(stored) : null, totalLevels);
  } catch {
    return createDefaultProgress();
  }
}

export function saveProgress(progress) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else to do if storage refuses the delete.
  }
}

/** Pure update applied when a level is cleared. */
export function recordLevelResult(progress, { levelId, moves, stars, totalLevels }) {
  const previousBest = progress.bestScores[levelId];
  const previousStars = progress.bestStars[levelId] ?? 0;
  const completed = new Set(progress.completedLevels);
  completed.add(levelId);

  return {
    ...progress,
    completedLevels: [...completed].sort((a, b) => a - b),
    unlockedLevel: Math.min(totalLevels, Math.max(progress.unlockedLevel, levelId + 1)),
    bestScores: { ...progress.bestScores, [levelId]: previousBest ? Math.min(previousBest, moves) : moves },
    bestStars: { ...progress.bestStars, [levelId]: Math.max(previousStars, stars) },
  };
}
