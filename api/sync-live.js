/**
 * /api/sync-live — Mise à jour automatique des scores live + calcul points
 *
 * Appelé :
 *  - Par accueil.html toutes les 60s quand un match live est en cours
 *  - Par un cron Vercel toutes les minutes (si plan Pro)
 *
 * Actions :
 *  1. Récupère les matchs live depuis la football API
 *  2. Met à jour home_score, away_score, minute dans Supabase
 *  3. Quand finished=true → status='finished' + calcul des points de tous les pronos
 *  4. Met à jour points_totaux des profils (pronos publics uniquement)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const API_KEY  = process.env.VITE_RAPIDAPI_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // ── 1. Récupérer les matchs live depuis l'API football ──
    const apiRes = await fetch(`https://${API_HOST}/football-current-live`, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key':  API_KEY,
      }
    });
    const apiData = await apiRes.json();
    const liveFromApi = apiData?.response?.live || apiData?.response || [];

    if (!liveFromApi.length) {
      // Pas de match en direct → vérifier si des matchs schedulés doivent passer live
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

      if (isFinished) {
        justFinished.push({ ...dbMatch, ...updateData });
      }
    }

    // ── 3. Calcul automatique des points pour les matchs terminés ──
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
