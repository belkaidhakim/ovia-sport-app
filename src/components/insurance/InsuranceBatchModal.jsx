import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X } from 'lucide-react';
import { Button } from '../ui';

export default function InsuranceBatchModal({
  isOpen,
  onClose,
  batchForm,
  setBatchForm,
  onSubmit,
  selectedCount = 0,
  groupes = [],
  compagniesList = [],
  typesCouverture = []
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 100 }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card modal-content"
          style={{ maxWidth: '560px', width: '95%' }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} color="#818cf8" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Souscription Groupée d'Assurance
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            {/* Cible */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Cible de la souscription groupée *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setBatchForm(prev => ({ ...prev, targetType: 'selected' }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    batchForm.targetType === 'selected'
                      ? 'bg-[var(--accent-primary)] text-white border-transparent'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}
                >
                  Membres cochés ({selectedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBatchForm(prev => ({ ...prev, targetType: 'group' }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    batchForm.targetType === 'group'
                      ? 'bg-[var(--accent-primary)] text-white border-transparent'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}
                >
                  Tout un Groupe
                </button>
              </div>

              {batchForm.targetType === 'group' && (
                <select
                  value={batchForm.targetGroupId}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, targetGroupId: e.target.value }))}
                  required={batchForm.targetType === 'group'}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="">Sélectionner le groupe à assurer...</option>
                  {groupes.map(g => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Compagnie */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Compagnie d'Assurance *
              </label>
              <select
                value={batchForm.compagnie}
                onChange={(e) => setBatchForm(prev => ({ ...prev, compagnie: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {compagniesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Numéro de police collective */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Numéro de Police Cadre / Bordereau *
              </label>
              <input 
                type="text"
                required
                placeholder="Ex: POL-COLL-2026/01"
                value={batchForm.numero_police}
                onChange={(e) => setBatchForm(prev => ({ ...prev, numero_police: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Date de début *
                </label>
                <input 
                  type="date"
                  required
                  value={batchForm.date_debut}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, date_debut: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Date d'expiration *
                </label>
                <input 
                  type="date"
                  required
                  value={batchForm.date_fin}
                  onChange={(e) => setBatchForm(prev => ({ ...prev, date_fin: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Type de couverture */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Garantie / Couverture
              </label>
              <select
                value={batchForm.type_couverture}
                onChange={(e) => setBatchForm(prev => ({ ...prev, type_couverture: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {typesCouverture.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
              <Button variant="secondary" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                Appliquer la souscription
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
