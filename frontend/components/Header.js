const e = React.createElement;

export function Header({ onToggleFilters, filtersOpen, viewMode, onViewChange }) {
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
    ),
    e(
      'div',
      { className: 'view-switch' },
      e('span', null, viewMode === 'list' ? 'Список' : 'Карточки'),
      e(
        'label',
        { className: 'switch' },
        e('input', {
          type: 'checkbox',
          checked: viewMode === 'list',
          onChange: () => onViewChange(viewMode === 'list' ? 'cards' : 'list'),
          'aria-label': 'Переключить вид',
        }),
        e('span', { className: 'slider' })
      )
    )
  );
}
