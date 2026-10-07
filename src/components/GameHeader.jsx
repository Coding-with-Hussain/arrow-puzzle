import { getPotentialStars, getStarThresholds } from '../game/scoring.js';
import { BackButton } from './ScreenHeader.jsx';
import Stars from './Stars.jsx';

export default function GameHeader({ level, tier, moves, remaining, best, penaltySeq, onBack }) {
  const totalArrows = level.arrows.length;
  const potentialStars = getPotentialStars(moves, remaining, totalArrows);
  const { three } = getStarThresholds(totalArrows);

  return (
    <>
      <header className="game-header">
        <BackButton onClick={onBack} />
        <div className="level-info">
          <h1 className="level-info__title">Level {level.id}</h1>
          <p className="level-info__tier">
            {tier.name} · {level.size}×{level.size}
          </p>
        </div>
      </header>

      <div className="game-stats">
        <div className="stat">
          <span className="stat__label" id="moves-label">
            Moves
          </span>
          <span className="stat__value" aria-labelledby="moves-label">
            {moves}
            {penaltySeq > 0 && (
              <span key={penaltySeq} className="stat__penalty" aria-hidden="true">
                +1
              </span>
            )}
          </span>
        </div>
        <Stars
          count={potentialStars}
          className="game-stats__stars"
          label={`On track for ${potentialStars} of 3 stars. Three stars at ${three} moves or fewer.`}
        />
        <div className="stat stat--end">
          <span className="stat__label">Best</span>
          <span className={`stat__value${best ? '' : ' stat__value--muted'}`}>{best ?? '–'}</span>
        </div>
      </div>
    </>
  );
}
