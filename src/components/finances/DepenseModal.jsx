import React from 'react';
import { TrendingDown, X } from 'lucide-react';
import { Button } from '../ui';

export default function DepenseModal({
  isOpen,
  onClose,
  editingId,
  depenseData,
  setDepenseData,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(6px)'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '540px',
          maxWidth: '96vw',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <div
          className="flex justify-between items-center p-4 border-b border-[var(--border-color)]"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444'
              }}
            >
              <TrendingDown size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingId ? 'Modifier une Dépense' : 'Enregistrer une Dépense'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Décaissement opérationnel du club
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-group">
              <label className="form-label font-bold text-xs mb-1">Description *</label>
              <input
                type="text"
                placeholder="Ex: Achat matériel, Location couloir..."
                className="form-input w-full"
                value={depenseData.description}
                onChange={(e) => setDepenseData((prev) => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-xs mb-1">Montant (DA) *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-input w-full"
                value={depenseData.montant}
                onChange={(e) => setDepenseData((prev) => ({ ...prev, montant: e.target.value }))}
                placeholder="Ex: 5000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="form-group">
              <label className="form-label font-bold text-xs mb-1">Catégorie *</label>
              <select
                className="form-select w-full"
                value={depenseData.categorie}
                onChange={(e) => setDepenseData((prev) => ({ ...prev, categorie: e.target.value }))}
                required
              >
                <option value="Location Couloirs">Location Couloirs</option>
                <option value="Salaires Entraîneurs">Salaires Entraîneurs</option>
                <option value="Achat de Matériel">Achat de Matériel</option>
                <option value="Frais Compétition">Frais Compétition</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-xs mb-1">Date de la dépense *</label>
              <input
                type="date"
                className="form-input w-full"
                value={depenseData.date_depense}
                onChange={(e) => setDepenseData((prev) => ({ ...prev, date_depense: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: '#ef4444', color: 'white', borderColor: 'transparent' }}
            >
              {editingId ? 'Mettre à jour' : 'Enregistrer la dépense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
