/**
 * =====================================================
 * OVIA SPORT — Athlete Business Helpers
 * =====================================================
 * Utilitaires centralisés pour le calcul des statuts
 * d'adhésion, d'accès bassin (Smart Access) et de catégorie d'âge.
 */

import { getSwimmingCategory } from './swimmingCategories';
import { DEFAULT_SESSION_QUOTA } from '../config/constants';

/**
 * Calcule l'âge et la catégorie de natation d'un athlète
 */
export const getAgeAndCategory = (dateNaissance, sexe = null) => {
  if (!dateNaissance) return { age: null, category: 'N/A', dateStr: '-' };
  const birth = new Date(dateNaissance);
  if (isNaN(birth.getTime())) return { age: null, category: 'N/A', dateStr: '-' };

  const cat = getSwimmingCategory(dateNaissance, sexe);
  return {
    age: cat.age,
    category: cat.simpleName,
    catBadge: cat.catBadge,
    fanaCategory: cat.fanaCategory,
    dateStr: birth.toLocaleDateString('fr-FR')
  };
};

/**
 * Détermine le statut de cotisation (payé ou en attente/expiré)
 */
export const getCotisationStatus = (cotisationsArr, cardStatut) => {
  if (!cotisationsArr || cotisationsArr.length === 0) {
    return { type: 'pending', label: 'En attente' };
  }
  const sorted = [...cotisationsArr].sort(
    (a, b) => new Date(b.periode_couverte_fin) - new Date(a.periode_couverte_fin)
  );
  const latest = sorted[0];
  const endDate = new Date(latest.periode_couverte_fin);
  const now = new Date();

  const monthNames = ['Janv', 'Fév', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const monthName = monthNames[endDate.getMonth()];

  if (endDate < now || cardStatut === 'EXPIREE' || cardStatut === 'SUSPENDUE') {
    return { type: 'expired', label: `Expiré (${monthName})` };
  } else {
    return { type: 'paid', label: `Payé (${monthName})` };
  }
};

/**
 * Règle de décision Smart Access pour les tourniquets et le contrôle bassin
 */
export const getSmartAccess = (athlete) => {
  const cardStatut =
    athlete.cartes_acces?.statut ||
    (Array.isArray(athlete.cartes_acces) && athlete.cartes_acces[0]?.statut) ||
    'ACTIVE';
  const presencesCount = Array.isArray(athlete.presences) ? athlete.presences.length : 0;
  const cotisations = athlete.cotisations || [];
  const maxSessions = DEFAULT_SESSION_QUOTA || 8;

  const sortedCotis = [...cotisations].sort(
    (a, b) => new Date(b.periode_couverte_fin) - new Date(a.periode_couverte_fin)
  );
  const latestCotis = sortedCotis[0];
  const isCotisPaid = latestCotis && new Date(latestCotis.periode_couverte_fin) >= new Date();

  if (cardStatut === 'SUSPENDUE' || cardStatut === 'BLOQUE') {
    return {
      code: 'BLOQUE',
      label: 'Accès Bloqué',
      sublabel: 'Carte suspendue',
      variant: 'danger'
    };
  }

  if (presencesCount >= maxSessions) {
    return {
      code: 'BLOQUE',
      label: 'Accès Bloqué',
      sublabel: `Quota ${maxSessions}/${maxSessions} épuisé`,
      variant: 'danger'
    };
  }

  if (isCotisPaid) {
    return {
      code: 'AUTORISE',
      label: 'Accès Autorisé',
      sublabel: `${Math.max(0, maxSessions - presencesCount)} séance(s) rest.`,
      variant: 'success'
    };
  }

  if (presencesCount <= 2) {
    return {
      code: 'TOLERANCE',
      label: `Tolérance Essai (${presencesCount}/2)`,
      sublabel: "Période d'essai",
      variant: 'warning'
    };
  }

  return {
    code: 'BLOQUE',
    label: 'Accès Bloqué',
    sublabel: 'Cotis. impayée',
    variant: 'danger'
  };
};
