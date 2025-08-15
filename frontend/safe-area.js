(() => {
  const tg = window.Telegram?.WebApp;

  function applySafeArea() {
    const safe = tg?.safeAreaInset || {};
    const contentSafe = tg?.contentSafeAreaInset || {};
    const top = contentSafe.top ?? safe.top ?? 0;
    const bottom = contentSafe.bottom ?? safe.bottom ?? 0;

    document.documentElement.style.setProperty(
      '--tg-content-safe-area-inset-top',
      `${top}px`
    );
    document.documentElement.style.setProperty(
      '--tg-content-safe-area-inset-bottom',
      `${bottom}px`
    );
    document.documentElement.style.setProperty(
      '--content-safe-area-top',
      `${contentSafe.top ?? 0}px`
    );
    document.documentElement.style.setProperty(
      '--content-safe-area-bottom',
      `${contentSafe.bottom ?? 0}px`
    );
    document.documentElement.style.setProperty(
      '--safe-area-top',
      `${safe.top ?? top}px`
    );
    document.documentElement.style.setProperty(
      '--safe-area-bottom',
      `${safe.bottom ?? bottom}px`
    );
    document.documentElement.style.setProperty(
      '--safe-top',
      `${top}px`
    );
  }

  tg?.onEvent?.('safeAreaChanged', applySafeArea);
  tg?.onEvent?.('safe_area_changed', applySafeArea);
  tg?.onEvent?.('contentSafeAreaChanged', applySafeArea);
  tg?.onEvent?.('content_safe_area_changed', applySafeArea);

  tg?.requestSafeArea?.();
  tg?.requestContentSafeArea?.();
  applySafeArea();
})();
