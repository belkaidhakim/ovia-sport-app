-- ==============================================================================
-- OVIA SPORT — Sécurisation Renforcée des Justificatifs et Dossiers d'Inscription
-- ==============================================================================
-- Ce script verrouille l'accès aux justificatifs sensibles :
-- 1. Certificats médicaux
-- 2. Extraits d'acte de naissance (N°12)
-- 3. Autorisations parentales et observations médicales
--
-- RÈGLES DE SÉCURITÉ :
-- - Grand public (anonyme) : Dépôt à l'aveugle uniquement (INSERT). AUCUNE lecture possible.
-- - Entraîneur : AUCUN accès aux dossiers d'inscription ni aux justificatifs.
-- - Secrétaire : Consultation (SELECT) et validation/rejet (UPDATE).
-- - Administrateur : Contrôle total (SELECT, UPDATE, DELETE).
-- ==============================================================================

-- 1. Activation stricte du Row Level Security
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Dépôt public d'inscription (Anonyme & Authentifié)
-- Règle : Seul un INSERT avec statut 'EN_ATTENTE' est permis.
DROP POLICY IF EXISTS "Public can submit inscription" ON public.inscriptions;
CREATE POLICY "Public can submit inscription"
  ON public.inscriptions
  FOR INSERT
  WITH CHECK (statut = 'EN_ATTENTE');

-- 3. Lecture des justificatifs et dossiers
-- Règle : Seuls les rôles 'admin' et 'secretaire' peuvent lire les dossiers et télécharger les justificatifs.
DROP POLICY IF EXISTS "Admins and Staff can view all inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins and Staff can view inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Only authorized staff can view inscriptions" ON public.inscriptions;

CREATE POLICY "Only authorized staff can view inscriptions"
  ON public.inscriptions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'secretaire')
  );

-- 4. Validation et mise à jour des dossiers
-- Règle : Seuls les rôles 'admin' et 'secretaire' peuvent changer le statut ou le motif de rejet.
DROP POLICY IF EXISTS "Admins and Staff can update inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Only authorized staff can update inscriptions" ON public.inscriptions;

CREATE POLICY "Only authorized staff can update inscriptions"
  ON public.inscriptions
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'secretaire')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'secretaire')
  );

-- 5. Suppression des dossiers
-- Règle : Seul le rôle 'admin' peut supprimer définitivement une inscription.
DROP POLICY IF EXISTS "Admins can delete inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Only admins can delete inscriptions" ON public.inscriptions;

CREATE POLICY "Only admins can delete inscriptions"
  ON public.inscriptions
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
