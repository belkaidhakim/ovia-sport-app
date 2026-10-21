/**
 * =====================================================
 * OVIA SPORT — Dashboard Service Layer
 * =====================================================
 * Agrégation des données de synthèse exécutive, alertes,
 * assiduité et remplissage des groupes pour la direction.
 */

import { supabase } from '../supabaseClient';

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const parseHoraires = (horairesText) => {
  if (!horairesText) return [];
  try {
    const parsed = JSON.parse(horairesText);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
};

/**
 * Récupère l'ensemble des données agrégées pour le tableau de bord
 */
export async function getDashboardOverview() {
  try {
    // 1. Récupération des athlètes actifs avec cartes, cotisations et groupes
    const { data: athletesData, error: athletesError } = await supabase
      .from('athletes')
      .select(`*, cartes_acces(statut, date_dernier_paiement), cotisations(montant_paye, date_paiement, periode_couverte_fin), groupes(id, nom, horaires)`)
      .eq('est_actif', true)
      .order('date_inscription', { ascending: false });

    if (athletesError) {
      console.warn('Erreur chargement athlètes dashboard:', athletesError);
      throw athletesError;
    }

    let active = 0;
    let suspended = 0;
    let missingRevenue = 0;

    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const expiringSoon = [];
    const expiredList = [];
    const incompleteFiles = [];

    (athletesData || []).forEach(athlete => {
      const rawCards = athlete.cartes_acces;
      const cardObj = Array.isArray(rawCards) ? rawCards[0] : rawCards;
      const statut = cardObj?.statut || 'SUSPENDUE';
      if (statut === 'ACTIVE') {
        active++;
      } else {
        suspended++;
      }

      // Dossiers incomplets (certificat médical ou photo)
      const missingCertif = !athlete.certificat_medical_valide && !athlete.certificat_medical_url && !athlete.certificat_medical;
      const missingPhoto = !athlete.photo && !athlete.photo_url;
      if (missingCertif || missingPhoto) {
        incompleteFiles.push({
          ...athlete,
          missingCertif,
          missingPhoto
        });
      }

      // Analyse des dates de cotisations
      const rawGroup = athlete.groupes;
      const grpObj = Array.isArray(rawGroup) ? rawGroup[0] : rawGroup;
      // Montant par défaut (la colonne `tarif` n'existe pas dans la table groupes)
      const tarifToUse = 3000;

      const validCotis = Array.isArray(athlete.cotisations)
        ? athlete.cotisations.filter(c => c && c.periode_couverte_fin && !isNaN(new Date(c.periode_couverte_fin).getTime()))
        : [];

      if (validCotis.length > 0) {
        const sorted = [...validCotis].sort((a, b) => new Date(b.periode_couverte_fin) - new Date(a.periode_couverte_fin));
        const endDate = new Date(sorted[0].periode_couverte_fin);
        const endDateStr = isNaN(endDate.getTime()) ? '-' : endDate.toLocaleDateString('fr-FR');

        if (endDate < now) {
          const daysExpired = Math.max(1, Math.ceil((now - endDate) / (1000 * 60 * 60 * 24)));
          expiredList.push({
            ...athlete,
            endDateStr,
            daysExpired
          });
          missingRevenue += tarifToUse;
        } else if (endDate >= now && endDate <= in7Days) {
          const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
          expiringSoon.push({
            ...athlete,
            endDateStr,
            daysLeft
          });
        }
      } else {
        const lastPayment = cardObj?.date_dernier_paiement;

        if (lastPayment && !isNaN(new Date(lastPayment).getTime())) {
          const payDate = new Date(lastPayment);
          const estEndDate = new Date(payDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          const endDateStr = isNaN(estEndDate.getTime()) ? '-' : estEndDate.toLocaleDateString('fr-FR');
          if (estEndDate < now) {
            const daysExpired = Math.max(1, Math.ceil((now - estEndDate) / (1000 * 60 * 60 * 24)));
            expiredList.push({
              ...athlete,
              endDateStr,
              daysExpired
            });
            missingRevenue += tarifToUse;
          } else if (estEndDate <= in7Days) {
            const daysLeft = Math.max(0, Math.ceil((estEndDate - now) / (1000 * 60 * 60 * 24)));
            expiringSoon.push({
              ...athlete,
              endDateStr,
              daysLeft
            });
          }
        } else if (statut !== 'ACTIVE') {
          expiredList.push({
            ...athlete,
            endDateStr: 'Non réglé',
            daysExpired: 99
          });
          missingRevenue += tarifToUse;
        }
      }
    });

    // 2. Scans d'aujourd'hui
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayScans } = await supabase
      .from('presences')
      .select('athlete_id')
      .gte('date_scan', todayStart.toISOString());

    const todayScansSet = new Set(todayScans?.map(p => p.athlete_id) || []);
    const uniqueTodayAthletes = todayScansSet.size;

    // 3. Suivi des présences attendues aujourd'hui selon le planning
    const todayDayName = JOURS_FR[new Date().getDay()];
    let tomorrowIndex = new Date().getDay() + 1;
    if (tomorrowIndex > 6) tomorrowIndex = 0;
    const tomorrowDayName = JOURS_FR[tomorrowIndex];

    const expectedTodayList = [];
    const absentTodayList = [];
    const planningTodayMap = new Map();
    const planningTomorrowMap = new Map();

    (athletesData || []).forEach(athlete => {
      const rawGroup = athlete.groupes;
      const grpObj = Array.isArray(rawGroup) ? rawGroup[0] : rawGroup;
      if (!grpObj) return;
      const groupName = grpObj.nom || athlete.groupe;
      if (!groupName) return;
      const groupHoraires = parseHoraires(grpObj.horaires);

      const sessionToday = groupHoraires.find(h => h && h.jour === todayDayName);
      const sessionTomorrow = groupHoraires.find(h => h && h.jour === tomorrowDayName);

      if (sessionToday && sessionToday.heure) {
        expectedTodayList.push(athlete);
        if (!planningTodayMap.has(groupName)) {
          planningTodayMap.set(groupName, { nom: groupName, heure: sessionToday.heure, inscrits: 0 });
        }
        planningTodayMap.get(groupName).inscrits += 1;

        if (!todayScansSet.has(athlete.id)) {
          absentTodayList.push({
            ...athlete,
            heureSeance: sessionToday.heure
          });
        }
      }

      if (sessionTomorrow && sessionTomorrow.heure) {
        if (!planningTomorrowMap.has(groupName)) {
          planningTomorrowMap.set(groupName, { nom: groupName, heure: sessionTomorrow.heure, inscrits: 0 });
        }
        planningTomorrowMap.get(groupName).inscrits += 1;
      }
    });

    // 4. Scans des 7 derniers jours pour les courbes de tendance
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: weekScans } = await supabase
      .from('presences')
      .select(`date_scan, athletes(groupe, groupes(nom))`)
      .gte('date_scan', sevenDaysAgo.toISOString());

    const dailyTrendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      dailyTrendMap[dateStr] = {
        name: key,
        Total: 0,
        Initiation: 0,
        Apprentissage: 0,
        ElitePerf: 0,
        date: dateStr
      };
    }

    (weekScans || []).forEach(scan => {
      if (!scan || !scan.date_scan) return;
      const dateStr = scan.date_scan.split('T')[0];
      if (dailyTrendMap[dateStr]) {
        dailyTrendMap[dateStr].Total += 1;

        const athletesObj = Array.isArray(scan.athletes) ? scan.athletes[0] : scan.athletes;
        const groupesObj = athletesObj?.groupes ? (Array.isArray(athletesObj.groupes) ? athletesObj.groupes[0] : athletesObj.groupes) : null;
        const gName = (groupesObj?.nom || athletesObj?.groupe || '').toLowerCase();
        if (gName.includes('initiation')) {
          dailyTrendMap[dateStr].Initiation += 1;
        } else if (gName.includes('apprent')) {
          dailyTrendMap[dateStr].Apprentissage += 1;
        } else if (gName.includes('elit') || gName.includes('élit') || gName.includes('perf') || gName.includes('entra')) {
          dailyTrendMap[dateStr].ElitePerf += 1;
        }
      }
    });

    // 5. Statistiques de remplissage des groupes
    const { data: groupesData } = await supabase
      .from('groupes')
      .select('id, nom, capacite_max, athletes(id)');

    let totalCapacity = 0;
    let totalEnrolled = 0;
    const groupCapacityStats = (groupesData || []).map(g => {
      const count = Array.isArray(g.athletes) ? g.athletes.length : 0;
      const max = g.capacite_max || 20;
      totalCapacity += max;
      totalEnrolled += count;
      const fillRate = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;
      return { id: g.id, nom: g.nom || 'Groupe', count, max, fillRate };
    });

    const globalFillRate = totalCapacity > 0 ? Math.min(100, Math.round((totalEnrolled / totalCapacity) * 100)) : 0;

    return {
      total: athletesData?.length || 0,
      active,
      suspended,
      todayPresences: uniqueTodayAthletes,
      expectedToday: expectedTodayList.length,
      missingRevenue,
      absentTodayList,
      expiringSoon,
      expiredList,
      incompleteFiles,
      groupCapacityStats,
      totalCapacity,
      totalEnrolled,
      globalFillRate,
      recent: athletesData?.slice(0, 8) || [],
      allAthletes: athletesData || [],
      dailyPresenceTrend: Object.values(dailyTrendMap),
      planningToday: Array.from(planningTodayMap.values()).sort((a, b) => a.heure.localeCompare(b.heure)),
      planningTomorrow: Array.from(planningTomorrowMap.values()).sort((a, b) => a.heure.localeCompare(b.heure))
    };
  } catch (error) {
    console.error('Erreur getDashboardOverview:', error);
    throw error;
  }
}
