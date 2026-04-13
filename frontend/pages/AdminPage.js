import { Modal } from '../components/Modal.js';
import { TagsMultiSelect } from '../components/TagsMultiSelect.js';
import { SpeakersMultiSelect } from '../components/SpeakersMultiSelect.js';

const e = React.createElement;
const { useState, useEffect, useCallback } = React;

const FORMAT_OPTIONS = [
  { value: 'speech',  label: 'Выступление' },
  { value: 'article', label: 'Статья' },
  { value: 'digital', label: 'Digital' },
];

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Speaker Form ──────────────────────────────────────────────────────────────
function SpeakerForm({ initial = {}, expertiseTags, onSave, onDelete, saving }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    role: initial.role || '',
    email: initial.email || '',
    telegram: initial.telegram || '',
    expertise: initial.expertise || [],
  });
  const set = key => ev => setForm(f => ({ ...f, [key]: ev.target.value }));

  return e(
    React.Fragment,
    null,
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Имя Фамилия *'),
      e('input', { className: 'field-input', value: form.name, onChange: set('name'), placeholder: 'Иван Иванов' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Роль'),
      e('input', { className: 'field-input', value: form.role, onChange: set('role'), placeholder: 'Frontend-разработчик' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Email'),
      e('input', { className: 'field-input', type: 'email', value: form.email, onChange: set('email'), placeholder: 'ivan@company.ru' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Telegram'),
      e('input', { className: 'field-input', value: form.telegram, onChange: set('telegram'), placeholder: '@username' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Экспертность'),
      e(TagsMultiSelect, {
        value: form.expertise,
        onChange: tags => setForm(f => ({ ...f, expertise: tags })),
        options: expertiseTags,
        placeholder: 'Выберите темы...',
      })
    ),
    e('button', {
      className: 'btn btn-primary',
      disabled: saving || !form.name.trim(),
      onClick: () => onSave(form),
    }, saving ? 'Сохранение...' : 'Сохранить'),
    initial.id && e('button', {
      className: 'btn btn-danger',
      style: { marginTop: 8 },
      disabled: saving,
      onClick: () => onDelete(),
    }, 'Удалить спикера')
  );
}

// ─── Activity Form ─────────────────────────────────────────────────────────────
function ActivityForm({ initial = {}, expertiseTags, speakers, onSave, onDelete, saving }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    format: initial.format || 'speech',
    description: initial.description || '',
    speaker_ids: initial.speaker_ids || [],
    date: initial.date || '',
    event: initial.event || '',
    expertise_tags: initial.expertise_tags || [],
  });
  const set = key => ev => setForm(f => ({ ...f, [key]: ev.target.value }));

  return e(
    React.Fragment,
    null,
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Название *'),
      e('input', { className: 'field-input', value: form.name, onChange: set('name'), placeholder: 'Название активности' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Формат'),
      e('select', { className: 'field-select', value: form.format, onChange: set('format') },
        FORMAT_OPTIONS.map(opt => e('option', { key: opt.value, value: opt.value }, opt.label))
      )
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Спикеры / Авторы'),
      e(SpeakersMultiSelect, {
        value: form.speaker_ids,
        onChange: ids => setForm(f => ({ ...f, speaker_ids: ids })),
        speakers,
      })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Описание'),
      e('textarea', { className: 'field-textarea', value: form.description, onChange: set('description'), placeholder: 'Краткое описание активности...' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Мероприятие / Площадка'),
      e('input', { className: 'field-input', value: form.event, onChange: set('event'), placeholder: 'HighLoad++, Habr...' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Дата'),
      e('input', { className: 'field-input', type: 'date', value: form.date, onChange: set('date') })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Тема экспертности'),
      e(TagsMultiSelect, {
        value: form.expertise_tags,
        onChange: tags => setForm(f => ({ ...f, expertise_tags: tags })),
        options: expertiseTags,
        placeholder: 'Выберите темы...',
      })
    ),
    e('button', {
      className: 'btn btn-primary',
      disabled: saving || !form.name.trim(),
      onClick: () => onSave(form),
    }, saving ? 'Сохранение...' : 'Сохранить'),
    initial.id && e('button', {
      className: 'btn btn-danger',
      style: { marginTop: 8 },
      disabled: saving,
      onClick: () => onDelete(),
    }, 'Удалить активность')
  );
}

// ─── Tag Form ──────────────────────────────────────────────────────────────────
function TagForm({ onSave, saving }) {
  const [name, setName] = useState('');
  return e(
    React.Fragment,
    null,
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Название тега *'),
      e('input', {
        className: 'field-input',
        value: name,
        onChange: ev => setName(ev.target.value),
        placeholder: 'Frontend, Backend, DevOps...',
        onKeyDown: ev => { if (ev.key === 'Enter' && name.trim()) onSave(name.trim()); },
      })
    ),
    e('button', {
      className: 'btn btn-primary',
      disabled: saving || !name.trim(),
      onClick: () => onSave(name.trim()),
    }, saving ? 'Сохранение...' : 'Добавить тег')
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────────
function Fab({ onClick }) {
  return e(
    'button',
    { className: 'add-fab', onClick, 'aria-label': 'Добавить' },
    e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5 },
      e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 4v16m8-8H4' })
    )
  );
}

// ─── Icon buttons ──────────────────────────────────────────────────────────────
const EditIcon = e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' })
);
const TrashIcon = e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
  e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' })
);

// ─── Admin Page ────────────────────────────────────────────────────────────────
export function AdminPage() {
  const [tab, setTab] = useState('activities'); // activities | speakers | tags
  const [activities, setActivities] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type, item? }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [acts, spks, tags] = await Promise.all([
        api('GET', '/api/activities'),
        api('GET', '/api/speakers'),
        api('GET', '/api/tags'),
      ]);
      setActivities(acts);
      setSpeakers(spks);
      setExpertiseTags(tags);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => setModal(null);

  // ─── Speakers CRUD ──
  const saveSpeaker = async form => {
    setSaving(true);
    try {
      if (modal?.item?.id) {
        await api('PUT', `/api/speakers/${modal.item.id}`, form);
      } else {
        await api('POST', '/api/speakers', form);
      }
      await load();
      closeModal();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const deleteSpeaker = async () => {
    if (!window.confirm('Удалить спикера?')) return;
    setSaving(true);
    try {
      await api('DELETE', `/api/speakers/${modal.item.id}`);
      await load();
      closeModal();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  // ─── Activities CRUD ──
  const saveActivity = async form => {
    setSaving(true);
    try {
      if (modal?.item?.id) {
        await api('PUT', `/api/activities/${modal.item.id}`, form);
      } else {
        await api('POST', '/api/activities', form);
      }
      await load();
      closeModal();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const deleteActivity = async () => {
    if (!window.confirm('Удалить активность?')) return;
    setSaving(true);
    try {
      await api('DELETE', `/api/activities/${modal.item.id}`);
      await load();
      closeModal();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  // ─── Tags CRUD ──
  const saveTag = async name => {
    setSaving(true);
    try {
      await api('POST', '/api/tags', { name });
      await load();
      closeModal();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const deleteTag = async id => {
    if (!window.confirm('Удалить тег?')) return;
    try {
      await api('DELETE', `/api/tags/${id}`);
      await load();
    } catch (err) { alert(err.message); }
  };

  // ─── Render ──
  const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital' };
  const speakerMap = Object.fromEntries(speakers.map(s => [s.id, s]));

  return e(
    'div',
    { className: 'page-scroll' },
    e('div', { className: 'page-header' }, e('div', { className: 'page-header__title' }, 'Администрирование')),

    // Tabs
    e(
      'div',
      { className: 'admin-tabs' },
      e('button', { className: `admin-tab${tab === 'activities' ? ' active' : ''}`, onClick: () => setTab('activities') }, 'Активности'),
      e('button', { className: `admin-tab${tab === 'speakers' ? ' active' : ''}`, onClick: () => setTab('speakers') }, 'Спикеры'),
      e('button', { className: `admin-tab${tab === 'tags' ? ' active' : ''}`, onClick: () => setTab('tags') }, 'Теги')
    ),

    loading
      ? e('div', { className: 'loader' }, e('div', { className: 'spinner' }))
      : null,

    // ── Activities tab ──
    !loading && tab === 'activities' && e(
      'div',
      { className: 'admin-list' },
      activities.length === 0
        ? e('div', { className: 'empty-state' }, e('div', { className: 'empty-state__icon' }, '📋'), e('div', { className: 'empty-state__text' }, 'Нет активностей'))
        : activities.map(a =>
            e('div', { key: a.id, className: 'admin-item' },
              e('div', { className: 'admin-item__info' },
                e('div', { className: 'admin-item__title' }, a.name),
                e('div', { className: 'admin-item__sub' },
                  [
                    FORMAT_LABELS[a.format],
                    a.event,
                    a.date,
                    (a.speaker_ids || []).map(id => speakerMap[id]?.name).filter(Boolean).join(', '),
                  ].filter(Boolean).join(' · ')
                )
              ),
              e('div', { className: 'admin-item__actions' },
                e('button', { className: 'icon-btn', onClick: () => setModal({ type: 'activity', item: a }) }, EditIcon)
              )
            )
          )
    ),

    // ── Speakers tab ──
    !loading && tab === 'speakers' && e(
      'div',
      { className: 'admin-list' },
      speakers.length === 0
        ? e('div', { className: 'empty-state' }, e('div', { className: 'empty-state__icon' }, '👤'), e('div', { className: 'empty-state__text' }, 'Нет спикеров'))
        : speakers.map(s =>
            e('div', { key: s.id, className: 'admin-item' },
              e('div', { className: 'admin-item__info' },
                e('div', { className: 'admin-item__title' }, s.name),
                e('div', { className: 'admin-item__sub' },
                  [s.role, (s.expertise || []).join(', ')].filter(Boolean).join(' · ')
                )
              ),
              e('div', { className: 'admin-item__actions' },
                e('button', { className: 'icon-btn', onClick: () => setModal({ type: 'speaker', item: s }) }, EditIcon)
              )
            )
          )
    ),

    // ── Tags tab ──
    !loading && tab === 'tags' && e(
      'div',
      { className: 'admin-list' },
      expertiseTags.length === 0
        ? e('div', { className: 'empty-state' }, e('div', { className: 'empty-state__icon' }, '🏷️'), e('div', { className: 'empty-state__text' }, 'Нет тегов'))
        : expertiseTags.map(t =>
            e('div', { key: t.id, className: 'admin-item' },
              e('div', { className: 'admin-item__info' }, e('div', { className: 'admin-item__title' }, t.name)),
              e('div', { className: 'admin-item__actions' },
                e('button', { className: 'icon-btn icon-btn--danger', onClick: () => deleteTag(t.id) }, TrashIcon)
              )
            )
          )
    ),

    // FAB
    e(Fab, {
      onClick: () => {
        if (tab === 'activities') setModal({ type: 'activity' });
        else if (tab === 'speakers') setModal({ type: 'speaker' });
        else setModal({ type: 'tag' });
      },
    }),

    // Modal
    modal && modal.type === 'speaker' && e(
      Modal,
      { title: modal.item ? 'Редактировать спикера' : 'Новый спикер', onClose: closeModal },
      e(SpeakerForm, {
        initial: modal.item || {},
        expertiseTags,
        onSave: saveSpeaker,
        onDelete: deleteSpeaker,
        saving,
      })
    ),

    modal && modal.type === 'activity' && e(
      Modal,
      { title: modal.item ? 'Редактировать активность' : 'Новая активность', onClose: closeModal },
      e(ActivityForm, {
        initial: modal.item || {},
        expertiseTags,
        speakers,
        onSave: saveActivity,
        onDelete: deleteActivity,
        saving,
      })
    ),

    modal && modal.type === 'tag' && e(
      Modal,
      { title: 'Новый тег экспертизы', onClose: closeModal },
      e(TagForm, { onSave: saveTag, saving })
    )
  );
}
