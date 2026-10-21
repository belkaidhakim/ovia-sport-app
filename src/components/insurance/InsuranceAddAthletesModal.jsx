import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Search, CheckSquare, Square } from 'lucide-react';
import { Button } from '../ui';

export default function InsuranceAddAthletesModal({
  isOpen,
  onClose,
  selectedForAdd = [],
  setSelectedForAdd,
  modalCandidateAthletes = [],
  modalSearchQuery,
  setModalSearchQuery,
  modalGroupFilter,
  setModalGroupFilter,
  addModalForm,
  setAddModalForm,
  onSubmit,
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
          style={{ maxWidth: '640px', width: '95%' }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserPlus size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                  Ajouter à la Liste d'Assurance
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sélectionnez les athlètes à inscrire au contrat d'assurance du club.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            {/* 1. Sélection des athlètes candidats */}
            <div style={{
              padding: '0.85rem',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)'
            }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  1. Choisir les athlètes non assurés ({selectedForAdd.length} sélectionné{selectedForAdd.length > 1 ? 's' : ''})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedForAdd(modalCandidateAthletes.map(a => a.id))}
                    className="text-[0.72rem] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer bg-transparent border-none p-0"
                  >
                    Tout cocher ({modalCandidateAthletes.length})
                  </button>
                  <span className="text-muted text-[0.7rem]">•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedForAdd([])}
                    className="text-[0.72rem] font-semibold text-[var(--text-muted)] hover:text-white cursor-pointer bg-transparent border-none p-0"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>

              {/* Filtres internes à la modale */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input 
                    type="text"
                    placeholder="Rechercher par nom..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <select
                  value={modalGroupFilter}
                  onChange={(e) => setModalGroupFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="ALL">Tous les groupes</option>
                  {groupes.map(g => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </select>
              </div>

              {/* Liste scrollable des athlètes candidats */}
              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)'
              }}>
                {modalCandidateAthletes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                    Aucun athlète non assuré ne correspond à ce filtre.
                  </div>
                ) : (
                  modalCandidateAthletes.map(ath => {
                    const isChecked = selectedForAdd.includes(ath.id);
                    return (
                      <div 
                        key={ath.id}
                        onClick={() => {
                          setSelectedForAdd(prev => 
                            isChecked ? prev.filter(x => x !== ath.id) : [...prev, ath.id]
                          );
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          transition: 'background-color 0.1s'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {isChecked ? (
                            <CheckSquare size={16} color="#10b981" />
                          ) : (
                            <Square size={16} color="var(--text-muted)" />
                          )}
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {(ath.nom || '').toUpperCase()} {ath.prenom}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-muted)'
                          }}>
                            {ath.groupes?.nom || ath.groupe || 'Standard'}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '1px 5px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            fontWeight: 700
                          }}>
                            {ath.insuranceStatus?.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Détails de couverture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Compagnie d'Assurance *
                </label>
                <select
                  value={addModalForm.compagnie}
                  onChange={(e) => setAddModalForm(prev => ({ ...prev, compagnie: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {compagniesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Numéro de Police / Référence *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: POL-COLL-2026/01"
                  value={addModalForm.numero_police}
                  onChange={(e) => setAddModalForm(prev => ({ ...prev, numero_police: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Dates & Prime */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Date de début
                </label>
                <input 
                  type="date"
                  required
                  value={addModalForm.date_debut}
                  onChange={(e) => setAddModalForm(prev => ({ ...prev, date_debut: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Date de fin (1 an)
                </label>
                <input 
                  type="date"
                  required
                  value={addModalForm.date_fin}
                  onChange={(e) => setAddModalForm(prev => ({ ...prev, date_fin: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  Prime par athlète (DA)
                </label>
                <input 
                  type="number"
                  min="0"
                  value={addModalForm.montant}
                  onChange={(e) => setAddModalForm(prev => ({ ...prev, montant: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--border-color)]">
              <Button variant="secondary" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={selectedForAdd.length === 0}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  backgroundColor: selectedForAdd.length === 0 ? 'var(--bg-tertiary)' : '#10b981',
                  borderColor: selectedForAdd.length === 0 ? 'var(--border-color)' : '#10b981',
                  color: selectedForAdd.length === 0 ? 'var(--text-muted)' : '#ffffff',
                  cursor: selectedForAdd.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <UserPlus size={15} /> Ajouter ({selectedForAdd.length}) à la Liste d'Assurance
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
