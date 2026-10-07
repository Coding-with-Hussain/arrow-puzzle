import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback) {
  const media = window.matchMedia?.(QUERY);
  if (!media) return () => {};
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

const getSnapshot = () => window.matchMedia?.(QUERY).matches ?? false;
const getServerSnapshot = () => false;

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
