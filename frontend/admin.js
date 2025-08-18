import { SpeakerForm, TalkForm } from './components/forms.js';
import { TAGS } from './tags.js';

const e = React.createElement;
const { useState, useEffect } = React;

const APP_CFG = window.APP_CONFIG || { mode: 'prod', admins: [] };
const ALLOWED_USERS = APP_CFG.admins;

function AdminApp() {
  const [username, setUsername] = useState('');
  const [authorized, setAuthorized] = useState(false);

  const [speakers, setSpeakers] = useState([]);
  const [talks, setTalks] = useState([]);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [editingTalk, setEditingTalk] = useState(null);
  const [expandedSpeakerId, setExpandedSpeakerId] = useState(null);
  const [tab, setTab] = useState('speakers');
  const [error, setError] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [filterTags, setFilterTags] = useState([]);

  useEffect(() => {
    const btnSpeakers = document.getElementById('tab-speakers');
    const btnTalks = document.getElementById('tab-talks');

    const handleSpeakers = () => {
      setEditingSpeaker(null);
      setEditingTalk(null);
      setTab('speakers');
    };
    const handleTalks = () => {
      setEditingSpeaker(null);
      setEditingTalk(null);
      setTab('talks');
    };

    btnSpeakers?.addEventListener('click', handleSpeakers);
    btnTalks?.addEventListener('click', handleTalks);

    return () => {
      btnSpeakers?.removeEventListener('click', handleSpeakers);
      btnTalks?.removeEventListener('click', handleTalks);
    };
  }, []);

  useEffect(() => {
    const btnSpeakers = document.getElementById('tab-speakers');
    const btnTalks = document.getElementById('tab-talks');
    if (!btnSpeakers || !btnTalks) return;
    if (tab === 'speakers') {
      btnSpeakers.classList.add('is-active');
      btnTalks.classList.remove('is-active');
    } else {
      btnTalks.classList.add('is-active');
      btnSpeakers.classList.remove('is-active');
    }
  }, [tab]);

  useEffect(() => {
    const load = async () => {
        const tg = window.Telegram?.WebApp;
        tg?.ready();
        tg?.expand?.();
        tg?.requestFullscreen?.();
        tg?.disableVerticalSwipes?.();
        tg?.postEvent?.('web_app_setup_swipe_behavior', JSON.stringify({ allow_vertical_swipe: false }));
        const user = tg?.initDataUnsafe?.user;
        if (user) {
          setUsername(user.username);
        }
        if (APP_CFG.mode === 'debug') {
          setAuthorized(true);
        } else if (user) {
          setAuthorized(ALLOWED_USERS.includes(user.username));
        }
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

  const toggleFilterTag = t => {
    setFilterTags(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const toggleSpeaker = id => {
    setExpandedSpeakerId(expandedSpeakerId === id ? null : id);
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

  const filteredSpeakers = speakers.filter(s => {
    if (filterName && !s.name.toLowerCase().includes(filterName.toLowerCase())) {
      return false;
    }
    if (filterTags.length) {
      const tags = s.tags || [];
      return filterTags.every(t => tags.includes(t));
    }
    return true;
  });

  const speakerFilters = e('div', { className: 'admin-speaker-filters' },
    e('input', {
      placeholder: 'Фильтр по имени',
      value: filterName,
      onChange: ev => setFilterName(ev.target.value),
    }),
    e('div', { className: 'admin-tags' },
      TAGS.map(t =>
        e('label', { key: t },
          e('input', {
            type: 'checkbox',
            checked: filterTags.includes(t),
            onChange: () => toggleFilterTag(t),
          }),
          t
        )
      )
    )
  );

  const speakerSection = editingSpeaker ?
    e(SpeakerForm, { initial: editingSpeaker, onSubmit: saveSpeaker, onCancel: () => setEditingSpeaker(null) }) :
    e('div', null,
      speakerFilters,
      e('div', { className: 'admin-list' },
        e('div', { key: 'add', className: 'admin-list-item admin-add-btn', onClick: () => setEditingSpeaker({}) }, '+'),
        filteredSpeakers.map(s => {
          const expanded = expandedSpeakerId === s.id;
          return e('div', {
            key: s.id,
            className: `admin-list-item admin-speaker-item${expanded ? ' expanded' : ''}`,
            onClick: () => toggleSpeaker(s.id)
          },
            e('div', { className: 'admin-item-header' },
              e('div', { className: 'admin-speaker-info' },
                e('img', { src: s.photoUrl || '/default_icon.svg', alt: '', className: 'admin-speaker-photo' }),
                e('span', { className: 'admin-item-name' }, s.name)
              ),
              e('div', {
                className: 'admin-actions',
                onClick: ev => ev.stopPropagation()
              },
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
            ),
            e('div', { className: `admin-item-details${expanded ? ' expanded' : ''}` },
              e('p', null, s.description),
              e('div', { className: 'admin-tags' },
                (s.tags || []).map(t => e('span', { key: t, className: 'admin-tag' }, t))
              ),
              (() => {
                const speakerTalks = talks.filter(t => (t.speakerIds || []).includes(s.id));
                return speakerTalks.length
                  ? e('ul', { className: 'admin-speaker-talks' },
                      speakerTalks.map(t =>
                        e('li', { key: t.id }, `${t.title} — ${t.eventName}`)
                      )
                    )
                  : null;
              })(),
              e('button', {
                className: 'collapse-btn',
                onClick: ev => { ev.stopPropagation(); toggleSpeaker(s.id); }
              }, 'Свернуть')
            )
          );
        })
      )
    );

  const talkSection = editingTalk ?
    e(TalkForm, { initial: editingTalk, speakers, onSubmit: saveTalk, onCancel: () => setEditingTalk(null) }) :
    e('div', { className: 'admin-list' },
      e('div', { key: 'add', className: 'admin-list-item admin-add-btn', onClick: () => setEditingTalk({}) }, '+'),
      talks.map(t => {
        const names = speakers.filter(s => (t.speakerIds || []).includes(s.id)).map(s => s.name).join(', ');
        return e('div', { key: t.id, className: 'admin-list-item' },
          e('span', { className: 'admin-item-name' }, `${t.title} (${names})`),
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
        );
      })
    );

  return e('div', null,
    error && e('div', { className: 'error' }, error),
    tab === 'speakers' ? speakerSection : talkSection
  );
}

ReactDOM.createRoot(document.getElementById('admin-root')).render(e(AdminApp));
