import { useCallback, useMemo, useState } from 'react';
import { decodeLevel } from '../game/levelFormat.js';
import { playSound } from '../game/sound.js';
import { useGame } from '../hooks/useGame.js';
import GameBoard from './GameBoard.jsx';
import Icon from './Icon.jsx';
import ScreenHeader from './ScreenHeader.jsx';

const STEPS = [
  {
    title: 'Tap an arrow',
    text: 'Tap any arrow to slide it off the board.',
    rows: ['...', '.>.', '...'],
    prompt: 'Go on — tap it!',
    success: 'Nice! It escaped.',
  },
  {
    title: 'One way only',
    text: 'An arrow can only move in the direction it points.',
    rows: ['^..', '..>', '.v.'],
    prompt: 'Send all three out.',
    success: 'Each one took its own exit.',
  },
  {
    title: 'Blocked arrows wait',
    text: 'If another arrow is in the way, it can’t move. Clear its path first.',
    rows: ['.v.', '...', '.<.'],
    prompt: 'Try the top arrow first.',
    success: 'That’s the trick: clear the way first.',
  },
  {
    title: 'Clear every arrow',
    text: 'Empty the board to win. Fewer moves earn more stars.',
    rows: ['>v.', '..<', '^..'],
    prompt: 'Find the right order.',
    success: 'Board cleared — you’ve got it!',
  },
];

const TIPS = [
  { icon: 'bump', text: 'Bumping a blocked arrow costs a move.' },
  { icon: 'hint', text: 'Stuck? A hint shows a free arrow for +1 move.' },
  { icon: 'star', text: 'Finish in fewer moves to earn three stars.' },
];

const handleDemoEvent = (name, detail) => {
  if (name === 'move') playSound('move', detail);
  else if (name === 'blocked') playSound('blocked');
  else if (name === 'complete') playSound('complete');
};

function Demo({ step, reducedMotion, onReset }) {
  const level = useMemo(() => decodeLevel(0, step.rows), [step]);
  const game = useGame(level, { reducedMotion, onEvent: handleDemoEvent });
  const solved = game.status === 'complete';

  let message = { tone: 'info', text: step.prompt };
  if (solved) message = { tone: 'success', text: step.success };
  else if (game.bump) message = { tone: 'blocked', text: 'Blocked! Clear the way first.' };

  return (
    <div className="howto-demo">
      <GameBoard
        className="board--demo"
        size={level.size}
        arrows={game.arrows}
        escaping={game.escaping}
        bump={game.bump}
        hint={null}
        reducedMotion={reducedMotion}
        onTap={game.tapArrow}
        label={`Practice board, ${game.remaining} arrows left`}
      />
      <p className={`game-message game-message--${message.tone}`} role="status">
        <span key={message.text}>{message.text}</span>
      </p>
      {solved && (
        <button type="button" className="btn btn--ghost howto-demo__reset" onClick={onReset}>
          <Icon name="restart" />
          Try again
        </button>
      )}
    </div>
  );
}

export default function HowToPlay({ reducedMotion, onPlay, onBack }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [demoRun, setDemoRun] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const goTo = useCallback((index) => {
    playSound('click');
    setStepIndex(index);
    setDemoRun(0);
  }, []);

  return (
    <div className="screen">
      <ScreenHeader title="How to Play" onBack={onBack} />

      <section className="howto-card" aria-labelledby="howto-step-title">
        <div className="step-dots" aria-hidden="true">
          {STEPS.map((s, index) => (
            <span
              key={s.title}
              className={`step-dot${index === stepIndex ? ' is-active' : ''}${index < stepIndex ? ' is-done' : ''}`}
            />
          ))}
        </div>
        <p className="howto-step__count">
          Step {stepIndex + 1} of {STEPS.length}
        </p>
        <h2 className="howto-step__title" id="howto-step-title">
          {step.title}
        </h2>
        <p className="howto-step__text">{step.text}</p>

        <Demo
          key={`${stepIndex}-${demoRun}`}
          step={step}
          reducedMotion={reducedMotion}
          onReset={() => setDemoRun((run) => run + 1)}
        />

        <div className="howto-nav">
          <button type="button" className="btn" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0}>
            <Icon name="back" />
            Back
          </button>
          {isLast ? (
            <button type="button" className="btn btn--primary" onClick={onPlay}>
              Play
              <Icon name="play" />
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => goTo(stepIndex + 1)}>
              Next
              <Icon name="forward" />
            </button>
          )}
        </div>
      </section>

      <ul className="howto-tips">
        {TIPS.map((tip) => (
          <li key={tip.text}>
            <Icon name={tip.icon} />
            {tip.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
