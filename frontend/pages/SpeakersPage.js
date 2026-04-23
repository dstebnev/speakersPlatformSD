import { SpeakerCard } from '../components/SpeakerCard.js';

const e = React.createElement;
const { useState, useEffect, useMemo } = React;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

const SearchIcon = e('svg', {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  width: 16, height: 16,
},
  e('circle', { cx: 11, cy: 11, r: 7 }),
  e('path', { d: 'm20 20-3.5-3.5', strokeLinecap: 'round' }));

const MicIcon = e('svg', {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
  width: 22, height: 22,
},
  e('rect', { x: 9, y: 3, width: 6, height: 12, rx: 3 }),
  e('path', { d: 'M5 11a7 7 0 0 0 14 0M12 18v3', strokeLinecap: 'round' }));

export function SpeakersPage({ onOpenRequest, onOpenSpeaker }) {
  const [speakers, setSpeakers] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');

  useEffect(() => {
    Promise.all([fetchJSON('/api/speakers'), fetchJSON('/api/tags')])
      .then(([spks, tags]) => { setSpeakers(spks); setExpertiseTags(tags); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return speakers.filter(s => {
      if (tagFilter !== 'all' && !(s.expertise || []).includes(tagFilter)) return false;
      if (q) {
        const inName = s.name.toLowerCase().includes(q);
        const inRole = (s.role || '').toLowerCase().includes(q);
        if (!inName && !inRole) return false;
      }
      return true;
    });
  }, [speakers, tagFilter, query]);

  const allTags = useMemo(() => expertiseTags.map(t => t.name), [expertiseTags]);

  if (loading) return e('div', { className: 'page-scroll' },
    e('div', { className: 'loader' }, e('div', { className: 'spinner' })));
  if (error) return e('div', { className: 'page-scroll' },
    e('div', { className: 'empty-state' },
      e('div', { className: 'empty-state__icon' }, '⚠️'),
      e('div', { className: 'empty-state__text' }, error)));

  return e('div', { className: 'page' },

    // Header
    e('div', { className: 'page__head' },
      e('div', null,
        e('h1', { className: 'page__title' }, 'Спикеры'),
        e('div', { className: 'page__sub' },
          'Эксперты, готовые делиться знаниями внешне и внутри компании')),
      e('div', { className: 'page__count' }, `${filtered.length} matches`)),

    // Search
    e('div', { className: 'search' },
      SearchIcon,
      e('input', {
        placeholder: 'Имя или роль…',
        value: query,
        onChange: ev => setQuery(ev.target.value),
      })),

    // Tag filter
    allTags.length > 0 && e('div', { className: 'chiprow' },
      e('span', { className: 'chiprow__label' }, 'Экспертиза'),
      e('button', {
        className: 'chip' + (tagFilter === 'all' ? ' is-active' : ''),
        onClick: () => setTagFilter('all'),
      }, 'Все'),
      allTags.map(t => e('button', {
        key: t,
        className: 'chip' + (tagFilter === t ? ' is-active' : ''),
        onClick: () => setTagFilter(t),
      }, t))),

    // Grid
    filtered.length === 0
      ? e('div', { className: 'empty', style: { marginTop: 18 } },
          e('div', { className: 'empty__glyph' }, '«пусто»'),
          'никого не нашли')
      : e('div', { className: 'spk-grid' },
          filtered.map(s => e(SpeakerCard, {
            key: s.id,
            speaker: s,
            onClick: () => onOpenSpeaker && onOpenSpeaker(s),
          }))),

    // CTA
    e('div', { className: 'cta' },
      e('div', { className: 'cta__ic' }, MicIcon),
      e('div', { className: 'cta__txt' },
        e('div', { className: 'cta__title' }, 'Хотите присоединиться к пулу спикеров?'),
        e('div', { className: 'cta__sub' }, 'Расскажите о себе — и мы подберём вам подходящую площадку.')),
      e('button', { className: 'cta__btn', onClick: onOpenRequest }, 'Заявка')));
}
