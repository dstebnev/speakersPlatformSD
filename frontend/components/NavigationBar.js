const e = React.createElement;

export function NavigationBar() {
  const isAdmin = window.__IS_ADMIN__;
  return e(
    'nav',
    { className: 'bottom-nav', 'aria-label': 'Основная навигация' },
    e(
      'a',
      {
        href: '/',
        className: 'nav-item active',
        'aria-label': 'Доклады',
        title: 'Доклады',
      },
      e('span', { className: 'icon', 'aria-hidden': true }, '🎤')
    ),
    isAdmin &&
      e(
        'a',
        {
          href: '/stats',
          className: 'nav-item',
          'aria-label': 'Статистика',
          title: 'Статистика',
        },
        e('span', { className: 'icon', 'aria-hidden': true }, '📊')
      ),
    isAdmin &&
      e(
        'a',
        {
          href: '/admin',
          className: 'nav-item',
          'aria-label': 'Настройки',
          title: 'Настройки',
        },
        e('span', { className: 'icon', 'aria-hidden': true }, '⚙️')
      ),
    e(
      'a',
      {
        href: '/profile',
        className: 'nav-item',
        'aria-label': 'Профиль',
        title: 'Профиль',
      },
      e('span', { className: 'icon', 'aria-hidden': true }, '👤')
    )
  );
}
