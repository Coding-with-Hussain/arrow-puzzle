import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIFFICULTY_TIERS } from '../data/tiers.js';
import { MAX_STARS } from '../game/scoring.js';
import Icon from './Icon.jsx';
import LevelCard from './LevelCard.jsx';
import ScreenHeader from './ScreenHeader.jsx';

const DENIED_FEEDBACK_MS = 1800;

function getLevelState(levelId, progress, completedSet) {
  if (completedSet.has(levelId)) return 'completed';
  if (levelId > progress.unlockedLevel) return 'locked';
  return levelId === progress.unlockedLevel ? 'current' : 'available';
}

export default function LevelSelect({ totalLevels, progress, onSelectLevel, onBack }) {
  const [denied, setDenied] = useState(null);
  const gridRef = useRef(null);
  const deniedTimer = useRef(null);

  const completedSet = useMemo(() => new Set(progress.completedLevels), [progress.completedLevels]);
  const totalStars = Object.values(progress.bestStars).reduce((sum, stars) => sum + stars, 0);

  // Bring the level the player is up to into view.
  useEffect(() => {
    const current = gridRef.current?.querySelector('.is-current');
    if (current && current.getBoundingClientRect().bottom > window.innerHeight - 40) {
      current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, []);

  useEffect(() => () => clearTimeout(deniedTimer.current), []);

  const handleSelect = useCallback(
    (levelId, locked) => {
      if (!locked) {
        onSelectLevel(levelId);
        return;
      }
      clearTimeout(deniedTimer.current);
      setDenied((previous) => ({ levelId, key: (previous?.key ?? 0) + 1 }));
      deniedTimer.current = setTimeout(() => setDenied(null), DENIED_FEEDBACK_MS);
    },
    [onSelectLevel],
  );

  return (
    <div className="screen">
      <ScreenHeader
        title="Levels"
        onBack={onBack}
        end={
          <span className="levels-total">
            <Icon name="star" className="star" />
            {totalStars}/{totalLevels * MAX_STARS}
            <span className="visually-hidden"> stars collected</span>
          </span>
        }
      />

      <div ref={gridRef}>
        {DIFFICULTY_TIERS.filter((tier) => tier.firstLevel <= totalLevels).map((tier) => {
          const ids = [];
          for (let id = tier.firstLevel; id <= Math.min(tier.lastLevel, totalLevels); id += 1) ids.push(id);
          const cleared = ids.filter((id) => completedSet.has(id)).length;

          return (
            <section className="tier" key={tier.id} aria-labelledby={`tier-${tier.id}`}>
              <div className="tier__header">
                <h2 className="tier__name" id={`tier-${tier.id}`}>
                  {tier.name}
                </h2>
                <span className="tier__meta">
                  {tier.size}×{tier.size} · {cleared}/{ids.length}
                </span>
              </div>
              <ul className="level-grid">
                {ids.map((id) => (
                  <li key={id}>
                    <LevelCard
                      levelId={id}
                      state={getLevelState(id, progress, completedSet)}
                      stars={progress.bestStars[id] ?? 0}
                      deniedKey={denied?.levelId === id ? denied.key : 0}
                      onSelect={handleSelect}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {denied && (
        <p className="toast" role="status" key={denied.key}>
          Finish level {progress.unlockedLevel} to unlock more.
        </p>
      )}
    </div>
  );
}
