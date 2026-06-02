// Portrait card: 1080×1350 (4:5), rendered at 2× for retina quality.
const W     = 1080;
const H     = 1350;
const SCALE = 2;
const PAD   = 76;

const FORMAT_META = {
  speech:  { label: 'Выступление', color: '#c87941' },
  article: { label: 'Статья',      color: '#3a9e8e' },
  digital: { label: 'Digital',     color: '#6b5ac9' },
  devrel:  { label: 'Деврел',      color: '#c24d7a' },
};

const MONTHS_RU = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Split text into lines (no truncation) at the current ctx.font
function splitLines(ctx, text, maxW) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const word of words) {
    const trial = cur ? cur + ' ' + word : word;
    if (ctx.measureText(trial).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Find the largest font size where the title fits within `maxTitleH` pixels.
// Returns { lines, fontSize, lineH }.
function fitTitle(ctx, text, maxW, maxTitleH, maxFS, minFS) {
  for (let fs = maxFS; fs >= minFS; fs -= 4) {
    ctx.font = `600 ${fs}px Inter, -apple-system, sans-serif`;
    const lh    = Math.round(fs * 1.28);
    const lines = splitLines(ctx, text, maxW);
    if (lines.length * lh <= maxTitleH) {
      return { lines, fontSize: fs, lineH: lh };
    }
  }
  // At minFS, accept whatever fits
  const fs    = minFS;
  const lh    = Math.round(fs * 1.28);
  ctx.font    = `600 ${fs}px Inter, -apple-system, sans-serif`;
  return { lines: splitLines(ctx, text, maxW), fontSize: fs, lineH: lh };
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// Circle photo with cover-fit aspect ratio correction
async function drawSpeakerCircle(ctx, speaker, cx, cy, r) {
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur    = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  if (speaker?.photoUrl) {
    try {
      const img = await loadImage(speaker.photoUrl);
      const nw  = img.naturalWidth  || img.width;
      const nh  = img.naturalHeight || img.height;
      const sc  = Math.max((r * 2) / nw, (r * 2) / nh);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - nw * sc / 2, cy - nh * sc / 2, nw * sc, nh * sc);
      ctx.restore();
      return;
    } catch { /* fall through */ }
  }

  const hue = speaker ? hashHue(speaker.id || speaker.name || '') : 38;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue}, 28%, 88%)`;
  ctx.fill();
  ctx.restore();

  if (speaker?.name) {
    const inits = speaker.name.split(' ').slice(0, 2).map(p => p[0] || '').join('').toUpperCase();
    ctx.fillStyle    = `hsl(${hue}, 32%, 36%)`;
    ctx.font         = `600 ${Math.round(r * 0.44)}px Inter, -apple-system, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(inits, cx, cy);
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function exportActivityCard(activity, speakers) {
  await Promise.all([
    document.fonts.load('400 17px Inter'),
    document.fonts.load('500 17px Inter'),
    document.fonts.load('600 68px Inter'),
    document.fonts.load('600 40px Inter'),
  ]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);

  // ── Background ──────────────────────────────────────────────────────────────
  const bgGrd = ctx.createLinearGradient(0, 0, 0, H);
  bgGrd.addColorStop(0, '#f9f6f1');
  bgGrd.addColorStop(1, '#ede5d8');
  ctx.fillStyle = bgGrd;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, 520);
  glow.addColorStop(0, 'rgba(200,121,65,0.06)');
  glow.addColorStop(1, 'rgba(200,121,65,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Accent bar ──────────────────────────────────────────────────────────────
  const barGrd = ctx.createLinearGradient(0, 0, W, 0);
  barGrd.addColorStop(0, '#c87941');
  barGrd.addColorStop(1, '#e8aa72');
  ctx.fillStyle = barGrd;
  ctx.fillRect(0, 0, W, 8);

  // ── Photo config by speaker count ───────────────────────────────────────────
  const n = Math.min(Math.max(speakers.length, 0), 3);
  let photoR, photoXs;
  if (n <= 1) {
    photoR = 200; photoXs = [W / 2];
  } else if (n === 2) {
    photoR = 155; photoXs = [W / 2 - 178, W / 2 + 178];
  } else {
    photoR = 122; photoXs = [W / 2 - 258, W / 2, W / 2 + 258];
  }

  // ── Measure title with adaptive font size ───────────────────────────────────
  // Space budget: card height minus badge area (top) and branding area (bottom)
  const BADGE_AREA  = 110;   // y=0..110 occupied by badge row
  const BRAND_AREA  = 80;    // bottom 80px reserved for branding
  const AVAILABLE   = H - BADGE_AREA - BRAND_AREA; // 1160px

  // Fixed heights of non-title elements
  const PHOTO_H        = photoR * 2;
  const PH_NAME_GAP    = 44;
  const NAME_H         = speakers.length > 0 ? 30 : 0;
  const NAME_TITLE_GAP = 80;
  const tags           = (activity.expertise_tags || []).slice(0, 5);
  const TAGS_GAP       = tags.length > 0 ? 56 : 0;
  const TAGS_H         = tags.length > 0 ? 44 : 0;

  const FIXED_H    = PHOTO_H + PH_NAME_GAP + NAME_H + NAME_TITLE_GAP + TAGS_GAP + TAGS_H;
  const MAX_TITLE_H = AVAILABLE - FIXED_H;  // height budget for the title

  const TITLE_W = W - PAD * 2;
  const { lines: titleLines, fontSize: titleFS, lineH: titleLH } =
    fitTitle(ctx, activity.name, TITLE_W, MAX_TITLE_H, 68, 28);

  // ── Compute vertical positions (centred block) ───────────────────────────────
  const BLOCK_H   = FIXED_H + titleLines.length * titleLH;
  const BLOCK_TOP = BADGE_AREA + Math.max(16, (AVAILABLE - BLOCK_H) / 2);

  const photoCY = BLOCK_TOP + photoR;
  const nameBaseY = BLOCK_TOP + PHOTO_H + PH_NAME_GAP + NAME_H * 0.78; // baseline
  const titleY    = BLOCK_TOP + PHOTO_H + PH_NAME_GAP + NAME_H + NAME_TITLE_GAP;
  const tagsY     = titleY + titleLines.length * titleLH + TAGS_GAP;

  // ── Format badge ────────────────────────────────────────────────────────────
  const fmt     = activity.format || 'speech';
  const fmtMeta = FORMAT_META[fmt] || FORMAT_META.speech;
  const BADGE_Y = 76;

  ctx.textBaseline = 'middle';

  ctx.beginPath();
  ctx.arc(PAD + 8, BADGE_Y, 7, 0, Math.PI * 2);
  ctx.fillStyle = fmtMeta.color;
  ctx.fill();

  ctx.fillStyle = '#6b5f52';
  ctx.font      = '500 17px Inter, -apple-system, sans-serif';
  ctx.fillText(fmtMeta.label, PAD + 24, BADGE_Y);

  if (activity.event) {
    const fmtW = ctx.measureText(fmtMeta.label).width;
    ctx.fillStyle = '#a89d91';
    ctx.font      = '400 16px Inter, -apple-system, sans-serif';
    ctx.fillText('· ' + activity.event, PAD + 24 + fmtW + 8, BADGE_Y);
  }

  if (activity.date) {
    const d  = new Date(activity.date + 'T00:00:00');
    const ds = `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
    ctx.fillStyle = '#6b5f52';
    ctx.font      = '500 17px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(ds, W - PAD, BADGE_Y);
    ctx.textAlign = 'left';
  }

  ctx.textBaseline = 'alphabetic';

  // ── Speaker photos ──────────────────────────────────────────────────────────
  for (let i = 0; i < Math.max(n, 1); i++) {
    await drawSpeakerCircle(ctx, speakers[i] ?? null, photoXs[i], photoCY, photoR);
  }

  // ── Speaker names ───────────────────────────────────────────────────────────
  if (speakers.length > 0) {
    const allNames = speakers.slice(0, 3).map(s => s.name).filter(Boolean);
    const extra    = speakers.length > 3 ? ` +${speakers.length - 3}` : '';
    ctx.fillStyle  = '#4a3f35';
    ctx.font       = '500 22px Inter, -apple-system, sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText(allNames.join(', ') + extra, W / 2, nameBaseY);
    ctx.textAlign  = 'left';
  }

  // ── Title (full text, adaptive font) ────────────────────────────────────────
  ctx.fillStyle = '#1c1811';
  ctx.font      = `600 ${titleFS}px Inter, -apple-system, sans-serif`;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, PAD, titleY + i * titleLH);
  });

  // ── Tags ─────────────────────────────────────────────────────────────────────
  if (tags.length > 0) {
    const TAG_H   = 44;
    const TAG_PAD = 20;
    ctx.font         = '400 16px Inter, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    let tx = PAD;
    for (const tag of tags) {
      const tw = ctx.measureText(tag).width;
      const pw = tw + TAG_PAD * 2;
      if (tx + pw > W - PAD) break;
      ctx.fillStyle = '#e4ddd3';
      roundRect(ctx, tx, tagsY, pw, TAG_H, 10);
      ctx.fill();
      ctx.fillStyle = '#6b5f52';
      ctx.fillText(tag, tx + TAG_PAD, tagsY + TAG_H / 2);
      tx += pw + 10;
    }
    ctx.textBaseline = 'alphabetic';
  }

  // ── Branding (always at the very bottom) ─────────────────────────────────────
  ctx.fillStyle = '#c2b8ae';
  ctx.font      = '400 15px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Spotlight · Experts Platform', W - PAD, H - 44);
  ctx.textAlign = 'left';

  // ── Download ─────────────────────────────────────────────────────────────────
  const a    = document.createElement('a');
  a.download = `activity-${activity.id.slice(0, 8)}.png`;
  a.href     = canvas.toDataURL('image/png');
  a.click();
}
