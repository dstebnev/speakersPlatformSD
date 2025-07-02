import { DIRECTIONS } from './directions.js';

const e = React.createElement;
const { useState, useEffect } = React;

const ALLOWED_USERS = ['admin'];

function SpeakerForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl || '');

  const uploadFile = async f => {
    const fd = new FormData();
    fd.append('file', f);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setPhotoUrl(data.url);
  };

  return e('form', { onSubmit: ev => { ev.preventDefault(); onSubmit({ ...initial, name, description, photoUrl }); } },
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
      e('input', { type: 'file', onChange: ev => ev.target.files[0] && uploadFile(ev.target.files[0]) })
    ),
    e('button', { type: 'submit' }, 'Сохранить'),
    e('button', { type: 'button', onClick: onCancel }, 'Отмена')
  );
}

function TalkForm({ initial = {}, speakers, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial.title || '');
  const [speakerId, setSpeakerId] = useState(initial.speakerId || (speakers[0]?.id || ''));
  const [description, setDescription] = useState(initial.description || '');
  const [eventName, setEventName] = useState(initial.eventName || '');
  const [direction, setDirection] = useState(initial.direction || 'frontend');
  const [status, setStatus] = useState(initial.status || 'upcoming');
  const [date, setDate] = useState(initial.date || '');
  const [registrationLink, setRegistrationLink] = useState(initial.registrationLink || '');
  const [recordingLink, setRecordingLink] = useState(initial.recordingLink || '');

  return e('form', { onSubmit: ev => { ev.preventDefault(); onSubmit({ ...initial, title, speakerId, description, eventName, direction, status, date, registrationLink, recordingLink }); } },
    e('div', null,
      e('label', null, 'Спикер'),
      e('select', { value: speakerId, onChange: ev => setSpeakerId(ev.target.value) },
        speakers.map(s => e('option', { key: s.id, value: s.id }, s.name))
      )
    ),
    e('div', null,
      e('label', null, 'Название'),
      e('input', { value: title, onChange: ev => setTitle(ev.target.value) })
    ),
    e('div', null,
      e('label', null, 'Описание'),
      e('textarea', { value: description, onChange: ev => setDescription(ev.target.value) })
    ),
    e('div', null,
      e('label', null, 'Мероприятие'),
      e('input', { value: eventName, onChange: ev => setEventName(ev.target.value) })
    ),
    e('div', null,
      e('label', null, 'Направление'),
      e('select', { value: direction, onChange: ev => setDirection(ev.target.value) },
        DIRECTIONS.map(d => e('option', { key: d, value: d }, d))
      )
    ),
    e('div', null,
      e('label', null, 'Статус'),
      e('select', { value: status, onChange: ev => setStatus(ev.target.value) },
        e('option', { value: 'upcoming' }, 'upcoming'),
        e('option', { value: 'past' }, 'past')
      )
    ),
    e('div', null,
      e('label', null, 'Дата'),
      e('input', { type: 'date', value: date, onChange: ev => setDate(ev.target.value) })
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

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user) {
      setUsername(user.username);
      setAuthorized(ALLOWED_USERS.includes(user.username));
    }
    tg?.expand();
    fetch('/api/speakers').then(r => r.json()).then(setSpeakers);
    fetch('/api/talks').then(r => r.json()).then(setTalks);
  }, []);

  const saveSpeaker = async data => {
    if (data.id) {
      const res = await fetch('/api/speakers/' + data.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const updated = await res.json();
      setSpeakers(speakers.map(s => s.id === updated.id ? updated : s));
    } else {
      const res = await fetch('/api/speakers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const created = await res.json();
      setSpeakers([...speakers, created]);
    }
    setEditingSpeaker(null);
  };

  const deleteSpeaker = async id => {
    await fetch('/api/speakers/' + id, { method: 'DELETE' });
    setSpeakers(speakers.filter(s => s.id !== id));
  };

  const saveTalk = async data => {
    if (data.id) {
      const res = await fetch('/api/talks/' + data.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const updated = await res.json();
      setTalks(talks.map(t => t.id === updated.id ? updated : t));
    } else {
      const res = await fetch('/api/talks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const created = await res.json();
      setTalks([...talks, created]);
    }
    setEditingTalk(null);
  };

  const deleteTalk = async id => {
    await fetch('/api/talks/' + id, { method: 'DELETE' });
    setTalks(talks.filter(t => t.id !== id));
  };

  // if (!authorized) {
  //   return e('div', null, 'Доступ запрещен для ', username || 'guest');
  // }

  const speakerSection = editingSpeaker ?
    e(SpeakerForm, { initial: editingSpeaker, onSubmit: saveSpeaker, onCancel: () => setEditingSpeaker(null) }) :
    e('div', null,
      e('button', { onClick: () => setEditingSpeaker({}) }, 'Добавить спикера'),
      speakers.map(s => e('div', { key: s.id },
        e('span', null, s.name),
        ' ',
        e('button', { onClick: () => setEditingSpeaker(s) }, 'Редактировать'),
        ' ',
        e('button', { onClick: () => deleteSpeaker(s.id) }, 'Удалить')
      ))
    );

  const talkSection = editingTalk ?
    e(TalkForm, { initial: editingTalk, speakers, onSubmit: saveTalk, onCancel: () => setEditingTalk(null) }) :
    e('div', null,
      e('button', { onClick: () => setEditingTalk({}) }, 'Добавить выступление'),
      talks.map(t => e('div', { key: t.id },
        e('span', null, t.title),
        ' (', speakers.find(s => s.id === t.speakerId)?.name || '', ') ',
        e('button', { onClick: () => setEditingTalk(t) }, 'Редактировать'),
        ' ',
        e('button', { onClick: () => deleteTalk(t.id) }, 'Удалить')
      ))
    );

  return e('div', null,
    e('div', null,
      e('button', { onClick: () => setTab('speakers') }, 'Спикеры'),
      e('button', { onClick: () => setTab('talks') }, 'Выступления')
    ),
    tab === 'speakers' ? speakerSection : talkSection
  );
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(e(AdminApp));
