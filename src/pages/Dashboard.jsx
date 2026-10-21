import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CreditCard, 
  ScanLine, 
  Wallet, 
  MessageCircle, 
  AlertOctagon, 
  ExternalLink, 
  Activity, 
  CalendarDays, 
  Copy, 
  ShieldCheck, 
  Plus 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { supabase } from '../supabaseClient';
import { Skeleton } from '../components/ui';
import { formatWhatsAppPhone, calculateAge, formatDA } from '../utils/formatters';
import { getSwimmingCategory } from '../utils/swimmingCategories';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const JOURS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
};

const parseHoraires = (horairesText) => {
  if (!horairesText) return [];
  try {
    const parsed = JSON.parse(horairesText);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
};

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    todayPresences: 0,
    expectedToday: 0,
    missingRevenue: 0,
    absentTodayList: [],
    expiringSoon: [],
    expiredList: [],
    incompleteFiles: [],
    groupCapacityStats: [],
    totalCapacity: 0,
    totalEnrolled: 0,
    globalFillRate: 0,
    recent: [],
    recentPresences: [],
    dailyPresenceTrend: [],
    revenueBreakdown: [],
    planningToday: [],
    planningTomorrow: []
  });

  const [loading, setLoading] = useState(true);
  
  // Filtres du listing inscrits
  const [inscritsSearch, setInscritsSearch] = useState('');
  const [inscritsFilterStatus, setInscritsFilterStatus] = useState('ALL');
  const [inscritsFilterGroup, setInscritsFilterGroup] = useState('ALL');

  // Modals
  const [showBulkWA, setShowBulkWA] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Phase 4: Financial impact calculation
        const { data: athletesData, error: athletesError } = await supabase
          .from('athletes')
          .select(`*, cartes_acces(statut, date_dernier_paiement), cotisations(montant_paye, date_paiement, periode_couverte_fin), groupes(id, nom, horaires)`)
          .eq('est_actif', true)
          .order('date_inscription', { ascending: false });

        if (athletesError) throw athletesError;

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

          // Vérification des dossiers incomplets (ex: pas de certificat médical valide ou pas de photo)
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
          const tarifToUse = grpObj?.tarif || 3000; // Default 3000 if null

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
              missingRevenue += tarifToUse; // Impact financier
            } else if (endDate >= now && endDate <= in7Days) {
              const daysLeft = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
              expiringSoon.push({
                ...athlete,
                endDateStr,
                daysLeft
              });
            }
          } else {
            // Si pas d'historique dans la table cotisations, vérifier la carte d'accès
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

        // Date de début d'aujourd'hui
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Scans d'aujourd'hui
        const { data: todayScans } = await supabase
          .from('presences')
          .select('athlete_id')
          .gte('date_scan', todayStart.toISOString());

        const todayScansSet = new Set(todayScans?.map(p => p.athlete_id) || []);
        const uniqueTodayAthletes = todayScansSet.size;

        // Suivi des présences attendues aujourd'hui selon le planning
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
            if (!planningTodayMap.has(groupName)) planningTodayMap.set(groupName, { nom: groupName, heure: sessionToday.heure, inscrits: 0 });
            planningTodayMap.get(groupName).inscrits += 1;

            if (!todayScansSet.has(athlete.id)) {
              absentTodayList.push({
                ...athlete,
                heureSeance: sessionToday.heure
              });
            }
          }
          
          if (sessionTomorrow && sessionTomorrow.heure) {
            if (!planningTomorrowMap.has(groupName)) planningTomorrowMap.set(groupName, { nom: groupName, heure: sessionTomorrow.heure, inscrits: 0 });
            planningTomorrowMap.get(groupName).inscrits += 1;
          }
        });

        // Historique récent des présences
        const { data: presencesData } = await supabase
          .from('presences')
          .select(`id, date_scan, athlete_id, athletes (nom, prenom, groupe, groupes(nom, horaires))`)
          .order('date_scan', { ascending: false })
          .limit(100);

        // Récupérer les scans des 7 derniers jours pour le graphique multi-courbes
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 7 points (today included)
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
            
            // Catégorisation pour le graphique détaillé (Phase 4)
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

        const dailyPresenceTrend = Object.values(dailyTrendMap);

        // Statistiques de remplissage des groupes
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

        setStats({
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
          recentPresences: presencesData || [],
          dailyPresenceTrend,
          planningToday: Array.from(planningTodayMap.values()).sort((a,b) => a.heure.localeCompare(b.heure)),
          planningTomorrow: Array.from(planningTomorrowMap.values()).sort((a,b) => a.heure.localeCompare(b.heure))
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Filtrage dynamique des inscrits
  const filteredInscrits = useMemo(() => {
    return (stats.allAthletes || []).filter(athlete => {
      if (!athlete) return false;
      const grp = Array.isArray(athlete.groupes) ? athlete.groupes[0] : athlete.groupes;
      if (inscritsFilterGroup !== 'ALL') {
        const gName = grp?.nom || athlete.groupe || '';
        if (gName !== inscritsFilterGroup) return false;
      }

      const card = Array.isArray(athlete.cartes_acces) ? athlete.cartes_acces[0] : athlete.cartes_acces;
      const statut = card?.statut || 'SUSPENDUE';
      if (inscritsFilterStatus === 'ACTIVE' && statut !== 'ACTIVE') return false;
      if (inscritsFilterStatus === 'SUSPENDED' && statut === 'ACTIVE') return false;

      if (inscritsSearch) {
        const q = inscritsSearch.toLowerCase();
        const nom = (athlete.nom || '').toLowerCase();
        const prenom = (athlete.prenom || '').toLowerCase();
        return nom.includes(q) || prenom.includes(q);
      }

      return true;
    });
  }, [stats.allAthletes, inscritsFilterGroup, inscritsFilterStatus, inscritsSearch]);

  const athletesWithPhoneToExpire = useMemo(() => {
    return (stats.expiredList || []).filter(a => {
      const ph = a.telephone || a.contact_urgence || a.telephone_tuteur;
      return ph && String(ph).trim().length > 0;
    });
  }, [stats.expiredList]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 sm:p-6 transition-colors duration-200">
      
      {/* 1. HEADER PROPRE ET ALIGNÉ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-0">
              Tableau de bord de Gestion
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Inscriptions Ouvertes
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">
            Supervision, assiduité et recouvrement financier · Saison 2026 / 2027
          </p>
        </div>

        {/* Barre d'actions compacte et hiérarchisée */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/inscription`;
              navigator.clipboard.writeText(url);
              toast.success("Lien d'inscription copié !");
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Copy size={14} /> Copier Lien Public
          </button>
          
          <Link to="/assurances" className="no-underline">
            <button 
              type="button"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <ShieldCheck size={14} /> Assurances
            </button>
          </Link>
          
          <Link to="/athletes/new" className="no-underline">
            <button 
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-xs shadow-sky-600/20 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Nouvel Athlète
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <Skeleton height="130px" className="rounded-2xl" />
          <Skeleton height="130px" className="rounded-2xl" />
          <Skeleton height="130px" className="rounded-2xl" />
          <Skeleton height="130px" className="rounded-2xl" />
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden" 
          animate="visible"
        >
          {/* 2. LES 4 CARTES KPI (Contraste 100% lisible en clair & sombre) */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            
            {/* Carte 1 : Total Athlètes */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Total Athlètes Inscrits</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats.total}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-0">Effectif global saison active</p>
            </div>

            {/* Carte 2 : Présences */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Présences Aujourd'hui</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <ScanLine size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.todayPresences} <span className="text-lg font-semibold text-slate-500">nageur(s)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-0">
                {stats.expectedToday > 0 ? `${stats.todayPresences} sur ${stats.expectedToday} attendus` : `Sur ${stats.total} athlètes actifs`}
              </p>
            </div>

            {/* Carte 3 : Impayés */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Manque à gagner (Impayés)</span>
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{formatDA(stats.missingRevenue)}</div>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium mt-2 mb-0">
                {stats.expiredList.length} cotisation(s) suspendue(s)
              </p>
            </div>

            {/* Carte 4 : Cotisations à jour */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Cotisations à Jour</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.active}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-0">
                {stats.expiringSoon.length} arrivent à échéance (&lt; 7j)
              </p>
            </div>

          </motion.div>

          {/* 3. CENTRE D'ALERTES & PLANNING BASSIN */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            
            {/* ALERTES (Occupe 2 colonnes sur grand écran) */}
            {(stats.expiredList.length > 0 || stats.expiringSoon.length > 0 || stats.incompleteFiles.length > 0) && (
              <div className="p-5 xl:col-span-2 bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/30 rounded-2xl shadow-xs">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <AlertOctagon size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-0">
                        Centre d'Alertes
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Actions requises pour le recouvrement
                      </span>
                    </div>
                  </div>
                  
                  {athletesWithPhoneToExpire.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setShowBulkWA(!showBulkWA)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <MessageCircle size={14} /> 
                      {showBulkWA ? "Fermer l'outil WhatsApp" : "Outil Relances Groupées"}
                    </button>
                  )}
                </div>

                {/* Interface WhatsApp relance groupée */}
                <AnimatePresence>
                  {showBulkWA && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                        <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                          <MessageCircle size={15} /> Envoi en chaîne WhatsApp ({athletesWithPhoneToExpire.length} cibles)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                          Cliquez successivement sur chaque contact pour ouvrir la discussion WhatsApp pré-remplie.
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                          {athletesWithPhoneToExpire.map(athlete => {
                            const wpPhone = formatWhatsAppPhone(athlete.telephone || athlete.contact_urgence || athlete.telephone_tuteur);
                            if (!wpPhone) return null;
                            const msg = `Bonjour ${athlete.prenom || ''}, votre adhésion à Ovia Sport a expiré le ${athlete.endDateStr || ''}. Merci de bien vouloir régulariser votre cotisation à la réception du club. Cordialement.`;
                            return (
                              <a
                                key={`bulk-${athlete.id}`}
                                href={`https://wa.me/${wpPhone}?text=${encodeURIComponent(msg)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] text-white hover:opacity-90 transition no-underline"
                                onClick={(e) => {
                                  e.currentTarget.style.opacity = '0.5';
                                }}
                              >
                                <span className="uppercase">{athlete.nom}</span> <span className="capitalize">{athlete.prenom?.toLowerCase()}</span>
                                <ExternalLink size={12}/>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ALERTE 1 : COTISATIONS EXPIRÉES */}
                  <div className="p-4 rounded-xl flex flex-col justify-between bg-slate-50 dark:bg-slate-950/40 border border-rose-200 dark:border-rose-900/40">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          ❌ Expirées ({stats.expiredList.length})
                        </span>
                        {/* Correction formelle: Badge BLOQUÉ en ROUGE et non vert */}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                          BLOQUÉ
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                        {stats.expiredList.slice(0, 6).map(athlete => {
                          const wpPhone = formatWhatsAppPhone(athlete.telephone || athlete.contact_urgence || athlete.telephone_tuteur);
                          return (
                            <div key={athlete.id} className="flex justify-between items-center p-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <div>
                                <span className="font-semibold uppercase text-slate-900 dark:text-white">{athlete.nom}</span>{' '}
                                <span className="capitalize text-slate-700 dark:text-slate-300">{athlete.prenom?.toLowerCase()}</span>
                                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Expiré ({athlete.endDateStr || 'Échu'})</div>
                              </div>
                              <div className="flex items-center gap-1">
                                {wpPhone ? (
                                  <a 
                                    href={`https://wa.me/${wpPhone}?text=${encodeURIComponent(`Bonjour ${athlete.prenom || ''}, votre adhésion à Ovia Sport a expiré. Merci de vous rapprocher de l'accueil pour régularisation.`)}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                                    title="Relancer par WhatsApp"
                                  >
                                    <MessageCircle size={14} />
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ALERTE 2 : RENOUVELLEMENTS SOUS 7 JOURS */}
                  <div className="p-4 rounded-xl flex flex-col justify-between bg-slate-50 dark:bg-slate-950/40 border border-amber-200 dark:border-amber-900/40">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          ⏳ Imminents ({stats.expiringSoon.length})
                        </span>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
                          &lt; 7 jours
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                        {stats.expiringSoon.slice(0, 6).map(athlete => {
                          return (
                            <div key={athlete.id} className="flex justify-between items-center p-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                              <div>
                                <span className="font-semibold uppercase text-slate-900 dark:text-white">{athlete.nom}</span>{' '}
                                <span className="capitalize text-slate-700 dark:text-slate-300">{athlete.prenom?.toLowerCase()}</span>
                                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Dans {athlete.daysLeft}j</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PLANNING BASSIN PRO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs xl:col-span-1 border-l-4 border-l-sky-500 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <CalendarDays size={18} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">Planning Bassin</h3>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Aujourd'hui</h4>
                  {stats.planningToday.length === 0 ? (
                    <div className="flex flex-col items-start gap-2 py-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">Aucune séance prévue aujourd'hui.</p>
                      <Link to="/planning" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800 transition no-underline">
                        <Plus size={13} /> + Planifier une séance
                      </Link>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-2 p-0 list-none m-0">
                      {stats.planningToday.map((seance, idx) => (
                        <li key={`td-${idx}`} className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                          <span className="font-semibold text-slate-900 dark:text-white">{seance.nom}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-bold">{seance.heure}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">({seance.inscrits} inscrits)</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Demain</h4>
                  {stats.planningTomorrow.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">Aucune séance prévue.</p>
                  ) : (
                    <ul className="flex flex-col gap-2 p-0 list-none m-0">
                      {stats.planningTomorrow.map((seance, idx) => (
                        <li key={`tm-${idx}`} className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{seance.nom}</span>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{seance.heure}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <Link to="/planning" className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-between no-underline">
                  <span>Accéder au calendrier hebdomadaire</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* 4. GRAPHIQUES D'ANALYSE (Assiduité & Jauges) */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Assiduité par type de groupe */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0 flex items-center gap-2">
                    <Activity size={18} className="text-sky-500" />
                    Assiduité par type de groupe
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Répartition des passages (Initiation, Apprentissage, Élite)
                  </span>
                </div>
              </div>

              {stats.dailyPresenceTrend && stats.dailyPresenceTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={stats.dailyPresenceTrend} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorAppr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorElite" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                    <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)', 
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', 
                        color: isDark ? '#fff' : '#0f172a',
                        borderRadius: '12px', 
                        fontSize: '0.85rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Area type="monotone" name="Initiation" dataKey="Initiation" stackId="1" stroke="#10b981" strokeWidth={2} fill="url(#colorInit)" />
                    <Area type="monotone" name="Apprentissage" dataKey="Apprentissage" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAppr)" />
                    <Area type="monotone" name="Élite / Perf" dataKey="ElitePerf" stackId="1" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorElite)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                  Données en cours de synchronisation...
                </div>
              )}
            </div>

            {/* JAUGE DE REMPLISSAGE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">Remplissage Groupes</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Taux d'occupation global : {stats.globalFillRate}%</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-2 overflow-y-auto pr-1" style={{ maxHeight: '250px' }}>
                {stats.groupCapacityStats.map(g => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{g.nom}</span>
                      <span className="font-extrabold" style={{ color: g.fillRate >= 90 ? '#ef4444' : g.fillRate >= 70 ? '#f59e0b' : '#10b981' }}>
                        {g.count}/{g.max} ({g.fillRate}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min(100, g.fillRate)}%`, 
                          backgroundColor: g.fillRate >= 90 ? '#ef4444' : g.fillRate >= 70 ? '#f59e0b' : '#10b981'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 5. TABLEAUX DES ADHÉRENTS NORMALISÉ */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">Adhérents du Club ({filteredInscrits.length})</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Listing officiel des adhérents, catégories fédérales et expiration</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    placeholder="🔍 Nom ou prénom..."
                    value={inscritsSearch}
                    onChange={(e) => setInscritsSearch(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
                    style={{ width: '180px' }}
                  />
                  <select
                    value={inscritsFilterStatus}
                    onChange={(e) => setInscritsFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
                  >
                    <option value="ALL">Tous statuts</option>
                    <option value="ACTIVE">✅ À jour</option>
                    <option value="SUSPENDED">❌ Suspendu / Bloqué</option>
                  </select>
                  <select
                    value={inscritsFilterGroup}
                    onChange={(e) => setInscritsFilterGroup(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
                  >
                    <option value="ALL">Tous les groupes</option>
                    {(stats.groupCapacityStats || []).map((g) => (
                      <option key={g.nom} value={g.nom}>{g.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-responsive overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                      <th className="py-3 px-3">Adhérent</th>
                      <th className="py-3 px-3">Catégorie</th>
                      <th className="py-3 px-3">Groupe</th>
                      <th className="py-3 px-3">Expiration</th>
                      <th className="py-3 px-3">Statut</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {filteredInscrits.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-slate-500 dark:text-slate-400 py-8">
                          Aucun athlète ne correspond aux filtres.
                        </td>
                      </tr>
                    ) : (
                      filteredInscrits.slice(0, 15).map(athlete => {
                        const card = Array.isArray(athlete.cartes_acces) ? athlete.cartes_acces[0] : athlete.cartes_acces;
                        const statut = card?.statut || 'SUSPENDUE';
                        const age = calculateAge(athlete.date_naissance);
                        const grp = Array.isArray(athlete.groupes) ? athlete.groupes[0] : athlete.groupes;
                        const swimmingCat = getSwimmingCategory(athlete);
                        
                        // Expiration réelle calculée
                        const validCotisDates = Array.isArray(athlete.cotisations)
                          ? athlete.cotisations
                              .map(c => c?.periode_couverte_fin ? new Date(c.periode_couverte_fin).getTime() : NaN)
                              .filter(t => !isNaN(t))
                          : [];
                        
                        let expirationDisplay = '-';
                        let isExpired = false;
                        if (validCotisDates.length > 0) {
                          const maxDate = new Date(Math.max(...validCotisDates));
                          expirationDisplay = maxDate.toLocaleDateString('fr-FR');
                          if (maxDate < new Date()) isExpired = true;
                        } else if (card?.date_dernier_paiement) {
                          const payDate = new Date(card.date_dernier_paiement);
                          const estEndDate = new Date(payDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                          if (!isNaN(estEndDate.getTime())) {
                            expirationDisplay = estEndDate.toLocaleDateString('fr-FR');
                            if (estEndDate < new Date()) isExpired = true;
                          }
                        } else if (statut === 'ACTIVE') {
                          expirationDisplay = 'À jour (Saison)';
                        } else {
                          expirationDisplay = 'Non réglé';
                          isExpired = true;
                        }

                        const isBlocked = statut !== 'ACTIVE' || isExpired;

                        return (
                          <tr 
                            key={athlete.id} 
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              isBlocked ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-medium">
                              <button
                                type="button"
                                onClick={() => {
                                  window.dispatchEvent(new CustomEvent('open-athlete-drawer', { detail: athlete }));
                                }}
                                className="text-left bg-transparent border-0 p-0 cursor-pointer group"
                              >
                                <span className="uppercase font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition">
                                  {athlete.nom}
                                </span>{' '}
                                <span className="capitalize text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition">
                                  {athlete.prenom?.toLowerCase()}
                                </span>
                              </button>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {swimmingCat.simpleName || 'ÉCOLE'}
                              </span>{' '}
                              <span className="text-slate-400 text-[11px]">
                                ({age ? `${age} ans` : '-'})
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                              {grp?.nom || athlete.groupe || '-'}
                            </td>
                            <td className={`py-3 px-3 font-semibold ${
                              isBlocked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              {expirationDisplay}
                            </td>
                            <td className="py-3 px-3">
                              {isBlocked ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                                  BLOQUÉ
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                                  À JOUR
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link 
                                  to={`/finances?search=${encodeURIComponent(athlete.nom)}`} 
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  title="Consulter les cotisations"
                                >
                                  <CreditCard size={14} />
                                </Link>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    window.dispatchEvent(new CustomEvent('open-athlete-drawer', { detail: athlete }));
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                                >
                                  Fiche
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
