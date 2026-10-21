import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { Button, Badge } from '../ui';
import { formatDA } from '../../utils/formatters';

export default function DeleteConfirmModal({
  deleteModal,
  onClose,
  onConfirm
}) {
  if (!deleteModal?.isOpen || !deleteModal?.item) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 120,
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
          width: '480px',
          maxWidth: '96vw',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <div
          className="flex justify-between items-center p-4 border-b border-[var(--border-color)]"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444'
              }}
            >
              <Trash2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {deleteModal.type === 'cotisation'
                  ? "Supprimer l'encaissement"
                  : 'Supprimer la dépense'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Confirmation définitive de suppression
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

        <div className="p-6">
          <div
            className="flex items-start gap-3 p-3.5 rounded-xl mb-4"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}
          >
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 m-0 leading-relaxed">
              Attention : cette suppression est <strong>immédiate et irréversible</strong>. Les
              totaux de revenus, dépenses et le solde net seront automatiquement recalculés.
            </p>
          </div>

          {deleteModal.type === 'cotisation' ? (
            <div
              className="p-4 rounded-xl mb-6 text-sm flex flex-col gap-2.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs font-semibold">Adhérent :</span>
                <strong className="text-sm text-[var(--text-primary)]">
                  {deleteModal.item.athletes
                    ? `${deleteModal.item.athletes.nom} ${deleteModal.item.athletes.prenom}`
                    : 'Inconnu'}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs font-semibold">Montant encaissé :</span>
                <strong className="text-sm font-bold text-emerald-500">
                  + {formatDA(deleteModal.item.montant_paye)}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs font-semibold">Date de règlement :</span>
                <span className="text-xs">
                  {new Date(deleteModal.item.date_paiement).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs font-semibold">Période couverte :</span>
                <span className="text-xs">
                  Jusqu'au{' '}
                  {new Date(deleteModal.item.periode_couverte_fin).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {deleteModal.item.mode_paiement && (
                <div className="flex justify-between items-center">
                  <span className="text-muted text-xs font-semibold">Mode de paiement :</span>
                  <span className="text-xs">{deleteModal.item.mode_paiement}</span>
                </div>
              )}
            </div>
          ) : (
            <div
              className="p-4 rounded-xl mb-6 text-sm flex flex-col gap-2.5"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs font-semibold">Description :</span>
                <strong className="text-sm text-[var(--text-primary)]">
                  {deleteModal.item.description}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs font-semibold">Catégorie :</span>
                <Badge
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {deleteModal.item.categorie}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs font-semibold">Montant décaissé :</span>
                <strong className="text-sm font-bold text-red-500">
                  - {formatDA(deleteModal.item.montant)}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs font-semibold">Date de dépense :</span>
                <span className="text-xs">
                  {new Date(deleteModal.item.date_depense).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={deleteModal.isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                borderColor: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={onConfirm}
              disabled={deleteModal.isSubmitting}
            >
              {deleteModal.isSubmitting ? (
                'Suppression en cours...'
              ) : (
                <>
                  <Trash2 size={16} /> Confirmer la suppression
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
