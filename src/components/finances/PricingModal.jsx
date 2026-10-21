import React from 'react';
import { Settings, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui';
import { formatDA } from '../../utils/formatters';

export default function PricingModal({
  isOpen,
  onClose,
  pricingFormData,
  setPricingFormData,
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
          border: '1px solid rgba(99, 102, 241, 0.3)',
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
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8'
              }}
            >
              <Settings size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Paramètres des Tarifs du Club
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Définissez les frais d'inscription et cotisations appliqués
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
            <X size={22} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="form-label font-bold text-sm mb-1.5 flex items-center justify-between">
                <span>📄 Frais d'Inscription (Dossier & Badge QR)</span>
                <span style={{ color: '#818cf8', fontWeight: 800 }}>
                  {formatDA(pricingFormData.frais_inscription)}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={pricingFormData.frais_inscription}
                  onChange={(e) =>
                    setPricingFormData((prev) => ({
                      ...prev,
                      frais_inscription: Number(e.target.value) || 0
                    }))
                  }
                  className="form-input w-full"
                  style={{ fontSize: '1rem', fontWeight: 700, paddingRight: '3rem' }}
                  required
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontWeight: 700
                  }}
                >
                  DA
                </span>
              </div>
              <span className="text-xs text-muted mt-1 block">
                Frais administratifs dus lors de la première inscription de l'adhérent.
              </span>
            </div>

            <div>
              <label className="form-label font-bold text-sm mb-1.5 flex items-center justify-between">
                <span>🏅 Droits d'Adhésion / Cotisation Club</span>
                <span style={{ color: 'var(--accent-success)', fontWeight: 800 }}>
                  {formatDA(pricingFormData.cotisation_adhesion)}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={pricingFormData.cotisation_adhesion}
                  onChange={(e) =>
                    setPricingFormData((prev) => ({
                      ...prev,
                      cotisation_adhesion: Number(e.target.value) || 0
                    }))
                  }
                  className="form-input w-full"
                  style={{ fontSize: '1rem', fontWeight: 700, paddingRight: '3rem' }}
                  required
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontWeight: 700
                  }}
                >
                  DA
                </span>
              </div>
              <span className="text-xs text-muted mt-1 block">
                Tarif standard de la cotisation d'entraînement ou d'adhésion sportive.
              </span>
            </div>
          </div>

          {/* Aperçu du total pour nouvel adhérent */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1.5px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <div className="flex justify-between items-center">
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                  Total exigible à la première inscription :
                </span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--accent-success)' }}>
                  {formatDA(
                    Number(pricingFormData.frais_inscription) +
                      Number(pricingFormData.cotisation_adhesion)
                  )}
                </strong>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Frais : {formatDA(pricingFormData.frais_inscription)} + Adhésion :{' '}
                {formatDA(pricingFormData.cotisation_adhesion)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} /> Enregistrer & Appliquer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
