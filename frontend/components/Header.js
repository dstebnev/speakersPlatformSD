const e = React.createElement;

export function Header({ onToggleFilters, filtersOpen }) {
  return e(
    'header',
    { className: 'app-header app-header--plain' },
    e('div', { className: 'app-header__spacer', 'aria-hidden': 'true' }),
    e(
      'div',
      { className: 'app-header__bar' },
      e('h1', { className: 'app-header__title' }, 'Доклады'),
      e(
        'button',
        {
          onClick: onToggleFilters,
          'aria-pressed': filtersOpen,
          'aria-label': 'Показать фильтры',
        },
        'Фильтры'
      )
    )
  );
}
