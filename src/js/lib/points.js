const MULTIPLICATEURS_PHASE = {
  groupes: 1,
  huitiemes: 2,
  quarts: 3,
  demis: 5,
  finale: 10
};

export function calculerPoints(prono, match) {
  let points = 0;

  if (prono.home_score === match.home_score && prono.away_score === match.away_score) {
    points += 50;
  } else if (
    (prono.home_score > prono.away_score && match.home_score > match.away_score) ||
    (prono.home_score < prono.away_score && match.home_score < match.away_score)
  ) {
    points += 20;
  } else if (prono.home_score === prono.away_score && match.home_score === match.away_score) {
    points += 30;
  }

  let buteursOK = 0;
  for (const b of (prono.buteurs || [])) {
    if ((match.buteurs || []).includes(b)) {
      points += 20;
      buteursOK++;
    }
  }
  if (buteursOK === 3) points += 30;

  if (prono.boost === 'boost_buteur' && prono.boost_buteur) {
    if ((match.buteurs || []).includes(prono.boost_buteur)) {
      points += 40;
    }
  }

  points *= MULTIPLICATEURS_PHASE[match.phase] || 1;
  if (prono.boost === 'x2') points *= 2;

  return points;
}

export function calculerStatutLive(prono, match) {
  if (match.status === 'scheduled') return 'pending';
  if (match.status === 'finished') {
    return calculerPoints(prono, match) > 0 ? 'won' : 'lost';
  }

  const pronoVainqueur = prono.home_score > prono.away_score ? 'home'
    : prono.home_score < prono.away_score ? 'away' : 'draw';
  const liveVainqueur = match.home_score > match.away_score ? 'home'
    : match.home_score < match.away_score ? 'away' : 'draw';

  if (prono.home_score === match.home_score && prono.away_score === match.away_score) {
    return 'en_vie_exact';
  }
  if (pronoVainqueur === liveVainqueur) return 'en_vie';
  return 'compromis';
}

export function formatStatut(statut) {
  const labels = {
    pending: 'En attente',
    en_vie: 'En vie',
    en_vie_exact: 'Score exact !',
    compromis: 'Compromis',
    won: 'Gagné',
    lost: 'Perdu',
  };
  return labels[statut] || statut;
}
