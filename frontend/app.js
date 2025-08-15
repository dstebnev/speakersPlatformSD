import { TalkCard } from './components/TalkCard.js';
import { FilterPanel } from './components/FilterPanel.js';
import { NavigationBar } from './components/NavigationBar.js';
import { Header } from './components/Header.js'; // app-header layout
import { useTalkData } from './hooks/useTalkData.js';

const e = React.createElement;
const { useState, useEffect } = React;

const tg = window.Telegram?.WebApp;

function applyContentSafeArea() {
  const top = tg?.contentSafeAreaInset?.top ?? 0;
  const bottom = tg?.contentSafeAreaInset?.bottom ?? 0;
  document.documentElement.style.setProperty(
    '--tg-content-safe-area-inset-top',
    `${top}px`
  );
  document.documentElement.style.setProperty(
    '--tg-content-safe-area-inset-bottom',
    `${bottom}px`
  );
}

function App() {
  const [filters, setFilters] = useState({
    direction: 'all',
    status: 'all',
    query: '',
    speaker: '',
    from: '',
    to: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [openedId, setOpenedId] = useState(null);

  const { upcoming, past, speakers, loading, error } = useTalkData(filters);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const theme = tg?.themeParams || {};
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => root.style.setProperty(`--tg-${k}`, v));
  }, []);

  const getSpeakers = talk =>
    speakers.filter(s => (talk?.speakerIds || []).includes(s.id));

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') setOpenedId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setOpenedId(null), [filters]);

  const activeFilters = [];
  if (filters.query) activeFilters.push(`Название: ${filters.query}`);
  if (filters.speaker) activeFilters.push(`Спикер: ${filters.speaker}`);
  if (filters.direction !== 'all') activeFilters.push(`Направление: ${filters.direction}`);
  if (filters.status !== 'all') activeFilters.push(`Статус: ${filters.status}`);
  if (filters.from) activeFilters.push(`С ${filters.from}`);
  if (filters.to) activeFilters.push(`По ${filters.to}`);

  return e(
    'div',
    { className: 'talks-page' },
    e(Header, {
      onToggleFilters: () => setShowFilters(!showFilters),
      filtersOpen: showFilters,
    }),
    e(
      'div',
      { className: 'talks-scroll' },
      e(FilterPanel, { filters, onChange: setFilters, visible: showFilters }),
      activeFilters.length > 0 &&
        e(
          'div',
          { className: 'active-filters' },
          activeFilters.map((f, i) => e('span', { key: i }, f))
        ),
      loading
        ? e('div', { className: 'loader', 'aria-live': 'polite' })
        : error
        ? e('div', { className: 'error' }, error)
        : e(
            'main',
            { className: 'talks-container' },
            e(
              'section',
              null,
              e('h2', null, 'Будущие'),
              upcoming.length === 0
                ? e('p', null, 'Нет докладов')
                : e(
                    'div',
                    { className: 'talk-list' },
                    upcoming.map(t =>
                      e(TalkCard, {
                        key: t.id,
                        talk: t,
                        speakers: getSpeakers(t),
                        isOpen: openedId === t.id,
                        onToggle: id =>
                          setOpenedId(prev => (prev === id ? null : id)),
                      })
                    )
                  )
            ),
            e(
              'section',
              null,
              e('h2', null, 'Прошедшие'),
              past.length === 0
                ? e('p', null, 'Нет докладов')
                : e(
                    'div',
                    { className: 'talk-list past' },
                    past.map(t =>
                      e(TalkCard, {
                        key: t.id,
                        talk: t,
                        speakers: getSpeakers(t),
                        isOpen: openedId === t.id,
                        onToggle: id =>
                          setOpenedId(prev => (prev === id ? null : id)),
                      })
                    )
                  )
            )
          )
    ),
    e('footer', null, e(NavigationBar))
  );
}

// Раскрываем мини-приложение, переводим его в полноэкранный режим и отключаем вертикальные свайпы
const tryExpand = () => {
  if (!tg) return;
  tg.ready();
  // Разворачиваем приложение на мобильных устройствах
  tg.expand?.();
  // Запрашиваем полноэкранный режим (Bot API 8.0+)
  if (typeof tg.requestFullscreen === 'function') {
    tg.requestFullscreen();
    // Настраиваем цвет заголовка для контрастности (при необходимости)
    tg.setHeaderColor?.('#FFFFFF');
  }
  // Отключаем вертикальные свайпы, чтобы приложение не сворачивалось при прокрутке
  if (typeof tg.disableVerticalSwipes === 'function') {
    tg.disableVerticalSwipes();
  } else if (typeof tg.postEvent === 'function') {
    // Новый вариант API — web_app_setup_swipe_behavior
    tg.postEvent('web_app_setup_swipe_behavior', JSON.stringify({ allow_vertical_swipe: false }));
  }
  tg.requestContentSafeArea?.();
  applyContentSafeArea();
};
// Инициализируем при загрузке
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', tryExpand);
} else {
  tryExpand();
}
tg?.onEvent?.('contentSafeAreaChanged', applyContentSafeArea);
tg?.onEvent?.('content_safe_area_changed', applyContentSafeArea);

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
