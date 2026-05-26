import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const MULTIPLICATEURS = { groupes: 1, huitiemes: 2, quarts: 3, demis: 5, finale: 10 };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.WHOP_SECRET_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { match_id } = await req.json();
  if (!match_id) return new Response('match_id required', { status: 400 });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: match } = await supabase
    .from('matchs')
    .select('*')
    .eq('id', match_id)
    .eq('status', 'finished')
    .single();

  if (!match) return new Response('Match not found or not finished', { status: 404 });

  const { data: pronos } = await supabase
    .from('pronostics')
    .select('*')
    .eq('match_id', match_id)
    .eq('status', 'pending');

  if (!pronos?.length) return new Response('No pending predictions', { status: 200 });

  const mult = MULTIPLICATEURS[match.phase] || 1;
  const updates = [];

  for (const prono of pronos) {
    let pts = 0;

    if (prono.home_score === match.home_score && prono.away_score === match.away_score) {
      pts += 50;
    } else if (
      (prono.home_score > prono.away_score && match.home_score > match.away_score) ||
      (prono.home_score < prono.away_score && match.home_score < match.away_score)
    ) {
      pts += 20;
    } else if (prono.home_score === prono.away_score && match.home_score === match.away_score) {
      pts += 30;
    }

    let buteursOK = 0;
    for (const b of (prono.buteurs || [])) {
      if ((match.buteurs || []).includes(b)) { pts += 20; buteursOK++; }
    }
    if (buteursOK === 3) pts += 30;

    if (prono.boost === 'boost_buteur' && prono.boost_buteur) {
      if ((match.buteurs || []).includes(prono.boost_buteur)) pts += 40;
    }

    pts *= mult;
    if (prono.boost === 'x2') pts *= 2;

    const scoreExact = prono.home_score === match.home_score && prono.away_score === match.away_score ? 1 : 0;

    updates.push({ id: prono.id, user_id: prono.user_id, pts, scoreExact });
  }

  for (const u of updates) {
    await supabase.from('pronostics').update({
      points: u.pts,
      status: u.pts > 0 ? 'won' : 'lost'
    }).eq('id', u.id);

    await supabase.rpc('increment_profile_points', {
      p_user_id: u.user_id,
      p_points: u.pts,
      p_scores_exacts: u.scoreExact
    });
  }

  // Check malus applications
  const { data: malusAchats } = await supabase
    .from('achats_boost')
    .select('*, pronostics(malus_target)')
    .eq('match_id', match_id)
    .eq('type', 'malus')
    .eq('applique', true);

  for (const achat of (malusAchats || [])) {
    const targetId = achat.pronostics?.malus_target;
    if (targetId) {
      await supabase.rpc('apply_malus', { p_user_id: targetId, p_points: 50 });
    }
  }

  return new Response(JSON.stringify({ resolved: updates.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
