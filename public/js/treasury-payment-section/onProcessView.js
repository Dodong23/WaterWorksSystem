// Lightweight onProcessView.js - ensures script exists and provides simple navigation helpers

(function(){
  function init() {
    // No-op for now; provides a safe hook for other scripts
    console.debug('[onProcessView] initialized');

    // Optional: handle anchor navigation for accounts/dashboard
    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  function handleHash() {
    const h = (location.hash || '').replace('#','');
    if (!h) return;
    // dispatch a custom event so other modules can react
    window.dispatchEvent(new CustomEvent('processView:navigate', { detail: { view: h } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
