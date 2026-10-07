import { MAX_STARS } from '../game/scoring.js';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';

export default function HomeScreen({ playLevel, totalLevels, progress, onPlay, onLevels, onHowToPlay, onSettings }) {
  const cleared = progress.completedLevels.length;
  const totalStars = Object.values(progress.bestStars).reduce((sum, stars) => sum + stars, 0);
  const isNewPlayer = cleared === 0;

  return (
    <div className="screen home">
      <div className="home__hero">
        <Logo />
        <h1 className="wordmark">
          Arrow <span className="wordmark__accent">Escape</span>
        </h1>
        <p className="tagline">
          Clear the path.
          <br />
          Escape the board.
        </p>

        <div className="home__actions">
          <button
            type="button"
            className="btn btn--primary play-btn"
            onClick={onPlay}
            aria-label={isNewPlayer ? 'Play level 1' : `Play level ${playLevel}`}
          >
            <Icon name="play" />
            Play
            {!isNewPlayer && <span className="play-btn__level">Lv {playLevel}</span>}
          </button>
          <div className="home__row">
            <button type="button" className="btn" onClick={onLevels}>
              <Icon name="levels" />
              Levels
            </button>
            <button type="button" className="btn" onClick={onHowToPlay}>
              <Icon name="help" />
              How to Play
            </button>
          </div>
          <button type="button" className="btn btn--ghost home__settings" onClick={onSettings}>
            <Icon name="settings" />
            Settings
          </button>
        </div>

        {!isNewPlayer && (
          <p className="home__progress">
            <Icon name="star" className="star" />
            {totalStars}/{totalLevels * MAX_STARS} · {cleared} of {totalLevels} levels cleared
          </p>
        )}
      </div>

      <a className="home__more" href="#about">
        About the game
        <Icon name="down" />
      </a>
    </div>
  );
}
