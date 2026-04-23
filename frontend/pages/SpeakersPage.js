import { SpeakerCard } from '../components/SpeakerCard.js';
import { Modal } from '../components/Modal.js';

const e = React.createElement;
const { useState, useEffect, useMemo } = React;

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

function getTgUser() {
  try {
    const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!u) return '';
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
    return u.username ? `${name} (@${u.username})` : name;
  } catch {
    return '';
  }
}

const MIC_ICON = e('svg', {
  xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18,
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
},
  e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z' }),
  e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M19 10v2a7 7 0 0 1-14 0v-2' }),
  e('line', { strokeLinecap: 'round', x1: 12, y1: 19, x2: 12, y2: 22 }),
  e('line', { strokeLinecap: 'round', x1: 8, y1: 22, x2: 16, y2: 22 }),
);

function SpeakerRequestModal({ onClose }) {
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const handleSubmit = async () => {
    if (!contact.trim() || !message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/speaker-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim(), message: message.trim(), tg_user: getTgUser() }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return e(Modal, { title: 'Заявка отправлена', onClose },
      e('div', { className: 'empty-state', style: { padding: '24px 0' } },
        e('div', { className: 'empty-state__icon' }, '🎉'),
        e('div', { className: 'empty-state__text' }, 'Ваша заявка отправлена DevRel-менеджерам. Они скоро свяжутся с вами!'),
      ),
      e('button', { className: 'btn btn-primary', onClick: onClose }, 'Закрыть'),
    );
  }

  return e(Modal, { title: 'Хочу стать спикером', onClose },
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Ваш контакт'),
      e('input', {
        className: 'field-input',
        type: 'text',
        placeholder: 'Telegram, email или телефон',
        value: contact,
        onChange: ev => setContact(ev.target.value),
        disabled: status === 'sending',
        autoFocus: true,
      }),
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Расскажите о себе'),
      e('textarea', {
        className: 'field-textarea',
        placeholder: 'Тема доклада, опыт, ссылки на предыдущие выступления...',
        value: message,
        onChange: ev => setMessage(ev.target.value),
        disabled: status === 'sending',
        rows: 5,
      }),
    ),
    status === 'error' && e('p', { className: 'speaker-request-error' }, 'Ошибка отправки. Попробуйте ещё раз.'),
    e('button', {
      className: 'btn btn-primary',
      onClick: handleSubmit,
      disabled: !contact.trim() || !message.trim() || status === 'sending',
    }, status === 'sending' ? 'Отправляем...' : 'Отправить заявку'),
  );
}

export function SpeakersPage() {
  const [speakers, setSpeakers] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);

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
        ),
    e('button', {
      className: 'speaker-cta-btn',
      onClick: () => setShowRequestModal(true),
    }, MIC_ICON, 'Хочу стать спикером'),
    showRequestModal && e(SpeakerRequestModal, { onClose: () => setShowRequestModal(false) }),
  );
}
