(() => {
  if (!('wakeLock' in navigator)) return;

  let wakeLockSentinel = null;

  async function requestWakeLock() {
    if (document.visibilityState !== 'visible') return;
    if (wakeLockSentinel && !wakeLockSentinel.released) return;
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    } catch (e) {}
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      requestWakeLock();
    }
  });

  ['pointerdown', 'keydown', 'click'].forEach(evt => {
    document.addEventListener(evt, requestWakeLock, { passive: true });
  });

  requestWakeLock();
})();
