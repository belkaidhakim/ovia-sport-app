/**
 * =====================================================
 * OVIA SPORT — Constantes Centralisées de l'Application
 * =====================================================
 * Toutes les valeurs "magiques" (strings hardcodés) doivent
 * être importées depuis ce fichier pour éviter les typos et
 * faciliter les évolutions futures.
 */

// ─── Rôles utilisateurs ───────────────────────────────────
export const ROLES = /** @type {const} */ ({
  ADMIN: 'admin',
  SECRETAIRE: 'secretaire',
  ENTRAINEUR: 'entraineur',
});

/** Tous les rôles autorisés à accéder à l'espace admin */
export const ALL_ADMIN_ROLES = [ROLES.ADMIN, ROLES.SECRETAIRE, ROLES.ENTRAINEUR];

/** Rôles avec droits d'écriture complets */
export const WRITE_ROLES = [ROLES.ADMIN, ROLES.SECRETAIRE];

/** Libellés affichés pour chaque rôle */
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.SECRETAIRE]: 'Secrétaire',
  [ROLES.ENTRAINEUR]: 'Entraîneur',
};

// ─── Statuts des cartes d'accès ───────────────────────────
export const ACCESS_STATUS = /** @type {const} */ ({
  ACTIVE: 'ACTIVE',
  SUSPENDUE: 'SUSPENDUE',
  EXPIREE: 'EXPIREE',
});

// ─── Statuts des inscriptions ─────────────────────────────
export const INSCRIPTION_STATUS = /** @type {const} */ ({
  EN_ATTENTE: 'EN_ATTENTE',
  VALIDE: 'VALIDE',
  REJETE: 'REJETE',
});

/** Labels et couleurs pour les statuts d'inscription */
export const INSCRIPTION_STATUS_META = {
  [INSCRIPTION_STATUS.EN_ATTENTE]: { label: 'En attente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  [INSCRIPTION_STATUS.VALIDE]:     { label: 'Validé',      color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  [INSCRIPTION_STATUS.REJETE]:     { label: 'Rejeté',      color: '#f43f5e', bg: 'rgba(244,63,94,0.12)'  },
};

// ─── Modes de paiement ────────────────────────────────────
export const PAYMENT_MODES = ['Espèces', 'Virement', 'Chèque'];

// ─── Paramètres sportifs ──────────────────────────────────
/** Nombre de séances par défaut dans un forfait mensuel */
export const DEFAULT_SESSION_QUOTA = 8;

/** Montant de cotisation mensuelle par défaut (DA) */
export const DEFAULT_COTISATION_MONTANT = 3000;

/** Durée de validité d'une cotisation en jours */
export const COTISATION_VALIDITY_DAYS = 30;

// ─── Clés localStorage ───────────────────────────────────
export const STORAGE_KEYS = {
  CACHED_ATHLETES: 'scb_cached_athletes_v1',
  INSCRIPTIONS_BACKUP: 'local_inscriptions_backup',
  PERF_PREFIX: 'scb_athlete_perfs_',
  PERF_LEGACY_PREFIX: 'ovs_athlete_perfs_',
};

// ─── Événements CustomEvent de l'application ─────────────
export const APP_EVENTS = {
  OPEN_ATHLETE_DRAWER: 'open-athlete-drawer',
  PERFORMANCES_UPDATED: 'ovia_performances_updated',
  INSCRIPTIONS_UPDATED: 'scb_inscriptions_updated',
};

// ─── Saison sportive actuelle ─────────────────────────────
export const CURRENT_SEASON = '2026 / 2027';

// ─── Identifiant du club ──────────────────────────────────
export const CLUB_NAME = 'OVIA SPORT';
export const CLUB_SUBTITLE = 'Aquatic Club ERP';

// ─── Délai de rafraîchissement des compteurs sidebar (ms) ─
export const SIDEBAR_REFRESH_INTERVAL = 30_000;
