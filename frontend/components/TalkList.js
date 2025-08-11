const e = React.createElement;

const formatDate = d => {
  const date = new Date(d);
  if (isNaN(date)) return d;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

export function TalkList({ items }) {
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
          e('span', { className: 'list-speaker' }, (t.speakers || []).map(s => s.name).join(', ')),
          ' — ',
          e('span', { className: 'list-title' }, t.title)
        ),
        e(
          'div',
          null,
          e('span', { className: 'list-date' }, formatDate(t.date)),
          ' | ',
          e('span', { className: 'list-event' }, t.eventName),
          ' | ',
          e('span', { className: 'list-link' }, link)
        )
      );
    })
  );
}
