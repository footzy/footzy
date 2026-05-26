-- ============================================
-- FOOTZY — SCHEMA INITIAL
-- ============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  pseudo TEXT UNIQUE NOT NULL,
  equipe_favorite TEXT,
  flag_favorite TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'mid')),
  plan_expires_at TIMESTAMPTZ,
  streak_quotidien INT DEFAULT 0,
  derniere_connexion DATE,
  points_totaux INT DEFAULT 0,
  scores_exacts INT DEFAULT 0,
  whop_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groupes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6)),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  membres_max INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groupe_membres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  groupe_id UUID REFERENCES groupes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(groupe_id, user_id)
);

CREATE TABLE matchs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_id INT UNIQUE,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_flag TEXT NOT NULL,
  away_flag TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('groupes','huitiemes','quarts','demis','finale')),
  groupe TEXT,
  stade TEXT,
  kickoff_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','halftime','finished')),
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  minute INT DEFAULT 0,
  possession_home INT,
  possession_away INT,
  shots_home INT,
  shots_away INT,
  xg_home NUMERIC(4,2),
  xg_away NUMERIC(4,2),
  buteurs TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pronostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matchs(id) ON DELETE CASCADE,
  groupe_id UUID REFERENCES groupes(id) ON DELETE CASCADE,
  home_score INT NOT NULL,
  away_score INT NOT NULL,
  buteurs TEXT[] DEFAULT '{}',
  boost TEXT CHECK (boost IN (NULL, 'x2', 'joker', 'boost_buteur')),
  boost_buteur TEXT,
  malus_target UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','won','lost')),
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id, groupe_id)
);

CREATE TABLE pronostics_vainqueur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  groupe_id UUID REFERENCES groupes(id) ON DELETE CASCADE,
  equipe TEXT NOT NULL,
  flag TEXT NOT NULL,
  points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, groupe_id)
);

CREATE TABLE achats_boost (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matchs(id) ON DELETE CASCADE,
  pronostic_id UUID REFERENCES pronostics(id),
  type TEXT NOT NULL CHECK (type IN ('x2','joker','malus','boost_buteur')),
  prix_centimes INT NOT NULL,
  whop_transaction_id TEXT UNIQUE,
  applique BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE defis_quotidiens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  question TEXT NOT NULL,
  reponses JSONB NOT NULL,
  bonne_reponse INT NOT NULL,
  difficulte TEXT DEFAULT 'normal' CHECK (difficulte IN ('normal','demi','finale'))
);

CREATE TABLE reponses_defi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  defi_id UUID REFERENCES defis_quotidiens(id) ON DELETE CASCADE,
  reponse INT NOT NULL,
  correcte BOOLEAN NOT NULL,
  points INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, defi_id)
);

CREATE TABLE badges_utilisateur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  debloque_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_code)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_matchs_kickoff ON matchs(kickoff_at);
CREATE INDEX idx_matchs_status ON matchs(status);
CREATE INDEX idx_pronostics_user ON pronostics(user_id);
CREATE INDEX idx_pronostics_match ON pronostics(match_id);
CREATE INDEX idx_pronostics_groupe ON pronostics(groupe_id);
CREATE INDEX idx_profiles_points ON profiles(points_totaux DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE groupes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "groupes_select_member" ON groupes FOR SELECT
  USING (id IN (SELECT groupe_id FROM groupe_membres WHERE user_id = auth.uid()));
CREATE POLICY "groupes_insert" ON groupes FOR INSERT WITH CHECK (auth.uid() = created_by);

ALTER TABLE groupe_membres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membres_select_same_groupe" ON groupe_membres FOR SELECT
  USING (groupe_id IN (SELECT groupe_id FROM groupe_membres WHERE user_id = auth.uid()));
CREATE POLICY "membres_insert_self" ON groupe_membres FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE matchs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matchs_select_all" ON matchs FOR SELECT USING (true);

ALTER TABLE pronostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pronostics_select_groupe" ON pronostics FOR SELECT
  USING (groupe_id IN (SELECT groupe_id FROM groupe_membres WHERE user_id = auth.uid()));
CREATE POLICY "pronostics_insert_own" ON pronostics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pronostics_update_own_before_kickoff" ON pronostics FOR UPDATE
  USING (auth.uid() = user_id AND (SELECT kickoff_at FROM matchs WHERE id = match_id) > NOW());

ALTER TABLE pronostics_vainqueur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vainqueur_select_groupe" ON pronostics_vainqueur FOR SELECT
  USING (groupe_id IN (SELECT groupe_id FROM groupe_membres WHERE user_id = auth.uid()));
CREATE POLICY "vainqueur_insert_own" ON pronostics_vainqueur FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vainqueur_update_own" ON pronostics_vainqueur FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE achats_boost ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achats_select_own" ON achats_boost FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE defis_quotidiens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "defis_select_today" ON defis_quotidiens FOR SELECT USING (date <= CURRENT_DATE);

ALTER TABLE reponses_defi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reponses_select_own" ON reponses_defi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reponses_insert_own" ON reponses_defi FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE badges_utilisateur ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select_all" ON badges_utilisateur FOR SELECT USING (true);

-- ============================================
-- HELPER FUNCTIONS (called by resolve-match API)
-- ============================================
-- Allows non-members to look up a group by code (for joining)
CREATE OR REPLACE FUNCTION find_group_by_code(p_code TEXT)
RETURNS TABLE(id UUID, nom TEXT, code TEXT) AS $$
  SELECT id, nom, code FROM groupes WHERE UPPER(groupes.code) = UPPER(p_code);
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_profile_points(p_user_id UUID, p_points INT, p_scores_exacts INT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET
    points_totaux = points_totaux + p_points,
    scores_exacts = scores_exacts + p_scores_exacts
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION apply_malus(p_user_id UUID, p_points INT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET
    points_totaux = GREATEST(0, points_totaux - p_points)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, pseudo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'pseudo', 'Joueur_' || SUBSTRING(NEW.id::TEXT, 1, 6)))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
