import { DIRECTIONS } from '../directions.js';
import { TAGS } from '../tags.js';
const e = React.createElement;
const { useState } = React;

export function SpeakerForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl || '');
  const [tags, setTags] = useState(initial.tags || []);
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

  return e(
    'form',
    {
      className: 'admin-form',
      onSubmit: ev => {
        ev.preventDefault();
        onSubmit({ ...initial, name, description, photoUrl, tags });
      },
    },
    e('div', null, e('label', null, 'Имя'), e('input', { value: name, onChange: ev => setName(ev.target.value) })),
    e(
      'div',
      null,
      e('label', null, 'Описание'),
      e('textarea', { value: description, onChange: ev => setDescription(ev.target.value) })
    ),
    e(
      'div',
      { className: 'admin-tags' },
      e('label', null, 'Теги'),
      e(
        'div',
        null,
        TAGS.map(t =>
          e(
            'label',
            { key: t },
            e('input', {
              type: 'checkbox',
              checked: tags.includes(t),
              onChange: ev => {
                if (ev.target.checked) {
                  setTags([...tags, t]);
                } else {
                  setTags(tags.filter(x => x !== t));
                }
              },
            }),
            t
          )
        )
      )
    ),
    e(
      'div',
      null,
      e('label', null, 'Фото URL'),
      e('input', { value: photoUrl, onChange: ev => setPhotoUrl(ev.target.value) })
    ),
    e(
      'div',
      null,
      uploading
        ? e('div', null, 'Загрузка фото...')
        : e('input', { type: 'file', onChange: ev => ev.target.files[0] && uploadFile(ev.target.files[0]) })
    ),
    e('button', { type: 'submit', disabled: uploading || !photoUrl }, 'Сохранить'),
    e('button', { type: 'button', onClick: onCancel }, 'Отмена')
  );
}

export function TalkForm({ initial = {}, speakers, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial.title || '');
  const [speakerId, setSpeakerId] = useState(initial.speakerId || (speakers[0]?.id || ''));
  const [description, setDescription] = useState(initial.description || '');
  const [eventName, setEventName] = useState(initial.eventName || '');
  const [direction, setDirection] = useState(initial.direction || 'frontend');
  const [date, setDate] = useState(initial.date || '');
  const [registrationLink, setRegistrationLink] = useState(initial.registrationLink || '');
  const [recordingLink, setRecordingLink] = useState(initial.recordingLink || '');

  const status = date && new Date(date) < new Date().setHours(0, 0, 0, 0) ? 'past' : 'upcoming';

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

  return e(
    'form',
    { className: 'admin-form', onSubmit: handleSubmit },
    e(
      'div',
      null,
      e('label', null, 'Спикер'),
      e(
        'select',
        { value: speakerId, onChange: ev => setSpeakerId(ev.target.value), required: true },
        speakers.map(s => e('option', { key: s.id, value: s.id }, s.name))
      )
    ),
    e(
      'div',
      null,
      e('label', null, 'Название'),
      e('input', { value: title, onChange: ev => setTitle(ev.target.value), required: true })
    ),
    e(
      'div',
      null,
      e('label', null, 'Описание'),
      e('textarea', { value: description, onChange: ev => setDescription(ev.target.value) })
    ),
    e(
      'div',
      null,
      e('label', null, 'Мероприятие'),
      e('input', { value: eventName, onChange: ev => setEventName(ev.target.value), required: true })
    ),
    e(
      'div',
      null,
      e('label', null, 'Направление'),
      e(
        'select',
        { value: direction, onChange: ev => setDirection(ev.target.value), required: true },
        DIRECTIONS.map(d => e('option', { key: d, value: d }, d))
      )
    ),
    e(
      'div',
      null,
      e('label', null, 'Дата'),
      e('input', { type: 'date', value: date, onChange: ev => setDate(ev.target.value), required: true })
    ),
    status === 'upcoming' &&
      e(
        'div',
        null,
        e('label', null, 'Ссылка регистрации'),
        e('input', { value: registrationLink, onChange: ev => setRegistrationLink(ev.target.value) })
      ),
    status === 'past' &&
      e(
        'div',
        null,
        e('label', null, 'Ссылка записи'),
        e('input', { value: recordingLink, onChange: ev => setRecordingLink(ev.target.value) })
      ),
    e('button', { type: 'submit' }, 'Сохранить'),
    e('button', { type: 'button', onClick: onCancel }, 'Отмена')
  );
}
