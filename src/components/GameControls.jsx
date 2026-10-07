import Icon from './Icon.jsx';

export default function GameControls({ canUndo, canHint, onUndo, onRestart, onHint }) {
  return (
    <div className="game-controls">
      <button
        type="button"
        className="btn control-btn"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last move"
        aria-keyshortcuts="U"
      >
        <Icon name="undo" />
        Undo
      </button>
      <button
        type="button"
        className="btn control-btn"
        onClick={onRestart}
        aria-label="Restart level"
        aria-keyshortcuts="R"
      >
        <Icon name="restart" />
        Restart
      </button>
      <button
        type="button"
        className="btn control-btn"
        onClick={onHint}
        disabled={!canHint}
        aria-label="Show a hint (costs one move)"
        aria-keyshortcuts="H"
      >
        <Icon name="hint" />
        Hint
        <span className="control-btn__badge" aria-hidden="true">
          +1
        </span>
      </button>
    </div>
  );
}
