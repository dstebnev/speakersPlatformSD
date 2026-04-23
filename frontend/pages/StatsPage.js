const e = React.createElement;
const { useState, useEffect } = React;

const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital' };
const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

function StatBig({ value, label, delta, accent }) {
  return e('div', { className: 'stat' },
    e('div', { className: 'stat__big' }, accent ? e('em', null, value) : value),
    e('div', { className: 'stat__lbl' }, label),
    delta && e('div', { className: 'stat__delta stat__delta-up' }, delta));
}

export function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJSON('/api/stats')
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return e('div', { className: 'page-scroll' },
    e('div', { className: 'loader' }, e('div', { className: 'spinner' })));
  if (error) return e('div', { className: 'page-scroll' },
    e('div', { className: 'empty-state' },
      e('div', { className: 'empty-state__icon' }, '⚠️'),
      e('div', { className: 'empty-state__text' }, error)));
  if (!stats) return null;

  // Format breakdown
  const formatItems = ['speech', 'article', 'digital'].map(k => ({
    key: k, label: FORMAT_LABELS[k], count: stats.format_counts?.[k] || 0,
  }));
  const maxFormat = Math.max(...formatItems.map(x => x.count), 1);

  // Tag breakdown (top 8)
  const tagItems = Object.entries(stats.tag_counts || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => ({ label: k, count: v }));
  const maxTag = Math.max(...tagItems.map(x => x.count), 1);

  // Monthly trend (last 12)
  const monthEntries = Object.entries(stats.monthly || {})
    .sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  const maxMonthly = Math.max(...monthEntries.map(x => x[1]), 1);
  const thisMonth = new Date().toISOString().slice(0, 7);

  // Upcoming count
  const today = new Date().toISOString().slice(0, 10);
  const upcomingCount = stats.upcoming_count ?? '—';

  return e('div', { className: 'page' },

    // Header
    e('div', { className: 'page__head' },
      e('div', null,
        e('h1', { className: 'page__title' }, 'Статистика'),
        e('div', { className: 'page__sub' }, 'Что и как мы публикуем'))),

    // Hero stats
    e('div', { className: 'stats-hero' },
      e(StatBig, { value: stats.total_activities, label: 'Активностей', delta: 'всего' }),
      e(StatBig, { value: stats.total_speakers,   label: 'Спикеров', delta: 'в пуле' }),
      e(StatBig, { value: Object.keys(stats.tag_counts || {}).length, label: 'Тем', delta: 'покрытие' }),
      e(StatBig, { value: upcomingCount, label: 'Впереди', delta: 'запланировано', accent: true })),

    // Format + Monthly — 2-col on desktop
    e('div', { className: 'stats-grid-2' },
      e('section', { className: 'stats-section' },
        e('h3', null,
          'По формату',
          e('small', null, `${stats.total_activities} total`)),
        formatItems.map(item => {
          const colors = { speech: 'oklch(0.68 0.16 55)', article: 'oklch(0.65 0.14 180)', digital: 'oklch(0.62 0.17 290)' };
          return e('div', { key: item.key, className: 'bar' },
            e('span', { className: 'bar__lbl' },
              e('span', { className: `fmt-dot fmt-dot--${item.key}` }),
              item.label),
            e('div', { className: 'bar__track' },
              e('div', { className: 'bar__fill', style: { width: `${item.count / maxFormat * 100}%`, background: colors[item.key] } })),
            e('span', { className: 'bar__val' }, item.count));
        })),

      e('section', { className: 'stats-section' },
        e('h3', null, 'По месяцам', e('small', null, 'последние 12')),
        e('div', { className: 'spark' },
          monthEntries.map(([k, v]) => e('div', {
            key: k,
            className: 'spark__col' + (k === thisMonth ? ' spark__col--accent' : ''),
            style: { height: `${v / maxMonthly * 100}%` },
            title: `${k}: ${v}`,
          }))),
        e('div', { className: 'spark__labels' },
          monthEntries.map(([k]) =>
            e('span', { key: k }, MONTHS_RU[+k.slice(5, 7) - 1]))))),

    // Top speakers
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

    // Tags
    tagItems.length > 0 && e('section', { className: 'stats-section' },
      e('h3', null, 'По темам', e('small', null, 'top 8')),
      tagItems.map(item => e('div', { key: item.label, className: 'bar' },
        e('span', { className: 'bar__lbl' }, item.label),
        e('div', { className: 'bar__track' },
          e('div', { className: 'bar__fill', style: { width: `${item.count / maxTag * 100}%` } })),
        e('span', { className: 'bar__val' }, item.count)))));
}
