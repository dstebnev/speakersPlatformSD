const e = React.createElement;
const { useEffect, useState } = React;
const tg = window.Telegram?.WebApp;

function updateSafeArea() {
  const safe = tg?.safeAreaInset;
  const contentSafe = tg?.contentSafeAreaInset;
  if (safe) {
    document.documentElement.style.setProperty('--safe-area-top', `${safe.top}px`);
    document.documentElement.style.setProperty('--safe-area-bottom', `${safe.bottom}px`);
  }
  if (contentSafe) {
    document.documentElement.style.setProperty('--content-safe-area-top', `${contentSafe.top}px`);
    document.documentElement.style.setProperty('--content-safe-area-bottom', `${contentSafe.bottom}px`);
  }
}

function ProfileApp() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    tg?.ready();
    const u = tg?.initDataUnsafe?.user || null;
    setUser(u);
    const cfg = window.APP_CONFIG || { mode: 'prod', admins: [] };
    setIsAdmin(cfg.mode === 'debug' || (u && cfg.admins.includes(u.username)));
    tg?.expand?.();
    tg?.requestFullscreen?.();
    tg?.disableVerticalSwipes?.();
    tg?.postEvent?.('web_app_setup_swipe_behavior', JSON.stringify({ allow_vertical_swipe: false }));
    tg?.requestSafeArea?.();
    tg?.requestContentSafeArea?.();
    updateSafeArea();
    tg?.onEvent?.('safeAreaChanged', updateSafeArea);
    tg?.onEvent?.('contentSafeAreaChanged', updateSafeArea);
    const bar = document.querySelector('.app-header__bar');
    if (bar) {
      const title = document.createElement('h1');
      title.className = 'app-header__title';
      title.textContent = 'Личный кабинет';
      bar.appendChild(title);
    }
  }, []);

  const handleClearCache = async () => {
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      if (window.caches) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      try {
        localStorage?.clear();
        sessionStorage?.clear();
      } catch (err) {}
      alert('Кэш сброшен');
    } catch (err) {
      alert('Не удалось сбросить кэш');
    }
  };

  if (!user) {
    return e('div', null, 'Информация о пользователе недоступна');
  }

  return e('div', null,
    e('div', null, `Имя: ${user.first_name} ${user.last_name || ''}`),
    e('div', null, `Username: @${user.username || ''}`),
    isAdmin && e('button', { onClick: handleClearCache }, 'Сбросить кэш')
  );
}

ReactDOM.createRoot(document.getElementById('profile-root')).render(e(ProfileApp));
