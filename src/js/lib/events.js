// ── Événements Footzy ────────────────────────────────────
export const EVENTS = [
  {
    id: 'cdm_2026',
    nom: 'Coupe du Monde 2026',
    emoji: '🌍',
    short: 'CdM 2026',
    start: '2026-06-12',
    end: '2026-07-19',
  },
  {
    id: 'ldc_2025_26',
    nom: 'Champions League 2025-26',
    emoji: '🏆',
    short: 'LDC 25/26',
    start: '2025-09-17',
    end: '2026-05-31',
  },
  {
    id: 'euro_2028',
    nom: 'Euro 2028',
    emoji: '⚽',
    short: 'Euro 2028',
    start: '2028-06-09',
    end: '2028-07-11',
  },
];

export function getEvent(id) {
  return EVENTS.find(e => e.id === id) || null;
}

export function isEventEnded(event) {
  if (!event) return false;
  return new Date() > new Date(event.end + 'T23:59:59');
}

export function isEventActive(event) {
  if (!event) return false;
  const now = new Date();
  return now >= new Date(event.start) && now <= new Date(event.end + 'T23:59:59');
}

export function formatEventDates(event) {
  if (!event) return '';
  const fmt = d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(event.start)} → ${fmt(event.end)}`;
}
