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
    fail(event.message || 'Không tải được tài nguyên của minh họa.');
  }, true);
  window.addEventListener('unhandledrejection', () => fail('Minh họa gặp lỗi khi khởi tạo.'));
  document.addEventListener('webglcontextcreationerror', () => {
    // Candle supplies its own poster and retry controls when WebGL is unavailable.
    if (document.getElementById('scene')) return;
    fail('Trình duyệt chưa tạo được WebGL. Hãy bật tăng tốc đồ họa và thử lại.');
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
        fail('Chưa khởi tạo được vùng vẽ. Bạn có thể thử tải lại.');
        return;
      }
      // The existing candle viewer has its own actionable WebGL fallback.
      report('ready');
    }));
  });
})();
