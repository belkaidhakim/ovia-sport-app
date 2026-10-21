import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from '../ui';

export default function InsuranceSingleModal({
  isOpen,
  onClose,
  editingAssurance,
  targetAthlete,
  singleForm,
  setSingleForm,
  onSubmit,
  enrichedAthletes = [],
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
          style={{ maxWidth: '540px', width: '95%' }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} color="#818cf8" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {editingAssurance ? 'Renouveler / Modifier l\'Assurance' : 'Souscrire une Police Individuelle'}
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
            {/* Choix de l'athlète */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Athlète concerné *
              </label>
              {targetAthlete ? (
                <div style={{
                  padding: '0.65rem 0.9rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  {(targetAthlete.nom || '').toUpperCase()} {targetAthlete.prenom} ({targetAthlete.groupes?.nom || targetAthlete.groupe || 'Standard'})
                </div>
              ) : (
                <select
                  value={singleForm.athlete_id}
                  onChange={(e) => setSingleForm(prev => ({ ...prev, athlete_id: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="">Sélectionner un athlète...</option>
                  {enrichedAthletes.map(a => (
                    <option key={a.id} value={a.id}>
                      {(a.nom || '').toUpperCase()} {a.prenom} ({a.groupes?.nom || a.groupe || 'Sans groupe'})
                    </option>
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
                value={singleForm.compagnie}
                onChange={(e) => setSingleForm(prev => ({ ...prev, compagnie: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {compagniesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Numéro de police */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Numéro de Police / Référence *
              </label>
              <input 
                type="text"
                required
                placeholder="Ex: POL-2026-9874"
                value={singleForm.numero_police}
                onChange={(e) => setSingleForm(prev => ({ ...prev, numero_police: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Dates de début et fin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Date de début *
                </label>
                <input 
                  type="date"
                  required
                  value={singleForm.date_debut}
                  onChange={(e) => setSingleForm(prev => ({ ...prev, date_debut: e.target.value }))}
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
                  value={singleForm.date_fin}
                  onChange={(e) => setSingleForm(prev => ({ ...prev, date_fin: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Type de couverture & Montant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Type de Couverture
                </label>
                <select
                  value={singleForm.type_couverture}
                  onChange={(e) => setSingleForm(prev => ({ ...prev, type_couverture: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {typesCouverture.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Prime payée (DA)
                </label>
                <input 
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1500"
                  value={singleForm.montant}
                  onChange={(e) => setSingleForm(prev => ({ ...prev, montant: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Notes / Remarques (Optionnel)
              </label>
              <input 
                type="text"
                placeholder="Ex: Quittance N° 124, certificat joint"
                value={singleForm.notes}
                onChange={(e) => setSingleForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
              <Button variant="secondary" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                Valider la Police
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
