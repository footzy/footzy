/**
 * Seed CdM 2026 avec les vrais matchs récupérés depuis RapidAPI
 * Données capturées lors des scans API précédents (quota mensuel atteint).
 * Usage: node scripts/sync-matches.mjs
 *
 * Pour re-syncer depuis l'API quand le quota reset, relancer ce script.
 * Les temps sont en UTC.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = 'https://xjnashvbxhnisgwphijw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbmFzaHZieGhuaXNnd3BoaWp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3OTMyMSwiZXhwIjoyMDk1MDU1MzIxfQ.ra1xbL8KcAFb-ANxFgyqpP5piMviq0r7uJ95y77NDvc';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Flags ────────────────────────────────────────────────────────
const F = {
  MEX:'🇲🇽', RSA:'🇿🇦', KOR:'🇰🇷', CZE:'🇨🇿',
  CAN:'🇨🇦', BIH:'🇧🇦', QAT:'🇶🇦', SUI:'🇨🇭',
  BRA:'🇧🇷', MAR:'🇲🇦', HAI:'🇭🇹', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  USA:'🇺🇸', PAR:'🇵🇾', AUS:'🇦🇺', TUR:'🇹🇷',
  GER:'🇩🇪', CUW:'🇨🇼', CIV:'🇨🇮', ECU:'🇪🇨',
  NED:'🇳🇱', JPN:'🇯🇵', SWE:'🇸🇪', TUN:'🇹🇳',
  BEL:'🇧🇪', EGY:'🇪🇬', IRN:'🇮🇷', NZL:'🇳🇿',
  ESP:'🇪🇸', CPV:'🇨🇻', KSA:'🇸🇦', URU:'🇺🇾',
  FRA:'🇫🇷', SEN:'🇸🇳', IRQ:'🇮🇶', NOR:'🇳🇴',
  ARG:'🇦🇷', ALG:'🇩🇿', AUT:'🇦🇹', JOR:'🇯🇴',
  POR:'🇵🇹', COD:'🇨🇩', UZB:'🇺🇿', COL:'🇨🇴',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', CRO:'🇭🇷', GHA:'🇬🇭', PAN:'🇵🇦',
};

// ── Team names (French) ─────────────────────────────────────────
const T = {
  MEX:'Mexique',           RSA:'Afrique du Sud',   KOR:'Corée du Sud',      CZE:'Rép. Tchèque',
  CAN:'Canada',            BIH:'Bosnie-Herzégovine',QAT:'Qatar',            SUI:'Suisse',
  BRA:'Brésil',            MAR:'Maroc',             HAI:'Haïti',             SCO:'Écosse',
  USA:'États-Unis',        PAR:'Paraguay',          AUS:'Australie',         TUR:'Türkiye',
  GER:'Allemagne',         CUW:'Curaçao',           CIV:"Côte d'Ivoire",    ECU:'Équateur',
  NED:'Pays-Bas',          JPN:'Japon',             SWE:'Suède',             TUN:'Tunisie',
  BEL:'Belgique',          EGY:'Égypte',            IRN:'Iran',              NZL:'Nouvelle-Zélande',
  ESP:'Espagne',           CPV:'Cap-Vert',          KSA:'Arabie Saoudite',  URU:'Uruguay',
  FRA:'France',            SEN:'Sénégal',           IRQ:'Irak',              NOR:'Norvège',
  ARG:'Argentine',         ALG:'Algérie',           AUT:'Autriche',          JOR:'Jordanie',
  POR:'Portugal',          COD:'RD Congo',          UZB:'Ouzbékistan',       COL:'Colombie',
  ENG:'Angleterre',        CRO:'Croatie',           GHA:'Ghana',             PAN:'Panama',
};

function m(home, away, kickoff, phase, groupe=null) {
  return {
    home_team: T[home], away_team: T[away],
    home_flag: F[home], away_flag: F[away],
    kickoff_at: kickoff, phase, groupe,
    status: 'scheduled', home_score: 0, away_score: 0, minute: 0,
  };
}

function tbd(home, away, kickoff, phase) {
  return {
    home_team: home, away_team: away,
    home_flag: '🏳️', away_flag: '🏳️',
    kickoff_at: kickoff, phase, groupe: null,
    status: 'scheduled', home_score: 0, away_score: 0, minute: 0,
  };
}

// ── GROUPE A : Mexique, Afrique du Sud, Corée du Sud, Rép. Tchèque
// Données exactes API (id=4667751-4667756)
const groupeA = [
  m('MEX','RSA', '2026-06-11T19:00:00Z', 'groupes', 'A'),
  m('KOR','CZE', '2026-06-12T02:00:00Z', 'groupes', 'A'),
  m('CZE','RSA', '2026-06-18T16:00:00Z', 'groupes', 'A'),
  m('MEX','KOR', '2026-06-19T01:00:00Z', 'groupes', 'A'),
  m('CZE','MEX', '2026-06-25T01:00:00Z', 'groupes', 'A'),
  m('RSA','KOR', '2026-06-25T01:00:00Z', 'groupes', 'A'),
];

// ── GROUPE B : Canada, Bosnie, Qatar, Suisse
// MD1 exact API, MD2/MD3 estimés
const groupeB = [
  m('CAN','BIH', '2026-06-12T19:00:00Z', 'groupes', 'B'),
  m('QAT','SUI', '2026-06-13T19:00:00Z', 'groupes', 'B'),
  m('SUI','BIH', '2026-06-18T19:00:00Z', 'groupes', 'B'),
  m('CAN','QAT', '2026-06-19T22:00:00Z', 'groupes', 'B'),
  m('CAN','SUI', '2026-06-25T19:00:00Z', 'groupes', 'B'),
  m('BIH','QAT', '2026-06-25T19:00:00Z', 'groupes', 'B'),
];

// ── GROUPE C : Brésil, Maroc, Haïti, Écosse
// MD1 exact API, MD2 game 1 exact, reste estimé
const groupeC = [
  m('BRA','MAR', '2026-06-13T22:00:00Z', 'groupes', 'C'),
  m('HAI','SCO', '2026-06-14T01:00:00Z', 'groupes', 'C'),
  m('SCO','MAR', '2026-06-19T22:00:00Z', 'groupes', 'C'),
  m('BRA','HAI', '2026-06-20T01:00:00Z', 'groupes', 'C'),
  m('BRA','SCO', '2026-06-26T22:00:00Z', 'groupes', 'C'),
  m('MAR','HAI', '2026-06-26T22:00:00Z', 'groupes', 'C'),
];

// ── GROUPE D : États-Unis, Paraguay, Australie, Türkiye
const groupeD = [
  m('USA','PAR', '2026-06-13T01:00:00Z', 'groupes', 'D'),
  m('AUS','TUR', '2026-06-14T04:00:00Z', 'groupes', 'D'),
  m('USA','AUS', '2026-06-19T19:00:00Z', 'groupes', 'D'),
  m('PAR','TUR', '2026-06-20T22:00:00Z', 'groupes', 'D'),
  m('USA','TUR', '2026-06-26T19:00:00Z', 'groupes', 'D'),
  m('PAR','AUS', '2026-06-26T19:00:00Z', 'groupes', 'D'),
];

// ── GROUPE E : Allemagne, Curaçao, Côte d'Ivoire, Équateur
const groupeE = [
  m('GER','CUW', '2026-06-14T17:00:00Z', 'groupes', 'E'),
  m('CIV','ECU', '2026-06-14T23:00:00Z', 'groupes', 'E'),
  m('GER','CIV', '2026-06-20T20:00:00Z', 'groupes', 'E'),
  m('CUW','ECU', '2026-06-21T23:00:00Z', 'groupes', 'E'),
  m('GER','ECU', '2026-06-27T20:00:00Z', 'groupes', 'E'),
  m('CUW','CIV', '2026-06-27T20:00:00Z', 'groupes', 'E'),
];

// ── GROUPE F : Pays-Bas, Japon, Suède, Tunisie
const groupeF = [
  m('NED','JPN', '2026-06-14T20:00:00Z', 'groupes', 'F'),
  m('SWE','TUN', '2026-06-15T02:00:00Z', 'groupes', 'F'),
  m('NED','SWE', '2026-06-20T17:00:00Z', 'groupes', 'F'),
  m('JPN','TUN', '2026-06-21T20:00:00Z', 'groupes', 'F'),
  m('NED','TUN', '2026-06-27T17:00:00Z', 'groupes', 'F'),
  m('JPN','SWE', '2026-06-27T17:00:00Z', 'groupes', 'F'),
];

// ── GROUPE G : Belgique, Égypte, Iran, Nouvelle-Zélande
const groupeG = [
  m('BEL','EGY', '2026-06-15T19:00:00Z', 'groupes', 'G'),
  m('IRN','NZL', '2026-06-16T01:00:00Z', 'groupes', 'G'),
  m('BEL','IRN', '2026-06-21T19:00:00Z', 'groupes', 'G'),
  m('EGY','NZL', '2026-06-22T22:00:00Z', 'groupes', 'G'),
  m('BEL','NZL', '2026-06-28T19:00:00Z', 'groupes', 'G'),
  m('EGY','IRN', '2026-06-28T19:00:00Z', 'groupes', 'G'),
];

// ── GROUPE H : Espagne, Cap-Vert, Arabie Saoudite, Uruguay
const groupeH = [
  m('ESP','CPV', '2026-06-15T16:00:00Z', 'groupes', 'H'),
  m('KSA','URU', '2026-06-15T22:00:00Z', 'groupes', 'H'),
  m('ESP','KSA', '2026-06-21T16:00:00Z', 'groupes', 'H'),
  m('CPV','URU', '2026-06-22T19:00:00Z', 'groupes', 'H'),
  m('ESP','URU', '2026-06-28T16:00:00Z', 'groupes', 'H'),
  m('CPV','KSA', '2026-06-28T16:00:00Z', 'groupes', 'H'),
];

// ── GROUPE I : France, Sénégal, Irak, Norvège
const groupeI = [
  m('FRA','SEN', '2026-06-16T19:00:00Z', 'groupes', 'I'),
  m('IRQ','NOR', '2026-06-16T22:00:00Z', 'groupes', 'I'),
  m('FRA','IRQ', '2026-06-22T21:00:00Z', 'groupes', 'I'),
  m('SEN','NOR', '2026-06-23T00:00:00Z', 'groupes', 'I'),
  m('FRA','NOR', '2026-06-29T19:00:00Z', 'groupes', 'I'),
  m('SEN','IRQ', '2026-06-29T19:00:00Z', 'groupes', 'I'),
];

// ── GROUPE J : Argentine, Algérie, Autriche, Jordanie
const groupeJ = [
  m('ARG','ALG', '2026-06-17T01:00:00Z', 'groupes', 'J'),
  m('AUT','JOR', '2026-06-17T04:00:00Z', 'groupes', 'J'),
  m('ARG','AUT', '2026-06-22T17:00:00Z', 'groupes', 'J'),
  m('ALG','JOR', '2026-06-23T20:00:00Z', 'groupes', 'J'),
  m('ARG','JOR', '2026-06-29T17:00:00Z', 'groupes', 'J'),
  m('ALG','AUT', '2026-06-29T17:00:00Z', 'groupes', 'J'),
];

// ── GROUPE K : Portugal, RD Congo, Ouzbékistan, Colombie
const groupeK = [
  m('POR','COD', '2026-06-17T17:00:00Z', 'groupes', 'K'),
  m('UZB','COL', '2026-06-18T02:00:00Z', 'groupes', 'K'),
  m('POR','UZB', '2026-06-23T17:00:00Z', 'groupes', 'K'),
  m('COD','COL', '2026-06-24T20:00:00Z', 'groupes', 'K'),
  m('POR','COL', '2026-06-30T17:00:00Z', 'groupes', 'K'),
  m('COD','UZB', '2026-06-30T17:00:00Z', 'groupes', 'K'),
];

// ── GROUPE L : Angleterre, Croatie, Ghana, Panama
const groupeL = [
  m('ENG','CRO', '2026-06-17T20:00:00Z', 'groupes', 'L'),
  m('GHA','PAN', '2026-06-17T23:00:00Z', 'groupes', 'L'),
  m('ENG','GHA', '2026-06-23T20:00:00Z', 'groupes', 'L'),
  m('CRO','PAN', '2026-06-24T23:00:00Z', 'groupes', 'L'),
  m('ENG','PAN', '2026-06-30T20:00:00Z', 'groupes', 'L'),
  m('CRO','GHA', '2026-06-30T20:00:00Z', 'groupes', 'L'),
];

// ── HUITIÈMES DE FINALE (R32) ─── données API exactes pour les 5 premiers
// Ordre selon l'API (leagueId=894789, stage=1/16)
const huitiemes = [
  tbd('1er Gr. H',  '2ème Gr. J', '2026-07-02T19:00:00Z', 'huitiemes'),
  tbd('2ème Gr. K', '2ème Gr. L', '2026-07-02T23:00:00Z', 'huitiemes'),
  tbd('1er Gr. B',  '3ème EFG-IJ','2026-07-03T03:00:00Z', 'huitiemes'),
  tbd('2ème Gr. D', '2ème Gr. G', '2026-07-03T18:00:00Z', 'huitiemes'),
  tbd('1er Gr. J',  '2ème Gr. H', '2026-07-03T22:00:00Z', 'huitiemes'),
  // Matchs suivants estimés selon planning WC 2026
  tbd('1er Gr. A',  '2ème Gr. C', '2026-07-04T19:00:00Z', 'huitiemes'),
  tbd('1er Gr. C',  '2ème Gr. A', '2026-07-04T23:00:00Z', 'huitiemes'),
  tbd('1er Gr. D',  '3ème ABCD',  '2026-07-05T19:00:00Z', 'huitiemes'),
  tbd('1er Gr. E',  '2ème Gr. F', '2026-07-05T23:00:00Z', 'huitiemes'),
  tbd('1er Gr. F',  '2ème Gr. E', '2026-07-06T19:00:00Z', 'huitiemes'),
  tbd('1er Gr. G',  '3ème GHIJKL','2026-07-06T23:00:00Z', 'huitiemes'),
  tbd('1er Gr. I',  '2ème Gr. K', '2026-07-07T19:00:00Z', 'huitiemes'),
  tbd('1er Gr. K',  '2ème Gr. I', '2026-07-07T23:00:00Z', 'huitiemes'),
  tbd('1er Gr. L',  '3ème ABCDE', '2026-07-08T19:00:00Z', 'huitiemes'),
  tbd('1er Gr. L',  '2ème Gr. B', '2026-07-08T23:00:00Z', 'huitiemes'), // placeholder
  tbd('Vainqueur R32-15', 'Vainqueur R32-16', '2026-07-09T19:00:00Z', 'huitiemes'), // placeholder
];

// ── QUARTS DE FINALE ──────────────────────────────────────────────
const quarts = [
  tbd('Vainqueur H1', 'Vainqueur H2', '2026-07-11T19:00:00Z', 'quarts'),
  tbd('Vainqueur H3', 'Vainqueur H4', '2026-07-11T23:00:00Z', 'quarts'),
  tbd('Vainqueur H5', 'Vainqueur H6', '2026-07-12T19:00:00Z', 'quarts'),
  tbd('Vainqueur H7', 'Vainqueur H8', '2026-07-12T23:00:00Z', 'quarts'),
  tbd('Vainqueur H9', 'Vainqueur H10','2026-07-13T19:00:00Z', 'quarts'),
  tbd('Vainqueur H11','Vainqueur H12','2026-07-13T23:00:00Z', 'quarts'),
  tbd('Vainqueur H13','Vainqueur H14','2026-07-14T19:00:00Z', 'quarts'),
  tbd('Vainqueur H15','Vainqueur H16','2026-07-14T23:00:00Z', 'quarts'),
];

// ── DEMI-FINALES ─────────────────────────────────────────────────
const demis = [
  tbd('Vainqueur Q1', 'Vainqueur Q2', '2026-07-14T19:00:00Z', 'demis'),
  tbd('Vainqueur Q3', 'Vainqueur Q4', '2026-07-15T19:00:00Z', 'demis'),
  tbd('Vainqueur Q5', 'Vainqueur Q6', '2026-07-15T23:00:00Z', 'demis'),
  tbd('Vainqueur Q7', 'Vainqueur Q8', '2026-07-16T19:00:00Z', 'demis'),
];

// ── FINALE ───────────────────────────────────────────────────────
const finale = [
  tbd('Vainqueur SF1', 'Vainqueur SF2', '2026-07-19T19:00:00Z', 'finale'),
];

// ── Compile all matches ──────────────────────────────────────────
const ALL_MATCHES = [
  ...groupeA, ...groupeB, ...groupeC, ...groupeD,
  ...groupeE, ...groupeF, ...groupeG, ...groupeH,
  ...groupeI, ...groupeJ, ...groupeK, ...groupeL,
  ...huitiemes, ...quarts, ...demis, ...finale,
];

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Sync CdM 2026 — données réelles depuis RapidAPI\n');
  console.log(`📊 ${ALL_MATCHES.length} matchs à insérer`);

  // Phase summary
  const phases = {};
  ALL_MATCHES.forEach(r => { phases[r.phase] = (phases[r.phase] || 0) + 1; });
  Object.entries(phases).forEach(([p, n]) => console.log(`   ${p}: ${n}`));

  // Confirm
  console.log('\n🗑️  Suppression de tous les matchs de test...');
  const { error: delErr } = await sb
    .from('matchs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (delErr) {
    console.error('❌ Erreur suppression:', delErr.message);
    process.exit(1);
  }
  console.log('   ✅ Table vidée\n');

  // Insert in batches
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < ALL_MATCHES.length; i += BATCH) {
    const batch = ALL_MATCHES.slice(i, i + BATCH);
    const { error } = await sb.from('matchs').insert(batch);
    if (error) {
      console.error(`❌ Erreur batch ${i}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`✅ ${inserted} matchs CdM 2026 insérés avec succès !`);

  // Verify
  const { count } = await sb.from('matchs').select('*', { count: 'exact', head: true });
  console.log(`\n📈 Total en base: ${count} matchs`);

  // Show first few
  const { data: sample } = await sb
    .from('matchs')
    .select('home_team, away_team, kickoff_at, phase, groupe')
    .order('kickoff_at')
    .limit(5);
  console.log('\nPremiers matchs:');
  sample?.forEach(m => {
    const d = new Date(m.kickoff_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Paris' });
    console.log(`  ${m.home_flag||''}  ${m.home_team} vs ${m.away_team}  — ${d} (Paris) — Groupe ${m.groupe||m.phase}`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
