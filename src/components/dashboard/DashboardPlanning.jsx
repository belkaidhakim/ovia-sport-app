import React from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPlanning({ planningToday = [], planningTomorrow = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs xl:col-span-1 border-l-4 border-l-sky-500 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <CalendarDays size={18} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">
              Planning Bassin
            </h3>
          </div>
        </div>

        {/* Aujourd'hui */}
        <div className="mb-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Aujourd'hui
          </h4>
          {planningToday.length === 0 ? (
            <div className="flex flex-col items-start gap-2 py-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                Aucune séance prévue aujourd'hui.
              </p>
              <Link
                to="/planning"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800 transition no-underline"
              >
                <Plus size={13} /> + Planifier une séance
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 p-0 list-none m-0">
              {planningToday.map((seance, idx) => (
                <li
                  key={`td-${idx}`}
                  className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{seance.nom}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-bold">
                      {seance.heure}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({seance.inscrits} inscrits)
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Demain */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Demain
          </h4>
          {planningTomorrow.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">Aucune séance prévue.</p>
          ) : (
            <ul className="flex flex-col gap-2 p-0 list-none m-0">
              {planningTomorrow.map((seance, idx) => (
                <li
                  key={`tm-${idx}`}
                  className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">{seance.nom}</span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{seance.heure}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          to="/planning"
          className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-between no-underline"
        >
          <span>Accéder au calendrier hebdomadaire</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
