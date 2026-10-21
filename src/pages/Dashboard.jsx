import React, { useState, useEffect } from 'react';
import { Copy, ShieldCheck, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skeleton } from '../components/ui';
import { dashboardService } from '../services';
import toast from 'react-hot-toast';

// Sous-composants modulaires du Dashboard
import DashboardKPIs from '../components/dashboard/DashboardKPIs';
import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import DashboardPlanning from '../components/dashboard/DashboardPlanning';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import DashboardAthletesTable from '../components/dashboard/DashboardAthletesTable';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
};

export default function Dashboard() {
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
    allAthletes: [],
    dailyPresenceTrend: [],
    planningToday: [],
    planningTomorrow: []
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardOverview();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      toast.error('Erreur lors du chargement des statistiques du club.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCopyPublicLink = () => {
    const url = `${window.location.origin}/inscription`;
    navigator.clipboard.writeText(url);
    toast.success("Lien d'inscription copié ! 🔗", {
      icon: '📋',
      duration: 3000
    });
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. EN-TÊTE EXÉCUTIF */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
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
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0 font-normal">
            Supervision, assiduité et recouvrement financier · Saison 2026 / 2027
          </p>
        </div>

        {/* Barre d'actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            type="button"
            onClick={handleCopyPublicLink}
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
          {/* 2. LES 4 CARTES KPI */}
          <motion.div variants={itemVariants}>
            <DashboardKPIs stats={stats} />
          </motion.div>

          {/* 3. CENTRE D'ALERTES & PLANNING BASSIN */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <DashboardAlerts stats={stats} />
            <DashboardPlanning 
              planningToday={stats.planningToday} 
              planningTomorrow={stats.planningTomorrow} 
            />
          </motion.div>

          {/* 4. GRAPHIQUES D'ANALYSE (Assiduité & Jauges) */}
          <motion.div variants={itemVariants}>
            <DashboardCharts 
              dailyPresenceTrend={stats.dailyPresenceTrend}
              groupCapacityStats={stats.groupCapacityStats}
              globalFillRate={stats.globalFillRate}
            />
          </motion.div>

          {/* 5. TABLEAU DES ADHÉRENTS */}
          <motion.div variants={itemVariants}>
            <DashboardAthletesTable 
              athletes={stats.allAthletes} 
              groupStats={stats.groupCapacityStats} 
            />
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
