import { TAGS } from '../tags.js';
const DIRECTIONS = TAGS;
const e = React.createElement;
const { useState, useEffect } = React;

export function SpeakerForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name || '');
  const [personnelId, setPersonnelId] = useState(initial.personnel_id || '');
  const [structure, setStructure] = useState(initial.structure || '');
  const [role, setRole] = useState(initial.role || '');
  const [description, setDescription] = useState(initial.description || '');
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl || '/default_icon.svg');
  const [uploading, setUploading] = useState(false);
  const tagRef = React.useRef(null);
  const choicesRef = React.useRef(null);

  useEffect(() => {
    if (!tagRef.current) return;

    choicesRef.current?.destroy();
    choicesRef.current = new Choices(tagRef.current, {
      removeItemButton: true,
      searchEnabled: true,
      placeholderValue: 'Выберите тег',
      itemSelectText: '',
      shouldSort: false,
    });

    const values = initial.tags || [];
    if (values.length) {
      choicesRef.current.setChoiceByValue(values);
    }

    return () => choicesRef.current?.destroy();
  }, [initial]);

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
        const selectedTags = choicesRef.current
          ? choicesRef.current.getValue(true)
          : [];
        onSubmit({
          ...initial,
          name,
          personnel_id: personnelId,
          structure,
          role,
          description,
          photoUrl,
          tags: selectedTags,
        });
      },
    },
    e('div', null, e('label', null, 'Имя'), e('input', { value: name, onChange: ev => setName(ev.target.value) })),
    e(
      'div',
      null,
      e('label', null, 'Табельный номер'),
      e('input', { value: personnelId, onChange: ev => setPersonnelId(ev.target.value) })
    ),
    e(
      'div',
      null,
      e('label', null, 'Структура'),
      e('input', { value: structure, onChange: ev => setStructure(ev.target.value) })
    ),
    e(
      'div',
      null,
      e('label', null, 'Роль'),
      e('input', { value: role, onChange: ev => setRole(ev.target.value) })
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
      e('label', null, 'Теги'),
      e(
        'select',
        { id: 'tags', name: 'tags[]', ref: tagRef, multiple: true },
        TAGS.map(t =>
          e(
            'option',
            {
              key: t,
              value: t,
              selected: (initial.tags || []).includes(t),
            },
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
    e('button', { type: 'submit', disabled: uploading }, 'Сохранить'),
    e('button', { type: 'button', onClick: onCancel }, 'Отмена')
  );
}

export function TalkForm({ initial = {}, speakers, onSubmit, onCancel }) {
  const initialTags = Array.isArray(initial.tags) ? initial.tags : [];
  const defaultTag = initial.direction || initialTags[0] || 'frontend';
  const initialSpeakerIds = (initial.speaker_ids || initial.speakerIds || []).map(String);

  const [name, setName] = useState(initial.name || initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [event, setEvent] = useState(initial.event || initial.eventName || '');
  const [tag, setTag] = useState(defaultTag);
  const [date, setDate] = useState(initial.date || '');
  const [link, setLink] = useState(
    initial.link || initial.registrationLink || initial.recordingLink || ''
  );
  const [rate, setRate] = useState(
    initial.rate === null || initial.rate === undefined ? '' : String(initial.rate)
  );
  const [speakerIds, setSpeakerIds] = useState(initialSpeakerIds);

  const speakerRef = React.useRef(null);
  const choicesRef = React.useRef(null);

  useEffect(() => {
    setName(initial.name || initial.title || '');
    setDescription(initial.description || '');
    setEvent(initial.event || initial.eventName || '');
    const nextTag = (Array.isArray(initial.tags) && initial.tags[0]) || initial.direction || 'frontend';
    setTag(nextTag);
    setDate(initial.date || '');
    setLink(initial.link || initial.registrationLink || initial.recordingLink || '');
    setRate(initial.rate === null || initial.rate === undefined ? '' : String(initial.rate));
    setSpeakerIds((initial.speaker_ids || initial.speakerIds || []).map(String));
  }, [initial]);

  useEffect(() => {
    if (!speakerRef.current || !speakers.length) return;

    choicesRef.current?.destroy();

    choicesRef.current = new Choices(speakerRef.current, {
      removeItemButton: true,
      searchEnabled: true,
      placeholderValue: 'Введите имя спикера',
      itemSelectText: '',
      shouldSort: false,
    });

    const input = choicesRef.current.input.element;
    const container = choicesRef.current.containerOuter.element;
    const focusInput = () => input.focus();
    container.addEventListener('click', focusInput);
    container.addEventListener('touchstart', focusInput);

    const ids = (initial.speaker_ids || initial.speakerIds || []).map(String);
    if (ids.length) {
      choicesRef.current.setChoiceByValue(ids);
    }
    setSpeakerIds(ids);

    return () => {
      container.removeEventListener('click', focusInput);
      container.removeEventListener('touchstart', focusInput);
      choicesRef.current?.destroy();
    };
  }, [speakers, initial]);

  const handleSubmit = ev => {
    ev.preventDefault();
    const selectedIds = choicesRef.current
      ? choicesRef.current.getValue(true)
      : [];
    if (!selectedIds.length || !name.trim() || !event.trim() || !tag || !date) {
      alert('Заполните обязательные поля');
      return;
    }
    const numericRate = rate === '' ? null : Number(rate);
    onSubmit({
      ...initial,
      name,
      speaker_ids: selectedIds,
      description,
      event,
      tags: tag ? [tag] : [],
      date,
      link,
      rate: Number.isFinite(numericRate) ? numericRate : null,
    });
  };

  return e(
    'form',
    { className: 'admin-form', onSubmit: handleSubmit },
    e(
      'div',
      null,
      e('label', null, 'Спикеры'),
      e(
        'select',
        {
          id: 'speakers',
          name: 'speakers[]',
          ref: speakerRef,
          multiple: true,
          onChange: ev =>
            setSpeakerIds(
              Array.from(ev.target.selectedOptions, opt => opt.value)
            ),
        },
        speakers.map(s =>
          e(
            'option',
            {
              key: s.id,
              value: String(s.id),
              selected: speakerIds.includes(String(s.id)),
            },
            s.name
          )
        )
      )
    ),
    e(
      'div',
      null,
      e('label', null, 'Название'),
      e('input', { value: name, onChange: ev => setName(ev.target.value), required: true })
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
      e('input', { value: event, onChange: ev => setEvent(ev.target.value), required: true })
    ),
    e(
      'div',
      null,
      e('label', null, 'Тег'),
      e(
        'select',
        { value: tag, onChange: ev => setTag(ev.target.value), required: true },
        DIRECTIONS.map(d => e('option', { key: d, value: d }, d))
      )
    ),
    e(
      'div',
      null,
      e('label', null, 'Дата'),
      e('input', { type: 'date', value: date, onChange: ev => setDate(ev.target.value), required: true })
    ),
    e(
      'div',
      null,
      e('label', null, 'Ссылка'),
      e('input', { value: link, onChange: ev => setLink(ev.target.value) })
    ),
    e(
      'div',
      null,
      e('label', null, 'Рейтинг'),
      e('input', {
        type: 'number',
        step: '0.1',
        min: '0',
        value: rate,
        onChange: ev => setRate(ev.target.value),
      })
    ),
    e('button', { type: 'submit' }, 'Сохранить'),
    e('button', { type: 'button', onClick: onCancel }, 'Отмена')
  );
}
