const e = React.createElement;

export function Header({ onToggleFilters, filtersOpen }) {
  return e(
    'header',
    { className: 'main-header' },
    e('h1', null, 'Доклады'),
    e(
      'button',
      {
        onClick: onToggleFilters,
        'aria-pressed': filtersOpen,
        'aria-label': 'Показать фильтры',
      },
      'Фильтры'
    )
  );
}
