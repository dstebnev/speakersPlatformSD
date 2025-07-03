export async function hideAdminLinks() {
  const tg = window.Telegram?.WebApp;
  const username = tg?.initDataUnsafe?.user?.username;
  let allowed = [];
  try {
    const res = await fetch('/api/admin-users');
    allowed = await res.json();
  } catch (e) {
    // ignore
  }
  if (!username || !allowed.includes(username)) {
    document.querySelectorAll('.admin-link').forEach(el => el.remove());
  }
}

hideAdminLinks();
