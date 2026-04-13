import { BottomNav } from './components/BottomNav.js';
import { ActivitiesPage } from './pages/ActivitiesPage.js';
import { StatsPage } from './pages/StatsPage.js';
import { SpeakersPage } from './pages/SpeakersPage.js';
import { AdminPage } from './pages/AdminPage.js';

const e = React.createElement;
const { useState } = React;

const PAGES = [
  { id: 'activities', label: 'Активности' },
  { id: 'speakers',   label: 'Спикеры' },
  { id: 'stats',      label: 'Статистика' },
  { id: 'admin',      label: 'Админка' },
];

function App() {
  const [page, setPage] = useState('activities');

  const renderPage = () => {
    switch (page) {
      case 'activities': return e(ActivitiesPage);
      case 'speakers':   return e(SpeakersPage);
      case 'stats':      return e(StatsPage);
      case 'admin':      return e(AdminPage);
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
