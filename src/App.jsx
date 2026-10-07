import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import GameScreen from './components/GameScreen.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import HowToPlay from './components/HowToPlay.jsx';
import LevelSelect from './components/LevelSelect.jsx';
import Settings from './components/Settings.jsx';
import { TOTAL_LEVELS, getLevel } from './data/levels.js';
import { playSound, setSoundEnabled, unlockAudio } from './game/sound.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion.js';
import { useProgress } from './hooks/useProgress.js';

const SCREENS = ['home', 'levels', 'game', 'settings', 'howto'];

/** The level the Play button should open: the next unbeaten one, or the last one played. */
function getPlayLevel(progress, lastPlayed) {
  const next = progress.unlockedLevel;
  return progress.completedLevels.includes(next) ? (lastPlayed ?? next) : next;
}

export default function App() {
  const { progress, completeLevel, updateSettings, resetProgress } = useProgress(TOTAL_LEVELS);
  const osPrefersReducedMotion = usePrefersReducedMotion();
  const reducedMotion = progress.settings.reducedMotion || osPrefersReducedMotion;

  const [screen, setScreen] = useState('home');
  const [currentLevelId, setCurrentLevelId] = useState(null);
  const mainRef = useRef(null);
  const isFirstScreen = useRef(true);

  useEffect(() => {
    setSoundEnabled(progress.settings.sound);
  }, [progress.settings.sound]);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
  }, [reducedMotion]);

  // Layout effect so it runs before child effects (e.g. Levels scrolling to the current level).
  useLayoutEffect(() => {
    document.body.dataset.screen = screen;
    if (isFirstScreen.current) {
      isFirstScreen.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [screen]);

  // Browsers only allow audio after a gesture, so wake the audio engine on the first one.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio, true);
    window.addEventListener('keydown', unlockAudio, true);
    return () => {
      window.removeEventListener('pointerdown', unlockAudio, true);
      window.removeEventListener('keydown', unlockAudio, true);
    };
  }, []);

  // Mirror screens into browser history so the phone's back gesture goes back a screen.
  useEffect(() => {
    window.history.replaceState({ screen: 'home' }, '');
    const onPopState = (event) => {
      const target = event.state?.screen;
      setScreen(SCREENS.includes(target) ? target : 'home');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((next, { replace = false } = {}) => {
    if (replace) window.history.replaceState({ screen: next }, '');
    else window.history.pushState({ screen: next }, '');
    setScreen(next);
  }, []);

  const goBack = useCallback(() => {
    playSound('click');
    if (window.history.state?.screen && window.history.state.screen !== 'home') window.history.back();
    else setScreen('home');
  }, []);

  useKeyboardShortcuts({ Escape: goBack }, screen === 'levels' || screen === 'howto');

  const openLevel = useCallback(
    (levelId, options) => {
      playSound('click');
      setCurrentLevelId(levelId);
      navigate('game', options);
    },
    [navigate],
  );

  const playLevelId = getPlayLevel(progress, currentLevelId);
  const currentLevel = currentLevelId ? getLevel(currentLevelId) : null;

  const handleNextLevel = useCallback(() => {
    playSound('click');
    setCurrentLevelId((id) => Math.min(TOTAL_LEVELS, id + 1));
  }, []);

  const openLevels = useCallback(() => {
    playSound('click');
    navigate('levels', { replace: screen !== 'home' });
  }, [navigate, screen]);

  const openScreen = (next) => () => {
    playSound('click');
    navigate(next);
  };

  let content;
  switch (screen) {
    case 'levels':
      content = (
        <LevelSelect totalLevels={TOTAL_LEVELS} progress={progress} onSelectLevel={openLevel} onBack={goBack} />
      );
      break;
    case 'game':
      content = (
        <GameScreen
          level={currentLevel}
          isLastLevel={currentLevelId === TOTAL_LEVELS}
          bestScore={currentLevelId ? progress.bestScores[currentLevelId] : undefined}
          reducedMotion={reducedMotion}
          onBack={goBack}
          onNext={handleNextLevel}
          onLevels={openLevels}
          onLevelComplete={completeLevel}
        />
      );
      break;
    case 'settings':
      content = (
        <Settings
          settings={progress.settings}
          osPrefersReducedMotion={osPrefersReducedMotion}
          hasProgress={progress.completedLevels.length > 0}
          onChange={updateSettings}
          onResetProgress={resetProgress}
          onBack={goBack}
        />
      );
      break;
    case 'howto':
      content = (
        <HowToPlay
          reducedMotion={reducedMotion}
          onPlay={() => openLevel(playLevelId, { replace: true })}
          onBack={goBack}
        />
      );
      break;
    default:
      content = (
        <HomeScreen
          playLevel={playLevelId}
          totalLevels={TOTAL_LEVELS}
          progress={progress}
          onPlay={() => openLevel(playLevelId)}
          onLevels={openScreen('levels')}
          onHowToPlay={openScreen('howto')}
          onSettings={openScreen('settings')}
        />
      );
  }

  return (
    <main className="app" ref={mainRef} tabIndex={-1} key={screen}>
      {content}
    </main>
  );
}
