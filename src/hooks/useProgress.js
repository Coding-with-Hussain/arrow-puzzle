import { useCallback, useEffect, useState } from 'react';
import {
  STORAGE_KEY,
  clearProgress,
  createDefaultProgress,
  loadProgress,
  recordLevelResult,
  saveProgress,
} from '../game/storage.js';

/** Persistent player progress and settings, synced to localStorage (and across tabs). */
export function useProgress(totalLevels) {
  const [progress, setProgress] = useState(() => loadProgress(totalLevels));

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setProgress(loadProgress(totalLevels));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [totalLevels]);

  const completeLevel = useCallback(
    ({ levelId, moves, stars }) =>
      setProgress((current) => recordLevelResult(current, { levelId, moves, stars, totalLevels })),
    [totalLevels],
  );

  const updateSettings = useCallback(
    (patch) => setProgress((current) => ({ ...current, settings: { ...current.settings, ...patch } })),
    [],
  );

  const resetProgress = useCallback(() => {
    clearProgress();
    setProgress((current) => ({ ...createDefaultProgress(), settings: current.settings }));
  }, []);

  return { progress, completeLevel, updateSettings, resetProgress };
}
