import React from 'react';
import { Users, ScanLine, Wallet, CreditCard } from 'lucide-react';
import { formatDA } from '../../utils/formatters';

export default function DashboardKPIs({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
      {/* Carte 1 : Total Athlètes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Total Athlètes Inscrits
          </span>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {stats.total}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-0">
          Effectif global saison active
        </p>
      </div>

      {/* Carte 2 : Présences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Présences Aujourd'hui
          </span>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <ScanLine size={20} />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {stats.todayPresences} <span className="text-lg font-semibold text-slate-500">nageur(s)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-0">
          {stats.expectedToday > 0
            ? `${stats.todayPresences} sur ${stats.expectedToday} attendus`
            : `Sur ${stats.total} athlètes actifs`}
        </p>
      </div>

      {/* Carte 3 : Impayés */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Manque à gagner (Impayés)
          </span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
          {formatDA(stats.missingRevenue)}
        </div>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium mt-2 mb-0">
          {stats.expiredList?.length || 0} cotisation(s) suspendue(s)
        </p>
      </div>

      {/* Carte 4 : Cotisations à jour */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Cotisations à Jour
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
          {stats.active}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-0">
          {stats.expiringSoon?.length || 0} arrivent à échéance (&lt; 7j)
        </p>
      </div>
    </div>
  );
}
