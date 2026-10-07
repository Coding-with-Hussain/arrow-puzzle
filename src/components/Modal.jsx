import { useEffect, useRef } from 'react';

/**
 * Thin wrapper over the native <dialog>, which provides focus trapping,
 * Escape handling and an inert background for free.
 */
export default function Modal({ open, onClose, labelledBy, describedBy, className = '', children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleCancel = (event) => {
    event.preventDefault();
    onClose?.();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${className}`}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={handleCancel}
    >
      {open && children}
    </dialog>
  );
}
