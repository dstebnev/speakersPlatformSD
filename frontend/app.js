import { Avatar } from './components/Avatar.js';
import { ActivitiesPage } from './pages/ActivitiesPage.js';
import { ArchivePage } from './pages/ArchivePage.js';
import { StatsPage } from './pages/StatsPage.js';
import { SpeakersPage } from './pages/SpeakersPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { CalendarPage } from './pages/CalendarPage.js';

const e = React.createElement;
const { useState, useEffect } = React;

// ─── Accent presets ────────────────────────────────────────────────────────────
const ACCENTS = [
  { name: 'amber',  accent: 'oklch(0.68 0.16 55)',  soft: 'oklch(0.94 0.04 65)',  ink: '#2a1b0c' },
  { name: 'forest', accent: 'oklch(0.58 0.13 155)', soft: 'oklch(0.94 0.04 155)', ink: '#0e2216' },
  { name: 'indigo', accent: 'oklch(0.55 0.15 265)', soft: 'oklch(0.94 0.04 265)', ink: '#0c1430' },
  { name: 'rose',   accent: 'oklch(0.62 0.17 15)',  soft: 'oklch(0.94 0.04 15)',  ink: '#2a0c0c' },
];

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Ic = {
  calendar: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, ...p },
    e('rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }),
    e('path', { d: 'M3 10h18M8 3v4M16 3v4', strokeLinecap: 'round' })),
  users: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, ...p },
    e('circle', { cx: 9, cy: 8, r: 3.2 }),
    e('path', { d: 'M3 20c.7-3 3.2-5 6-5s5.3 2 6 5', strokeLinecap: 'round' }),
    e('circle', { cx: 17, cy: 9, r: 2.5 }),
    e('path', { d: 'M15 14c3 .3 5 2 5.5 5', strokeLinecap: 'round' })),
  chart: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, ...p },
    e('path', { d: 'M4 20V10M10 20V4M16 20v-6M22 20H2', strokeLinecap: 'round' })),
  spark: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, ...p },
    e('path', { d: 'M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8', strokeLinecap: 'round' })),
  mic: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, ...p },
    e('rect', { x: 9, y: 3, width: 6, height: 12, rx: 3 }),
    e('path', { d: 'M5 11a7 7 0 0 0 14 0M12 18v3', strokeLinecap: 'round' })),
  close: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...p },
    e('path', { d: 'M6 6l12 12M18 6 6 18', strokeLinecap: 'round' })),
  check: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, ...p },
    e('path', { d: 'm5 13 4 4L19 7', strokeLinecap: 'round', strokeLinejoin: 'round' })),
  archive: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, ...p },
    e('rect', { x: 2, y: 4, width: 20, height: 5, rx: 1.5 }),
    e('path', { d: 'M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9', strokeLinecap: 'round' }),
    e('path', { d: 'M10 13h4', strokeLinecap: 'round' })),
  admin: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, ...p },
    e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
    e('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })),
  calview: (p = {}) => e('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, ...p },
    e('rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }),
    e('path', { d: 'M3 10h18M8 3v4M16 3v4', strokeLinecap: 'round' }),
    e('path', { d: 'M7.5 14.5h.01M12 14.5h.01M16.5 14.5h.01M7.5 18h.01M12 18h.01', strokeLinecap: 'round', strokeWidth: 2.5 })),
};

// ─── TopBar ────────────────────────────────────────────────────────────────────
function TopBar({ onToggleTweaks }) {
  return e('header', { className: 'topbar' },
    e('div', { className: 'topbar__brand' },
      e('div', { className: 'brand-dot' })),
    e('div', { className: 'topbar__spacer' }),
    e('button', { className: 'topbar__action', onClick: onToggleTweaks, title: 'Настройки' },
      Ic.spark({ width: 16, height: 16 })));
}

// ─── BotNav ────────────────────────────────────────────────────────────────────
function BotNav({ pages, current, onChange }) {
  const iconMap = { activities: Ic.calendar, archive: Ic.archive, speakers: Ic.users, stats: Ic.chart, admin: Ic.admin, calendar: Ic.calview };
  return e('nav', { className: 'botnav', style: { '--botnav-cols': pages.length } },
    pages.map(p => e('button', {
      key: p.id,
      className: 'botnav__item' + (current === p.id ? ' is-active' : ''),
      onClick: () => onChange(p.id),
    }, (iconMap[p.id] || Ic.chart)({}), p.label)));
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ pages, current, onChange, onOpenRequest, onToggleTweaks }) {
  const iconMap = { activities: Ic.calendar, archive: Ic.archive, speakers: Ic.users, stats: Ic.chart, admin: Ic.admin, calendar: Ic.calview };
  return e('aside', { className: 'sidebar' },
    e('div', { className: 'sidebar__brand' },
      e('div', { className: 'brand-dot' })),
    e('nav', { className: 'sidebar__nav' },
      pages.map(p => e('button', {
        key: p.id,
        className: 'sidebar__item' + (current === p.id ? ' is-active' : ''),
        onClick: () => onChange(p.id),
      }, (iconMap[p.id] || Ic.chart)({}), p.label))),
    e('div', { className: 'sidebar__foot' },
      e('button', {
        className: 'sidebar__tweaks-btn',
        onClick: onToggleTweaks,
        title: 'Настройки внешнего вида',
      }, Ic.spark({ width: 16, height: 16 }), 'Настройки'),
      e('button', {
        className: 'sidebar__item',
        onClick: onOpenRequest,
        style: { color: 'var(--ink-2)' },
      }, Ic.mic({}), 'Стать спикером'),
      e('div', { className: 'sidebar__foot-divider' })));
}

// ─── Tweaks panel ──────────────────────────────────────────────────────────────
function Tweaks({ open, onClose, state, setState }) {
  if (!open) return null;
  return e('div', { className: 'tweaks' },
    e('div', { className: 'tweaks__head' },
      e('h4', null, 'Tweaks'),
      e('button', { className: 'tweaks__close', onClick: onClose },
        Ic.close({ width: 14, height: 14 }))),
    e('div', { className: 'tweaks__row' },
      e('div', { className: 'tweaks__row-lbl' }, 'Accent'),
      e('div', { className: 'tweaks__swatches' },
        ACCENTS.map(a => e('button', {
          key: a.name,
          className: 'tweaks__sw' + (state.accent === a.name ? ' is-on' : ''),
          style: { background: a.accent },
          onClick: () => setState(s => ({ ...s, accent: a.name })),
          title: a.name,
        })))),
    e('div', { className: 'tweaks__row' },
      e('div', { className: 'tweaks__row-lbl' }, 'Theme'),
      e('div', { className: 'tweaks__seg' },
        e('button', { className: state.theme === 'light' ? 'is-on' : '', onClick: () => setState(s => ({ ...s, theme: 'light' })) }, 'Light'),
        e('button', { className: state.theme === 'dark' ? 'is-on' : '', onClick: () => setState(s => ({ ...s, theme: 'dark' })) }, 'Dark'))),
    e('div', { className: 'tweaks__row' },
      e('div', { className: 'tweaks__row-lbl' }, 'Density'),
      e('div', { className: 'tweaks__seg' },
        e('button', { className: state.density === 'comfy' ? 'is-on' : '', onClick: () => setState(s => ({ ...s, density: 'comfy' })) }, 'Comfy'),
        e('button', { className: state.density === 'compact' ? 'is-on' : '', onClick: () => setState(s => ({ ...s, density: 'compact' })) }, 'Compact'))));
}

// ─── Request sheet (real API) ──────────────────────────────────────────────────
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

const FORMAT_LABELS = { speech: 'Выступление', article: 'Статья', digital: 'Digital', devrel: 'Деврел' };

function RequestSheet({ onClose }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const submit = async () => {
    if (!message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/speaker-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), tg_user: getTgUser() }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return e('div', { className: 'overlay', onClick: onClose },
    e('div', { className: 'sheet', onClick: ev => ev.stopPropagation(), style: { position: 'relative' } },
      e('div', { className: 'sheet__grip' }),
      e('button', { className: 'sheet__close', onClick: onClose },
        Ic.close({ width: 16, height: 16 })),

      status === 'success'
        ? e('div', null,
            e('div', { className: 'success-state' },
              e('div', { className: 'success-state__glyph' },
                Ic.check({ width: 24, height: 24 })),
              e('h2', { className: 'sheet__title', style: { textAlign: 'center' } }, 'Готово!'),
              e('p', { className: 'success-state__txt' },
                'Заявка отправлена деврелу. Приду за подробностями в телеграм.')),
            e('button', { className: 'btn-sheet-primary', onClick: onClose }, 'Закрыть'))
        : e('div', null,
            e('h2', { className: 'sheet__title' },
              'Хочу ', e('em', { style: { fontStyle: 'italic', color: 'var(--accent)' } }, 'заявить о себе.')),
            e('p', { style: { color: 'var(--ink-3)', margin: '0 0 18px', fontSize: 14 } },
              'Коротко — кто ты и о чём хочешь рассказать. Деврел ответит в телеграм.'),
            e('div', { className: 'field' },
              e('label', { className: 'field-lbl' }, 'О себе и теме, если есть'),
              e('textarea', {
                className: 'textarea',
                placeholder: 'Тема, формат, кратко о себе',
                value: message,
                onChange: ev => setMessage(ev.target.value),
                disabled: status === 'sending',
                rows: 5,
                autoFocus: true,
              })),
            status === 'error' && e('p', { className: 'error-msg' }, 'Ошибка отправки. Попробуйте ещё раз.'),
            e('button', {
              className: 'btn-sheet-primary',
              onClick: submit,
              disabled: !message.trim() || status === 'sending',
            }, status === 'sending' ? 'Отправляем…' : 'Отправить заявку'))));
}

// ─── Speaker detail sheet ──────────────────────────────────────────────────────
function SpeakerSheet({ speaker, onClose }) {
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activities')
      .then(r => r.json())
      .then(all => setActs((all || []).filter(a => (a.speaker_ids || []).includes(speaker.id))))
      .catch(() => setActs([]))
      .finally(() => setLoading(false));
  }, [speaker.id]);

  const tgHandle = speaker.telegram ? speaker.telegram.replace(/^@/, '') : null;

  return e('div', { className: 'overlay', onClick: onClose },
    e('div', { className: 'sheet', onClick: ev => ev.stopPropagation(), style: { position: 'relative' } },
      e('div', { className: 'sheet__grip' }),
      e('button', { className: 'sheet__close', onClick: onClose },
        Ic.close({ width: 16, height: 16 })),

      // Header
      e('div', { style: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10 } },
        e(Avatar, { speaker, size: 68 }),
        e('div', null,
          e('h2', { className: 'sheet__title', style: { fontSize: 26 } }, speaker.name),
          speaker.role && e('div', { style: { color: 'var(--ink-3)', fontSize: 14, marginTop: 4 } }, speaker.role))),

      // Expertise
      (speaker.expertise || []).length > 0 && e('div', {
        style: { display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 16 },
      }, speaker.expertise.map(t => e('span', { key: t, className: 'tag' }, t))),

      // Activities
      e('div', { style: { marginTop: 22 } },
        e('div', { className: 'field-lbl' },
          loading ? 'Активности · …' : `Активности · ${acts.length}`),
        loading
          ? e('div', { style: { display: 'flex', justifyContent: 'center', padding: '20px 0' } },
              e('div', { className: 'spinner' }))
          : acts.length === 0
            ? e('div', { style: { color: 'var(--ink-3)', fontSize: 13, marginTop: 8 } },
                'Нет записанных выступлений.')
            : e('div', { style: { display: 'flex', flexDirection: 'column', marginTop: 8 } },
                acts.map(a => e('div', { key: a.id, style: { padding: '10px 0', borderBottom: '1px solid var(--line-2)' } },
                  e('div', { style: { fontSize: 14, fontWeight: 500, color: 'var(--ink)' } }, a.name),
                  e('div', { style: { fontSize: 12, color: 'var(--ink-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 } },
                    e('span', { className: `fmt-dot fmt-dot--${a.format || 'speech'}` }),
                    FORMAT_LABELS[a.format] || a.format,
                    a.event && ` · ${a.event}`,
                    a.date && ` · ${a.date.slice(0, 10)}`))))),

      // Contacts
      (speaker.email || tgHandle || speaker.mattermost) && e('div', { style: { marginTop: 20 } },
        e('div', { className: 'field-lbl' }, 'Контакты'),
        e('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 } },
          tgHandle && e('a', {
            href: `https://t.me/${tgHandle}`, target: '_blank', rel: 'noopener',
            className: 'chip', style: { textDecoration: 'none' },
          }, `@${tgHandle}`),
          speaker.email && e('a', {
            href: `mailto:${speaker.email}`,
            className: 'chip', style: { textDecoration: 'none' },
          }, speaker.email),
          speaker.mattermost && e('span', { className: 'chip' },
            speaker.mattermost.startsWith('@') ? speaker.mattermost : `@${speaker.mattermost}`)))));
}

// ─── App ───────────────────────────────────────────────────────────────────────
const BASE_PAGES = [
  { id: 'activities', label: 'Активности' },
  { id: 'archive',    label: 'Архив' },
  { id: 'speakers',   label: 'Спикеры' },
  { id: 'stats',      label: 'Статистика' },
];
const ADMIN_PAGES = [
  { id: 'calendar', label: 'Календарь' },
  { id: 'admin',    label: 'Админка' },
];

function isAdminUser() {
  // localhost / debug — always admin
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
  // set by inline script in index.html based on config.js + Telegram user
  return !!window.__IS_ADMIN__;
}

function App() {
  const isAdmin = isAdminUser();
  const PAGES = isAdmin ? [...BASE_PAGES, ...ADMIN_PAGES] : BASE_PAGES;

  const [page, setPage] = useState(() => localStorage.getItem('sp.page') || 'activities');
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [tweaks, setTweaks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp.tweaks')) || { accent: 'amber', theme: 'light', density: 'comfy' }; }
    catch { return { accent: 'amber', theme: 'light', density: 'comfy' }; }
  });

  useEffect(() => { localStorage.setItem('sp.page', page); }, [page]);
  useEffect(() => { localStorage.setItem('sp.tweaks', JSON.stringify(tweaks)); }, [tweaks]);

  // Apply design tokens
  useEffect(() => {
    const a = ACCENTS.find(x => x.name === tweaks.accent) || ACCENTS[0];
    document.documentElement.style.setProperty('--accent', a.accent);
    document.documentElement.style.setProperty('--accent-soft', a.soft);
    document.documentElement.style.setProperty('--accent-ink', a.ink);
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.style.fontSize = tweaks.density === 'compact' ? '14px' : '15px';
  }, [tweaks]);

  // Iframe edit-mode protocol
  useEffect(() => {
    const onMsg = ev => {
      if (ev.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (ev.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const openRequest = () => setRequestOpen(true);
  const closeRequest = () => setRequestOpen(false);
  const toggleTweaks = () => setTweaksOpen(o => !o);

  return e('div', { className: 'app' },
    e(Sidebar, { pages: PAGES, current: page, onChange: setPage, onOpenRequest: openRequest, onToggleTweaks: toggleTweaks }),
    e('div', { className: 'app__main' },
      e(TopBar, { onToggleTweaks: toggleTweaks }),
      e('div', { className: 'app__scroll' },
        page === 'activities' && e(ActivitiesPage, { onOpenRequest: openRequest }),
        page === 'archive'    && e(ArchivePage),
        page === 'speakers'   && e(SpeakersPage, { onOpenRequest: openRequest, onOpenSpeaker: setActiveSpeaker }),
        page === 'stats'      && e(StatsPage),
        page === 'calendar' && isAdmin && e(CalendarPage),
        page === 'admin'    && isAdmin && e(AdminPage)),
      e(BotNav, { pages: PAGES, current: page, onChange: setPage })),

    requestOpen  && e(RequestSheet, { onClose: closeRequest }),
    activeSpeaker && e(SpeakerSheet, { speaker: activeSpeaker, onClose: () => setActiveSpeaker(null) }),
    e(Tweaks, { open: tweaksOpen, onClose: () => setTweaksOpen(false), state: tweaks, setState: setTweaks }));
}

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
