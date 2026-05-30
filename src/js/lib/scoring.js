/**
 * Footzy — Barème de points v1.0
 *
 * Score final (obligatoire)
 *   ✅ Score exact              → 5 pts
 *   🎯 Bon vainqueur + même écart → 3 pts
 *   🤝 Nul prévu + nul réel     → 2 pts
 *   ✓  Bon vainqueur seulement  → 1 pt
 *   ❌ Mauvais résultat         → 0 pt
 *
 * Bonus (si champs remplis dans prono ET match)
 *   ⚽ Buteur trouvé (max 3)    → +2 pts chacun
 *   🕐 Score mi-temps exact     → +2 pts
 *   🟨 Cartons jaunes (±1)      → +1 pt
 */

/**
 * Calcule les points pour un pronostic donné.
 * @param {Object} prono  - ligne de la table pronostics
 * @param {Object} match  - ligne de la table matchs (doit avoir status='finished')
 * @returns {{ points: number, status: string, breakdown: Object } | null}
 */
export function calculatePoints(prono, match) {
  if (!match || match.status !== 'finished') return null;

  const ph = Number(prono.home_score);
  const pa = Number(prono.away_score);
  const rh = Number(match.home_score);
  const ra = Number(match.away_score);

  if ([ph, pa, rh, ra].some(n => isNaN(n))) return null;

  let points = 0;
  let status = 'wrong';
  const breakdown = {};

  // ── Score final ─────────────────────────────────────────────
  if (ph === rh && pa === ra) {
    // Score exact
    points += 5;
    status = 'exact';
    breakdown.score = 5;
  } else {
    const pronoResult = ph > pa ? 'home' : ph < pa ? 'away' : 'draw';
    const realResult  = rh > ra ? 'home' : rh < ra ? 'away' : 'draw';

    if (pronoResult === realResult) {
      status = 'correct';
      if (pronoResult === 'draw') {
        // Nul prévu + nul réel (rare → bonus)
        points += 2;
        breakdown.score = 2;
      } else if ((ph - pa) === (rh - ra)) {
        // Bon vainqueur + même écart de buts
        points += 3;
        breakdown.score = 3;
      } else {
        // Bon vainqueur seulement
        points += 1;
        breakdown.score = 1;
      }
    } else {
      breakdown.score = 0;
    }
  }

  // ── Bonus buteurs ───────────────────────────────────────────
  const pronoButeurs = Array.isArray(prono.buteurs) ? prono.buteurs : [];
  const realButeurs  = Array.isArray(match.buteurs_reels) ? match.buteurs_reels : [];
  if (pronoButeurs.length && realButeurs.length) {
    const realNames = realButeurs.map(b =>
      (typeof b === 'string' ? b : b?.name || '').toLowerCase().trim()
    );
    let scorerPts = 0;
    pronoButeurs.slice(0, 3).forEach(b => {
      const name = (typeof b === 'string' ? b : b?.name || '').toLowerCase().trim();
      if (!name) return;
      // Match partiel sur le nom de famille (dernier mot)
      const lastName = name.split(' ').pop();
      if (lastName.length >= 3 && realNames.some(r => r.includes(lastName))) {
        scorerPts += 2;
      }
    });
    if (scorerPts > 0) {
      points += scorerPts;
      breakdown.buteurs = scorerPts;
    }
  }

  // ── Bonus mi-temps ──────────────────────────────────────────
  const htOk =
    match.ht_home != null && match.ht_away != null &&
    prono.ht_home != null && prono.ht_away != null;
  if (htOk &&
      Number(prono.ht_home) === Number(match.ht_home) &&
      Number(prono.ht_away) === Number(match.ht_away)) {
    points += 2;
    breakdown.halftime = 2;
  }

  // ── Bonus cartons jaunes (±1) ───────────────────────────────
  if (match.yellow_cards != null && prono.yellow_cards != null) {
    if (Math.abs(Number(prono.yellow_cards) - Number(match.yellow_cards)) <= 1) {
      points += 1;
      breakdown.yellowCards = 1;
    }
  }

  return { points, status, breakdown };
}

/**
 * Label court pour afficher le statut d'un prono.
 */
export function statusLabel(status) {
  if (status === 'exact')   return { emoji: '✅', text: 'Score exact',  color: '#00C44F', bg: '#E8FFF1', border: 'rgba(0,196,79,0.25)' };
  if (status === 'correct') return { emoji: '🎯', text: 'Correct',      color: '#00C44F', bg: '#E8FFF1', border: 'rgba(0,196,79,0.25)' };
  if (status === 'wrong')   return { emoji: '❌', text: 'Raté',         color: '#E8453C', bg: '#FEF2F2', border: 'rgba(232,69,60,0.2)' };
  return                           { emoji: '⏳', text: 'En attente',   color: '#6B6966', bg: '#F7F6F4', border: '#E8E6E2' };
}
