/**
 * =====================================================
 * OVIA SPORT — Service Layer : Athlètes
 * =====================================================
 * Couche d'abstraction entre les hooks React et Supabase.
 * Centralise toutes les queries sur la table `athletes`.
 * Les hooks importent ces fonctions au lieu d'appeler
 * Supabase directement.
 */

import { supabase } from '../supabaseClient';

// ─── Sélecteurs réutilisables ─────────────────────────────
const ATHLETE_BASE_SELECT = `
  *,
  cartes_acces (statut, date_dernier_paiement),
  cotisations (periode_couverte_fin),
  groupes(id, nom),
  presences (id)
`;

const ATHLETE_FULL_SELECT = `
  *,
  cartes_acces (statut, date_dernier_paiement),
  cotisations (montant_paye, date_paiement, periode_couverte_fin),
  groupes(id, nom),
  presences (id)
`;

// ─── Fonctions de lecture ─────────────────────────────────

/**
 * Récupère tous les athlètes actifs avec leurs relations.
 * @returns {Promise<{ data: Array, error: object|null }>}
 */
export async function fetchActiveAthletes() {
  return supabase
    .from('athletes')
    .select(ATHLETE_BASE_SELECT)
    .eq('est_actif', true)
    .order('date_inscription', { ascending: false });
}

/**
 * Récupère tous les athlètes (actifs + archivés).
 * @returns {Promise<{ data: Array, error: object|null }>}
 */
export async function fetchAllAthletes() {
  return supabase
    .from('athletes')
    .select(ATHLETE_BASE_SELECT)
    .order('date_inscription', { ascending: false });
}

/**
 * Récupère les athlètes archivés (est_actif = false).
 * @returns {Promise<{ data: Array, error: object|null }>}
 */
export async function fetchArchivedAthletes() {
  return supabase
    .from('athletes')
    .select(`
      *,
      cartes_acces (statut, date_dernier_paiement),
      cotisations (periode_couverte_fin, date_paiement, montant_paye),
      groupes(id, nom)
    `)
    .eq('est_actif', false)
    .order('date_inscription', { ascending: false });
}

/**
 * Récupère un athlète par son ID.
 * @param {string} id
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function fetchAthleteById(id) {
  return supabase
    .from('athletes')
    .select(ATHLETE_FULL_SELECT)
    .eq('id', id)
    .single();
}

/**
 * Récupère un athlète par son token QR.
 * @param {string} token
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function fetchAthleteByToken(token) {
  return supabase
    .from('athletes')
    .select(ATHLETE_FULL_SELECT)
    .eq('token_qr', token)
    .single();
}

// ─── Compteurs rapides (pour la sidebar) ─────────────────

/**
 * Récupère les compteurs pour la sidebar sans charger les données complètes.
 * @returns {Promise<{ athletes: number, inscriptions: number, pendingCotis: number }>}
 */
export async function fetchSidebarCounts() {
  const [athletesRes, inscriptionsRes, suspendedRes] = await Promise.all([
    supabase.from('athletes').select('*', { count: 'exact', head: true }).eq('est_actif', true),
    supabase.from('inscriptions').select('*', { count: 'exact', head: true }).eq('statut', 'EN_ATTENTE'),
    supabase.from('cartes_acces').select('*', { count: 'exact', head: true }).eq('statut', 'SUSPENDUE'),
  ]);

  return {
    athletes: athletesRes.count ?? 0,
    inscriptions: inscriptionsRes.count ?? 0,
    pendingCotis: suspendedRes.count ?? 0,
  };
}

// ─── Fonctions d'écriture ─────────────────────────────────

/**
 * Crée un athlète avec fallback progressif si certaines colonnes n'existent pas.
 * @param {object} payload
 * @returns {Promise<{ data: object|null, error: object|null }>}
 */
export async function insertAthleteSafely(payload) {
  let toInsert = { ...payload };
  let result = await supabase.from('athletes').insert([toInsert]).select().maybeSingle();

  if (result.error && (
    result.error.message?.includes('column') ||
    result.error.message?.includes('schema cache') ||
    result.error.code === '42703'
  )) {
    console.warn('[athletesService] Colonnes étendues non trouvées, repli schéma standard:', result.error.message);
    const optionalCols = [
      'contact_urgence', 'observations_medicales', 'groupe_id',
      'certificat_medical', 'autorisation_parentale', 'extrait_naissance',
    ];
    optionalCols.forEach(col => delete toInsert[col]);
    if (result.error.message?.includes('lieu_naissance')) delete toInsert.lieu_naissance;

    result = await supabase.from('athletes').insert([toInsert]).select().maybeSingle();

    if (result.error?.message?.includes('column')) {
      delete toInsert.groupe;
      if (result.error.message?.includes('lieu_naissance')) delete toInsert.lieu_naissance;
      result = await supabase.from('athletes').insert([toInsert]).select().maybeSingle();
    }
  }

  return result;
}

/**
 * Archive un athlète (soft delete — est_actif = false).
 * @param {string} id
 */
export async function archiveAthlete(id) {
  return supabase.from('athletes').update({ est_actif: false }).eq('id', id);
}

/**
 * Restaure un athlète archivé (est_actif = true).
 * @param {string} id
 */
export async function restoreAthlete(id) {
  return supabase.from('athletes').update({ est_actif: true }).eq('id', id);
}

/**
 * Restaure plusieurs athlètes archivés en masse.
 * @param {string[]} ids
 */
export async function bulkRestoreAthletes(ids) {
  return supabase.from('athletes').update({ est_actif: true }).in('id', ids);
}

/**
 * Supprime définitivement un athlète et toutes ses données liées.
 * @param {string} id
 */
export async function deleteAthletePermanently(id) {
  await Promise.allSettled([
    supabase.from('cartes_acces').delete().eq('athlete_id', id),
    supabase.from('cotisations').delete().eq('athlete_id', id),
    supabase.from('assurances').delete().eq('athlete_id', id),
    supabase.from('presences').delete().eq('athlete_id', id),
    supabase.from('scans').delete().eq('athlete_id', id),
  ]);
  return supabase.from('athletes').delete().eq('id', id);
}

/**
 * Supprime définitivement plusieurs athlètes et leurs données.
 * @param {string[]} ids
 */
export async function bulkDeleteAthletes(ids) {
  await Promise.allSettled([
    supabase.from('cartes_acces').delete().in('athlete_id', ids),
    supabase.from('cotisations').delete().in('athlete_id', ids),
    supabase.from('assurances').delete().in('athlete_id', ids),
    supabase.from('presences').delete().in('athlete_id', ids),
    supabase.from('scans').delete().in('athlete_id', ids),
  ]);
  return supabase.from('athletes').delete().in('id', ids);
}

/**
 * Réaffecte des athlètes à un groupe en masse.
 * @param {string[]} athleteIds
 * @param {string} groupeId
 * @param {string} groupeNom
 */
export async function bulkUpdateGroup(athleteIds, groupeId, groupeNom) {
  return supabase
    .from('athletes')
    .update({ groupe_id: groupeId, groupe: groupeNom })
    .in('id', athleteIds);
}

// ─── Cartes d'accès ───────────────────────────────────────

/**
 * Bascule le statut d'accès d'un athlète (ACTIVE ↔ SUSPENDUE).
 * @param {string} athleteId
 * @param {'ACTIVE'|'SUSPENDUE'} newStatus
 */
export async function updateAccessStatus(athleteId, newStatus) {
  return supabase
    .from('cartes_acces')
    .update({ statut: newStatus })
    .eq('athlete_id', athleteId);
}

/**
 * Met à jour le statut d'accès pour plusieurs athlètes.
 * @param {string[]} athleteIds
 * @param {'ACTIVE'|'SUSPENDUE'} newStatus
 */
export async function bulkUpdateAccessStatus(athleteIds, newStatus) {
  return supabase
    .from('cartes_acces')
    .update({ statut: newStatus })
    .in('athlete_id', athleteIds);
}

/**
 * Autorise l'accès avec mise à jour de la date de paiement.
 * @param {string} athleteId
 */
export async function grantAccess(athleteId) {
  return supabase
    .from('cartes_acces')
    .update({ statut: 'ACTIVE', date_dernier_paiement: new Date().toISOString() })
    .eq('athlete_id', athleteId);
}
