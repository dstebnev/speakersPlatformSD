import { exportActivityCard } from '../utils/exportCard.js';

const e = React.createElement;
const { useState, useEffect, useMemo } = React;

const FORMAT_OPTIONS = [
  { value: 'speech',  label: 'Выступление' },
  { value: 'article', label: 'Статья' },
  { value: 'digital', label: 'Digital' },
];

const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital' };
const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

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

function speakerAv(s) {
  if (s.photoUrl) {
    return e('div', { key: s.id, className: 'av-sm', style: { overflow: 'hidden' } },
      e('img', { src: s.photoUrl, alt: s.name }));
  }
  const initials = (s.name || '').split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
  return e('div', { key: s.id, className: 'av-sm',
    style: { background: 'var(--accent-soft)', color: 'var(--accent-ink)' } }, initials);
}

function ArchiveCard({ activity, speakers }) {
  const fmt = activity.format || 'speech';
  const dt = activity.date ? new Date(activity.date + 'T00:00:00') : null;
  const dateStr = dt
    ? `${String(dt.getDate()).padStart(2, '0')} ${MONTHS_RU[dt.getMonth()]} ${dt.getFullYear()}`
    : null;

  return e('article', { className: 'arc-card' },
    // Top row: format + date + speaker avatars
    e('div', { className: 'arc-card__top' },
      e('div', { className: 'arc-card__meta' },
        e('span', { className: `fmt-dot fmt-dot--${fmt}` }),
        FORMAT_LABELS[fmt],
        dateStr && e('span', { className: 'arc-card__sep' }, '·'),
        dateStr && e('span', null, dateStr)),
      speakers.length > 0 && e('div', { className: 'arc-card__avs' },
        speakers.slice(0, 3).map(speakerAv))),

    // Title
    e('h3', { className: 'arc-card__title' }, activity.name),

    // Speakers names + event
    e('div', { className: 'arc-card__sub' },
      speakers.length > 0 && e('span', null, speakers.map(s => s.name).join(', ')),
      activity.event && e('span', { className: 'arc-card__event' }, activity.event)),

    // Tags
    (activity.expertise_tags || []).length > 0 && e('div', { className: 'arc-card__tags' },
      activity.expertise_tags.map(t => e('span', { key: t, className: 'tag' }, t))),

    // Footer: link + download button
    e('div', { className: 'arc-card__footer' },
      activity.link
        ? e('a', {
            href: activity.link,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'arc-card__link',
            onClick: ev => ev.stopPropagation(),
          },
            e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, width: 14, height: 14 },
              e('path', { d: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3', strokeLinecap: 'round', strokeLinejoin: 'round' })),
            'Открыть материал')
        : e('span', { className: 'arc-card__no-link' }, 'Материал не добавлен'),

      e('button', {
        className: 'arc-card__dl',
        title: 'Скачать карточку',
        onClick: ev => {
          ev.stopPropagation();
          exportActivityCard(activity, speakers);
        },
      },
        e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, width: 14, height: 14 },
          e('path', { d: 'M12 3v12M7 11l5 5 5-5M4 20h16', strokeLinecap: 'round', strokeLinejoin: 'round' })),
        'Карточка')));
}

export function ArchivePage() {
  const [activities, setActivities] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [formatFilters, setFormatFilters] = useState([]);
  const [tagFilters, setTagFilters] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchJSON('/api/activities'),
      fetchJSON('/api/speakers'),
      fetchJSON('/api/tags'),
    ])
      .then(([acts, spks, tags]) => {
        setActivities(acts.filter(a => a.format !== 'devrel'));
        setSpeakers(spks);
        setExpertiseTags(tags);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const speakerMap = useMemo(() =>
    Object.fromEntries(speakers.map(s => [s.id, s])), [speakers]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Only past activities
  const past = useMemo(() =>
    activities.filter(a => a.date && a.date < today),
    [activities, today]);

  const formatCounts = useMemo(() => {
    const counts = {};
    past.forEach(a => { counts[a.format] = (counts[a.format] || 0) + 1; });
    return counts;
  }, [past]);

  const tagCounts = useMemo(() => {
    const counts = {};
    past
      .filter(a => formatFilters.length === 0 || formatFilters.includes(a.format))
      .forEach(a => {
        (a.expertise_tags || []).forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });
    return counts;
  }, [past, formatFilters]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const result = past.filter(a => {
      if (formatFilters.length > 0 && !formatFilters.includes(a.format)) return false;
      if (tagFilters.length > 0 && !(a.expertise_tags || []).some(t => tagFilters.includes(t))) return false;
      if (q) {
        const inName = a.name.toLowerCase().includes(q);
        const inEvent = (a.event || '').toLowerCase().includes(q);
        const inSpks = (a.speaker_ids || []).some(id => speakerMap[id]?.name.toLowerCase().includes(q));
        if (!inName && !inEvent && !inSpks) return false;
      }
      return true;
    });
    // Newest first
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [past, formatFilters, tagFilters, query, speakerMap]);

  if (loading) return e('div', { className: 'page-scroll' },
    e('div', { className: 'loader' }, e('div', { className: 'spinner' })));
  if (error) return e('div', { className: 'page-scroll' },
    e('div', { className: 'empty-state' },
      e('div', { className: 'empty-state__icon' }, '⚠️'),
      e('div', { className: 'empty-state__text' }, error)));

  const allTagChips = expertiseTags.map(t => t.name);

  return e('div', { className: 'page' },

    // Header
    e('div', { className: 'page__head' },
      e('div', null,
        e('h1', { className: 'page__title' }, 'Архив'),
        e('div', { className: 'page__sub' }, 'Прошедшие активности и материалы к ним')),
      e('div', { className: 'page__count' }, `${filtered.length} из ${past.length}`)),

    // Search
    e('div', { className: 'search' },
      SearchIcon,
      e('input', {
        placeholder: 'Поиск по названию, спикеру или площадке…',
        value: query,
        onChange: ev => setQuery(ev.target.value),
      })),

    // Format filter
    e('div', { className: 'chiprow' },
      e('span', { className: 'chiprow__label' }, 'Формат'),
      e('button', {
        className: 'chip' + (formatFilters.length === 0 ? ' is-active' : ''),
        onClick: () => setFormatFilters([]),
      }, 'Все'),
      FORMAT_OPTIONS.map(opt => {
        const count = formatCounts[opt.value] || 0;
        return e('button', {
          key: opt.value,
          className: 'chip' + (formatFilters.includes(opt.value) ? ' is-active' : ''),
          onClick: () => setFormatFilters(prev =>
            prev.includes(opt.value) ? prev.filter(v => v !== opt.value) : [...prev, opt.value]),
        },
          e('span', { className: `fmt-dot fmt-dot--${opt.value}` }),
          opt.label,
          e('span', { className: 'chip__count' }, count));
      })),

    // Tag filter
    allTagChips.length > 0 && e('div', { className: 'chiprow' },
      e('span', { className: 'chiprow__label' }, 'Темы'),
      e('button', {
        className: 'chip' + (tagFilters.length === 0 ? ' is-active' : ''),
        onClick: () => setTagFilters([]),
      }, 'Все'),
      allTagChips.map(t => e('button', {
        key: t,
        className: 'chip' + (tagFilters.includes(t) ? ' is-active' : ''),
        onClick: () => setTagFilters(prev =>
          prev.includes(t) ? prev.filter(v => v !== t) : [...prev, t]),
      },
        t,
        tagCounts[t] != null && e('span', { className: 'chip__count' }, tagCounts[t] || 0)))),

    // Grid
    filtered.length === 0
      ? e('div', { className: 'empty', style: { marginTop: 18 } },
          e('div', { className: 'empty__glyph' }, '«пусто»'),
          'нет прошедших активностей')
      : e('div', { className: 'arc-grid' },
          filtered.map(a => e(ArchiveCard, {
            key: a.id,
            activity: a,
            speakers: (a.speaker_ids || []).map(id => speakerMap[id]).filter(Boolean),
          }))));
}
