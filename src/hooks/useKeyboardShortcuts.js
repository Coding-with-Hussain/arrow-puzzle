import { useEffect, useRef } from 'react';

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Binds single-key shortcuts (e.g. { Escape: goBack, r: restart }).
 * Ignores keys with modifiers and keys typed into form fields.
 */
export function useKeyboardShortcuts(bindings, enabled = true) {
  const bindingsRef = useRef(bindings);
  useEffect(() => {
    bindingsRef.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const handler = bindingsRef.current[key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
