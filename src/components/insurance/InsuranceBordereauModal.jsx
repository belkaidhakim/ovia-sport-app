import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Download } from 'lucide-react';
import { Button } from '../ui';

export default function InsuranceBordereauModal({
  isOpen,
  onClose,
  bordereauForm,
  setBordereauForm,
  onSubmit,
  stats,
  selectedCount = 0,
  groupes = [],
  compagniesList = []
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
          style={{ maxWidth: '580px', width: '95%' }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText size={20} color="#818cf8" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Générateur de Bordereau Collectif (PDF)
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            {/* 1. Sélection de la cible */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                Quels athlètes inclure dans ce bordereau ? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBordereauForm(prev => ({ ...prev, targetType: 'non_assures' }))}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    bordereauForm.targetType === 'non_assures'
                      ? 'bg-[var(--accent-primary)] text-white border-transparent shadow'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}
                >
                  <strong className="block text-xs font-bold">🔴 Nouveaux & Non-assurés</strong>
                  <span className="text-[0.7rem] opacity-80">{stats.nonAssure || 0} athlète(s) à régulariser</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBordereauForm(prev => ({ ...prev, targetType: 'selected' }))}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    bordereauForm.targetType === 'selected'
                      ? 'bg-[var(--accent-primary)] text-white border-transparent shadow'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}
                >
                  <strong className="block text-xs font-bold">📋 Sélection cochée</strong>
                  <span className="text-[0.7rem] opacity-80">{selectedCount} athlète(s) coché(s)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBordereauForm(prev => ({ ...prev, targetType: 'group' }))}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    bordereauForm.targetType === 'group'
                      ? 'bg-[var(--accent-primary)] text-white border-transparent shadow'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}
                >
                  <strong className="block text-xs font-bold">👥 Tout un Groupe</strong>
                  <span className="text-[0.7rem] opacity-80">Sélectionner par niveau</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBordereauForm(prev => ({ ...prev, targetType: 'all' }))}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    bordereauForm.targetType === 'all'
                      ? 'bg-[var(--accent-primary)] text-white border-transparent shadow'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                  }`}
                >
                  <strong className="block text-xs font-bold">🌐 Tous les Membres</strong>
                  <span className="text-[0.7rem] opacity-80">Totalité du club ({stats.total || 0})</span>
                </button>
              </div>

              {bordereauForm.targetType === 'group' && (
                <select
                  value={bordereauForm.targetGroupId}
                  onChange={(e) => setBordereauForm(prev => ({ ...prev, targetGroupId: e.target.value }))}
                  required={bordereauForm.targetType === 'group'}
                  className="w-full mt-2 px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="">Sélectionner le groupe...</option>
                  {groupes.map(g => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. Compagnie d'Assurance */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Compagnie d'Assurance Destinataire *
              </label>
              <select
                value={bordereauForm.compagnie}
                onChange={(e) => setBordereauForm(prev => ({ ...prev, compagnie: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {compagniesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 3. Référence de police / bordereau */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                Référence de Police / Contrat-Cadre *
              </label>
              <input 
                type="text"
                required
                placeholder="Ex: BORD-OVIA-2026/01 ou POL-SAA-7890"
                value={bordereauForm.numero_police}
                onChange={(e) => setBordereauForm(prev => ({ ...prev, numero_police: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* 4. Dates de couverture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Date de début *
                </label>
                <input 
                  type="date"
                  required
                  value={bordereauForm.date_debut}
                  onChange={(e) => setBordereauForm(prev => ({ ...prev, date_debut: e.target.value }))}
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
                  value={bordereauForm.date_fin}
                  onChange={(e) => setBordereauForm(prev => ({ ...prev, date_fin: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* 5. Option d'enregistrement automatique */}
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <input 
                type="checkbox"
                id="autoEnregistrerCheck"
                checked={bordereauForm.autoEnregistrer}
                onChange={(e) => setBordereauForm(prev => ({ ...prev, autoEnregistrer: e.target.checked }))}
                style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
              />
              <label htmlFor="autoEnregistrerCheck" style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                <strong>Enregistrer automatiquement ces membres comme assurés</strong>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Cochez cette case si le contrat est déjà effectif : les athlètes inclus passeront immédiatement au vert 🟢 "À jour".
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--border-color)]">
              <Button variant="secondary" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Download size={15} /> Télécharger le Bordereau PDF
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
