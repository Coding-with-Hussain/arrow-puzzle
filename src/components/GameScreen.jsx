import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTierForLevel } from '../data/tiers.js';
import { getStarRating } from '../game/scoring.js';
import { playSound } from '../game/sound.js';
import { validateLevel } from '../game/validator.js';
import { useGame } from '../hooks/useGame.js';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import CompletionModal from './CompletionModal.jsx';
import GameBoard from './GameBoard.jsx';
import GameControls from './GameControls.jsx';
import GameHeader from './GameHeader.jsx';
import { BackButton } from './ScreenHeader.jsx';

// A short beat after the last arrow leaves before the results appear.
const RESULTS_DELAY_MS = 260;

const ONBOARDING_TIPS = {
  1: 'Tap an arrow to send it off the board.',
  2: 'Each arrow only moves the way it points.',
  3: 'Blocked? Move the arrow in front first.',
};

function getMessage(game, levelId) {
  if (game.status === 'complete') return { tone: 'success', text: 'Board cleared!', key: 'done' };
  if (game.hint) return { tone: 'hint', text: '💡 Try this arrow first.', key: `h${game.hint.seq}` };
  if (game.bump) return { tone: 'blocked', text: 'Blocked! Clear its path first.', key: `b${game.bump.seq}` };
  if (game.moves === 0 && ONBOARDING_TIPS[levelId]) return { tone: 'info', text: ONBOARDING_TIPS[levelId], key: 'tip' };
  return null;
}

function GameSession({ level, isLastLevel, bestScore, reducedMotion, onBack, onNext, onLevels, onLevelComplete }) {
  const [result, setResult] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const resultsTimer = useRef(null);
  const latest = useRef({ bestScore, onLevelComplete });
  useEffect(() => {
    latest.current = { bestScore, onLevelComplete };
  });

  const handleEvent = useCallback(
    (name, detail) => {
      if (name === 'move') playSound('move', detail);
      else if (name === 'blocked') playSound('blocked');
      else if (name === 'hint') playSound('hint');
      else if (name === 'complete') {
        const { moves } = detail;
        const stars = getStarRating(moves, level.arrows.length);
        const previousBest = latest.current.bestScore ?? null;
        setResult({
          moves,
          stars,
          previousBest,
          best: previousBest == null ? moves : Math.min(previousBest, moves),
          isNewBest: previousBest == null || moves < previousBest,
        });
        latest.current.onLevelComplete({ levelId: level.id, moves, stars });
        playSound('complete');
        clearTimeout(resultsTimer.current);
        resultsTimer.current = setTimeout(() => setResultsOpen(true), RESULTS_DELAY_MS);
      }
    },
    [level],
  );

  useEffect(() => () => clearTimeout(resultsTimer.current), []);

  const game = useGame(level, { reducedMotion, onEvent: handleEvent });
  const { restart, undo, showHint, tapArrow } = game;

  const replay = useCallback(() => {
    clearTimeout(resultsTimer.current);
    setResultsOpen(false);
    setResult(null);
    restart();
  }, [restart]);

  useKeyboardShortcuts({ Escape: onBack, r: replay, u: undo, h: showHint }, !resultsOpen);

  const tier = getTierForLevel(level.id);
  const message = getMessage(game, level.id);

  return (
    <div className="screen game">
      <GameHeader
        level={level}
        tier={tier}
        moves={game.moves}
        remaining={game.remaining}
        best={bestScore}
        penaltySeq={game.penaltySeq}
        onBack={onBack}
      />

      <p className={`game-message${message ? ` game-message--${message.tone}` : ''}`} role="status">
        {message && <span key={message.key}>{message.text}</span>}
      </p>

      <div className="board-area">
        <GameBoard
          size={level.size}
          arrows={game.arrows}
          escaping={game.escaping}
          bump={game.bump}
          hint={game.hint}
          reducedMotion={reducedMotion}
          onTap={tapArrow}
          label={`Level ${level.id} board, ${level.size} by ${level.size}, ${game.remaining} arrows left`}
        />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {game.remaining === 0 ? 'All arrows escaped.' : `${game.remaining} arrows left.`}
      </p>

      <GameControls
        canUndo={game.canUndo}
        canHint={game.status === 'playing'}
        onUndo={undo}
        onRestart={replay}
        onHint={showHint}
      />
      <p className="shortcut-hint">
        <kbd>U</kbd> undo · <kbd>R</kbd> restart · <kbd>H</kbd> hint · <kbd>Esc</kbd> back
      </p>

      <CompletionModal
        open={resultsOpen}
        result={result}
        levelId={level.id}
        isLastLevel={isLastLevel}
        reducedMotion={reducedMotion}
        onNext={onNext}
        onRetry={replay}
        onLevels={onLevels}
      />
    </div>
  );
}

function LevelError({ onBack, onLevels }) {
  return (
    <div className="screen game">
      <header className="game-header">
        <BackButton onClick={onBack} />
      </header>
      <div className="level-error" role="alert">
        <h2>This level couldn’t be loaded</h2>
        <p>Its data looks damaged. Your progress is safe — pick another level to keep playing.</p>
        <button type="button" className="btn btn--primary" onClick={onLevels}>
          Back to levels
        </button>
      </div>
    </div>
  );
}

export default function GameScreen({ level, onBack, onLevels, ...sessionProps }) {
  const validation = useMemo(
    () => (level ? validateLevel(level) : { valid: false, errors: ['Level not found.'] }),
    [level],
  );

  useEffect(() => {
    if (!validation.valid) console.error(`[Arrow Escape] Level ${level?.id} is invalid:`, validation.errors);
  }, [validation, level]);

  if (!validation.valid) return <LevelError onBack={onBack} onLevels={onLevels} />;

  return <GameSession key={level.id} level={level} onBack={onBack} onLevels={onLevels} {...sessionProps} />;
}
