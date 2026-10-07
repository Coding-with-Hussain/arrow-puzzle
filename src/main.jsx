import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { levels } from './data/levels.js';
import { validateLevels } from './game/validator.js';
import './styles/variables.css';
import './styles/global.css';
import './styles/game.css';
import './styles/screens.css';
import './styles/responsive.css';

if (import.meta.env.DEV) {
  const { invalidLevels } = validateLevels(levels);
  invalidLevels.forEach(({ id, errors }) => console.error(`[Arrow Escape] Level ${id} is invalid:`, errors));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('[Arrow Escape] Offline support unavailable:', error);
    });
  });
}
