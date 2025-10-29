const e = React.createElement;

const formatDate = d => {
  const date = new Date(d);
  if (isNaN(date)) return d;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

export function TalkList({ items, speakers = [] }) {
  return e(
    'ul',
    { className: 'talk-list' },
    items.map(t => {
      const rawStatus = (t.status || '').toLowerCase();
      const isPast = rawStatus ? rawStatus === 'past' : new Date(t.date) < new Date();
      const link =
        t.link &&
        e(
          'a',
          { href: t.link, target: '_blank', rel: 'noopener' },
          isPast ? 'Запись' : 'Регистрация'
        );
      const ids = (t.speaker_ids || t.speakerIds || []).map(String);
      const speakerNames = speakers
        .filter(s => ids.includes(String(s.id)))
        .map(s => s.name)
        .join(', ');
      const meta = [
        e('span', { className: 'list-date' }, formatDate(t.date)),
        ' | ',
        e('span', { className: 'list-event' }, t.event),
      ];
      if (link) {
        meta.push(' | ');
        meta.push(e('span', { className: 'list-link' }, link));
      }
      if (t.rate !== null && t.rate !== undefined) {
        meta.push(' | ');
        meta.push(`Рейтинг: ${t.rate}`);
      }
      return e(
        'li',
        { key: t.id },
        e(
          'div',
          null,
          e('span', { className: 'list-speaker' }, speakerNames),
          ' — ',
          e('span', { className: 'list-title' }, t.name)
        ),
        e(
          'div',
          null,
          ...meta
        )
      );
    })
  );
}
