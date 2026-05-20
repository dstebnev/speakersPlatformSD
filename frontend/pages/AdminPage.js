import { Modal } from '../components/Modal.js';
import { TagsMultiSelect } from '../components/TagsMultiSelect.js';
import { SpeakersMultiSelect } from '../components/SpeakersMultiSelect.js';

const e = React.createElement;
const { useState, useEffect, useCallback } = React;

const FORMAT_OPTIONS = [
  { value: 'speech',  label: 'Выступление' },
  { value: 'article', label: 'Статья' },
  { value: 'digital', label: 'Digital' },
  { value: 'devrel',  label: 'Деврел' },
];

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Photo Upload ──────────────────────────────────────────────────────────────
function PhotoUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = React.useRef(null);

  const handleFile = async ev => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const { url } = await res.json();
      onChange(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
      ev.target.value = '';
    }
  };

  return e(
    'div',
    { className: 'photo-upload' },
    // Preview / placeholder
    e(
      'div',
      {
        className: 'photo-upload__preview',
        onClick: () => !uploading && inputRef.current?.click(),
        style: { cursor: uploading ? 'default' : 'pointer' },
      },
      value
        ? e('img', { src: value, alt: 'Фото', className: 'photo-upload__img' })
        : e('div', { className: 'photo-upload__placeholder' },
            e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 },
              e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
            )
          ),
      uploading && e('div', { className: 'photo-upload__overlay' }, e('div', { className: 'spinner' }))
    ),
    e(
      'div',
      { className: 'photo-upload__actions' },
      e('button', {
        type: 'button',
        className: 'btn btn-ghost',
        style: { flex: 1 },
        disabled: uploading,
        onClick: () => inputRef.current?.click(),
      }, uploading ? 'Загрузка...' : value ? 'Заменить фото' : 'Добавить фото'),
      value && e('button', {
        type: 'button',
        className: 'btn btn-danger',
        style: { width: 'auto', padding: '11px 14px' },
        disabled: uploading,
        onClick: () => onChange(''),
      }, '×')
    ),
    e('input', {
      ref: inputRef,
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
      style: { display: 'none' },
      onChange: handleFile,
    })
  );
}

// ─── Speaker Form ──────────────────────────────────────────────────────────────
function SpeakerForm({ initial = {}, expertiseTags, onSave, onDelete, saving }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    role: initial.role || '',
    email: initial.email || '',
    telegram: initial.telegram || '',
    mattermost: initial.mattermost || '',
    expertise: initial.expertise || [],
    photoUrl: initial.photoUrl || '',
  });
  const set = key => ev => setForm(f => ({ ...f, [key]: ev.target.value }));

  return e(
    React.Fragment,
    null,
    // Photo
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Фото'),
      e(PhotoUpload, {
        value: form.photoUrl,
        onChange: url => setForm(f => ({ ...f, photoUrl: url })),
      })
    ),
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
      e('label', { className: 'field-label' }, 'Mattermost'),
      e('input', { className: 'field-input', value: form.mattermost, onChange: set('mattermost'), placeholder: '@username' })
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
    }, 'Удалить эксперта')
  );
}

// ─── Activity Form ─────────────────────────────────────────────────────────────
export function ActivityForm({ initial = {}, expertiseTags, speakers, onSave, onDelete, saving, onCreateSpeaker }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    format: initial.format || 'speech',
    description: initial.description || '',
    speaker_ids: initial.speaker_ids || [],
    date: initial.date || '',
    date_end: initial.date_end || '',
    event: initial.event || '',
    expertise_tags: initial.expertise_tags || [],
    link: initial.link || '',
  });
  const set = key => ev => setForm(f => ({ ...f, [key]: ev.target.value }));
  const isDevrel = form.format === 'devrel';

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
      e('label', { className: 'field-label' }, 'Эксперты / Авторы'),
      e(SpeakersMultiSelect, {
        value: form.speaker_ids,
        onChange: ids => setForm(f => ({ ...f, speaker_ids: ids })),
        speakers,
        onCreateSpeaker,
      })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Описание'),
      e('textarea', { className: 'field-textarea', value: form.description, onChange: set('description'), placeholder: 'Краткое описание активности...' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Мероприятие'),
      e('input', { className: 'field-input', value: form.event, onChange: set('event'), placeholder: isDevrel ? 'В рамках какого мероприятия' : 'HighLoad++, Habr...' })
    ),
    e('div', { className: 'field' },
      e('label', { className: 'field-label' }, isDevrel ? 'Дата начала' : 'Дата'),
      e('input', { className: 'field-input', type: 'date', value: form.date, onChange: set('date') })
    ),
    isDevrel && e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Дата окончания'),
      e('input', {
        className: 'field-input', type: 'date', value: form.date_end,
        onChange: set('date_end'),
        min: form.date || undefined,
      })
    ),
    !isDevrel && e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Тема экспертности'),
      e(TagsMultiSelect, {
        value: form.expertise_tags,
        onChange: tags => setForm(f => ({ ...f, expertise_tags: tags })),
        options: expertiseTags,
        placeholder: 'Выберите темы...',
      })
    ),
    !isDevrel && e('div', { className: 'field' },
      e('label', { className: 'field-label' }, 'Ссылка'),
      e('input', { className: 'field-input', value: form.link, onChange: set('link'), placeholder: 'https://...' })
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
function TagForm({ initial = {}, onSave, saving }) {
  const [name, setName] = useState(initial.name || '');
  const isEdit = !!initial.id;
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
        autoFocus: true,
      })
    ),
    e('button', {
      className: 'btn btn-primary',
      disabled: saving || !name.trim(),
      onClick: () => onSave(name.trim()),
    }, saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить тег')
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
  const [cacheClearing, setCacheClearing] = useState(false);

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
    if (!window.confirm('Удалить эксперта?')) return;
    setSaving(true);
    try {
      await api('DELETE', `/api/speakers/${modal.item.id}`);
      await load();
      closeModal();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  // ─── Create speaker on-the-fly (from ActivityForm) ──
  const createSpeaker = async name => {
    try {
      const created = await api('POST', '/api/speakers', { name: name.trim() });
      setSpeakers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'ru')));
      return created.id;
    } catch (err) {
      alert('Ошибка при создании эксперта: ' + err.message);
      return null;
    }
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
      if (modal?.item?.id) {
        await api('PUT', `/api/tags/${modal.item.id}`, { name });
      } else {
        await api('POST', '/api/tags', { name });
      }
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

  const clearCache = async () => {
    if (!window.confirm('Сбросить весь кэш браузера? Страница перезагрузится.')) return;
    setCacheClearing(true);
    try {
      await api('POST', '/api/cache/clear');
      window.location.reload();
    } catch (err) {
      alert('Ошибка при сбросе кэша: ' + err.message);
      setCacheClearing(false);
    }
  };

  // ─── Render ──
  const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital', devrel: 'Деврел' };
  const speakerMap = Object.fromEntries(speakers.map(s => [s.id, s]));

  const RefreshIcon = e('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
    e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }));

  return e(
    'div',
    { className: 'page' },

    // Header
    e('div', { className: 'page__head' },
      e('div', null,
        e('h1', { className: 'page__title' }, 'Администрирование'),
        e('div', { className: 'page__sub' }, 'Управление экспертами, активностями и тегами')),
      e('button', {
        className: 'btn btn-ghost',
        style: { alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6, width: 'auto', padding: '8px 14px' },
        onClick: clearCache,
        disabled: cacheClearing,
      }, RefreshIcon, cacheClearing ? 'Сброс...' : 'Сбросить кэш')),

    // Tabs
    e('div', { className: 'chiprow', style: { marginBottom: 4 } },
      e('button', { className: 'chip' + (tab === 'activities' ? ' is-active' : ''), onClick: () => setTab('activities') }, 'Активности'),
      e('button', { className: 'chip' + (tab === 'speakers' ? ' is-active' : ''), onClick: () => setTab('speakers') }, 'Эксперты'),
      e('button', { className: 'chip' + (tab === 'tags' ? ' is-active' : ''), onClick: () => setTab('tags') }, 'Теги')),

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
        ? e('div', { className: 'empty-state' }, e('div', { className: 'empty-state__icon' }, '👤'), e('div', { className: 'empty-state__text' }, 'Нет экспертов'))
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
                e('button', { className: 'icon-btn', onClick: () => setModal({ type: 'tag', item: t }) }, EditIcon),
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
      { title: modal.item ? 'Редактировать эксперта' : 'Новый эксперт', onClose: closeModal },
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
        onCreateSpeaker: createSpeaker,
      })
    ),

    modal && modal.type === 'tag' && e(
      Modal,
      { title: modal.item ? 'Редактировать тег' : 'Новый тег', onClose: closeModal },
      e(TagForm, { initial: modal.item || {}, onSave: saveTag, saving })
    )
  );
}
