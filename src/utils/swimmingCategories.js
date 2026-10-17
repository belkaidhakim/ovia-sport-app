/**
 * Catégories officielles de natation (Fédération Algérienne de Natation / World Aquatics)
 * et détection intelligente des fratries / réductions familiales.
 */

import { calculateAge } from './formatters';

/**
 * Liste officielle des catégories d'âge FANA (Fédération Algérienne de Natation)
 */
export const FANA_CATEGORIES = [
  { code: 'ECOLE', name: 'École', simpleName: 'ÉCOLE', ageBracket: '2017 et +', label: 'École (2017+)', catBadge: 'CAT: ÉCOLE', color: '#38bdf8', badgeBg: 'rgba(56, 189, 248, 0.15)' },
  { code: 'POU', name: 'Poussin', simpleName: 'POUSSIN', ageBracket: '2016', label: 'Poussin (2016)', catBadge: 'CAT: POUSSIN', color: '#818cf8', badgeBg: 'rgba(129, 140, 248, 0.15)' },
  { code: 'BEN', name: 'Benjamin', simpleName: 'BENJAMIN', ageBracket: '2014 - 2015', label: 'Benjamin (2014-2015)', catBadge: 'CAT: BENJAMIN', color: '#34d399', badgeBg: 'rgba(52, 211, 153, 0.15)' },
  { code: 'MIN', name: 'Minime', simpleName: 'MINIME', ageBracket: '2012 - 2013', label: 'Minime (2012-2013)', catBadge: 'CAT: MINIME', color: '#fbbf24', badgeBg: 'rgba(251, 191, 36, 0.15)' },
  { code: 'CAD', name: 'Cadet', simpleName: 'CADET', ageBracket: '2010 - 2011', label: 'Cadet (2010-2011)', catBadge: 'CAT: CADET', color: '#fb923c', badgeBg: 'rgba(251, 146, 60, 0.15)' },
  { code: 'JUN', name: 'Junior', simpleName: 'JUNIOR', ageBracket: '2008 - 2009', label: 'Junior (2008-2009)', catBadge: 'CAT: JUNIOR', color: '#f43f5e', badgeBg: 'rgba(244, 63, 94, 0.15)' },
  { code: 'SEN', name: 'Senior', simpleName: 'SENIOR', ageBracket: '2007 et avant', label: 'Senior (2007 et avant)', catBadge: 'CAT: SENIOR', color: '#a855f7', badgeBg: 'rgba(168, 85, 247, 0.15)' },
];

/**
 * Extrait l'année de naissance de manière robuste quel que soit le format
 * @param {string|number|Date} dateInput 
 * @returns {number|null}
 */
export const extractBirthYear = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === 'number') return dateInput;
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) return dateInput.getFullYear();
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}$/.test(trimmed)) return parseInt(trimmed, 10);
    const matchYMD = trimmed.match(/^(\d{4})[-/]/);
    if (matchYMD) return parseInt(matchYMD[1], 10);
    const matchDMY = trimmed.match(/[-/](\d{4})$/);
    if (matchDMY) return parseInt(matchDMY[1], 10);
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
  }
  return null;
};

/**
 * Retourne la catégorie officielle de natation selon la formule exacte du club :
 * =SI(D15>=2017;"école";SI(D15=2016;"Poussin";SI(D15>=2014;"Benjamin";SI(D15>=2012;"Minime";SI(D15>=2010;"Cadet";SI(D15>=2008;"Junior";SI(D15<=2007;"Sinior";)))))))
 * 
 * @param {string|Date|object} dateOrAthlete - Date de naissance ou objet athlète
 * @param {string} [explicitSexe] - 'M' ou 'F' (optionnel)
 * @returns {{ code: string, fanaCode: string, label: string, shortLabel: string, simpleName: string, catBadge: string, fanaCategory: string, ageBracket: string, birthYear: number|null, age: number|null, sportingAge: number|null, color: string, badgeBg: string }}
 */
export const getSwimmingCategory = (dateOrAthlete, explicitSexe = null) => {
  let dateNaissance = dateOrAthlete;
  let sexe = explicitSexe;

  if (dateOrAthlete && typeof dateOrAthlete === 'object' && !(dateOrAthlete instanceof Date)) {
    dateNaissance = dateOrAthlete.date_naissance;
    sexe = explicitSexe || dateOrAthlete.sexe;
  }

  const birthYear = extractBirthYear(dateNaissance);

  if (!birthYear) {
    return { 
      code: 'NA', 
      fanaCode: 'NA', 
      name: 'Non renseignée',
      label: 'Non renseignée', 
      shortLabel: 'N/A', 
      simpleName: 'N/A',
      catBadge: 'CAT: N/A',
      fanaCategory: 'Non renseignée',
      ageBracket: '-', 
      birthYear: null,
      age: null, 
      sportingAge: null, 
      color: '#94a3b8', 
      badgeBg: 'rgba(148, 163, 184, 0.15)' 
    };
  }

  const currentYear = new Date().getFullYear();
  const sportingAge = currentYear - birthYear;
  const civilAge = calculateAge(dateNaissance) ?? sportingAge;

  // Logique exacte spécifiée :
  // D15 >= 2017 -> école
  // D15 = 2016  -> Poussin
  // D15 >= 2014 -> Benjamin (2014 - 2015)
  // D15 >= 2012 -> Minime (2012 - 2013)
  // D15 >= 2010 -> Cadet (2010 - 2011)
  // D15 >= 2008 -> Junior (2008 - 2009)
  // D15 <= 2007 -> Sinior (Senior)

  if (birthYear >= 2017) {
    return { 
      code: 'ECOLE', 
      fanaCode: 'AVE', 
      name: 'École',
      label: 'École (2017+)', 
      shortLabel: 'École', 
      simpleName: 'ÉCOLE',
      catBadge: 'CAT: ÉCOLE',
      fanaCategory: 'École',
      ageBracket: '2017 et +', 
      birthYear,
      age: civilAge, 
      sportingAge, 
      color: '#38bdf8', 
      badgeBg: 'rgba(56, 189, 248, 0.15)' 
    };
  } else if (birthYear === 2016) {
    return { 
      code: 'POU', 
      fanaCode: 'POU', 
      name: 'Poussin',
      label: 'Poussin (2016)', 
      shortLabel: 'Poussin', 
      simpleName: 'POUSSIN',
      catBadge: 'CAT: POUSSIN',
      fanaCategory: 'Poussin',
      ageBracket: '2016', 
      birthYear,
      age: civilAge, 
      sportingAge, 
      color: '#818cf8', 
      badgeBg: 'rgba(129, 140, 248, 0.15)' 
    };
  } else if (birthYear >= 2014) {
    return { 
      code: 'BEN', 
      fanaCode: 'BEN', 
      name: 'Benjamin',
      label: 'Benjamin (2014-2015)', 
      shortLabel: 'Benjamin', 
      simpleName: 'BENJAMIN',
      catBadge: 'CAT: BENJAMIN',
      fanaCategory: 'Benjamin',
      ageBracket: '2014 - 2015', 
      birthYear,
      age: civilAge, 
      sportingAge, 
      color: '#34d399', 
      badgeBg: 'rgba(52, 211, 153, 0.15)' 
    };
  } else if (birthYear >= 2012) {
    return { 
      code: 'MIN', 
      fanaCode: 'MIN', 
      name: 'Minime',
      label: 'Minime (2012-2013)', 
      shortLabel: 'Minime', 
      simpleName: 'MINIME',
      catBadge: 'CAT: MINIME',
      fanaCategory: 'Minime',
      ageBracket: '2012 - 2013', 
      birthYear,
      age: civilAge, 
      sportingAge, 
      color: '#fbbf24', 
      badgeBg: 'rgba(251, 191, 36, 0.15)' 
    };
  } else if (birthYear >= 2010) {
    return { 
      code: 'CAD', 
      fanaCode: 'CAD', 
      name: 'Cadet',
      label: 'Cadet (2010-2011)', 
      shortLabel: 'Cadet', 
      simpleName: 'CADET',
      catBadge: 'CAT: CADET',
      fanaCategory: 'Cadet',
      ageBracket: '2010 - 2011', 
      birthYear,
      age: civilAge, 
      sportingAge, 
      color: '#fb923c', 
      badgeBg: 'rgba(251, 146, 60, 0.15)' 
    };
  } else if (birthYear >= 2008) {
    return { 
      code: 'JUN', 
      fanaCode: 'JUN', 
      name: 'Junior',
      label: 'Junior (2008-2009)', 
      shortLabel: 'Junior', 
      simpleName: 'JUNIOR',
      catBadge: 'CAT: JUNIOR',
      fanaCategory: 'Junior',
      ageBracket: '2008 - 2009', 
      birthYear,
      age: civilAge, 
      sportingAge, 
      color: '#f43f5e', 
      badgeBg: 'rgba(244, 63, 94, 0.15)' 
    };
  } else {
    // birthYear <= 2007 : Sinior / Senior
    return { 
      code: 'SEN', 
      fanaCode: 'SEN', 
      name: 'Senior',
      label: 'Senior (<=2007)', 
      shortLabel: 'Senior', 
      simpleName: 'SENIOR',
      catBadge: 'CAT: SENIOR',
      fanaCategory: 'Senior',
      ageBracket: '2007 et avant', 
      birthYear,
      age: civilAge, 
      sportingAge, 
      color: '#a855f7', 
      badgeBg: 'rgba(168, 85, 247, 0.15)' 
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
