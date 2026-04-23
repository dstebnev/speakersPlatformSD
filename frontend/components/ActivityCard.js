const e = React.createElement;

// Markdown inline rendering (bold/italic)
function parseInline(line, lineIdx) {
  const segments = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0, match, i = 0;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) segments.push(line.slice(last, match.index));
    if (match[1] !== undefined) segments.push(e('strong', { key: `${lineIdx}b${i++}` }, match[1]));
    else                        segments.push(e('em',     { key: `${lineIdx}i${i++}` }, match[2]));
    last = match.index + match[0].length;
  }
  if (last < line.length) segments.push(line.slice(last));
  return segments;
}

function renderDescription(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const nodes = [];
  lines.forEach((line, idx) => {
    if (idx > 0) nodes.push(e('br', { key: `br${idx}` }));
    parseInline(line, idx).forEach(n => nodes.push(n));
  });
  return nodes;
}

const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital' };
const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function fmtDay(iso) {
  const d = new Date(iso + 'T00:00:00');
  return {
    d: String(d.getDate()).padStart(2, '0'),
    m: MONTHS_RU[d.getMonth()],
    y: String(d.getFullYear()),
  };
}

function speakerInitials(name) {
  return (name || '').split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
}

export function ActivityCard({ activity, speakers = [], isOpen, onToggle }) {
  const fmt = activity.format || 'speech';
  const dt = activity.date ? fmtDay(activity.date) : null;
  const speakerNames = speakers.map(s => s.name).join(', ');

  return e('article', {
    className: 'act' + (isOpen ? ' is-open' : ''),
    onClick: () => onToggle && onToggle(activity.id),
  },

    // Date column
    e('div', { className: 'act__date' },
      dt
        ? [
            e('span', { key: 'd', className: 'act__date-day' }, dt.d),
            e('span', { key: 'm', className: 'act__date-mo' }, dt.m),
            e('span', { key: 'y', className: 'act__date-yr' }, dt.y),
          ]
        : e('span', { className: 'act__date-mo' }, '—')),

    // Body
    e('div', { className: 'act__body' },
      e('h3', { className: 'act__title' }, activity.name),

      e('div', { className: 'act__meta' },
        e('span', null,
          e('span', { className: `fmt-dot fmt-dot--${fmt}` }),
          FORMAT_LABELS[fmt] || fmt),
        activity.event && e('span', { className: 'act__meta-event' }, '· ', activity.event)),

      speakers.length > 0 && e('div', { className: 'act__speakers' },
        e('div', { className: 'act__speakers-av' },
          speakers.slice(0, 3).map(s => e('div', {
            key: s.id, className: 'av-sm',
            style: { background: 'var(--accent-soft)', color: 'var(--accent-ink)' },
          }, speakerInitials(s.name)))),
        speakerNames),

      (activity.expertise_tags || []).length > 0 && e('div', { className: 'act__tags' },
        activity.expertise_tags.map(t => e('span', { key: t, className: 'tag' }, t))),

      // Expandable — uses CSS grid-template-rows animation
      e('div', { className: 'act__expand' },
        e('div', { className: 'act__expand-inner' },
          activity.description && e('p', { className: 'act__desc' },
            ...renderDescription(activity.description)),
          activity.link && e('div', { className: 'act__links' },
            e('a', {
              href: activity.link,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'act__link',
              onClick: ev => ev.stopPropagation(),
            },
              'Открыть ',
              e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, width: 12, height: 12 },
                e('path', { d: 'M5 12h14M13 6l6 6-6 6', strokeLinecap: 'round', strokeLinejoin: 'round' }))))))),

    // Chevron
    e('div', { className: 'act__chev' },
      e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, width: 18, height: 18 },
        e('path', { d: 'm6 9 6 6 6-6', strokeLinecap: 'round', strokeLinejoin: 'round' }))));
}
