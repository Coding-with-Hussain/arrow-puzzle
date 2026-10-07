import { MAX_STARS } from '../game/scoring.js';
import Icon from './Icon.jsx';

export default function Stars({ count, label, decorative = false, className = '' }) {
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': label ?? `${count} of ${MAX_STARS} stars` };
  return (
    <span className={`stars ${className}`} {...a11y}>
      {Array.from({ length: MAX_STARS }, (_, index) => (
        <Icon key={index} name="star" className={`star${index < count ? ' is-filled' : ''}`} />
      ))}
    </span>
  );
}
