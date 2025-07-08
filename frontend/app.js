import { DIRECTIONS } from './directions.js';
import { ACCENTS } from './constants.js';
import { Card } from './components/Card.js';
import { BottomSheet } from './components/BottomSheet.js';
import { TalkList } from './components/TalkList.js';

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

// Expand the Telegram WebApp on mobile if running inside Telegram
const tryExpand = () => {
  const tg = window.Telegram?.WebApp;
  tg?.ready();
  if (tg && tg.initData && (tg.platform === 'android' || tg.platform === 'ios') && !tg.isExpanded) {
    tg.expand();
  }
};
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', tryExpand);
} else {
  tryExpand();
}

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
