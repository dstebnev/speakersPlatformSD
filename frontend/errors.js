(function() {
  const cfg = window.APP_CONFIG || { mode: 'prod', admins: [] };
  const tg = window.Telegram?.WebApp;
  tg?.ready?.();
  const user = tg?.initDataUnsafe?.user;
  const isAdmin = window.__IS_ADMIN__ ?? (cfg.mode === 'debug' || (user && cfg.admins.includes(user.username)));
  if (!isAdmin) return;
  window.__IS_ADMIN__ = true;

  let container;
  function show(msg) {
    if (!container) {
      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.left = '0';
      container.style.right = '0';
      container.style.maxHeight = '40%';
      container.style.overflowY = 'auto';
      container.style.background = 'rgba(0,0,0,0.8)';
      container.style.color = '#fff';
      container.style.fontSize = '12px';
      container.style.padding = '8px';
      container.style.zIndex = '9999';
      container.style.fontFamily = 'monospace';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }
    const line = document.createElement('div');
    line.textContent = msg;
    container.appendChild(line);
  }

  window.addEventListener('error', event => {
    show(`Error: ${event.message}`);
  });

  window.addEventListener('unhandledrejection', event => {
    const msg = event.reason?.message || event.reason;
    show(`Promise rejection: ${msg}`);
  });

  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const res = await origFetch(...args);
      if (!res.ok) {
        show(`HTTP ${res.status} ${res.statusText}`);
      }
      return res;
    } catch (err) {
      show(`Fetch error: ${err.message}`);
      throw err;
    }
  };
})();
