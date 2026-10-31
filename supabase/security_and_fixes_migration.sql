-- ==============================================================================
-- OVIA SPORT — Migration Consolidée : Sécurité RLS, Triggers & Modes de Paiement
-- ==============================================================================
-- À exécuter dans l'éditeur SQL de Supabase pour appliquer l'ensemble des
-- correctifs de sécurité et de schéma identifiés lors de l'audit.
-- ==============================================================================

-- 1. Sécurisation du Trigger de création de profil (Empêcher l'attribution auto de 'admin')
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'entraineur';

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  has_any_admin BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') INTO has_any_admin;

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN has_any_admin THEN 'entraineur' ELSE 'admin' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Extension des modes de paiement autorisés sur la table cotisations (BaridiMob & Virement CCP)
DO $$
BEGIN
  ALTER TABLE public.cotisations DROP CONSTRAINT IF EXISTS cotisations_mode_paiement_check;
  ALTER TABLE public.cotisations
    ADD CONSTRAINT cotisations_mode_paiement_check
    CHECK (mode_paiement IN ('Espèces', 'Virement', 'Virement CCP', 'BaridiMob', 'Chèque'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- 3. Restriction des écritures sur la table assurances aux rôles 'admin' et 'secretaire'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assurances') THEN
    DROP POLICY IF EXISTS "Modification par le staff et admin" ON public.assurances;
    CREATE POLICY "Modification par le staff et admin" ON public.assurances
      FOR ALL TO authenticated
      USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'secretaire'))
      WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'secretaire'));
  END IF;
END $$;

-- 4. Sécurisation de club_settings (Seuls les utilisateurs authentifiés avec un rôle valide peuvent modifier)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'club_settings') THEN
    DROP POLICY IF EXISTS "Admins can update club_settings" ON public.club_settings;
    CREATE POLICY "Admins can update club_settings" ON public.club_settings
      FOR ALL TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'secretaire')
        OR key LIKE 'athlete_perfs_%'
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'secretaire')
        OR key LIKE 'athlete_perfs_%'
      );
  END IF;
END $$;

