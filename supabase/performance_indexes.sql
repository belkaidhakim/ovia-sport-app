-- =====================================================
-- OVIA SPORT — Index Supabase pour les performances
-- =====================================================
-- À exécuter dans l'éditeur SQL Supabase une seule fois.
-- Ces index accélèrent les queries les plus fréquentes.

-- Index sur les athlètes actifs (query principale de la sidebar et des listes)
CREATE INDEX IF NOT EXISTS idx_athletes_est_actif
  ON public.athletes(est_actif);

-- Index sur les inscriptions en attente (compteur sidebar + liste admin)
CREATE INDEX IF NOT EXISTS idx_inscriptions_statut
  ON public.inscriptions(statut);

-- Index sur les cotisations par athlète (fréquent dans FinancialDashboard)
CREATE INDEX IF NOT EXISTS idx_cotisations_athlete_id
  ON public.cotisations(athlete_id);

-- Index sur les fins de période (pour détecter les cotisations expirées)
CREATE INDEX IF NOT EXISTS idx_cotisations_periode_fin
  ON public.cotisations(periode_couverte_fin);

-- Index sur les dates de paiement (tri chronologique dans FinancialDashboard)
CREATE INDEX IF NOT EXISTS idx_cotisations_date_paiement
  ON public.cotisations(date_paiement DESC);

-- Index sur les présences par athlète (calcul du quota de séances)
CREATE INDEX IF NOT EXISTS idx_presences_athlete_id
  ON public.presences(athlete_id);

-- Index sur le statut des cartes d'accès (compteur sidebar + scanner)
CREATE INDEX IF NOT EXISTS idx_cartes_acces_statut
  ON public.cartes_acces(statut);

-- Index sur le token QR (utilisé par le scanner en temps réel)
CREATE INDEX IF NOT EXISTS idx_athletes_token_qr
  ON public.athletes(token_qr);

-- Index composite athlète + date d'inscription (tri liste athlètes)
CREATE INDEX IF NOT EXISTS idx_athletes_actif_inscription
  ON public.athletes(est_actif, date_inscription DESC);
