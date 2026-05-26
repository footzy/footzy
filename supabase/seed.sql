-- ============================================
-- FOOTZY — SEED : MATCHS CdM 2026 + DÉFIS
-- ============================================
-- Coupe du Monde 2026 : USA / Canada / Mexique
-- 14 juin – 19 juillet 2026
-- 48 équipes, 104 matchs de phase de groupes + 32 matchs knockout
-- Ce seed contient les matchs de phase de groupes + structure knockout

-- Phase de groupes (sélection illustrative — à compléter avec le tirage officiel)
-- Groupes A-L, 3 matches par groupe, 4 équipes par groupe

INSERT INTO matchs (home_team, away_team, home_flag, away_flag, phase, groupe, stade, kickoff_at) VALUES

-- GROUPE A
('États-Unis', 'Serbie', '🇺🇸', '🇷🇸', 'groupes', 'A', 'MetLife Stadium, NJ', '2026-06-14 21:00:00+00'),
('Uruguay', 'Panama', '🇺🇾', '🇵🇦', 'groupes', 'A', 'SoFi Stadium, LA', '2026-06-14 18:00:00+00'),
('États-Unis', 'Uruguay', '🇺🇸', '🇺🇾', 'groupes', 'A', 'MetLife Stadium, NJ', '2026-06-19 21:00:00+00'),
('Serbie', 'Panama', '🇷🇸', '🇵🇦', 'groupes', 'A', 'AT&T Stadium, Dallas', '2026-06-19 18:00:00+00'),
('États-Unis', 'Panama', '🇺🇸', '🇵🇦', 'groupes', 'A', 'MetLife Stadium, NJ', '2026-06-23 21:00:00+00'),
('Uruguay', 'Serbie', '🇺🇾', '🇷🇸', 'groupes', 'A', 'SoFi Stadium, LA', '2026-06-23 21:00:00+00'),

-- GROUPE B
('Mexique', 'Equateur', '🇲🇽', '🇪🇨', 'groupes', 'B', 'Estadio Azteca, Mexico', '2026-06-15 21:00:00+00'),
('Sénégal', 'Pays-Bas', '🇸🇳', '🇳🇱', 'groupes', 'B', 'Levi''s Stadium, SF', '2026-06-15 18:00:00+00'),
('Mexique', 'Sénégal', '🇲🇽', '🇸🇳', 'groupes', 'B', 'Estadio Azteca, Mexico', '2026-06-20 21:00:00+00'),
('Equateur', 'Pays-Bas', '🇪🇨', '🇳🇱', 'groupes', 'B', 'Rose Bowl, LA', '2026-06-20 18:00:00+00'),
('Mexique', 'Pays-Bas', '🇲🇽', '🇳🇱', 'groupes', 'B', 'Estadio Azteca, Mexico', '2026-06-24 21:00:00+00'),
('Equateur', 'Sénégal', '🇪🇨', '🇸🇳', 'groupes', 'B', 'Levi''s Stadium, SF', '2026-06-24 21:00:00+00'),

-- GROUPE C
('Argentine', 'Albanie', '🇦🇷', '🇦🇱', 'groupes', 'C', 'Hard Rock Stadium, Miami', '2026-06-15 00:00:00+00'),
('Maroc', 'Croatie', '🇲🇦', '🇭🇷', 'groupes', 'C', 'AT&T Stadium, Dallas', '2026-06-15 03:00:00+00'),
('Argentine', 'Maroc', '🇦🇷', '🇲🇦', 'groupes', 'C', 'Hard Rock Stadium, Miami', '2026-06-20 00:00:00+00'),
('Albanie', 'Croatie', '🇦🇱', '🇭🇷', 'groupes', 'C', 'MetLife Stadium, NJ', '2026-06-20 03:00:00+00'),
('Argentine', 'Croatie', '🇦🇷', '🇭🇷', 'groupes', 'C', 'Hard Rock Stadium, Miami', '2026-06-24 00:00:00+00'),
('Albanie', 'Maroc', '🇦🇱', '🇲🇦', 'groupes', 'C', 'AT&T Stadium, Dallas', '2026-06-24 00:00:00+00'),

-- GROUPE D
('France', 'Mexique B', '🇫🇷', '🇧🇷', 'groupes', 'D', 'Mercedes-Benz Stadium, Atlanta', '2026-06-16 21:00:00+00'),
('Angleterre', 'Tunisie', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇹🇳', 'groupes', 'D', 'Allegiant Stadium, LV', '2026-06-16 18:00:00+00'),
('France', 'Angleterre', '🇫🇷', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'groupes', 'D', 'Mercedes-Benz Stadium, Atlanta', '2026-06-21 21:00:00+00'),
('Mexique B', 'Tunisie', '🇧🇷', '🇹🇳', 'groupes', 'D', 'Allegiant Stadium, LV', '2026-06-21 18:00:00+00'),
('France', 'Tunisie', '🇫🇷', '🇹🇳', 'groupes', 'D', 'Mercedes-Benz Stadium, Atlanta', '2026-06-25 21:00:00+00'),
('Mexique B', 'Angleterre', '🇧🇷', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'groupes', 'D', 'Allegiant Stadium, LV', '2026-06-25 21:00:00+00'),

-- GROUPE E
('Espagne', 'Nigeria', '🇪🇸', '🇳🇬', 'groupes', 'E', 'Rose Bowl, LA', '2026-06-17 21:00:00+00'),
('Japon', 'Suède', '🇯🇵', '🇸🇪', 'groupes', 'E', 'Lincoln Financial, Philly', '2026-06-17 18:00:00+00'),
('Espagne', 'Japon', '🇪🇸', '🇯🇵', 'groupes', 'E', 'Rose Bowl, LA', '2026-06-22 21:00:00+00'),
('Nigeria', 'Suède', '🇳🇬', '🇸🇪', 'groupes', 'E', 'Lincoln Financial, Philly', '2026-06-22 18:00:00+00'),
('Espagne', 'Suède', '🇪🇸', '🇸🇪', 'groupes', 'E', 'Rose Bowl, LA', '2026-06-26 21:00:00+00'),
('Nigeria', 'Japon', '🇳🇬', '🇯🇵', 'groupes', 'E', 'Lincoln Financial, Philly', '2026-06-26 21:00:00+00'),

-- GROUPE F
('Allemagne', 'Chili', '🇩🇪', '🇨🇱', 'groupes', 'F', 'Arrowhead Stadium, KC', '2026-06-17 00:00:00+00'),
('Portugal', 'Côte d''Ivoire', '🇵🇹', '🇨🇮', 'groupes', 'F', 'Lumen Field, Seattle', '2026-06-17 03:00:00+00'),
('Allemagne', 'Portugal', '🇩🇪', '🇵🇹', 'groupes', 'F', 'Arrowhead Stadium, KC', '2026-06-22 00:00:00+00'),
('Chili', 'Côte d''Ivoire', '🇨🇱', '🇨🇮', 'groupes', 'F', 'Lumen Field, Seattle', '2026-06-22 03:00:00+00'),
('Allemagne', 'Côte d''Ivoire', '🇩🇪', '🇨🇮', 'groupes', 'F', 'Arrowhead Stadium, KC', '2026-06-26 00:00:00+00'),
('Chili', 'Portugal', '🇨🇱', '🇵🇹', 'groupes', 'F', 'Lumen Field, Seattle', '2026-06-26 00:00:00+00'),

-- GROUPE G
('Brésil', 'Danemark', '🇧🇷', '🇩🇰', 'groupes', 'G', 'SoFi Stadium, LA', '2026-06-18 21:00:00+00'),
('Colombie', 'Grèce', '🇨🇴', '🇬🇷', 'groupes', 'G', 'NRG Stadium, Houston', '2026-06-18 18:00:00+00'),
('Brésil', 'Colombie', '🇧🇷', '🇨🇴', 'groupes', 'G', 'SoFi Stadium, LA', '2026-06-23 21:00:00+00'),
('Danemark', 'Grèce', '🇩🇰', '🇬🇷', 'groupes', 'G', 'NRG Stadium, Houston', '2026-06-23 18:00:00+00'),
('Brésil', 'Grèce', '🇧🇷', '🇬🇷', 'groupes', 'G', 'SoFi Stadium, LA', '2026-06-27 21:00:00+00'),
('Danemark', 'Colombie', '🇩🇰', '🇨🇴', 'groupes', 'G', 'NRG Stadium, Houston', '2026-06-27 21:00:00+00'),

-- GROUPE H
('Belgique', 'Australie', '🇧🇪', '🇦🇺', 'groupes', 'H', 'Lincoln Financial, Philly', '2026-06-18 00:00:00+00'),
('Turquie', 'Cameroun', '🇹🇷', '🇨🇲', 'groupes', 'H', 'Camping World Stadium, Orlando', '2026-06-18 03:00:00+00'),
('Belgique', 'Turquie', '🇧🇪', '🇹🇷', 'groupes', 'H', 'Lincoln Financial, Philly', '2026-06-23 00:00:00+00'),
('Australie', 'Cameroun', '🇦🇺', '🇨🇲', 'groupes', 'H', 'Camping World Stadium, Orlando', '2026-06-23 03:00:00+00'),
('Belgique', 'Cameroun', '🇧🇪', '🇨🇲', 'groupes', 'H', 'Lincoln Financial, Philly', '2026-06-27 00:00:00+00'),
('Australie', 'Turquie', '🇦🇺', '🇹🇷', 'groupes', 'H', 'Camping World Stadium, Orlando', '2026-06-27 00:00:00+00'),

-- KNOCKOUT (structure — équipes TBD au tirage final)
-- Huitièmes de finale
('1er Groupe A', '2ème Groupe B', '🏳', '🏳', 'huitiemes', NULL, 'MetLife Stadium, NJ', '2026-07-02 21:00:00+00'),
('1er Groupe C', '2ème Groupe D', '🏳', '🏳', 'huitiemes', NULL, 'AT&T Stadium, Dallas', '2026-07-02 18:00:00+00'),
('1er Groupe E', '2ème Groupe F', '🏳', '🏳', 'huitiemes', NULL, 'Rose Bowl, LA', '2026-07-03 21:00:00+00'),
('1er Groupe G', '2ème Groupe H', '🏳', '🏳', 'huitiemes', NULL, 'SoFi Stadium, LA', '2026-07-03 18:00:00+00'),
('1er Groupe B', '2ème Groupe A', '🏳', '🏳', 'huitiemes', NULL, 'Mercedes-Benz Stadium, Atlanta', '2026-07-04 21:00:00+00'),
('1er Groupe D', '2ème Groupe C', '🏳', '🏳', 'huitiemes', NULL, 'Hard Rock Stadium, Miami', '2026-07-04 18:00:00+00'),
('1er Groupe F', '2ème Groupe E', '🏳', '🏳', 'huitiemes', NULL, 'NRG Stadium, Houston', '2026-07-05 21:00:00+00'),
('1er Groupe H', '2ème Groupe G', '🏳', '🏳', 'huitiemes', NULL, 'Lumen Field, Seattle', '2026-07-05 18:00:00+00'),

-- Quarts de finale
('Vainqueur H1', 'Vainqueur H2', '🏳', '🏳', 'quarts', NULL, 'MetLife Stadium, NJ', '2026-07-09 21:00:00+00'),
('Vainqueur H3', 'Vainqueur H4', '🏳', '🏳', 'quarts', NULL, 'SoFi Stadium, LA', '2026-07-09 18:00:00+00'),
('Vainqueur H5', 'Vainqueur H6', '🏳', '🏳', 'quarts', NULL, 'AT&T Stadium, Dallas', '2026-07-10 21:00:00+00'),
('Vainqueur H7', 'Vainqueur H8', '🏳', '🏳', 'quarts', NULL, 'Mercedes-Benz Stadium, Atlanta', '2026-07-10 18:00:00+00'),

-- Demi-finales
('Vainqueur Q1', 'Vainqueur Q2', '🏳', '🏳', 'demis', NULL, 'MetLife Stadium, NJ', '2026-07-14 21:00:00+00'),
('Vainqueur Q3', 'Vainqueur Q4', '🏳', '🏳', 'demis', NULL, 'Rose Bowl, LA', '2026-07-15 21:00:00+00'),

-- Finale
('Vainqueur SF1', 'Vainqueur SF2', '🏳', '🏳', 'finale', NULL, 'MetLife Stadium, NJ', '2026-07-19 21:00:00+00');

-- ============================================
-- DÉFIS QUOTIDIENS (14 juin → 19 juillet 2026)
-- ============================================
INSERT INTO defis_quotidiens (date, question, reponses, bonne_reponse, difficulte) VALUES
('2026-06-14', 'Combien d''équipes participent à la Coupe du Monde 2026 ?', '["32","36","48","64"]', 2, 'normal'),
('2026-06-15', 'Dans quelle ville se joue la finale de la CdM 2026 ?', '["Los Angeles","Miami","Mexico","New York / NJ"]', 3, 'normal'),
('2026-06-16', 'Qui est le meilleur buteur de l''histoire des Coupes du Monde ?', '["Pelé","Ronaldo (Brésil)","Miroslav Klose","Just Fontaine"]', 2, 'normal'),
('2026-06-17', 'Quelle équipe a remporté la dernière Coupe du Monde (2022) ?', '["France","Brésil","Argentine","Croatie"]', 2, 'normal'),
('2026-06-18', 'Combien de Coupes du Monde le Brésil a-t-il remportées ?', '["4","5","6","3"]', 1, 'normal'),
('2026-06-19', 'Qui a marqué le but de la victoire en finale 2022 ?', '["Messi","Mbappé","Gonzalo Montiel (pen)","Di María"]', 2, 'normal'),
('2026-06-20', 'Quel pays accueille seul le plus de matchs en 2026 ?', '["Canada","Mexique","États-Unis","Aucun, c''est équitable"]', 2, 'normal'),
('2026-06-21', 'Qui détient le record de buts sur une seule CdM (13 buts en 1958) ?', '["Pelé","Just Fontaine","Gerd Müller","Ronaldo"]', 1, 'demi'),
('2026-06-22', 'Quel joueur a le plus de Coupes du Monde gagnées (3) ?', '["Pelé","Ronaldo","Zidane","Cafu"]', 0, 'normal'),
('2026-06-23', 'En quelle année l''Allemagne a-t-elle perdu 7-1 contre le Brésil ?', '["2010","2014","2018","2006"]', 1, 'normal'),
('2026-06-24', 'Quel gardien a arrêté le plus de penalties en CdM ?', '["Sepp Maier","Gordon Banks","Peter Shilton","Gianluigi Buffon"]', 2, 'demi'),
('2026-06-25', 'Combien de fois la France a-t-elle remporté la CdM ?', '["1","2","3","0"]', 1, 'normal'),
('2026-06-26', 'Quel est le score le plus large de l''histoire de la CdM ?', '["17-0","10-1","9-0","12-0"]', 0, 'demi'),
('2026-06-27', 'Qui était l''arbitre de la finale 2022 ?', '["Howard Webb","Szymon Marciniak","Pierluigi Collina","Björn Kuipers"]', 1, 'demi'),
('2026-07-02', 'Quel pays organise le plus de stades pour 2026 ?', '["Canada","Mexique","États-Unis","Équitable"]', 2, 'normal'),
('2026-07-03', 'Mbappé a marqué combien de buts en CdM 2022 ?', '["5","7","8","6"]', 1, 'normal'),
('2026-07-04', 'Quel pays a été éliminé en phase de groupes en 2022 malgré avoir battu l''Argentine ?', '["Arabie Saoudite","Mexique","Cameroun","Japon"]', 0, 'demi'),
('2026-07-05', 'Qui a remporté le Ballon d''Or du joueur du tournoi en 2022 ?', '["Mbappé","Modric","Messi","Benzema"]', 2, 'finale'),
('2026-07-09', 'Quel gardien a été nommé meilleur gardien en 2022 ?', '["Lloris","Martinez (ARG)","Bounou","Alisson"]', 1, 'finale'),
('2026-07-10', 'Combien de penalties Messi a-t-il marqués dans la finale 2022 ?', '["1","2","3","0"]', 1, 'finale'),
('2026-07-14', 'Qui est le plus jeune buteur de l''histoire de la CdM ?', '["Pelé","Cesc Fabregas","Theo Walcott","Wayne Rooney"]', 0, 'finale'),
('2026-07-15', 'Combien de buts ont été inscrits en finale 2022 ?', '["3","5","6","7"]', 2, 'finale'),
('2026-07-19', 'Dans combien de pays se joue la CdM 2026 ?', '["1","2","3","4"]', 2, 'finale');
