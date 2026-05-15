import { Modal } from '../components/Modal.js';
import { ActivityForm } from './AdminPage.js';

const e = React.createElement;
const { useState, useEffect, useMemo, useCallback } = React;

const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital', devrel: 'Деврел' };
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function pluralAct(n) {
  if (n % 100 >= 11 && n % 100 <= 19) return 'активностей';
  const r = n % 10;
  if (r === 1) return 'активность';
  if (r >= 2 && r <= 4) return 'активности';
  return 'активностей';
}

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function speakerInitials(name) {
  return (name || '').split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon = () => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, width: 16, height: 16 },
  e('path', { d: 'M6 6l12 12M18 6 6 18', strokeLinecap: 'round' }));

const ChevLeft = () => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, width: 18, height: 18 },
  e('path', { d: 'm15 18-6-6 6-6', strokeLinecap: 'round', strokeLinejoin: 'round' }));

const ChevRight = () => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, width: 18, height: 18 },
  e('path', { d: 'm9 18 6-6-6-6', strokeLinecap: 'round', strokeLinejoin: 'round' }));

const EditIcon = () => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, width: 16, height: 16 },
  e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }));

// ─── Activity detail sheet ────────────────────────────────────────────────────

function ActivityDetailSheet({ activity, speakers, onClose, onEdit }) {
  const fmt = activity.format || 'speech';

  return e('div', { className: 'overlay', onClick: onClose },
    e('div', { className: 'sheet', onClick: ev => ev.stopPropagation(), style: { position: 'relative' } },
      e('div', { className: 'sheet__grip' }),
      e('button', { className: 'sheet__close', onClick: onClose }, e(CloseIcon)),

      e('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
        e('span', { className: `fmt-dot fmt-dot--${fmt}` }),
        e('span', { style: { color: 'var(--ink-3)', fontSize: 13 } }, FORMAT_LABELS[fmt] || fmt),
        activity.date && e('span', { style: { color: 'var(--ink-4)', fontSize: 13 } },
          ' · ' + (activity.date_end
            ? activity.date.slice(0, 10) + ' – ' + activity.date_end.slice(0, 10)
            : activity.date.slice(0, 10)))),

      e('h2', { className: 'sheet__title' }, activity.name),

      activity.event && e('div', { style: { color: 'var(--ink-3)', fontSize: 14, marginTop: 4 } },
        activity.event),

      speakers.length > 0 && e('div', { style: { marginTop: 18 } },
        e('div', { className: 'field-lbl' }, 'Спикеры'),
        e('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 } },
          speakers.map(s => e('div', { key: s.id, style: { display: 'flex', alignItems: 'center', gap: 10 } },
            e('div', {
              className: 'av-sm',
              style: { width: 32, height: 32, fontSize: 12, flexShrink: 0,
                ...(s.photoUrl ? {} : { background: 'var(--accent-soft)', color: 'var(--accent-ink)' }) },
            }, s.photoUrl ? e('img', { src: s.photoUrl, alt: s.name }) : speakerInitials(s.name)),
            e('div', null,
              e('div', { style: { fontSize: 14, fontWeight: 500 } }, s.name),
              s.role && e('div', { style: { fontSize: 12, color: 'var(--ink-3)', marginTop: 1 } }, s.role)))))),

      (activity.expertise_tags || []).length > 0 && e('div', {
        style: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 14 },
      }, activity.expertise_tags.map(t => e('span', { key: t, className: 'tag' }, t))),

      activity.description && e('div', { style: { marginTop: 16 } },
        e('div', { className: 'field-lbl' }, 'Описание'),
        e('p', {
          style: { color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.65, margin: '8px 0 0',
            paddingLeft: 12, borderLeft: '2px solid var(--accent)' },
        }, activity.description)),

      activity.link && e('div', { style: { marginTop: 16 } },
        e('a', {
          href: activity.link, target: '_blank', rel: 'noopener noreferrer',
          className: 'act__link', onClick: ev => ev.stopPropagation(),
        }, 'Открыть ',
          e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, width: 12, height: 12 },
            e('path', { d: 'M5 12h14M13 6l6 6-6 6', strokeLinecap: 'round', strokeLinejoin: 'round' })))),

      e('div', { style: { marginTop: 24 } },
        e('button', {
          className: 'btn btn-ghost',
          style: { display: 'inline-flex', gap: 8, width: 'auto', padding: '10px 18px' },
          onClick: onEdit,
        }, e(EditIcon), 'Редактировать'))));
}

// ─── Calendar Page ────────────────────────────────────────────────────────────

export function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [activities, setActivities] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [expertiseTags, setExpertiseTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailActivity, setDetailActivity] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

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
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const speakerMap = useMemo(() =>
    Object.fromEntries(speakers.map(s => [s.id, s])), [speakers]);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthActivities = useMemo(() =>
    activities
      .filter(a => a.date && a.date.startsWith(monthStr))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [activities, monthStr]);

  const lastDayOfMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const dayMap = useMemo(() => {
    const map = {};
    monthActivities.forEach(a => {
      const startDay = parseInt(a.date.slice(8, 10), 10);
      let endDay = startDay;
      if (a.date_end) {
        if (a.date_end.startsWith(monthStr)) {
          endDay = parseInt(a.date_end.slice(8, 10), 10);
        } else if (a.date_end > monthStr) {
          endDay = lastDayOfMonth;
        }
      }
      for (let d = startDay; d <= endDay; d++) {
        if (!map[d]) map[d] = [];
        map[d].push(a);
      }
    });
    return map;
  }, [monthActivities, monthStr, lastDayOfMonth]);

  const listedActivities = useMemo(() =>
    selectedDay !== null ? (dayMap[selectedDay] || []) : monthActivities,
    [selectedDay, dayMap, monthActivities]);

  const calDays = useMemo(() => buildCalendar(year, month), [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const closeModal = () => setModal(null);

  const createSpeaker = async name => {
    try {
      const created = await api('POST', '/api/speakers', { name: name.trim() });
      setSpeakers(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'ru')));
      return created.id;
    } catch (err) {
      alert('Ошибка при создании спикера: ' + err.message);
      return null;
    }
  };

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
      setDetailActivity(null);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const n = listedActivities.length;
  const listLabel = selectedDay !== null
    ? `${selectedDay} ${MONTHS_RU[month].toLowerCase()} · ${n} ${pluralAct(n)}`
    : `${MONTHS_RU[month]} ${year} · ${n} ${pluralAct(n)}`;

  return e('div', { className: 'page' },

    // Header
    e('div', { className: 'page__head' },
      e('div', null,
        e('h1', { className: 'page__title' }, 'Календарь'),
        e('div', { className: 'page__sub' }, 'Активности деврела'))),

    // Month navigation
    e('div', { className: 'cal-nav' },
      e('button', { className: 'cal-nav__btn', onClick: prevMonth, 'aria-label': 'Предыдущий месяц' },
        e(ChevLeft)),
      e('span', { className: 'cal-nav__label' }, `${MONTHS_RU[month]} ${year}`),
      e('button', { className: 'cal-nav__btn', onClick: nextMonth, 'aria-label': 'Следующий месяц' },
        e(ChevRight))),

    // Calendar grid
    e('div', { className: 'cal-grid' },
      WEEKDAYS.map(d => e('div', { key: d, className: 'cal-grid__hdr' }, d)),
      calDays.map((day, i) => {
        if (day === null) return e('div', { key: `e${i}`, className: 'cal-day cal-day--empty' });
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const acts = dayMap[day] || [];
        const isToday = dateStr === todayStr;
        const isSelected = selectedDay === day;
        return e('div', {
          key: day,
          className: 'cal-day'
            + (isToday ? ' cal-day--today' : '')
            + (isSelected ? ' cal-day--selected' : '')
            + (acts.length > 0 ? ' cal-day--has-acts' : ''),
          onClick: () => setSelectedDay(prev => prev === day ? null : day),
        },
          e('span', { className: 'cal-day__num' }, day),
          acts.length > 0 && e('div', { className: 'cal-day__dots' },
            acts.slice(0, 3).map((a, ai) =>
              e('span', { key: ai, className: `cal-day__dot cal-day__dot--${a.format || 'speech'}` }))));
      })),

    // List header
    e('div', { className: 'cal-list-head' },
      e('span', null, listLabel),
      selectedDay !== null && e('button', {
        className: 'cal-clear-day',
        onClick: () => setSelectedDay(null),
      }, 'Все')),

    // Activity cards
    loading
      ? e('div', { className: 'loader' }, e('div', { className: 'spinner' }))
      : listedActivities.length === 0
        ? e('div', { className: 'empty', style: { marginTop: 8 } },
            e('div', { className: 'empty__glyph' }, '—'),
            selectedDay !== null ? 'Нет активностей в этот день' : 'Нет активностей в этом месяце')
        : e('div', { className: 'cal-cards' },
            listedActivities.map(a => {
              const actSpeakers = (a.speaker_ids || []).map(id => speakerMap[id]).filter(Boolean);
              const fmt = a.format || 'speech';
              return e('div', { key: a.id, className: 'cal-card', onClick: () => setDetailActivity(a) },
                e('div', { className: `cal-card__stripe cal-card__stripe--${fmt}` }),
                e('div', { className: 'cal-card__body' },
                  e('div', { className: 'cal-card__meta' },
                    e('span', { className: `fmt-dot fmt-dot--${fmt}` }),
                    FORMAT_LABELS[fmt] || fmt,
                    a.date && e('span', { style: { color: 'var(--ink-4)', marginLeft: 4 } },
                      a.date_end
                        ? `· ${a.date.slice(8, 10)}.${a.date.slice(5, 7)} – ${a.date_end.slice(8, 10)}.${a.date_end.slice(5, 7)}`
                        : `· ${a.date.slice(8, 10)}.${a.date.slice(5, 7)}`)),
                  e('div', { className: 'cal-card__title' }, a.name),
                  a.event && e('div', { className: 'cal-card__event' }, a.event),
                  actSpeakers.length > 0 && e('div', { className: 'cal-card__speakers' },
                    e('div', { className: 'act__speakers-av' },
                      actSpeakers.slice(0, 2).map(s => e('div', {
                        key: s.id, className: 'av-sm',
                        style: s.photoUrl ? {} : { background: 'var(--accent-soft)', color: 'var(--accent-ink)' },
                      }, s.photoUrl
                        ? e('img', { src: s.photoUrl, alt: s.name })
                        : speakerInitials(s.name)))),
                    actSpeakers.map(s => s.name).join(', ')),
                  (a.expertise_tags || []).length > 0 && e('div', { className: 'cal-card__tags' },
                    a.expertise_tags.slice(0, 3).map(t =>
                      e('span', { key: t, className: 'tag' }, t)))));
            })),

    // FAB
    e('button', {
      className: 'add-fab',
      onClick: () => setModal({ type: 'activity', item: { format: 'devrel' } }),
      'aria-label': 'Добавить активность',
    }, e('svg', {
      xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24,
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5,
    }, e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M12 4v16m8-8H4' }))),

    // Detail sheet
    detailActivity && e(ActivityDetailSheet, {
      activity: detailActivity,
      speakers: (detailActivity.speaker_ids || []).map(id => speakerMap[id]).filter(Boolean),
      onClose: () => setDetailActivity(null),
      onEdit: () => {
        setModal({ type: 'activity', item: detailActivity });
        setDetailActivity(null);
      },
    }),

    // Add / Edit modal
    modal && modal.type === 'activity' && e(Modal,
      { title: modal.item ? 'Редактировать активность' : 'Новая активность', onClose: closeModal },
      e(ActivityForm, {
        initial: modal.item || {},
        expertiseTags,
        speakers,
        onSave: saveActivity,
        onDelete: deleteActivity,
        saving,
        onCreateSpeaker: createSpeaker,
      })));
}
