/**
 * /api/sync-live — Calcul de points + notifications push
 *
 * L'intégration RapidAPI a été retirée.
 * Les scores sont mis à jour manuellement (ou via l'agent IA à venir).
 *
 * Ce endpoint gère uniquement :
 *  1. Promotion scheduled → live quand le kickoff_at est passé
 *  2. Calcul des points pour les matchs terminés (status='finished')
 *  3. Envoi des push notifications quand un match se termine
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// webpush chargé à la demande (évite crash si clés VAPID absentes)
let _webpush = null;
async function getWebPush() {
  if (_webpush) return _webpush;
  const pub  = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return null;
  const wp = (await import('web-push')).default;
  wp.setVapidDetails('mailto:support@footzy.app', pub, priv);
  _webpush = wp;
  return _webpush;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // ── 1. Passer scheduled → live si kickoff dépassé ──
    const now = new Date().toISOString();
    const { data: toStart } = await supabase
      .from('matchs')
      .select('id')
      .eq('status', 'scheduled')
      .lte('kickoff_at', now);

    for (const m of toStart || []) {
      await supabase.from('matchs')
        .update({ status: 'live', minute: 0 })
        .eq('id', m.id);
    }

    // ── 2. Calculer les points pour les matchs terminés ──
    const { data: finished } = await supabase
      .from('matchs')
      .select('*')
      .eq('status', 'finished')
      .gte('updated_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());

    let pointsCalculated = 0;
    for (const match of finished || []) {
      const n = await calculatePoints(match);
      pointsCalculated += n;

      // Push notification fin de match (une seule fois)
      if (n > 0) {
        await sendPushToAll({
          type:  'fulltime',
          title: '⏱ Résultats calculés !',
          body:  `${match.home_flag || ''} ${match.home_team} ${match.home_score}–${match.away_score} ${match.away_team} ${match.away_flag || ''} · Tes points sont disponibles`,
          tag:   `ft-${match.id}`,
          data:  { url: '/src/pages/profil.html' },
        });
      }
    }

    return res.json({
      status: 'ok',
      started: toStart?.length || 0,
      pointsCalculated,
    });

  } catch(e) {
    console.error('sync-live error:', e);
    return res.status(500).json({ error: e.message });
  }
}

// ── Calcul des points pour un match terminé ──
async function calculatePoints(match) {
  const { data: pronos } = await supabase
    .from('pronostics')
    .select('id, home_score, away_score, user_id, groupe_id, ht_home, ht_away, yellow_cards')
    .eq('match_id', match.id)
    .is('points', null);

  if (!pronos?.length) return 0;

  const rh = match.home_score, ra = match.away_score;
  const updates = [];

  for (const prono of pronos) {
    const ph = prono.home_score, pa = prono.away_score;
    if (ph === null || pa === null || rh === null || ra === null) continue;

    let pts = 0, status = 'wrong';

    if (ph === rh && pa === ra) {
      pts = 5; status = 'exact';
    } else {
      const pRes = ph > pa ? 'h' : ph < pa ? 'a' : 'd';
      const rRes = rh > ra ? 'h' : rh < ra ? 'a' : 'd';
      if (pRes === rRes) {
        status = 'correct';
        if (pRes === 'd')             pts = 2;
        else if ((ph - pa) === (rh - ra)) pts = 3;
        else                          pts = 1;
      }
    }

    // Bonus mi-temps
    if (match.ht_home != null && prono.ht_home != null &&
        Number(prono.ht_home) === Number(match.ht_home) &&
        Number(prono.ht_away) === Number(match.ht_away)) pts += 2;

    // Bonus cartons (±1)
    if (match.yellow_cards != null && prono.yellow_cards != null &&
        Math.abs(Number(prono.yellow_cards) - Number(match.yellow_cards)) <= 1) pts += 1;

    updates.push({ id: prono.id, points: pts, status, user_id: prono.user_id, groupe_id: prono.groupe_id });
  }

  if (!updates.length) return 0;

  await Promise.all(updates.map(u =>
    supabase.from('pronostics').update({ points: u.points, status: u.status }).eq('id', u.id)
  ));

  // Mettre à jour points_totaux (pronos publics uniquement)
  const publicUsers = [...new Set(updates.filter(u => u.groupe_id === null).map(u => u.user_id))];
  for (const userId of publicUsers) {
    const { data: allPts } = await supabase
      .from('pronostics').select('points')
      .eq('user_id', userId).is('groupe_id', null).not('points', 'is', null);
    const total = (allPts || []).reduce((s, p) => s + (p.points || 0), 0);
    await supabase.from('profiles').update({ points_totaux: total }).eq('id', userId);
  }

  return updates.length;
}

// ── Envoyer push à tous les abonnés ──
async function sendPushToAll(payload) {
  try {
    const wp = await getWebPush();
    if (!wp) return;

    const { data: subs } = await supabase
      .from('push_subscriptions').select('endpoint, p256dh, auth');
    if (!subs?.length) return;

    await Promise.allSettled(subs.map(sub =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(e => {
        if (e.statusCode === 410)
          supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      })
    ));
  } catch(e) {
    console.warn('sendPushToAll:', e.message);
  }
}
