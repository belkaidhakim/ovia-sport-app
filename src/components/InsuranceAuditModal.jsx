import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { INITIAL_LOGS } from '../utils/insuranceAudit';

export default function InsuranceAuditModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('ovia_insurance_audit_log');
        setLogs(stored ? JSON.parse(stored) : INITIAL_LOGS);
      } catch {
        setLogs(INITIAL_LOGS);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(item => {
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch = !q || 
      (item.athleteNom || '').toLowerCase().includes(q) ||
      (item.details || '').toLowerCase().includes(q) ||
      (item.operateur || '').toLowerCase().includes(q);

    const matchesAction = actionFilter === 'ALL' || item.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'SOUSCRIPTION':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">SOUSCRIPTION</span>;
      case 'RELANCE_WHATSAPP':
        return <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-[10px]">RELANCE</span>;
      case 'EXPORT_BORDEREAU':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-[10px]">BORDEREAU FAN</span>;
      case 'RETRAIT':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[10px]">SUPPRESSION</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* EN-TÊTE MODALE */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Journal d'Audit & Traçabilité des Assurances
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-black">
                  Audit Trail
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Historique complet des souscriptions, modifications et relances effectuées sur le module assurances.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* FILTRES RAPIDES */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {['ALL', 'SOUSCRIPTION', 'RELANCE_WHATSAPP', 'EXPORT_BORDEREAU'].map(act => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  actionFilter === act
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {act === 'ALL' ? 'Toutes les actions' : act}
              </button>
            ))}
          </div>

          <div className="relative">
            <input 
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Rechercher par athlète ou opérateur..."
              className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>
        </div>

        {/* LISTE CHRONOLOGIQUE DES ACTIONS */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Aucun événement d'assurance enregistré correspondant.
            </div>
          ) : (
            filteredLogs.map(log => {
              const dateStr = new Date(log.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
              const timeStr = new Date(log.date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <strong className="text-xs font-bold text-slate-900 dark:text-white">
                        {log.actionLabel || log.action}
                      </strong>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Athlète concerné : <strong className="text-slate-900 dark:text-white uppercase">{log.athleteNom || '-'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {log.details}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 text-xs space-y-1">
                    <div className="font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-end">
                      <Clock size={12} />
                      {dateStr} à {timeStr}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 block">
                      Par : {log.operateur}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PIED DE MODALE */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500">
          <span>Journal d'audit horodaté pour la conformité et la vérification des licences d'assurance.</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold transition"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
