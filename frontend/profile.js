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
  useEffect(() => {
    tg?.ready();
    setUser(tg?.initDataUnsafe?.user || null);
    tg?.expand?.();
    tg?.requestFullscreen?.();
    tg?.disableVerticalSwipes?.();
    tg?.postEvent?.('web_app_setup_swipe_behavior', JSON.stringify({ allow_vertical_swipe: false }));
    tg?.requestSafeArea?.();
    tg?.requestContentSafeArea?.();
    updateSafeArea();
    tg?.onEvent?.('safeAreaChanged', updateSafeArea);
    tg?.onEvent?.('contentSafeAreaChanged', updateSafeArea);
  }, []);

  if (!user) {
    return e('div', null, 'Информация о пользователе недоступна');
  }

  return e('div', null,
    e('h2', null, 'Личный кабинет'),
    e('div', null, `Имя: ${user.first_name} ${user.last_name || ''}`),
    e('div', null, `Username: @${user.username || ''}`)
  );
}

ReactDOM.createRoot(document.getElementById('profile-root')).render(e(ProfileApp));
