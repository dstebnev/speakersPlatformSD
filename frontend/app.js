import { DIRECTIONS } from './directions.js';

const e = React.createElement;
const { useState, useEffect, useRef } = React;


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
    { className: 'card', style: { borderLeft: `8px solid ${accent}` } },
    e('img', { src: speaker.photoUrl || '/default_icon.svg', alt: speaker.name }),
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
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const swiperRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [speakersRes, talksRes] = await Promise.all([
          fetch('/api/speakers'),
          fetch('/api/talks'),
        ]);
        if (!speakersRes.ok || !talksRes.ok) throw new Error('Fetch error');
        const [speakers, talks] = await Promise.all([
          speakersRes.json(),
          talksRes.json(),
        ]);
        const merged = talks.map(t => ({
          ...t,
          speaker: speakers.find(s => s.id === t.speakerId),
        }));
        setTalks(merged);
      } catch (err) {
        setError('Не удалось загрузить данные');
      }
    };
    load();
  }, []);

  let filtered = talks;
  if (direction !== 'all') filtered = filtered.filter(t => t.direction === direction);
  if (status !== 'all') filtered = filtered.filter(t => t.status === status);
  filtered = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  useEffect(() => {
    if (window.Swiper && swiperRef.current) {
      if (swiperRef.current.swiper) swiperRef.current.swiper.destroy();
      swiperRef.current.swiper = new window.Swiper(swiperRef.current, {
        slidesPerView: 1.2,
        centeredSlides: true,
        spaceBetween: 20,
        effect: 'coverflow',
        coverflowEffect: { rotate: 0, stretch: 0, depth: 100, modifier: 1, slideShadows: false },
        breakpoints: { 600: { slidesPerView: 3 } }
      });
    }
  }, [filtered.length]);

  return e(
    'div',
    null,
    error && e('div', { className: 'error' }, error),
    e('button', { onClick: () => setShowFilters(!showFilters) }, 'Фильтры'),
    e(
      'div',
      { className: `filters${showFilters ? ' show' : ''}` },
      e('select', { value: direction, onChange: e => setDirection(e.target.value) },
        e('option', { value: 'all' }, 'Все направления'),
        DIRECTIONS.map(d =>
          e('option', { key: d, value: d }, d)
        )
      ),
      e('select', { value: status, onChange: e => setStatus(e.target.value) },
        e('option', { value: 'all' }, 'Все статусы'),
        e('option', { value: 'past' }, 'Прошедшие'),
        e('option', { value: 'upcoming' }, 'Будущие')
      )
    ),
    e('div', { className: 'swiper-container', ref: swiperRef },
      e('div', { className: 'swiper-wrapper' },
        filtered.map(t =>
          e('div', { className: 'swiper-slide', key: t.id },
            e(Card, { talk: t, speaker: t.speaker })
          )
        )
      )
    )
  );
}

// Expand the Telegram WebApp if running inside Telegram
window.Telegram?.WebApp?.expand();

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
