import Icon from './Icon.jsx';

export function BackButton({ onClick, label = 'Back' }) {
  return (
    <button type="button" className="btn btn--ghost back-btn" onClick={onClick}>
      <Icon name="back" />
      {label}
    </button>
  );
}

export default function ScreenHeader({ title, titleId, onBack, end }) {
  return (
    <header className="screen-header">
      <BackButton onClick={onBack} />
      <h1 className="screen-header__title" id={titleId}>
        {title}
      </h1>
      <div className="screen-header__end">{end}</div>
    </header>
  );
}
