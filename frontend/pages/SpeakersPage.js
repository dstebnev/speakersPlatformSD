import { SpeakerCard } from '../components/SpeakerCard.js';

const e = React.createElement;
const { useState, useEffect, useMemo } = React;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

export function SpeakersPage() {
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

  const tagChips = useMemo(() => [
    { value: 'all', label: 'Все' },
    ...expertiseTags.map(t => ({ value: t.name, label: t.name })),
  ], [expertiseTags]);

  if (loading) return e('div', { className: 'page-scroll' }, e('div', { className: 'loader' }, e('div', { className: 'spinner' })));
  if (error)   return e('div', { className: 'page-scroll' }, e('div', { className: 'empty-state' }, e('div', { className: 'empty-state__icon' }, '⚠️'), e('div', { className: 'empty-state__text' }, error)));

  return e(
    'div',
    { className: 'page-scroll' },
    e(
      'div',
      { className: 'page-header' },
      e('div', { className: 'page-header__title' }, `Спикеры (${speakers.length})`),
      e(
        'div',
        { className: 'search-bar' },
        e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
          e('circle', { cx: 11, cy: 11, r: 8 }),
          e('path', { strokeLinecap: 'round', d: 'm21 21-4.35-4.35' })
        ),
        e('input', {
          type: 'search',
          placeholder: 'Поиск по имени или роли...',
          value: query,
          onChange: ev => setQuery(ev.target.value),
        })
      )
    ),
    tagChips.length > 1 && e(
      'div',
      { className: 'filter-chips' },
      tagChips.map(opt =>
        e('button', {
          key: opt.value,
          className: `chip${tagFilter === opt.value ? ' active' : ''}`,
          onClick: () => setTagFilter(opt.value),
        }, opt.label)
      )
    ),
    filtered.length === 0
      ? e('div', { className: 'empty-state' },
          e('div', { className: 'empty-state__icon' }, '👤'),
          e('div', { className: 'empty-state__text' }, 'Спикеры не найдены')
        )
      : e(
          'div',
          { className: 'list-container' },
          filtered.map(s => e(SpeakerCard, { key: s.id, speaker: s }))
        )
  );
}
