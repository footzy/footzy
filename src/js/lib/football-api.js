const API_HOST = 'free-api-live-football-data.p.rapidapi.com';
const API_KEY  = import.meta.env.VITE_RAPIDAPI_KEY;

const headers = {
  'Content-Type': 'application/json',
  'x-rapidapi-host': API_HOST,
  'x-rapidapi-key': API_KEY,
};

// Récupère le score en direct d'un match (par noms d'équipes EN)
export async function fetchLiveScore(homeTeamFr, awayTeamFr) {
  try {
    const r = await fetch(`https://${API_HOST}/football-current-live`, { headers });
    const data = await r.json();
    const matches = data?.response?.live || [];

    return matches.find(m => {
      const home = (m.home?.name || '').toLowerCase();
      const away = (m.away?.name || '').toLowerCase();
      const homeFr = homeTeamFr.toLowerCase();
      const awayFr = awayTeamFr.toLowerCase();
      // Fuzzy match: common French→EN mappings
      return (
        (home.includes(homeFr) || homeFr.includes(home) ||
         FR_TO_EN[homeTeamFr]?.toLowerCase() === home) &&
        (away.includes(awayFr) || awayFr.includes(away) ||
         FR_TO_EN[awayTeamFr]?.toLowerCase() === away)
      );
    }) || null;
  } catch {
    return null;
  }
}

// Mapping FR→EN pour la correspondance live
const FR_TO_EN = {
  'Mexique': 'Mexico', 'Afrique du Sud': 'South Africa', 'Corée du Sud': 'South Korea',
  'Rép. Tchèque': 'Czechia', 'Canada': 'Canada', 'Bosnie-Herzégovine': 'Bosnia and Herzegovina',
  'Qatar': 'Qatar', 'Suisse': 'Switzerland', 'Brésil': 'Brazil', 'Maroc': 'Morocco',
  'Haïti': 'Haiti', 'Écosse': 'Scotland', 'États-Unis': 'USA', 'Paraguay': 'Paraguay',
  'Australie': 'Australia', 'Türkiye': 'Turkiye', 'Allemagne': 'Germany', 'Curaçao': 'Curacao',
  "Côte d'Ivoire": 'Ivory Coast', 'Équateur': 'Ecuador', 'Pays-Bas': 'Netherlands',
  'Japon': 'Japan', 'Suède': 'Sweden', 'Tunisie': 'Tunisia', 'Belgique': 'Belgium',
  'Égypte': 'Egypt', 'Iran': 'Iran', 'Nouvelle-Zélande': 'New Zealand', 'Espagne': 'Spain',
  'Cap-Vert': 'Cape Verde', 'Arabie Saoudite': 'Saudi Arabia', 'Uruguay': 'Uruguay',
  'France': 'France', 'Sénégal': 'Senegal', 'Irak': 'Iraq', 'Norvège': 'Norway',
  'Argentine': 'Argentina', 'Algérie': 'Algeria', 'Autriche': 'Austria', 'Jordanie': 'Jordan',
  'Portugal': 'Portugal', 'RD Congo': 'DR Congo', 'Ouzbékistan': 'Uzbekistan', 'Colombie': 'Colombia',
  'Angleterre': 'England', 'Croatie': 'Croatia', 'Ghana': 'Ghana', 'Panama': 'Panama',
};

export async function searchPlayer(query) {
  if (query.length < 2) return [];
  try {
    const r = await fetch(
      `https://${API_HOST}/football-players-search?search=${encodeURIComponent(query)}`,
      { headers }
    );
    const data = await r.json();
    // L'API retourne response soit comme array, soit comme objet avec .players
    const raw = Array.isArray(data?.response)
      ? data.response
      : (data?.response?.players || data?.players || []);
    // Normaliser chaque item pour exposer .name directement
    return raw.map(p => ({
      name: p.player?.name || p.name || p.strPlayer || p.fullName || null,
      ...p,
    })).filter(p => p.name);
  } catch(e) {
    console.warn('searchPlayer failed:', e);
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

// Polling live score toutes les 60s et mise à jour Supabase
export function startLivePolling(matchId, homeTeam, awayTeam, supabase, onUpdate) {
  const update = async () => {
    const live = await fetchLiveScore(homeTeam, awayTeam);
    if (live) {
      const liveTime = live.status?.liveTime;
      const updateData = {
        home_score: live.home?.score ?? 0,
        away_score: live.away?.score ?? 0,
        minute:     liveTime ? (parseInt(liveTime.short) || 0) : 0,
        status:     'live',
        updated_at: new Date().toISOString(),
      };
      await supabase.from('matchs').update(updateData).eq('id', matchId);
      if (onUpdate) onUpdate(updateData);
    }
  };

  update();
  return setInterval(update, 60_000);
}
