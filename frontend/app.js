import { DIRECTIONS } from './directions.js';

const ACCENTS = {
  frontend: '#4caf50',
  backend: '#795548',
  QA: '#9c27b0',
  mobile: '#ff9800',
  product: '#f44336',
  data: '#2196f3',
  manager: '#607d8b',
};

const e = React.createElement;
const { useState, useEffect, useRef } = React;

const sheetRoot = ReactDOM.createRoot(document.getElementById('bottom-sheet-root'));


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
  return e(
    'div',
    { className: 'card' },
    e('img', { src: speaker.photoUrl || '/default_icon.svg', alt: speaker.name })
  );
}

function BottomSheet({ talk, speaker }) {
  if (!talk) return null;

  const accent = ACCENTS[talk.direction] || '#03a9f4';

  const link =
    talk.status === 'past'
      ? e('a', { href: talk.recordingLink, target: '_blank' }, 'Запись')
      : e('a', { href: talk.registrationLink, target: '_blank' }, 'Регистрация');

  return e(
    'div',
    { className: 'bottom-sheet', style: { borderTop: `8px solid ${accent}` } },
    e('div', { className: 'handle' }),
    e('h3', null, talk.title),
    e('div', { className: 'sheet-speaker' }, speaker?.name || ''),
    e('div', null, talk.description),
    e('div', { className: 'sheet-event' }, talk.eventName),
    link
  );
}

function TalkList({ items }) {
  const formatDate = d => {
    const date = new Date(d);
    if (isNaN(date)) return d;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  return e(
    'ul',
    { className: 'talk-list' },
    items.map(t => {
      const link =
        t.status === 'past'
          ? e('a', { href: t.recordingLink, target: '_blank' }, 'Запись')
          : e('a', { href: t.registrationLink, target: '_blank' }, 'Регистрация');
      return e(
        'li',
        { key: t.id },
        e(
          'div',
          null,
          e('span', { className: 'list-date' }, formatDate(t.date)),
          ' | ',
          e('span', { className: 'list-speaker' }, t.speaker?.name || ''),
          ' — ',
          e('span', { className: 'list-title' }, t.title)
        ),
        e(
          'div',
          null,
          e('span', { className: 'list-event' }, t.eventName),
          ' | ',
          e('span', { className: 'list-link' }, link)
        )
      );
    })
  );
}

function App() {
  const [direction, setDirection] = useState('all');
  const [status, setStatus] = useState('all');
  const [talks, setTalks] = useState([]);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [activeIndex, setActiveIndex] = useState(0);
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
    setActiveIndex(0);
  }, [filtered.length]);

  useEffect(() => {
    if (viewMode !== 'cards') {
      sheetRoot.render(null);
      return;
    }
    const item = filtered[activeIndex];
    sheetRoot.render(e(BottomSheet, { talk: item, speaker: item?.speaker }));
  }, [activeIndex, filtered, viewMode]);

  useEffect(() => {
    if (viewMode !== 'cards') {
      if (swiperRef.current?.swiper) {
        swiperRef.current.swiper.destroy();
        swiperRef.current.swiper = null;
      }
      return;
    }
    if (window.Swiper && swiperRef.current) {
      if (swiperRef.current.swiper) swiperRef.current.swiper.destroy();
      swiperRef.current.swiper = new window.Swiper(swiperRef.current, {
        centeredSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 20,
        loop: false,
        effect: 'coverflow',
        coverflowEffect: {
          rotate: 0,
          stretch: 0,
          depth: 120,
          modifier: 2,
          slideShadows: false,
        },
        on: {
          slideChange() {
            setActiveIndex(this.realIndex);
          },
        },
      });
    }
  }, [filtered.length, viewMode]);

  return e(
    'div',
    null,
    error && e('div', { className: 'error' }, error),
    e('button', { className: 'filter-btn', onClick: () => setShowFilters(!showFilters) }, 'Фильтры'),
    e(
      'div',
      { className: 'view-switch' },
      e('span', null, 'Список'),
      e(
        'label',
        { className: 'switch' },
        e('input', {
          type: 'checkbox',
          checked: viewMode === 'list',
          onChange: () => setViewMode(viewMode === 'cards' ? 'list' : 'cards'),
        }),
        e('span', { className: 'slider' })
      )
    ),
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
    viewMode === 'cards'
      ? e(
          'div',
          { className: 'swiper-container', ref: swiperRef },
          e(
            'div',
            { className: 'swiper-wrapper' },
            filtered.map((t, idx) =>
              e(
                'div',
                {
                  className: 'swiper-slide',
                  key: t.id,
                  onClick: () => {},
                },
                e(Card, { talk: t, speaker: t.speaker })
              )
            )
          )
        )
      : e(TalkList, { items: filtered })
  );
}

// Expand the Telegram WebApp if running inside Telegram
window.Telegram?.WebApp?.expand();

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
