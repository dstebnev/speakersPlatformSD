const e = React.createElement;
const { useState, useEffect } = React;

const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital' };
const FORMAT_COLORS = { speech: '#3b82f6', article: '#10b981', digital: '#8b5cf6' };

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

function StatCard({ value, label }) {
  return e(
    'div',
    { className: 'stat-card' },
    e('div', { className: 'stat-card__value' }, value),
    e('div', { className: 'stat-card__label' }, label)
  );
}

function BarChart({ items, maxValue, colorFn }) {
  return e(
    'div',
    { className: 'bar-list' },
    items.map(({ label, count }) =>
      e(
        'div',
        { key: label },
        e(
          'div',
          { className: 'bar-item__label' },
          e('span', null, label),
          e('span', null, count)
        ),
        e(
          'div',
          { className: 'bar-track' },
          e('div', {
            className: 'bar-fill',
            style: {
              width: maxValue ? `${(count / maxValue) * 100}%` : '0%',
              background: colorFn ? colorFn(label) : 'var(--tg-theme-button-color)',
            },
          })
        )
      )
    )
  );
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

  if (loading) return e('div', { className: 'page-scroll' }, e('div', { className: 'loader' }, e('div', { className: 'spinner' })));
  if (error)   return e('div', { className: 'page-scroll' }, e('div', { className: 'empty-state' }, e('div', { className: 'empty-state__icon' }, '⚠️'), e('div', { className: 'empty-state__text' }, error)));
  if (!stats)  return null;

  // Format breakdown
  const formatItems = Object.entries(stats.format_counts || {}).map(([k, v]) => ({
    label: FORMAT_LABELS[k] || k,
    count: v,
    key: k,
  }));
  const maxFormat = Math.max(...formatItems.map(x => x.count), 1);

  // Tag breakdown (top 10)
  const tagItems = Object.entries(stats.tag_counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v]) => ({ label: k, count: v }));
  const maxTag = Math.max(...tagItems.map(x => x.count), 1);

  // Monthly trend (last 12 months)
  const monthlyEntries = Object.entries(stats.monthly || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12);
  const maxMonthly = Math.max(...monthlyEntries.map(x => x[1]), 1);
  const monthlyItems = monthlyEntries.map(([k, v]) => ({
    label: new Date(k + '-01').toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
    count: v,
  }));

  return e(
    'div',
    { className: 'page-scroll' },
    e('div', { className: 'page-header' }, e('div', { className: 'page-header__title' }, 'Статистика')),

    // Summary cards
    e(
      'div',
      { className: 'stats-grid' },
      e(StatCard, { value: stats.total_activities, label: 'Активностей' }),
      e(StatCard, { value: stats.total_speakers,   label: 'Спикеров' })
    ),

    // Format breakdown
    formatItems.length > 0 && e(
      'div',
      { className: 'stats-section' },
      e('div', { className: 'stats-section__title' }, 'По формату'),
      e(BarChart, {
        items: formatItems,
        maxValue: maxFormat,
        colorFn: label => {
          const key = Object.keys(FORMAT_LABELS).find(k => FORMAT_LABELS[k] === label);
          return FORMAT_COLORS[key] || 'var(--tg-theme-button-color)';
        },
      })
    ),

    // Top speakers
    stats.top_speakers?.length > 0 && e(
      'div',
      { className: 'stats-section' },
      e('div', { className: 'stats-section__title' }, 'Топ спикеров'),
      e(
        'div',
        { className: 'rank-list' },
        stats.top_speakers.map(({ speaker, count }, idx) =>
          e(
            'div',
            { key: speaker.id, className: 'rank-item' },
            e('div', { className: `rank-num${idx < 3 ? ' top3' : ''}` }, idx + 1),
            e(
              'div',
              { className: 'rank-info' },
              e('div', { className: 'rank-info__name' }, speaker.name),
              speaker.role && e('div', { className: 'rank-info__role' }, speaker.role)
            ),
            e('div', { className: 'rank-count' }, count)
          )
        )
      )
    ),

    // Expertise tags breakdown
    tagItems.length > 0 && e(
      'div',
      { className: 'stats-section' },
      e('div', { className: 'stats-section__title' }, 'По экспертизе'),
      e(BarChart, { items: tagItems, maxValue: maxTag })
    ),

    // Monthly trend
    monthlyItems.length > 0 && e(
      'div',
      { className: 'stats-section', style: { marginBottom: 12 } },
      e('div', { className: 'stats-section__title' }, 'По месяцам (последние 12)'),
      e(BarChart, { items: monthlyItems, maxValue: maxMonthly })
    )
  );
}
