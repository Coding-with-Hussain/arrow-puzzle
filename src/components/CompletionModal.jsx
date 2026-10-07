import { useEffect } from 'react';
import { getPraise } from '../game/scoring.js';
import { playSound } from '../game/sound.js';
import Confetti from './Confetti.jsx';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';

const STAR_INTERVAL_MS = 150;
const FIRST_STAR_DELAY_MS = 180;

export default function CompletionModal({ open, result, levelId, isLastLevel, reducedMotion, onNext, onRetry, onLevels }) {
  const stars = result?.stars ?? 0;

  useEffect(() => {
    if (!open || stars === 0) return undefined;
    const timers = Array.from({ length: stars }, (_, index) =>
      setTimeout(() => playSound('star', { index }), FIRST_STAR_DELAY_MS + index * STAR_INTERVAL_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [open, stars]);

  return (
    <Modal open={open && Boolean(result)} onClose={onLevels} labelledBy="complete-title" className="complete">
      {result && (
        <div className="modal__body">
          {!reducedMotion && <Confetti />}
          <p className="complete__eyebrow">Level {levelId}</p>
          <h2 className="complete__title" id="complete-title">
            {isLastLevel ? 'You escaped them all!' : 'Level Complete!'}
          </h2>

          <div className="complete__stars" role="img" aria-label={`${stars} of 3 stars`}>
            {[0, 1, 2].map((index) => (
              <svg
                key={index}
                className={`complete__star${index < stars ? ' is-filled' : ''}`}
                style={{ '--i': index }}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 2.8l2.75 5.6 6.15.9-4.45 4.35 1.05 6.12L12 16.87l-5.5 2.9 1.05-6.12L3.1 9.3l6.15-.9z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </div>
          <p className="complete__praise">{getPraise(stars)}</p>

          <div className="complete__stats">
            <div className="complete__stat">
              <div className="stat__label">Moves</div>
              <div className="stat__value">{result.moves}</div>
            </div>
            <div className="complete__stat">
              <div className="stat__label">Best</div>
              <div className="stat__value">{result.best}</div>
            </div>
          </div>
          {result.isNewBest && result.previousBest != null && <p className="new-best">New best!</p>}
          {isLastLevel && <p className="complete__finale">All 100 levels cleared. Replay any level to chase three stars.</p>}

          <div className="modal__actions">
            {!isLastLevel && (
              <button type="button" className="btn btn--primary btn--lg" onClick={onNext}>
                Next Level
                <Icon name="forward" />
              </button>
            )}
            <div className="modal__row">
              <button type="button" className="btn" onClick={onRetry}>
                <Icon name="restart" />
                Retry
              </button>
              <button type="button" className="btn" onClick={onLevels}>
                <Icon name="levels" />
                Levels
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
