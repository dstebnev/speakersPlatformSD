import { useSwipeable } from 'https://unpkg.com/react-swipeable@7/dist/react-swipeable.esm.js';
const e = React.createElement;
const { useState, useEffect } = React;

const TEST_SPEAKERS = [
  {
    id: '1',
    name: 'Alice',
    photoUrl: 'https://placekitten.com/300/200',
    description: 'Frontend developer',
  },
];

const TEST_TALKS = [
  {
    id: '1',
    speakerId: '1',
    title: 'React Basics',
    description: 'Intro to React',
    eventName: 'JS Conf',
    direction: 'frontend',
    status: 'upcoming',
    date: '2024-08-20',
    registrationLink: 'https://example.com/register',
  },
  {
    id: '2',
    speakerId: '1',
    title: 'Past Talk',
    description: 'Something done',
    eventName: 'Old Conf',
    direction: 'frontend',
    status: 'past',
    date: '2024-01-10',
    recordingLink: 'https://example.com/recording',
  },
];

function Card({ talk, speaker }) {
  const handlers = useSwipeable({ onSwiped: () => {} });
  const accent = {
    frontend: '#4caf50',
    backend: '#795548',
    QA: '#9c27b0',
    mobile: '#ff9800',
    product: '#f44336',
    data: '#2196f3',
    manager: '#607d8b',
  }[talk.direction] || '#03a9f4';

  return e(
    'div',
    { className: 'card', style: { borderLeft: `8px solid ${accent}` }, ...handlers },
    e('img', { src: speaker.photoUrl, alt: speaker.name }),
    e('div', { className: 'card-title' }, talk.title),
    e('div', null, speaker.name),
    e('div', null, talk.description),
    e('div', null, talk.eventName),
    talk.status === 'past'
      ? e('div', null, 'Прошло — ', e('a', { href: talk.recordingLink, target: '_blank' }, 'Запись'))
      : e('div', null, talk.date, ' — ', e('a', { href: talk.registrationLink, target: '_blank' }, 'Регистрация'))
  );
}

function App() {
  const [direction, setDirection] = useState('all');
  const [status, setStatus] = useState('all');
  const [talks, setTalks] = useState([]);

  useEffect(() => {
    // For demo use test data
    const merged = TEST_TALKS.map(t => ({
      ...t,
      speaker: TEST_SPEAKERS.find(s => s.id === t.speakerId),
    }));
    setTalks(merged);
  }, []);

  let filtered = talks;
  if (direction !== 'all') filtered = filtered.filter(t => t.direction === direction);
  if (status !== 'all') filtered = filtered.filter(t => t.status === status);

  filtered = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  return e(
    'div',
    null,
    e(
      'div',
      { className: 'filters' },
      e('select', { value: direction, onChange: e => setDirection(e.target.value) },
        e('option', { value: 'all' }, 'Все направления'),
        ['frontend','backend','QA','mobile','product','data','manager'].map(d =>
          e('option', { key: d, value: d }, d)
        )
      ),
      e('select', { value: status, onChange: e => setStatus(e.target.value) },
        e('option', { value: 'all' }, 'Все статусы'),
        e('option', { value: 'past' }, 'Прошедшие'),
        e('option', { value: 'upcoming' }, 'Будущие')
      )
    ),
    filtered.map(t => e(Card, { key: t.id, talk: t, speaker: t.speaker }))
  );
}

Telegram?.WebApp?.expand();

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
