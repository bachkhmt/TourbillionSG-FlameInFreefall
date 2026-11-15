// Shared lifecycle bridge for trusted, local Studio illustrations.
(() => {
  function report(state, detail = '') {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'studio-demo', state, detail }, location.origin);
    }
  }
  let failed = false;
  function fail(detail) {
    failed = true;
    report('error', detail);
  }
  window.addEventListener('error', (event) => {
    fail(event.message || 'Unable to load a simulation resource.');
  }, true);
  window.addEventListener('unhandledrejection', () => fail('The simulation encountered an initialization error.'));
  document.addEventListener('webglcontextcreationerror', () => {
    // Candle supplies its own poster and retry controls when WebGL is unavailable.
    if (document.getElementById('scene')) return;
    fail('The browser could not create a WebGL context. Enable hardware acceleration and try again.');
  }, true);
  window.addEventListener('load', () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (failed) return;
      const fallback = document.getElementById('fallback');
      if (fallback && !fallback.hidden) {
        report('ready');
        return;
      }
      const canvas = document.querySelector('canvas');
      if (!canvas || !canvas.width || !canvas.height) {
        fail('Unable to initialize the canvas. Please try reloading.');
        return;
      }
      // The existing candle viewer has its own actionable WebGL fallback.
      report('ready');
    }));
  });
})();
