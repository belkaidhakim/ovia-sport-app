-- ==========================================================
-- Migration : Ajout du Lieu de Naissance (athletes & inscriptions)
-- ==========================================================

-- 1. Ajout dans la table athletes
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS lieu_naissance TEXT;

-- 2. Ajout dans la table inscriptions
ALTER TABLE public.inscriptions 
ADD COLUMN IF NOT EXISTS lieu_naissance TEXT;

-- 3. Synchronisation rétroactive automatique des athlètes existants depuis les inscriptions
UPDATE public.athletes a
SET lieu_naissance = i.lieu_naissance
FROM public.inscriptions i
WHERE (a.nom = i.nom AND a.prenom = i.prenom)
  AND (a.lieu_naissance IS NULL OR a.lieu_naissance = '')
  AND (i.lieu_naissance IS NOT NULL AND i.lieu_naissance <> '');
