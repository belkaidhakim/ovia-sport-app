-- ==========================================================
-- Migration : Ajout du Lieu de Naissance (athletes & inscriptions)
-- ==========================================================

-- 1. Ajout dans la table athletes
ALTER TABLE public.athletes 
ADD COLUMN IF NOT EXISTS lieu_naissance TEXT;

-- 2. Ajout dans la table inscriptions
ALTER TABLE public.inscriptions 
ADD COLUMN IF NOT EXISTS lieu_naissance TEXT;
