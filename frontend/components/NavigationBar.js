const e = React.createElement;

export function NavigationBar() {
  const isAdmin = window.__IS_ADMIN__;
  return e(
    'nav',
    { className: 'bottom-nav', 'aria-label': 'Основная навигация' },
    e(
      'a',
      { href: '/', className: 'nav-item active', 'aria-label': 'Доклады' },
      e('span', { className: 'icon', 'aria-hidden': true }, '🎤'),
      e('span', { className: 'label' }, 'Доклады')
    ),
    isAdmin &&
      e(
        'a',
        { href: '/stats', className: 'nav-item', 'aria-label': 'Статистика' },
        e('span', { className: 'icon', 'aria-hidden': true }, '📊'),
        e('span', { className: 'label' }, 'Статистика')
      ),
    isAdmin &&
      e(
        'a',
        { href: '/admin', className: 'nav-item', 'aria-label': 'Настройки' },
        e('span', { className: 'icon', 'aria-hidden': true }, '⚙️'),
        e('span', { className: 'label' }, 'Настройки')
      ),
    e(
      'a',
      { href: '/profile', className: 'nav-item', 'aria-label': 'Профиль' },
      e('span', { className: 'icon', 'aria-hidden': true }, '👤'),
      e('span', { className: 'label' }, 'Профиль')
    )
  );
}
