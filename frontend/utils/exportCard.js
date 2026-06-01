// Portrait card: 1080×1350 (4:5), rendered at 2× for retina quality.
// Suits Stories, vertical slides, and 2-up landscape presentations.
const W     = 1080;
const H     = 1350;
const SCALE = 2;
const PAD   = 76; // horizontal padding

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

// Returns the number of lines drawn
function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';

  for (const word of words) {
    const trial = cur ? cur + ' ' + word : word;
    if (ctx.measureText(trial).width > maxW && cur) {
      if (lines.length === maxLines - 1) {
        let shortened = cur;
        while (ctx.measureText(shortened + '…').width > maxW && shortened.includes(' ')) {
          shortened = shortened.slice(0, shortened.lastIndexOf(' '));
        }
        lines.push(shortened + '…');
        cur = '';
        break;
      }
      lines.push(cur);
      cur = word;
    } else {
      cur = trial;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);

  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lineH));
  return lines.length;
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// Circle photo with cover-fit aspect ratio (no squishing)
async function drawSpeakerCircle(ctx, speaker, cx, cy, r) {
  // Drop shadow
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

      // Cover-fit: scale so the shorter dimension fills the diameter
      const nw = img.naturalWidth  || img.width;
      const nh = img.naturalHeight || img.height;
      const sc = Math.max((r * 2) / nw, (r * 2) / nh);
      const dw = nw * sc;
      const dh = nh * sc;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();
      return;
    } catch { /* fall through */ }
  }

  // Initials fallback
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
  ]).catch(() => {});

  const canvas = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');

  // All drawing in logical W×H — SCALE is applied via transform only
  ctx.scale(SCALE, SCALE);

  // ── Background ──────────────────────────────────────────────────────────────
  const bgGrd = ctx.createLinearGradient(0, 0, 0, H);
  bgGrd.addColorStop(0, '#f9f6f1');
  bgGrd.addColorStop(1, '#ede5d8');
  ctx.fillStyle = bgGrd;
  ctx.fillRect(0, 0, W, H);

  // Warm ambient glow centred on the photo area
  const glow = ctx.createRadialGradient(W / 2, 380, 0, W / 2, 380, 480);
  glow.addColorStop(0, 'rgba(200,121,65,0.07)');
  glow.addColorStop(1, 'rgba(200,121,65,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Top accent bar ──────────────────────────────────────────────────────────
  const barGrd = ctx.createLinearGradient(0, 0, W, 0);
  barGrd.addColorStop(0, '#c87941');
  barGrd.addColorStop(1, '#e8aa72');
  ctx.fillStyle = barGrd;
  ctx.fillRect(0, 0, W, 8);

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
  // Layout adapts to 1, 2, or 3 speakers; extras shown in the name label.
  const n = Math.min(Math.max(speakers.length, 0), 3);
  const showCount = Math.max(n, 1); // always render at least one slot

  let photoCY, photoR, photoXs;
  if (n <= 1) {
    photoCY = 400;  photoR = 200;
    photoXs = [W / 2];
  } else if (n === 2) {
    photoCY = 390;  photoR = 155;
    photoXs = [W / 2 - 178, W / 2 + 178];
  } else {
    photoCY = 380;  photoR = 122;
    photoXs = [W / 2 - 258, W / 2, W / 2 + 258];
  }

  for (let i = 0; i < showCount; i++) {
    await drawSpeakerCircle(ctx, speakers[i] ?? null, photoXs[i], photoCY, photoR);
  }

  // ── Speaker name(s) ─────────────────────────────────────────────────────────
  const nameY    = photoCY + photoR + 44;
  const allNames = speakers.slice(0, 3).map(s => s.name).filter(Boolean);
  if (allNames.length > 0) {
    const extra = speakers.length > 3 ? ` +${speakers.length - 3}` : '';
    ctx.fillStyle = '#352e28';
    ctx.font      = '500 32px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(allNames.join(', ') + extra, W / 2, nameY);
    ctx.textAlign = 'left';
  }

  // ── Title ───────────────────────────────────────────────────────────────────
  const TITLE_Y  = nameY + 135;
  const TITLE_LH = 88;
  const TITLE_W  = W - PAD * 2;

  ctx.fillStyle = '#1c1811';
  ctx.font      = '600 68px Inter, -apple-system, sans-serif';
  const nTitleLines = wrapText(ctx, activity.name, PAD, TITLE_Y, TITLE_W, TITLE_LH, 3);

  // ── Tags ────────────────────────────────────────────────────────────────────
  // Anchored relative to bottom; sit above the branding strip.
  const BRAND_Y = H - 50;
  const TAG_H   = 40;
  const TAG_Y   = BRAND_Y - 56 - TAG_H;

  const tags = (activity.expertise_tags || []).slice(0, 6);
  if (tags.length > 0) {
    const TAG_PAD = 18;
    ctx.font         = '400 16px Inter, -apple-system, sans-serif';
    ctx.textBaseline = 'middle';
    let tx = PAD;

    for (const tag of tags) {
      const tw = ctx.measureText(tag).width;
      const pw = tw + TAG_PAD * 2;
      if (tx + pw > W - PAD) break;

      ctx.fillStyle = '#e4ddd3';
      roundRect(ctx, tx, TAG_Y, pw, TAG_H, 10);
      ctx.fill();

      ctx.fillStyle = '#6b5f52';
      ctx.fillText(tag, tx + TAG_PAD, TAG_Y + TAG_H / 2);
      tx += pw + 10;
    }

    ctx.textBaseline = 'alphabetic';
  }

  // ── Thin separator between title block and tags ──────────────────────────────
  const contentBottom = TITLE_Y + nTitleLines * TITLE_LH + 4;
  const sepY = contentBottom + (TAG_Y - contentBottom) / 2;
  if (TAG_Y - contentBottom > 60) {
    ctx.strokeStyle = 'rgba(180,170,160,0.4)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, sepY);
    ctx.lineTo(W - PAD, sepY);
    ctx.stroke();
  }

  // ── Branding ────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#c2b8ae';
  ctx.font      = '400 15px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'right';

  // ── Download ────────────────────────────────────────────────────────────────
  const a    = document.createElement('a');
  a.download = `activity-${activity.id.slice(0, 8)}.png`;
  a.href     = canvas.toDataURL('image/png');
  a.click();
}
