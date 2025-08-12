import { TalkCard } from './components/TalkCard.js';
import { FilterPanel } from './components/FilterPanel.js';
import { NavigationBar } from './components/NavigationBar.js';
import { Header } from './components/Header.js';
import { BottomSheet } from './components/BottomSheet.js';
import { useTalkData } from './hooks/useTalkData.js';

const e = React.createElement;
const { useState, useEffect } = React;

const sheetRoot = ReactDOM.createRoot(document.getElementById('bottom-sheet-root'));
const navRoot = ReactDOM.createRoot(document.getElementById('nav-root'));

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
  const [viewMode, setViewMode] = useState('list');
  const [selectedTalk, setSelectedTalk] = useState(null);

  const { upcoming, past, speakers, loading, error } = useTalkData(filters);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const theme = tg?.themeParams || {};
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => root.style.setProperty(`--tg-${k}`, v));
  }, []);

  useEffect(() => {
    navRoot.render(e(NavigationBar));
  }, []);

  const getSpeakers = talk =>
    speakers.filter(s => (talk?.speakerIds || []).includes(s.id));

  useEffect(() => {
    sheetRoot.render(
      selectedTalk
        ? e(BottomSheet, {
            talk: selectedTalk,
            speakers: getSpeakers(selectedTalk),
          })
        : null
    );
  }, [selectedTalk, speakers]);

  const activeFilters = [];
  if (filters.query) activeFilters.push(`Название: ${filters.query}`);
  if (filters.speaker) activeFilters.push(`Спикер: ${filters.speaker}`);
  if (filters.direction !== 'all') activeFilters.push(`Направление: ${filters.direction}`);
  if (filters.status !== 'all') activeFilters.push(`Статус: ${filters.status}`);
  if (filters.from) activeFilters.push(`С ${filters.from}`);
  if (filters.to) activeFilters.push(`По ${filters.to}`);

  return e(
    'div',
    null,
    e(Header, {
      onToggleFilters: () => setShowFilters(!showFilters),
      filtersOpen: showFilters,
      viewMode,
      onViewChange: setViewMode,
    }),
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
          null,
          e(
            'section',
            null,
            e('h2', null, 'Будущие'),
            upcoming.length === 0
              ? e('p', null, 'Нет докладов')
              : viewMode === 'list'
              ? e(
                  'div',
                  { className: 'talk-list' },
                  upcoming.map(t =>
                    e(TalkCard, {
                      key: t.id,
                      talk: t,
                      speakers: getSpeakers(t),
                      onSelect: setSelectedTalk,
                    })
                  )
                )
              : e(
                  'div',
                  { className: 'card-grid' },
                  upcoming.map(t =>
                    e(TalkCard, {
                      key: t.id,
                      talk: t,
                      speakers: getSpeakers(t),
                      onSelect: setSelectedTalk,
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
              : viewMode === 'list'
              ? e(
                  'div',
                  { className: 'talk-list past' },
                  past.map(t =>
                    e(TalkCard, {
                      key: t.id,
                      talk: t,
                      speakers: getSpeakers(t),
                      onSelect: setSelectedTalk,
                    })
                  )
                )
              : e(
                  'div',
                  { className: 'card-grid past' },
                  past.map(t =>
                    e(TalkCard, {
                      key: t.id,
                      talk: t,
                      speakers: getSpeakers(t),
                      onSelect: setSelectedTalk,
                    })
                  )
                )
          )
        )
  );
}

// Expand the Telegram WebApp on mobile if running inside Telegram
const tryExpand = () => {
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
};
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', tryExpand);
} else {
  tryExpand();
}

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
