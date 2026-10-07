import { memo, useEffect, useRef } from 'react';
import { isMotionReduced } from '../game/motion.js';
import Icon from './Icon.jsx';
import Stars from './Stars.jsx';

function describe(levelId, state, stars) {
  if (state === 'locked') return `Level ${levelId}, locked`;
  if (state === 'completed') return `Level ${levelId}, completed with ${stars} of 3 stars`;
  if (state === 'current') return `Level ${levelId}, next to play`;
  return `Level ${levelId}`;
}

const SHAKE = [0, -4, 4, -3, 0].map((x) => ({ transform: `translateX(${x}px)` }));

function LevelCard({ levelId, state, stars, deniedKey, onSelect }) {
  const buttonRef = useRef(null);
  const locked = state === 'locked';

  // Replays on every tap of a locked level, which a CSS class alone can't do.
  useEffect(() => {
    if (deniedKey && !isMotionReduced()) buttonRef.current?.animate?.(SHAKE, { duration: 280, easing: 'ease-out' });
  }, [deniedKey]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`level-card is-${state}`}
      aria-label={describe(levelId, state, stars)}
      aria-disabled={locked || undefined}
      aria-current={state === 'current' ? 'step' : undefined}
      onClick={() => onSelect(levelId, locked)}
    >
      {locked ? (
        <Icon name="lock" />
      ) : (
        <>
          <span className="level-card__number">{levelId}</span>
          {state === 'completed' && <Stars count={stars} decorative />}
        </>
      )}
      {state === 'completed' && (
        <span className="level-card__check" aria-hidden="true">
          <Icon name="check" />
        </span>
      )}
    </button>
  );
}

export default memo(LevelCard);
