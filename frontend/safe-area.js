(() => {
  const tg = window.Telegram?.WebApp;

  function applySafeTop() {
    const top = tg?.contentSafeAreaInset?.top ?? 0;
    document.documentElement.style.setProperty('--safe-top', `${top}px`);
  }

  tg?.onEvent?.('content_safe_area_changed', applySafeTop);
  tg?.requestContentSafeArea?.();
  applySafeTop();
})();

