const e = React.createElement;
const { useEffect, useState } = React;

function ProfileApp() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    setUser(tg?.initDataUnsafe?.user || null);
    tg?.expand();
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
