import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Modal de confirmation réutilisable et professionnel
 * Remplace les window.confirm natifs
 */
export default function ConfirmModal({
  isOpen,
  title = "Confirmation",
  message = "Êtes-vous sûr de vouloir effectuer cette action ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  confirmVariant = "danger", // 'danger' | 'primary' | 'warning'
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
}) {
  // Fermeture avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const variantStyles = {
    danger: {
      btn: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30",
      iconBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    },
    warning: {
      btn: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30",
      iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    primary: {
      btn: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30",
      iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
  };

  const currentVariant = variantStyles[confirmVariant] || variantStyles.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
          />

          {/* Fenêtre modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl border shrink-0 ${currentVariant.iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {title}
                  </h3>
                  <button
                    onClick={onCancel}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-lg transition cursor-pointer ${currentVariant.btn}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
