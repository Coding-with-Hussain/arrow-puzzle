import { useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import ScreenHeader from './ScreenHeader.jsx';
import Toggle from './Toggle.jsx';

export default function Settings({ settings, osPrefersReducedMotion, hasProgress, onChange, onResetProgress, onBack }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useKeyboardShortcuts({ Escape: onBack }, !confirmOpen);

  const confirmReset = () => {
    onResetProgress();
    setConfirmOpen(false);
    setResetDone(true);
  };

  return (
    <div className="screen">
      <ScreenHeader title="Settings" onBack={onBack} />

      <div className="settings-list">
        <div className="setting">
          <span className="setting__icon">
            <Icon name="sound" />
          </span>
          <div className="setting__text">
            <p className="setting__label" id="setting-sound">
              Sound
            </p>
            <p className="setting__desc" id="setting-sound-desc">
              Taps, bumps and celebrations.
            </p>
          </div>
          <Toggle
            checked={settings.sound}
            onChange={(sound) => onChange({ sound })}
            labelledBy="setting-sound"
            describedBy="setting-sound-desc"
          />
        </div>

        <div className="setting">
          <span className="setting__icon">
            <Icon name="motion" />
          </span>
          <div className="setting__text">
            <p className="setting__label" id="setting-motion">
              Reduced Motion
            </p>
            <p className="setting__desc" id="setting-motion-desc">
              {osPrefersReducedMotion
                ? 'Your device asks for reduced motion, so it’s always on.'
                : 'Calmer animations, no confetti or shaking.'}
            </p>
          </div>
          <Toggle
            checked={settings.reducedMotion || osPrefersReducedMotion}
            onChange={(reducedMotion) => onChange({ reducedMotion })}
            labelledBy="setting-motion"
            describedBy="setting-motion-desc"
            disabled={osPrefersReducedMotion}
          />
        </div>

        <div className="setting">
          <span className="setting__icon setting__icon--danger">
            <Icon name="trash" />
          </span>
          <div className="setting__text">
            <p className="setting__label">Reset Progress</p>
            <p className="setting__desc" role="status">
              {resetDone ? 'Progress cleared. Back to level 1!' : 'Clears levels, stars and best scores.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setConfirmOpen(true)}
            disabled={!hasProgress}
          >
            Reset
          </button>
        </div>
      </div>

      <p className="settings-footer">
        Arrow Escape · Progress is saved on this device only.
        <br />
        No account, no tracking.
      </p>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        labelledBy="reset-title"
        describedBy="reset-desc"
      >
        <div className="modal__body">
          <h2 className="modal__title" id="reset-title">
            Reset all progress?
          </h2>
          <p className="modal__text" id="reset-desc">
            This clears every completed level, star and best score. It can’t be undone.
          </p>
          <div className="modal__actions modal__row">
            <button type="button" className="btn" onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={confirmReset}>
              Reset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
