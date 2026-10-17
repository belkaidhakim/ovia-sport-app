/**
 * Catégories officielles de natation (Fédération Algérienne de Natation / World Aquatics)
 * et détection intelligente des fratries / réductions familiales.
 */

import { calculateAge } from './formatters';

/**
 * Liste officielle des catégories d'âge FANA (Fédération Algérienne de Natation)
 */
export const FANA_CATEGORIES = [
  { code: 'AVE', name: 'Avenirs', ageBracket: '9 ans et moins', label: 'Avenirs (≤ 9 ans)', color: '#38bdf8', badgeBg: 'rgba(56, 189, 248, 0.15)' },
  { code: 'POU', name: 'Poussins', ageBracket: '10 - 11 ans', label: 'Poussins (10-11 ans)', color: '#818cf8', badgeBg: 'rgba(129, 140, 248, 0.15)' },
  { code: 'BEN', name: 'Benjamins', ageBracket: '12 - 13 ans', label: 'Benjamins (12-13 ans)', color: '#34d399', badgeBg: 'rgba(52, 211, 153, 0.15)' },
  { code: 'MIN', name: 'Minimes', ageBracket: '14 - 15 ans', label: 'Minimes (14-15 ans)', color: '#fbbf24', badgeBg: 'rgba(251, 191, 36, 0.15)' },
  { code: 'CAD', name: 'Cadets', ageBracket: '16 - 17 ans', label: 'Cadets (16-17 ans)', color: '#fb923c', badgeBg: 'rgba(251, 146, 60, 0.15)' },
  { code: 'JUN', name: 'Juniors', ageBracket: '18 - 19 ans', label: 'Juniors (18-19 ans)', color: '#f43f5e', badgeBg: 'rgba(244, 63, 94, 0.15)' },
  { code: 'SEN', name: 'Seniors', ageBracket: '20 - 34 ans', label: 'Seniors (20-34 ans)', color: '#a855f7', badgeBg: 'rgba(168, 85, 247, 0.15)' },
  { code: 'MAS', name: 'Masters', ageBracket: '35 ans et +', label: 'Masters (+35 ans)', color: '#06b6d4', badgeBg: 'rgba(6, 182, 212, 0.15)' },
];

/**
 * Retourne la catégorie officielle de natation selon le modèle officiel FANA
 * (Fédération Algérienne de Natation / World Aquatics)
 * @param {string|Date|object} dateOrAthlete - Date de naissance ou objet athlète
 * @param {string} [explicitSexe] - 'M' ou 'F' (optionnel)
 * @returns {{ code: string, fanaCode: string, label: string, shortLabel: string, fanaCategory: string, ageBracket: string, age: number|null, sportingAge: number|null, color: string, badgeBg: string }}
 */
export const getSwimmingCategory = (dateOrAthlete, explicitSexe = null) => {
  let dateNaissance = dateOrAthlete;
  let sexe = explicitSexe;

  if (dateOrAthlete && typeof dateOrAthlete === 'object' && !(dateOrAthlete instanceof Date)) {
    dateNaissance = dateOrAthlete.date_naissance;
    sexe = explicitSexe || dateOrAthlete.sexe;
  }

  if (!dateNaissance) {
    return { 
      code: 'NA', 
      fanaCode: 'NA', 
      label: 'Non renseignée', 
      shortLabel: 'N/A', 
      fanaCategory: 'Non renseignée',
      ageBracket: '-', 
      age: null, 
      sportingAge: null, 
      color: '#94a3b8', 
      badgeBg: 'rgba(148, 163, 184, 0.15)' 
    };
  }

  const birth = new Date(dateNaissance);
  if (isNaN(birth.getTime())) {
    return { 
      code: 'NA', 
      fanaCode: 'NA', 
      label: 'Date invalide', 
      shortLabel: 'N/A', 
      fanaCategory: 'Date invalide',
      ageBracket: '-', 
      age: null, 
      sportingAge: null, 
      color: '#94a3b8', 
      badgeBg: 'rgba(148, 163, 184, 0.15)' 
    };
  }

  const currentYear = new Date().getFullYear();
  const birthYear = birth.getFullYear();
  // Millésime fédéral FANA : l'âge au 31 décembre de la saison sportive en cours
  const sportingAge = currentYear - birthYear;
  const civilAge = calculateAge(dateNaissance) ?? sportingAge;
  const age = sportingAge >= 0 ? sportingAge : civilAge;

  const isFemale = typeof sexe === 'string' && (sexe.trim().toUpperCase() === 'F' || sexe.trim().toUpperCase() === 'FEMME' || sexe.trim().toUpperCase() === 'FILLE');

  if (age < 7) {
    return { 
      code: 'AVE', 
      fanaCode: 'AVE', 
      label: 'Avenirs (Baby Nat)', 
      shortLabel: 'Avenirs', 
      fanaCategory: 'Avenirs',
      ageBracket: '< 7 ans', 
      age: civilAge, 
      sportingAge, 
      color: '#ec4899', 
      badgeBg: 'rgba(236, 72, 153, 0.15)' 
    };
  } else if (age <= 9) {
    return { 
      code: 'AVE', 
      fanaCode: 'AVE', 
      label: 'Avenirs (≤ 9 ans)', 
      shortLabel: 'Avenirs', 
      fanaCategory: 'Avenirs',
      ageBracket: '9 ans et -', 
      age: civilAge, 
      sportingAge, 
      color: '#38bdf8', 
      badgeBg: 'rgba(56, 189, 248, 0.15)' 
    };
  } else if (age <= 11) {
    const name = isFemale ? 'Poussines' : 'Poussins';
    return { 
      code: 'POU', 
      fanaCode: 'POU', 
      label: `${name} (10-11 ans)`, 
      shortLabel: name, 
      fanaCategory: 'Poussins',
      ageBracket: '10 - 11 ans', 
      age: civilAge, 
      sportingAge, 
      color: '#818cf8', 
      badgeBg: 'rgba(129, 140, 248, 0.15)' 
    };
  } else if (age <= 13) {
    const name = isFemale ? 'Benjamines' : 'Benjamins';
    return { 
      code: 'BEN', 
      fanaCode: 'BEN', 
      label: `${name} (12-13 ans)`, 
      shortLabel: name, 
      fanaCategory: 'Benjamins',
      ageBracket: '12 - 13 ans', 
      age: civilAge, 
      sportingAge, 
      color: '#34d399', 
      badgeBg: 'rgba(52, 211, 153, 0.15)' 
    };
  } else if (age <= 15) {
    return { 
      code: 'MIN', 
      fanaCode: 'MIN', 
      label: 'Minimes (14-15 ans)', 
      shortLabel: 'Minimes', 
      fanaCategory: 'Minimes',
      ageBracket: '14 - 15 ans', 
      age: civilAge, 
      sportingAge, 
      color: '#fbbf24', 
      badgeBg: 'rgba(251, 191, 36, 0.15)' 
    };
  } else if (age <= 17) {
    const name = isFemale ? 'Cadettes' : 'Cadets';
    return { 
      code: 'CAD', 
      fanaCode: 'CAD', 
      label: `${name} (16-17 ans)`, 
      shortLabel: name, 
      fanaCategory: 'Cadets',
      ageBracket: '16 - 17 ans', 
      age: civilAge, 
      sportingAge, 
      color: '#fb923c', 
      badgeBg: 'rgba(251, 146, 60, 0.15)' 
    };
  } else if (age <= 19) {
    return { 
      code: 'JUN', 
      fanaCode: 'JUN', 
      label: 'Juniors (18-19 ans)', 
      shortLabel: 'Juniors', 
      fanaCategory: 'Juniors',
      ageBracket: '18 - 19 ans', 
      age: civilAge, 
      sportingAge, 
      color: '#f43f5e', 
      badgeBg: 'rgba(244, 63, 94, 0.15)' 
    };
  } else if (age < 35) {
    return { 
      code: 'SEN', 
      fanaCode: 'SEN', 
      label: 'Seniors (20-34 ans)', 
      shortLabel: 'Seniors', 
      fanaCategory: 'Seniors',
      ageBracket: '20 - 34 ans', 
      age: civilAge, 
      sportingAge, 
      color: '#a855f7', 
      badgeBg: 'rgba(168, 85, 247, 0.15)' 
    };
  } else {
    return { 
      code: 'MAS', 
      fanaCode: 'MAS', 
      label: 'Masters (+35 ans)', 
      shortLabel: 'Masters', 
      fanaCategory: 'Masters',
      ageBracket: '35 ans et +', 
      age: civilAge, 
      sportingAge, 
      color: '#06b6d4', 
      badgeBg: 'rgba(6, 182, 212, 0.15)' 
    };
  }
};

/**
 * Détecte les fratries parmi une liste d'athlètes (même nom de famille ou même numéro de téléphone tuteur)
 * @param {Array} athletes 
 * @returns {Map<string, { familyId: string, count: number, members: Array, discountPercent: number }>}
 */
export const detectSiblingGroups = (athletes = []) => {
  const familyMap = new Map();

  athletes.forEach(athlete => {
    const nomClean = (athlete.nom || '').trim().toUpperCase();
    const phoneClean = (athlete.contact_urgence || athlete.telephone_tuteur || athlete.telephone || '').replace(/\D/g, '');
    
    if (!nomClean && !phoneClean) return;

    const key = nomClean ? `NOM_${nomClean}` : `TEL_${phoneClean}`;

    if (!familyMap.has(key)) {
      familyMap.set(key, []);
    }
    familyMap.get(key).push(athlete);
  });

  const athleteFamilyInfo = new Map();

  familyMap.forEach((members, familyKey) => {
    if (members.length > 1) {
      const sorted = [...members].sort((a, b) => new Date(a.date_naissance || 0) - new Date(b.date_naissance || 0));

      sorted.forEach((member, index) => {
        let discountPercent = 0;
        if (index === 1) discountPercent = 10;
        else if (index >= 2) discountPercent = 20;

        athleteFamilyInfo.set(member.id, {
          familyKey,
          familyCount: members.length,
          siblingIndex: index + 1,
          discountPercent,
          siblings: members.filter(m => m.id !== member.id)
        });
      });
    }
  });

  return athleteFamilyInfo;
};

/**
 * Familles / Styles officiels de nage
 */
export const SWIMMING_STYLES = [
  { id: 'NL', label: 'Nage Libre (Crawl)', short: 'Nage Libre', icon: '🏊', color: '#38bdf8' },
  { id: 'DOS', label: 'Dos', short: 'Dos', icon: '🏊‍♂️', color: '#818cf8' },
  { id: 'BRASSE', label: 'Brasse', short: 'Brasse', icon: '🐸', color: '#34d399' },
  { id: 'PAP', label: 'Papillon', short: 'Papillon', icon: '🦋', color: '#fb923c' },
  { id: '4N', label: '4 Nages (Medley)', short: '4 Nages', icon: '🏅', color: '#f43f5e' },
];

/**
 * Liste standard des épreuves officielles de natation en bassin regroupées par style
 */
export const SWIMMING_EVENTS = [
  // Nage Libre
  { id: '50_NL', label: '50m Nage Libre', shortLabel: '50m NL', nage: 'Nage Libre', styleId: 'NL', distance: 50 },
  { id: '100_NL', label: '100m Nage Libre', shortLabel: '100m NL', nage: 'Nage Libre', styleId: 'NL', distance: 100 },
  { id: '200_NL', label: '200m Nage Libre', shortLabel: '200m NL', nage: 'Nage Libre', styleId: 'NL', distance: 200 },
  { id: '400_NL', label: '400m Nage Libre', shortLabel: '400m NL', nage: 'Nage Libre', styleId: 'NL', distance: 400 },
  { id: '800_NL', label: '800m Nage Libre', shortLabel: '800m NL', nage: 'Nage Libre', styleId: 'NL', distance: 800 },
  
  // Dos
  { id: '50_DOS', label: '50m Dos', shortLabel: '50m Dos', nage: 'Dos', styleId: 'DOS', distance: 50 },
  { id: '100_DOS', label: '100m Dos', shortLabel: '100m Dos', nage: 'Dos', styleId: 'DOS', distance: 100 },
  { id: '200_DOS', label: '200m Dos', shortLabel: '200m Dos', nage: 'Dos', styleId: 'DOS', distance: 200 },

  // Brasse
  { id: '50_BRASSE', label: '50m Brasse', shortLabel: '50m Brasse', nage: 'Brasse', styleId: 'BRASSE', distance: 50 },
  { id: '100_BRASSE', label: '100m Brasse', shortLabel: '100m Brasse', nage: 'Brasse', styleId: 'BRASSE', distance: 100 },
  { id: '200_BRASSE', label: '200m Brasse', shortLabel: '200m Brasse', nage: 'Brasse', styleId: 'BRASSE', distance: 200 },

  // Papillon
  { id: '50_PAP', label: '50m Papillon', shortLabel: '50m Pap', nage: 'Papillon', styleId: 'PAP', distance: 50 },
  { id: '100_PAP', label: '100m Papillon', shortLabel: '100m Pap', nage: 'Papillon', styleId: 'PAP', distance: 100 },
  { id: '200_PAP', label: '200m Papillon', shortLabel: '200m Pap', nage: 'Papillon', styleId: 'PAP', distance: 200 },

  // 4 Nages
  { id: '100_4N', label: '100m 4 Nages', shortLabel: '100m 4N', nage: '4 Nages', styleId: '4N', distance: 100 },
  { id: '200_4N', label: '200m 4 Nages', shortLabel: '200m 4N', nage: '4 Nages', styleId: '4N', distance: 200 },
  { id: '400_4N', label: '400m 4 Nages', shortLabel: '400m 4N', nage: '4 Nages', styleId: '4N', distance: 400 },
];
