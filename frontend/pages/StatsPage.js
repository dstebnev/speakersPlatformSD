const e = React.createElement;
const { useState, useEffect, useRef } = React;

const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital', devrel: 'Деврел' };
const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const MONTHS_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

const QUARTERS = [
  { key: 'q1', label: 'Q1', from: '01-01', to: '03-31' },
  { key: 'q2', label: 'Q2', from: '04-01', to: '06-30' },
  { key: 'q3', label: 'Q3', from: '07-01', to: '09-30' },
  { key: 'q4', label: 'Q4', from: '10-01', to: '12-31' },
];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

function getDateRange(preset, year) {
  if (preset === 'all') return {};
  if (preset === 'year') return { date_from: `${year}-01-01`, date_to: `${year}-12-31` };
  const q = QUARTERS.find(x => x.key === preset);
  if (q) return { date_from: `${year}-${q.from}`, date_to: `${year}-${q.to}` };
  const m = parseInt(preset.slice(1), 10);
  const lastDay = new Date(year, m, 0).getDate();
  const mm = String(m).padStart(2, '0');
  return { date_from: `${year}-${mm}-01`, date_to: `${year}-${mm}-${lastDay}` };
}

function StatBig({ value, label, delta, accent }) {
  return e('div', { className: 'stat' },
    e('div', { className: 'stat__big' }, accent ? e('em', null, value) : value),
    e('div', { className: 'stat__lbl' }, label),
    delta && e('div', { className: 'stat__delta stat__delta-up' }, delta));
}

function StatsFilter({ preset, year, onPreset, onYear }) {
  const currentYear = new Date().getFullYear();
  return e('div', { className: 'stats-filter' },
    e('div', { className: 'chiprow' },
      e('div', {
        className: 'chip' + (preset === 'all' ? ' is-active' : ''),
        onClick: () => onPreset('all'),
      }, 'Всё время'),

      e('div', { className: 'year-nav' },
        e('button', {
          className: 'year-nav__btn',
          onClick: () => onYear(year - 1),
        }, '‹'),
        e('span', { className: 'year-nav__val' }, year),
        e('button', {
          className: 'year-nav__btn',
          onClick: () => onYear(Math.min(year + 1, currentYear)),
          disabled: year >= currentYear,
        }, '›')),

      e('div', {
        className: 'chip' + (preset === 'year' ? ' is-active' : ''),
        onClick: () => onPreset('year'),
      }, 'Весь год'),

      ...QUARTERS.map(q => e('div', {
        key: q.key,
        className: 'chip' + (preset === q.key ? ' is-active' : ''),
        onClick: () => onPreset(q.key),
      }, q.label))),

    e('div', { className: 'chiprow' },
      MONTHS_SHORT.map((label, i) => {
        const key = `m${i + 1}`;
        return e('div', {
          key,
          className: 'chip' + (preset === key ? ' is-active' : ''),
          onClick: () => onPreset(key),
        }, label);
      })));
}

export function StatsPage() {
  const currentYear = new Date().getFullYear();
  const [preset, setPreset] = useState('all');
  const [year, setYear]     = useState(currentYear);
  const [stats, setStats]   = useState(null);
  const [refreshing, setRefreshing] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    setRefreshing(true);
    setError('');
    const range = getDateRange(preset, year);
    const params = new URLSearchParams(range);
    const url = '/api/stats' + (params.toString() ? '?' + params : '');
    fetchJSON(url)
      .then(data => { setStats(data); setRefreshing(false); })
      .catch(err => { setError(err.message); setRefreshing(false); });
  }, [preset, year]);

  function handlePreset(p) {
    setPreset(p);
    if (p !== 'all') setYear(y => y); // keep year
  }

  if (refreshing && !stats) return e('div', { className: 'page-scroll' },
    e('div', { className: 'loader' }, e('div', { className: 'spinner' })));
  if (error) return e('div', { className: 'page-scroll' },
    e('div', { className: 'empty-state' },
      e('div', { className: 'empty-state__icon' }, '⚠️'),
      e('div', { className: 'empty-state__text' }, error)));
  if (!stats) return null;

  // Format breakdown
  const formatItems = ['speech', 'article', 'digital', 'devrel'].map(k => ({
    key: k, label: FORMAT_LABELS[k], count: stats.format_counts?.[k] || 0,
  }));
  const maxFormat = Math.max(...formatItems.map(x => x.count), 1);

  // Tag breakdown (top 8)
  const tagItems = Object.entries(stats.tag_counts || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => ({ label: k, count: v }));
  const maxTag = Math.max(...tagItems.map(x => x.count), 1);

  // Monthly trend
  const monthEntries = Object.entries(stats.monthly || {})
    .sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  const maxMonthly = Math.max(...monthEntries.map(x => x[1]), 1);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const upcomingCount = stats.upcoming_count ?? '—';

  const monthlyLabel = preset === 'all' ? 'последние 12'
    : preset === 'year' ? String(year)
    : preset.startsWith('q') ? `${year} · ${QUARTERS.find(q => q.key === preset)?.label}`
    : preset.startsWith('m') ? `${MONTHS_SHORT[parseInt(preset.slice(1), 10) - 1]} ${year}`
    : '';

  return e('div', { className: 'page', style: { opacity: refreshing ? 0.6 : 1, transition: 'opacity .2s' } },

    e('div', { className: 'page__head' },
      e('div', null,
        e('h1', { className: 'page__title' }, 'Статистика'),
        e('div', { className: 'page__sub' }, 'Что и как мы публикуем'))),

    e(StatsFilter, { preset, year, onPreset: handlePreset, onYear: setYear }),

    e('div', { className: 'stats-hero' },
      e(StatBig, { value: stats.total_activities, label: 'Активностей', delta: 'всего' }),
      e(StatBig, { value: stats.total_speakers,   label: 'Экспертов', delta: 'в пуле' }),
      e(StatBig, { value: Object.keys(stats.tag_counts || {}).length, label: 'Тем', delta: 'покрытие' }),
      e(StatBig, { value: upcomingCount, label: 'Впереди', delta: 'запланировано', accent: true })),

    e('div', { className: 'stats-grid-2' },
      e('section', { className: 'stats-section' },
        e('h3', null,
          'По формату',
          e('small', null, `${stats.total_activities} total`)),
        formatItems.map(item => {
          const colors = { speech: 'oklch(0.68 0.16 55)', article: 'oklch(0.65 0.14 180)', digital: 'oklch(0.62 0.17 290)', devrel: 'oklch(0.62 0.14 330)' };
          return e('div', { key: item.key, className: 'bar' },
            e('span', { className: 'bar__lbl' },
              e('span', { className: `fmt-dot fmt-dot--${item.key}` }),
              item.label),
            e('div', { className: 'bar__track' },
              e('div', { className: 'bar__fill', style: { width: `${item.count / maxFormat * 100}%`, background: colors[item.key] } })),
            e('span', { className: 'bar__val' }, item.count));
        })),

      e('section', { className: 'stats-section' },
        e('h3', null, 'По месяцам', e('small', null, monthlyLabel)),
        monthEntries.length > 0
          ? [
              e('div', { key: 'spark', className: 'spark' },
                monthEntries.map(([k, v]) => e('div', {
                  key: k,
                  className: 'spark__col' + (k === thisMonth ? ' spark__col--accent' : ''),
                  style: { height: `${v / maxMonthly * 100}%` },
                  title: `${k}: ${v}`,
                }))),
              e('div', { key: 'labels', className: 'spark__labels' },
                monthEntries.map(([k]) =>
                  e('span', { key: k }, MONTHS_RU[+k.slice(5, 7) - 1]))),
            ]
          : e('div', { className: 'empty-state', style: { padding: '24px 0' } },
              e('div', { className: 'empty-state__text' }, 'Нет данных за период')))),

    stats.top_speakers?.length > 0 && e('section', { className: 'stats-section' },
      e('h3', null, 'Топ спикеров', e('small', null, 'по числу активностей')),
      e('div', { className: 'rank-list' },
        stats.top_speakers.map(({ speaker, count }, i) => e('div', {
          key: speaker.id,
          className: 'rank' + (i < 3 ? ' is-top' : ''),
        },
          e('div', { className: 'rank__n' }, i + 1),
          e('div', null,
            e('div', { className: 'rank__name' }, speaker.name),
            speaker.role && e('div', { className: 'rank__role' }, speaker.role)),
          e('div', { className: 'rank__num' }, count))))),

    tagItems.length > 0 && e('section', { className: 'stats-section' },
      e('h3', null, 'По темам', e('small', null, 'top 8')),
      tagItems.map(item => e('div', { key: item.label, className: 'bar' },
        e('span', { className: 'bar__lbl' }, item.label),
        e('div', { className: 'bar__track' },
          e('div', { className: 'bar__fill', style: { width: `${item.count / maxTag * 100}%` } })),
        e('span', { className: 'bar__val' }, item.count)))));
}
