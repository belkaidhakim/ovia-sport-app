import React from 'react';
import { Users, CreditCard, Zap, ShieldCheck } from 'lucide-react';

export default function AthletesKPIs({
  totalActifs,
  payeCount,
  enAttenteCount,
  autorisesAccessCount,
  essaiAccessCount,
  medicalPercent
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Effectif */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Effectif Total
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalActifs} <span className="text-xs font-normal text-slate-500">nageurs</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 2: Cotisations */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Cotisations à jour
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {payeCount} / {totalActifs}{' '}
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              ({enAttenteCount} en attente)
            </span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <CreditCard className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 3: Smart Access */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Smart Access (Bassin)
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {autorisesAccessCount}{' '}
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              ({essaiAccessCount} en période d'essai)
            </span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Zap className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 4: Dossiers Médicaux */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Dossiers Médicaux
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {medicalPercent}%{' '}
            <span className="text-xs font-normal text-slate-500">Conformes</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
