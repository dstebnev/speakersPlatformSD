import { DIRECTIONS } from './directions.js';

const e = React.createElement;
const { useState, useEffect } = React;

const APP_CFG = window.APP_CONFIG || { mode: 'prod', admins: [] };
const ALLOWED_USERS = APP_CFG.admins;

function SpeakerForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl || '');
  const [uploading, setUploading] = useState(false);

  const uploadFile = async f => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', f);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setPhotoUrl(data.url);
    setUploading(false);
  };

  return e('form', { className: 'admin-form', onSubmit: ev => { ev.preventDefault(); onSubmit({ ...initial, name, description, photoUrl }); } },
    e('div', null,
      e('label', null, 'Имя'),
      e('input', { value: name, onChange: ev => setName(ev.target.value) })
    ),
    e('div', null,
      e('label', null, 'Описание'),
      e('textarea', { value: description, onChange: ev => setDescription(ev.target.value) })
    ),
    e('div', null,
      e('label', null, 'Фото URL'),
      e('input', { value: photoUrl, onChange: ev => setPhotoUrl(ev.target.value) })
    ),
    e('div', null,
      uploading ? e('div', null, 'Загрузка фото...') :
      e('input', { type: 'file', onChange: ev => ev.target.files[0] && uploadFile(ev.target.files[0]) })
    ),
    e('button', { type: 'submit', disabled: uploading || !photoUrl }, 'Сохранить'),
    e('button', { type: 'button', onClick: onCancel }, 'Отмена')
  );
}

function TalkForm({ initial = {}, speakers, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial.title || '');
  const [speakerId, setSpeakerId] = useState(initial.speakerId || (speakers[0]?.id || ''));
  const [description, setDescription] = useState(initial.description || '');
  const [eventName, setEventName] = useState(initial.eventName || '');
  const [direction, setDirection] = useState(initial.direction || 'frontend');
  const [date, setDate] = useState(initial.date || '');
  const [registrationLink, setRegistrationLink] = useState(initial.registrationLink || '');
  const [recordingLink, setRecordingLink] = useState(initial.recordingLink || '');

  const status = date && new Date(date) < new Date().setHours(0,0,0,0) ? 'past' : 'upcoming';

  const handleSubmit = ev => {
    ev.preventDefault();
    if (!speakerId || !title.trim() || !eventName.trim() || !direction || !date) {
      alert('Заполните обязательные поля');
      return;
    }
    onSubmit({
      ...initial,
      title,
      speakerId,
      description,
      eventName,
      direction,
      status,
      date,
      registrationLink,
      recordingLink,
    });
  };

  return e('form', { className: 'admin-form', onSubmit: handleSubmit },
    e('div', null,
      e('label', null, 'Спикер'),
      e('select', { value: speakerId, onChange: ev => setSpeakerId(ev.target.value), required: true },
        speakers.map(s => e('option', { key: s.id, value: s.id }, s.name))
      )
    ),
    e('div', null,
      e('label', null, 'Название'),
      e('input', { value: title, onChange: ev => setTitle(ev.target.value), required: true })
    ),
    e('div', null,
      e('label', null, 'Описание'),
      e('textarea', { value: description, onChange: ev => setDescription(ev.target.value) })
    ),
    e('div', null,
      e('label', null, 'Мероприятие'),
      e('input', { value: eventName, onChange: ev => setEventName(ev.target.value), required: true })
    ),
    e('div', null,
      e('label', null, 'Направление'),
      e('select', { value: direction, onChange: ev => setDirection(ev.target.value), required: true },
        DIRECTIONS.map(d => e('option', { key: d, value: d }, d))
      )
    ),
    e('div', null,
      e('label', null, 'Дата'),
      e('input', { type: 'date', value: date, onChange: ev => setDate(ev.target.value), required: true })
    ),
    status === 'upcoming' && e('div', null,
      e('label', null, 'Ссылка регистрации'),
      e('input', { value: registrationLink, onChange: ev => setRegistrationLink(ev.target.value) })
    ),
    status === 'past' && e('div', null,
      e('label', null, 'Ссылка записи'),
      e('input', { value: recordingLink, onChange: ev => setRecordingLink(ev.target.value) })
    ),
    e('button', { type: 'submit' }, 'Сохранить'),
    e('button', { type: 'button', onClick: onCancel }, 'Отмена')
  );
}

function AdminApp() {
  const [username, setUsername] = useState('');
  const [authorized, setAuthorized] = useState(false);

  const [speakers, setSpeakers] = useState([]);
  const [talks, setTalks] = useState([]);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [editingTalk, setEditingTalk] = useState(null);
  const [tab, setTab] = useState('speakers');
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const tg = window.Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      if (user) {
        setUsername(user.username);
      }
      if (APP_CFG.mode === 'debug') {
        setAuthorized(true);
      } else if (user) {
        setAuthorized(ALLOWED_USERS.includes(user.username));
      }
      tg?.expand();
      try {
        const [speakersRes, talksRes] = await Promise.all([
          fetch('/api/speakers'),
          fetch('/api/talks'),
        ]);
        if (!speakersRes.ok || !talksRes.ok) throw new Error('Fetch error');
        const [speakersData, talksData] = await Promise.all([
          speakersRes.json(),
          talksRes.json(),
        ]);
        setSpeakers(speakersData);
        setTalks(talksData);
      } catch (err) {
        setError('Не удалось загрузить данные');
      }
    };
    load();
  }, []);

  const saveSpeaker = async data => {
    try {
      if (data.id) {
        const res = await fetch('/api/speakers/' + data.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Fetch error');
        const updated = await res.json();
        setSpeakers(speakers.map(s => s.id === updated.id ? updated : s));
      } else {
        const res = await fetch('/api/speakers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Fetch error');
        const created = await res.json();
        setSpeakers([...speakers, created]);
      }
      setEditingSpeaker(null);
    } catch (err) {
      setError('Не удалось сохранить спикера');
    }
  };

  const deleteSpeaker = async id => {
    try {
      const res = await fetch('/api/speakers/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fetch error');
      setSpeakers(speakers.filter(s => s.id !== id));
    } catch (err) {
      setError('Не удалось удалить спикера');
    }
  };

  const saveTalk = async data => {
    try {
      if (data.id) {
        const res = await fetch('/api/talks/' + data.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Fetch error');
        const updated = await res.json();
        setTalks(talks.map(t => t.id === updated.id ? updated : t));
      } else {
        const res = await fetch('/api/talks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Fetch error');
        const created = await res.json();
        setTalks([...talks, created]);
      }
      setEditingTalk(null);
    } catch (err) {
      setError('Не удалось сохранить выступление');
    }
  };

  const deleteTalk = async id => {
    try {
      const res = await fetch('/api/talks/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Fetch error');
      setTalks(talks.filter(t => t.id !== id));
    } catch (err) {
      setError('Не удалось удалить выступление');
    }
  };

  if (APP_CFG.mode !== 'debug' && !authorized) {
    return e('div', null, 'Доступ запрещён для ', username || 'guest');
  }

  const speakerSection = editingSpeaker ?
    e(SpeakerForm, { initial: editingSpeaker, onSubmit: saveSpeaker, onCancel: () => setEditingSpeaker(null) }) :
    e('div', { className: 'admin-list' },
      e('button', { onClick: () => setEditingSpeaker({}) }, 'Добавить спикера'),
      speakers.map(s => e('div', { key: s.id, className: 'admin-list-item' },
        e('span', { className: 'admin-item-name' }, s.name),
        e('div', { className: 'admin-actions' },
          e('button', {
            className: 'icon-btn',
            title: 'Редактировать',
            onClick: () => setEditingSpeaker(s)
          }, '✏️'),
          e('button', {
            className: 'icon-btn',
            title: 'Удалить',
            onClick: () => window.confirm('Удалить спикера?') && deleteSpeaker(s.id)
          }, '🗑️')
        )
      ))
    );

  const talkSection = editingTalk ?
    e(TalkForm, { initial: editingTalk, speakers, onSubmit: saveTalk, onCancel: () => setEditingTalk(null) }) :
    e('div', { className: 'admin-list' },
      e('button', { onClick: () => setEditingTalk({}) }, 'Добавить выступление'),
      talks.map(t => e('div', { key: t.id, className: 'admin-list-item' },
        e('span', { className: 'admin-item-name' }, `${t.title} (${speakers.find(s => s.id === t.speakerId)?.name || ''})`),
        e('div', { className: 'admin-actions' },
          e('button', {
            className: 'icon-btn',
            title: 'Редактировать',
            onClick: () => setEditingTalk(t)
          }, '✏️'),
          e('button', {
            className: 'icon-btn',
            title: 'Удалить',
            onClick: () => window.confirm('Удалить выступление?') && deleteTalk(t.id)
          }, '🗑️')
        )
      ))
    );

  return e('div', null,
    error && e('div', { className: 'error' }, error),
    e('div', { className: 'admin-tabs' },
      e('button', { onClick: () => setTab('speakers') }, 'Спикеры'),
      e('button', { onClick: () => setTab('talks') }, 'Выступления')
    ),
    tab === 'speakers' ? speakerSection : talkSection
  );
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(e(AdminApp));
