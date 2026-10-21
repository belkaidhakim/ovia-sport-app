import React from 'react';
import { TrendingUp, X } from 'lucide-react';
import { Button } from '../ui';
import { formatDA, formatName } from '../../utils/formatters';

export default function PaymentModal({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  onSubmit,
  athletes,
  siblingMap,
  fraisInscription,
  cotisationAdhesion,
  totalAdhesion
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
          width: '560px',
          maxWidth: '96vw',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
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
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981'
              }}
            >
              <TrendingUp size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingId ? 'Modifier un Encaissement' : 'Nouvel Encaissement'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Enregistrer une cotisation ou des frais d'adhésion
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
          {/* Presets rapides de montant */}
          <div className="mb-4">
            <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
              Montants prédéfinis :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  cursor: 'pointer'
                }}
                onClick={() => setFormData((prev) => ({ ...prev, montant_paye: fraisInscription }))}
              >
                📄 Frais Dossier ({formatDA(fraisInscription)})
              </button>
              <button
                type="button"
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer'
                }}
                onClick={() => setFormData((prev) => ({ ...prev, montant_paye: cotisationAdhesion }))}
              >
                🏅 Cotisation ({formatDA(cotisationAdhesion)})
              </button>
              <button
                type="button"
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  cursor: 'pointer'
                }}
                onClick={() => setFormData((prev) => ({ ...prev, montant_paye: totalAdhesion }))}
              >
                🌟 Inscription Totale ({formatDA(totalAdhesion)})
              </button>
            </div>
          </div>

          {/* Suggestion réduction fratrie */}
          {formData.athlete_id && siblingMap.has(formData.athlete_id) && (() => {
            const sib = siblingMap.get(formData.athlete_id);
            const discountRate = sib.discountPercent;
            const discountedCotis = Math.round(cotisationAdhesion * (1 - discountRate / 100));
            return (
              <div
                className="p-3 rounded-lg mb-4 flex flex-wrap items-center justify-between gap-2"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.2rem' }}>👨‍👩‍👧‍👦</span>
                  <div>
                    <strong style={{ color: '#818cf8', fontSize: '0.85rem' }}>
                      Fratrie Détectée ({sib.familyCount} enfants)
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {sib.siblingIndex}e enfant · Réduction :{' '}
                      <strong style={{ color: 'var(--accent-success)' }}>
                        {discountRate > 0 ? `-${discountRate}%` : 'Plein tarif (1er)'}
                      </strong>
                    </div>
                  </div>
                </div>
                {discountRate > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, montant_paye: discountedCotis }))}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: 'var(--accent-success)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      cursor: 'pointer'
                    }}
                  >
                    Appliquer -{discountRate}% ({formatDA(discountedCotis)})
                  </button>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label font-bold text-xs mb-0">Adhérent *</label>
                <span className="text-[11px] text-muted">{athletes.length} membre(s) actif(s)</span>
              </div>
              <select
                className="form-select w-full"
                value={formData.athlete_id}
                onChange={(e) => {
                  const athleteId = e.target.value;
                  setFormData((prev) => {
                    let nextMontant = prev.montant_paye;
                    if (!nextMontant || Number(nextMontant) === 0) {
                      if (siblingMap.has(athleteId)) {
                        const sib = siblingMap.get(athleteId);
                        nextMontant = Math.round(
                          cotisationAdhesion * (1 - (sib.discountPercent || 0) / 100)
                        );
                      } else {
                        nextMontant = cotisationAdhesion || 3000;
                      }
                    }
                    return {
                      ...prev,
                      athlete_id: athleteId,
                      montant_paye: nextMontant
                    };
                  });
                }}
                required
              >
                <option value="">Sélectionner un athlète</option>
                {athletes.map((a) => {
                  const grp = a.groupes?.nom || a.groupe;
                  return (
                    <option key={a.id} value={a.id}>
                      {formatName(a.nom, a.prenom)}
                      {grp ? ` — ${grp}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-xs mb-1">Montant encaissé (DA) *</label>
              <input
                type="number"
                min="0"
                step="any"
                className="form-input w-full"
                value={formData.montant_paye}
                onChange={(e) => setFormData((prev) => ({ ...prev, montant_paye: e.target.value }))}
                placeholder="Ex: 3000"
                required
              />
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, montant_paye: cotisationAdhesion || 3000 }))}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {formatDA(cotisationAdhesion || 3000)} (Cotis.)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, montant_paye: totalAdhesion || 3300 }))}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {formatDA(totalAdhesion || 3300)} (Inscr. Totale)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="form-group">
              <label className="form-label font-bold text-xs mb-1">Mode de paiement *</label>
              <select
                className="form-select w-full"
                value={formData.mode_paiement}
                onChange={(e) => setFormData((prev) => ({ ...prev, mode_paiement: e.target.value }))}
                required
              >
                <option value="Espèces">Espèces</option>
                <option value="Virement CCP">Virement CCP</option>
                <option value="BaridiMob">BaridiMob</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-bold text-xs mb-1">
                Couvre jusqu'au (Fin de validité) *
              </label>
              <input
                type="date"
                className="form-input w-full"
                value={formData.periode_couverte_fin}
                onChange={(e) => setFormData((prev) => ({ ...prev, periode_couverte_fin: e.target.value }))}
                required
              />
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 30);
                    setFormData((prev) => ({ ...prev, periode_couverte_fin: d.toISOString().split('T')[0] }));
                  }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  +30 jours (1 mois)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 90);
                    setFormData((prev) => ({ ...prev, periode_couverte_fin: d.toISOString().split('T')[0] }));
                  }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  +90 jours (Trimestre)
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? 'Mettre à jour' : 'Enregistrer le paiement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
