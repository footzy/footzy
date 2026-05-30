/**
 * /api/sync-live — Scores live + notifications push + calcul points
 *
 * Appelé toutes les 60s (cron Vercel Pro ou client-triggered)
 * Actions :
 *  1. Récupère matchs live depuis la football API
 *  2. Met à jour scores/minute dans Supabase
 *  3. Détecte nouveaux buts/cartons/changements → push notifications
 *  4. Quand finished → calcule les points de tous les pronos
 */

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const API_KEY  = process.env.VITE_RAPIDAPI_KEY;

// Config Web Push VAPID
webpush.setVapidDetails(
  'mailto:support@footzy.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // ── 1. Récupérer les matchs live depuis l'API football ──
    const apiRes = await fetch(`https://${API_HOST}/football-current-live`, {
      headers: { 'x-rapidapi-host': API_HOST, 'x-rapidapi-key': API_KEY }
    });
    const apiData = await apiRes.json();
    const liveFromApi = apiData?.response?.live || apiData?.response || [];

    if (!liveFromApi.length) {
      await checkScheduledToLive();
      return res.json({ status: 'ok', live: 0, updated: 0, finished: 0 });
    }

    // ── 2. Récupérer nos matchs en cours en DB ──
    const { data: dbMatches } = await supabase
      .from('matchs')
      .select('*')
      .in('status', ['scheduled', 'live']);

    if (!dbMatches?.length) return res.json({ status: 'ok', live: liveFromApi.length, updated: 0, finished: 0 });

    let updated = 0;
    const justFinished = [];

    for (const dbMatch of dbMatches) {
      // Trouver le match correspondant dans l'API par fixture_id ou noms d'équipes
      const apiMatch = liveFromApi.find(m =>
        (dbMatch.fixture_id && m.id === dbMatch.fixture_id) ||
        nameMatch(m.home?.longName || m.home?.name, dbMatch.home_team) &&
        nameMatch(m.away?.longName || m.away?.name, dbMatch.away_team)
      );

      if (!apiMatch) continue;

      const isFinished = apiMatch.status?.finished === true;
      const minute = parseInt(apiMatch.status?.liveTime?.short) || dbMatch.minute || 0;

      const updateData = {
        home_score:  apiMatch.home?.score ?? dbMatch.home_score,
        away_score:  apiMatch.away?.score ?? dbMatch.away_score,
        minute,
        status:      isFinished ? 'finished' : 'live',
        updated_at:  new Date().toISOString(),
        fixture_id:  dbMatch.fixture_id || apiMatch.id || null,
      };

      await supabase.from('matchs').update(updateData).eq('id', dbMatch.id);
      updated++;

      // ── 3. Détecter les événements (buts, cartons, changements) ──
      await detectAndNotifyEvents(dbMatch, apiMatch, updateData);

      if (isFinished) {
        justFinished.push({ ...dbMatch, ...updateData });
        // Notif fin de match
        const homeFlag = dbMatch.home_flag || '⚽';
        const awayFlag = dbMatch.away_flag || '⚽';
        await sendPushToAll({
          type:    'fulltime',
          title:   `⏱ Coup de sifflet final !`,
          body:    `${homeFlag} ${dbMatch.home_team} ${updateData.home_score} - ${updateData.away_score} ${dbMatch.away_team} ${awayFlag}`,
          tag:     `ft-${dbMatch.id}`,
          vibrate: [200, 100, 200],
          data:    { url: '/src/pages/accueil.html' },
        });
      }
    }

    // ── 4. Calcul automatique des points pour les matchs terminés ──
    for (const match of justFinished) {
      await calculatePoints(match);
    }

    return res.json({
      status:   'ok',
      live:     liveFromApi.length,
      updated,
      finished: justFinished.length,
      scores:   justFinished.map(m => `${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team}`),
    });

  } catch(e) {
    console.error('sync-live error:', e);
    return res.status(500).json({ error: e.message });
  }
}

// ── Vérifier si des matchs schedulés doivent passer en live ──
async function checkScheduledToLive() {
  const now = new Date().toISOString();
  const { data: started } = await supabase
    .from('matchs')
    .select('id')
    .eq('status', 'scheduled')
    .lte('kickoff_at', now);
  for (const m of started || []) {
    await supabase.from('matchs').update({ status: 'live', minute: 0 }).eq('id', m.id);
  }
}

// ── Correspondance de nom d'équipe (fuzzy) ──
function nameMatch(apiName, dbName) {
  if (!apiName || !dbName) return false;
  const a = apiName.toLowerCase().replace(/[^a-z]/g, '');
  const b = dbName.toLowerCase().replace(/[^a-z]/g, '');
  return a.includes(b.slice(0, 5)) || b.includes(a.slice(0, 5));
}

// ── Calcul des points pour tous les pronos d'un match terminé ──
async function calculatePoints(match) {
  const { data: pronos } = await supabase
    .from('pronostics')
    .select('id, home_score, away_score, user_id, groupe_id, ht_home, ht_away, yellow_cards, buteurs')
    .eq('match_id', match.id)
    .is('points', null); // seulement non calculés

  if (!pronos?.length) return;

  const rh = match.home_score, ra = match.away_score;
  const updates = [];

  for (const prono of pronos) {
    const ph = prono.home_score, pa = prono.away_score;
    if (ph === null || pa === null || rh === null || ra === null) continue;

    let pts = 0, status = 'wrong';

    // Score final
    if (ph === rh && pa === ra) {
      pts = 5; status = 'exact';
    } else {
      const pRes = ph > pa ? 'h' : ph < pa ? 'a' : 'd';
      const rRes = rh > ra ? 'h' : rh < ra ? 'a' : 'd';
      if (pRes === rRes) {
        status = 'correct';
        if (pRes === 'd')             pts = 2; // Nul prévu + nul réel
        else if ((ph-pa) === (rh-ra)) pts = 3; // Bon vainqueur + bonne différence
        else                          pts = 1; // Bon vainqueur seul
      }
    }

    // Bonus mi-temps
    if (match.ht_home !== null && prono.ht_home !== null &&
        Number(prono.ht_home) === Number(match.ht_home) &&
        Number(prono.ht_away) === Number(match.ht_away)) {
      pts += 2;
    }

    // Bonus cartons jaunes (±1)
    if (match.yellow_cards !== null && prono.yellow_cards !== null &&
        Math.abs(Number(prono.yellow_cards) - Number(match.yellow_cards)) <= 1) {
      pts += 1;
    }

    updates.push({ id: prono.id, points: pts, status, user_id: prono.user_id, groupe_id: prono.groupe_id });
  }

  if (!updates.length) return;

  // Sauvegarder les points dans pronostics
  await Promise.all(updates.map(u =>
    supabase.from('pronostics').update({ points: u.points, status: u.status }).eq('id', u.id)
  ));

  // Mettre à jour points_totaux pour les pronos PUBLICS uniquement
  const publicUsers = [...new Set(updates.filter(u => u.groupe_id === null).map(u => u.user_id))];
  for (const userId of publicUsers) {
    const { data: allPts } = await supabase
      .from('pronostics')
      .select('points')
      .eq('user_id', userId)
      .is('groupe_id', null)
      .not('points', 'is', null);
    const total = (allPts || []).reduce((s, p) => s + (p.points || 0), 0);
    await supabase.from('profiles').update({ points_totaux: total }).eq('id', userId);
  }

  console.log(`[sync-live] Points calculés pour ${updates.length} pronos, match: ${match.home_team} ${rh}-${ra} ${match.away_team}`);
}

// ── Détecter nouveaux buts / cartons / changements et envoyer push ──
async function detectAndNotifyEvents(dbMatch, apiMatch, newData) {
  try {
    const matchId = dbMatch.id;
    const homeFlag = dbMatch.home_flag || '⚽';
    const awayFlag = dbMatch.away_flag || '⚽';
    const ht = dbMatch.home_team, at = dbMatch.away_team;

    // But(s) marqué(s) — comparer avec le score précédent en DB
    const prevHome = dbMatch.home_score ?? 0;
    const prevAway = dbMatch.away_score ?? 0;
    const newHome  = newData.home_score ?? prevHome;
    const newAway  = newData.away_score ?? prevAway;

    if (newHome > prevHome) {
      const scorer = await getLastScorer(matchId, 'home');
      await sendPushToAll({
        type:    'goal',
        title:   `⚽ BUT ! ${homeFlag} ${ht}`,
        body:    `${ht} ${newHome} - ${newAway} ${at}${scorer ? ` · ${scorer}` : ''} (${newData.minute}')`,
        tag:     `goal-${matchId}-${newHome}-${newAway}`,
        vibrate: [100, 30, 100, 30, 200],
        data:    { url: '/src/pages/accueil.html' },
      });
    }
    if (newAway > prevAway) {
      const scorer = await getLastScorer(matchId, 'away');
      await sendPushToAll({
        type:    'goal',
        title:   `⚽ BUT ! ${awayFlag} ${at}`,
        body:    `${ht} ${newHome} - ${newAway} ${at}${scorer ? ` · ${scorer}` : ''} (${newData.minute}')`,
        tag:     `goal-${matchId}-${newHome}-${newAway}`,
        vibrate: [100, 30, 100, 30, 200],
        data:    { url: '/src/pages/accueil.html' },
      });
    }

    // Mi-temps
    if (!dbMatch.ht_home && apiMatch.status?.halfs?.secondHalfStarted && newData.minute > 45) {
      await supabase.from('matchs').update({
        ht_home: newHome, ht_away: newAway
      }).eq('id', matchId);
      await sendPushToAll({
        type:  'halftime',
        title: `⏸ Mi-temps`,
        body:  `${homeFlag} ${ht} ${newHome} - ${newAway} ${at} ${awayFlag}`,
        tag:   `ht-${matchId}`,
        data:  { url: '/src/pages/accueil.html' },
      });
    }

  } catch(e) {
    console.warn('detectAndNotifyEvents error:', e.message);
  }
}

// ── Récupérer le dernier buteur depuis l'API ──
async function getLastScorer(matchId, side) {
  try {
    const ep = side === 'home' ? 'football-get-hometeam-lineup' : 'football-get-awayteam-lineup';
    // Utiliser match_event_all_stats pour les buteurs si disponible
    const r = await fetch(`https://${API_HOST}/football-get-match-all-stats?match_id=${matchId}`, {
      headers: { 'x-rapidapi-host': API_HOST, 'x-rapidapi-key': API_KEY }
    });
    const d = await r.json();
    const goals = d?.response?.goals || d?.goals || [];
    const last = [...goals].reverse().find(g => g.side === side || g.team === side);
    return last?.player || last?.name || null;
  } catch { return null; }
}

// ── Envoyer une push notification à TOUS les users abonnés ──
async function sendPushToAll(payload) {
  try {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (!subs?.length) return;

    const notifPayload = JSON.stringify(payload);
    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notifPayload
        ).catch(e => {
          // Subscription expirée → supprimer
          if (e.statusCode === 410) {
            supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        })
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[push] ${payload.title} → ${sent}/${subs.length} envoyées`);
  } catch(e) {
    console.warn('sendPushToAll error:', e.message);
  }
}
