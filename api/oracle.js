import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { matchId, homeTeam, awayTeam, homeFlag, awayFlag, phase, kickoffAt } = await req.json();
  if (!matchId) return new Response('matchId required', { status: 400 });

  // Verify user JWT & premium plan
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
  if (authErr || !user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).single();
  if (!profile || !['mid', 'elite'].includes(profile.plan)) {
    return new Response(JSON.stringify({ error: 'Premium required' }), { status: 403 });
  }

  // Check cache first
  const { data: cached } = await supabase
    .from('oracle_analyses')
    .select('*')
    .eq('match_id', matchId)
    .maybeSingle();

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Generate with Claude
  const phaseLabel = phase === 'groupes' ? 'phase de groupes' : phase || 'match de coupe du monde';
  const kickoff = kickoffAt ? new Date(kickoffAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';

  const prompt = `Tu es l'Oracle Footzy, l'expert IA de pronostics football pour la Coupe du Monde 2026.

Match : ${homeFlag} ${homeTeam} vs ${awayTeam} ${awayFlag}
Phase : ${phaseLabel}${kickoff ? ` — ${kickoff}` : ''}

Génère une analyse de pronostic complète et réaliste en JSON (réponds UNIQUEMENT avec le JSON brut, sans markdown) :

{
  "home_score": <entier>,
  "away_score": <entier>,
  "confidence": <entier 55-88>,
  "verdict": <string court ex: "Victoire domicile solide" ou "Match serré, léger avantage visiteur">,
  "analysis": <string 2-3 phrases, analyse tactique percutante et arguments clés en français>,
  "buteur": <string nom du buteur probable avec son équipe>,
  "key_players": [
    {"name": <string>, "team": <string>, "role": <string court ex: "Buteur décisif" ou "Maître du milieu">},
    {"name": <string>, "team": <string>, "role": <string>},
    {"name": <string>, "team": <string>, "role": <string>}
  ],
  "home_form": <string 5 caractères parmi W/D/L, ex: "WWDWL">,
  "away_form": <string 5 caractères parmi W/D/L>,
  "stats": {
    "home_attack": <entier 40-95>,
    "away_attack": <entier 40-95>,
    "home_defense": <entier 40-95>,
    "away_defense": <entier 40-95>
  },
  "facteur_cle": <string 1 phrase, le facteur décisif du match>
}`;

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const aiData = await aiRes.json();
  const rawText = aiData?.content?.[0]?.text || '';

  let analysis;
  try {
    analysis = JSON.parse(rawText);
  } catch {
    // Try to extract JSON if wrapped in text
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return new Response('AI parse error', { status: 500 });
    analysis = JSON.parse(match[0]);
  }

  // Save to cache
  const { data: saved } = await supabase.from('oracle_analyses').insert({
    match_id:   matchId,
    home_score: analysis.home_score,
    away_score: analysis.away_score,
    confidence: analysis.confidence,
    verdict:    analysis.verdict,
    analysis:   analysis.analysis,
    buteur:     analysis.buteur,
    key_players: analysis.key_players,
    home_form:  analysis.home_form,
    away_form:  analysis.away_form,
    stats:      analysis.stats,
    facteur_cle: analysis.facteur_cle,
  }).select().single();

  return new Response(JSON.stringify(saved || analysis), {
    headers: { 'Content-Type': 'application/json' }
  });
}
