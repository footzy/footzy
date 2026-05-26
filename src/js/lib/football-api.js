const API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

const headers = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': API_HOST,
  'x-rapidapi-key': API_KEY
};

export async function fetchLiveScore(homeTeam, awayTeam) {
  try {
    const r = await fetch(`https://${API_HOST}/football-current-live`, { headers });
    const data = await r.json();
    const matches = data.response || data.matches || [];
    return matches.find(m =>
      m.home?.name?.toLowerCase().includes(homeTeam.toLowerCase()) &&
      m.away?.name?.toLowerCase().includes(awayTeam.toLowerCase())
    ) || null;
  } catch {
    return null;
  }
}

export async function searchPlayer(query) {
  if (query.length < 2) return [];
  try {
    const r = await fetch(
      `https://${API_HOST}/football-players-search?search=${encodeURIComponent(query)}`,
      { headers }
    );
    const data = await r.json();
    return data.response || data.players || [];
  } catch {
    return [];
  }
}

export async function getHeadToHead(team1Id, team2Id) {
  try {
    const r = await fetch(
      `https://${API_HOST}/football-head-to-head?team1=${team1Id}&team2=${team2Id}`,
      { headers }
    );
    return await r.json();
  } catch {
    return null;
  }
}

export async function getLineups(fixtureId) {
  try {
    const r = await fetch(
      `https://${API_HOST}/football-get-linups?fixture_id=${fixtureId}`,
      { headers }
    );
    return await r.json();
  } catch {
    return null;
  }
}

export async function getTeamStreaks(teamId) {
  try {
    const r = await fetch(
      `https://${API_HOST}/football-team-streaks?team_id=${teamId}`,
      { headers }
    );
    return await r.json();
  } catch {
    return null;
  }
}

export function startLivePolling(matchId, homeTeam, awayTeam, supabase, onUpdate) {
  const update = async () => {
    const live = await fetchLiveScore(homeTeam, awayTeam);
    if (live) {
      const updateData = {
        home_score: live.home?.score ?? live.home_score ?? 0,
        away_score: live.away?.score ?? live.away_score ?? 0,
        minute: live.minute || live.time?.elapsed || 0,
        status: 'live',
        updated_at: new Date().toISOString()
      };
      await supabase.from('matchs').update(updateData).eq('id', matchId);
      if (onUpdate) onUpdate(updateData);
    }
  };

  update();
  return setInterval(update, 60000);
}
