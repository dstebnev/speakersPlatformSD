const e = React.createElement;
const { useState, useEffect } = React;

const ALLOWED_USERS = ['admin'];

function AdminApp() {
  const [username, setUsername] = useState('');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user) {
      setUsername(user.username);
      setAuthorized(ALLOWED_USERS.includes(user.username));
    }
    tg?.expand();
  }, []);

  if (!authorized) {
    return e('div', null, 'Access denied for ', username || 'guest');
  }

  return e('div', null, 'Admin panel placeholder');
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(e(AdminApp));
