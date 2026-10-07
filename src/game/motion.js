/** Whether the app is currently in reduced-motion mode (player setting or OS preference). */
export function isMotionReduced() {
  return globalThis.document?.documentElement.dataset.motion === 'reduced';
}
