import { TAGS } from '../tags.js';
const DIRECTIONS = TAGS;
const e = React.createElement;
const { useState, useEffect } = React;

export function SpeakerForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name || '');
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
        onSubmit({ ...initial, name, description, photoUrl, tags: selectedTags });
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
  const [title, setTitle] = useState(initial.title || '');
  // Store selected speaker IDs. Default to an empty array so the user must
  // explicitly pick one or more speakers.
  const [speakerIds, setSpeakerIds] = useState((initial.speakerIds || []).map(String));
  const [description, setDescription] = useState(initial.description || '');
  const [eventName, setEventName] = useState(initial.eventName || '');
  const [direction, setDirection] = useState(initial.direction || 'frontend');
  const [date, setDate] = useState(initial.date || '');
  const [registrationLink, setRegistrationLink] = useState(initial.registrationLink || '');
  const [recordingLink, setRecordingLink] = useState(initial.recordingLink || '');

  const status = date && new Date(date) < new Date().setHours(0, 0, 0, 0) ? 'past' : 'upcoming';

  const speakerRef = React.useRef(null);
  const choicesRef = React.useRef(null);

  useEffect(() => {
    // Don't try to initialise the widget until we have a select element and
    // at least one option rendered. Initialising Choices too early leads to an
    // empty widget that never receives preselected values.
    if (!speakerRef.current || !speakers.length) return;

    // Destroy previous instance if any. React will also call the cleanup when
    // dependencies change, but destroying explicitly guards against manual
    // re-renders.
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

    const ids = (initial.speakerIds || []).map(String);
    if (ids.length) {
      // Ensure the required speakers are selected even if the `selected`
      // attribute on <option> was ignored by Choices.
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
    if (!selectedIds.length || !title.trim() || !eventName.trim() || !direction || !date) {
      alert('Заполните обязательные поля');
      return;
    }
    onSubmit({
      ...initial,
      title,
      speakerIds: selectedIds,
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
              selected: (initial.speakerIds || []).map(String).includes(String(s.id)),
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
