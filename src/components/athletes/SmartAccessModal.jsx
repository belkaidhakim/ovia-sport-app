import React, { useState } from 'react';
import { ShieldCheck, X, RotateCcw, Check } from 'lucide-react';
import { getSmartAccess } from '../../utils/athleteHelpers';

export default function SmartAccessModal({ athlete, onClose, onApply }) {
  const [targetAction, setTargetAction] = useState(() => {
    if (!athlete) return 'AUTORISE';
    const sa = getSmartAccess(athlete);
    return sa.code === 'AUTORISE' ? 'BLOQUE' : 'AUTORISE';
  });
  const [prolongCotis, setProlongCotis] = useState(false);
  const [resetQuota, setResetQuota] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!athlete) return null;

  const currentSa = getSmartAccess(athlete);
  const presencesCount = Array.isArray(athlete.presences) ? athlete.presences.length : 0;

  const handleSubmit = async () => {
    setIsUpdating(true);
    try {
      await onApply(athlete.id, targetAction, {
        addCotisation: prolongCotis,
        resetPresences: resetQuota,
        adjustPresences: true
      });
      onClose();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                Changer Smart Access
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                Contrôle des droits d'accès au bassin & scanner QR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profil de l'athlète */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-5 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white m-0">
              {athlete.nom?.toUpperCase()} {athlete.prenom}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
              Section : {athlete.groupes?.nom || athlete.groupe || 'Générale'} • {presencesCount}/8 séances consommées
            </p>
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                currentSa.code === 'AUTORISE'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : currentSa.code === 'TOLERANCE'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
              }`}
            >
              {currentSa.label}
            </span>
          </div>
        </div>

        {/* Choix des options Smart Access */}
        <div className="space-y-3 mb-5">
          {/* Option 1: AUTORISE */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
              targetAction === 'AUTORISE'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="smart_access_action"
              value="AUTORISE"
              checked={targetAction === 'AUTORISE'}
              onChange={() => setTargetAction('AUTORISE')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Autoriser l'Accès (Passage libre)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Active la carte d'accès. Le membre peut scanner son badge QR et entrer immédiatement.
              </p>

              {targetAction === 'AUTORISE' && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prolongCotis}
                      onChange={(e) => setProlongCotis(e.target.checked)}
                      className="rounded"
                    />
                    <span>Régulariser / Prolonger la cotisation (30 jours • 3 000 DA)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resetQuota}
                      onChange={(e) => setResetQuota(e.target.checked)}
                      className="rounded"
                    />
                    <span>Réinitialiser les séances consommées (0/8)</span>
                  </label>
                </div>
              )}
            </div>
          </label>

          {/* Option 2: TOLERANCE */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
              targetAction === 'TOLERANCE'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="smart_access_action"
              value="TOLERANCE"
              checked={targetAction === 'TOLERANCE'}
              onChange={() => setTargetAction('TOLERANCE')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Tolérance / Période d'Essai
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Autorise le passage au scanner avec avertissement jaune (séance d'essai accordée sans cotisation).
              </p>
            </div>
          </label>

          {/* Option 3: BLOQUE */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
              targetAction === 'BLOQUE'
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="smart_access_action"
              value="BLOQUE"
              checked={targetAction === 'BLOQUE'}
              onChange={() => setTargetAction('BLOQUE')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Bloquer l'Accès (Suspendre la carte)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Suspend la carte d'accès. Le scanner affichera systématiquement « ACCÈS BLOQUÉ ».
              </p>
            </div>
          </label>

          {/* Option 4: RESET_QUOTA */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
              targetAction === 'RESET_QUOTA'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              name="smart_access_action"
              value="RESET_QUOTA"
              checked={targetAction === 'RESET_QUOTA'}
              onChange={() => setTargetAction('RESET_QUOTA')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <RotateCcw size={13} className="text-blue-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Réinitialiser le Quota (Nouveau forfait 8 séances)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                Remet les présences à 0 et réactive la carte pour débuter un cycle complet de 8 séances.
              </p>
            </div>
          </label>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUpdating}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} />
            {isUpdating ? 'Application...' : 'Appliquer la modification'}
          </button>
        </div>
      </div>
    </div>
  );
}
