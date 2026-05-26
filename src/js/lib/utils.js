export function formatKickoff(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · '
    + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export function isBeforeKickoff(kickoffAt) {
  return new Date(kickoffAt) > new Date();
}

export function minutesUntilKickoff(kickoffAt) {
  return Math.floor((new Date(kickoffAt) - Date.now()) / 60000);
}

export async function shareCode(code, groupName) {
  const text = `Rejoins mon groupe "${groupName}" sur Footzy 🏆\nCode : ${code}\nfootzy.app`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Footzy', text });
      return;
    } catch {}
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}

export function generateShareCard(canvas, data) {
  const ctx = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 200;
  ctx.fillStyle = '#0A1A0F';
  ctx.fillRect(0, 0, 400, 200);
  ctx.fillStyle = '#00FF6A';
  ctx.font = 'bold italic 36px sans-serif';
  ctx.fillText('Footzy', 20, 50);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`${data.home} ${data.homeScore} - ${data.awayScore} ${data.away}`, 20, 100);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Mon pronostic · ${data.points} pts`, 20, 140);
}

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

export function show(el) { if (el) el.style.display = ''; }
export function hide(el) { if (el) el.style.display = 'none'; }

export function toast(msg, duration = 2800) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(10,26,15,0.95)', border: '1px solid rgba(255,255,255,0.15)',
    backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '10px 20px',
    fontSize: '13px', fontWeight: '600', color: '#fff', zIndex: '9999',
    whiteSpace: 'nowrap', transition: 'opacity 0.3s'
  });
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, duration);
}
