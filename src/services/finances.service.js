/**
 * =====================================================
 * OVIA SPORT — Service Layer : Cotisations & Finances
 * =====================================================
 */

import { supabase } from '../supabaseClient';
import { DEFAULT_COTISATION_MONTANT, COTISATION_VALIDITY_DAYS } from '../config/constants';

// ─── Cotisations ──────────────────────────────────────────

/**
 * Récupère toutes les cotisations avec les données athlète.
 */
export async function fetchCotisations() {
  return supabase
    .from('cotisations')
    .select('*, athletes(id, nom, prenom, groupe, groupes(nom))')
    .order('date_paiement', { ascending: false });
}

/**
 * Récupère les cotisations d'un athlète spécifique.
 * @param {string} athleteId
 */
export async function fetchCotisationsByAthlete(athleteId) {
  return supabase
    .from('cotisations')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('date_paiement', { ascending: false });
}

/**
 * Enregistre un paiement de cotisation pour un athlète.
 * Active automatiquement la carte d'accès via le trigger DB.
 * @param {object} params
 * @param {string} params.athleteId
 * @param {number} params.montant
 * @param {string} params.modePaiement
 * @param {string} [params.periodeFin]
 */
export async function createCotisation({ athleteId, montant, modePaiement, periodeFin }) {
  const now = new Date();
  const fin = periodeFin || new Date(now.getTime() + COTISATION_VALIDITY_DAYS * 86_400_000)
    .toISOString().split('T')[0];

  return supabase.from('cotisations').insert([{
    athlete_id: athleteId,
    montant_paye: Number(montant) || DEFAULT_COTISATION_MONTANT,
    mode_paiement: modePaiement || 'Espèces',
    date_paiement: now.toISOString().split('T')[0],
    periode_couverte_fin: fin,
  }]);
}

/**
 * Enregistre des cotisations en masse (multi-athlètes).
 * @param {string[]} athleteIds
 * @param {number} montant
 * @param {string} modePaiement
 */
export async function bulkCreateCotisations(athleteIds, montant, modePaiement) {
  const now = new Date();
  const fin = new Date(now.getTime() + COTISATION_VALIDITY_DAYS * 86_400_000).toISOString().split('T')[0];
  const date = now.toISOString().split('T')[0];

  const rows = athleteIds.map(id => ({
    athlete_id: id,
    montant_paye: Number(montant) || DEFAULT_COTISATION_MONTANT,
    mode_paiement: modePaiement || 'Espèces',
    date_paiement: date,
    periode_couverte_fin: fin,
  }));

  return supabase.from('cotisations').insert(rows);
}

// ─── Dépenses ─────────────────────────────────────────────

/**
 * Récupère toutes les dépenses du club.
 */
export async function fetchDepenses() {
  return supabase
    .from('depenses')
    .select('*')
    .order('date_depense', { ascending: false });
}

/**
 * Crée une nouvelle dépense.
 * @param {object} payload
 */
export async function createDepense(payload) {
  return supabase.from('depenses').insert([payload]);
}

/**
 * Supprime une dépense.
 * @param {string} id
 */
export async function deleteDepense(id) {
  return supabase.from('depenses').delete().eq('id', id);
}

// ─── Présences ────────────────────────────────────────────

/**
 * Enregistre une présence (pointage séance).
 * @param {string} athleteId
 */
export async function createPresence(athleteId) {
  return supabase.from('presences').insert([{
    athlete_id: athleteId,
    date_scan: new Date().toISOString(),
  }]);
}

/**
 * Réinitialise le quota de présences d'un athlète.
 * @param {string} athleteId
 */
export async function resetPresences(athleteId) {
  return supabase.from('presences').delete().eq('athlete_id', athleteId);
}
