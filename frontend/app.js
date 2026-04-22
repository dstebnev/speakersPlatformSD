import { BottomNav } from './components/BottomNav.js';
import { ActivitiesPage } from './pages/ActivitiesPage.js';
import { StatsPage } from './pages/StatsPage.js';
import { SpeakersPage } from './pages/SpeakersPage.js';
import { AdminPage } from './pages/AdminPage.js';

const e = React.createElement;
const { useState } = React;

const BASE_PAGES = [
  { id: 'activities', label: 'Активности' },
  { id: 'speakers',   label: 'Спикеры' },
  { id: 'stats',      label: 'Статистика' },
];
const ADMIN_PAGE = { id: 'admin', label: 'Админка' };

const PAGES = window.__IS_ADMIN__ ? [...BASE_PAGES, ADMIN_PAGE] : BASE_PAGES;

function App() {
  const [page, setPage] = useState('activities');

  const renderPage = () => {
    switch (page) {
      case 'activities': return e(ActivitiesPage);
      case 'speakers':   return e(SpeakersPage);
      case 'stats':      return e(StatsPage);
      case 'admin':      return window.__IS_ADMIN__ ? e(AdminPage) : null;
      default:           return null;
    }
  };

  return e(
    'div',
    { className: 'app-shell' },
    renderPage(),
    e(BottomNav, { pages: PAGES, current: page, onChange: setPage })
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
