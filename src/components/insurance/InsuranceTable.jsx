import React from 'react';
import { 
  CheckSquare, Square, UserPlus, Trash2, Send, Award, FileText, 
  Shield, CheckCircle2, Clock, X, UserMinus, Edit, MessageSquare 
} from 'lucide-react';
import { Button, Skeleton } from '../ui';

export default function InsuranceTable({
  filteredAthletes = [],
  selectedAthleteIds = [],
  setSelectedAthleteIds,
  onToggleSelectAll,
  onToggleSelectAthlete,
  loadingAthletes,
  loadingAssurances,
  onOpenBatchModalForSelected,
  onBatchDeleteSelected,
  onOpenWhatsAppModalForSelected,
  onGenerateBordereauFederalFan,
  onOpenBordereauModalForSelected,
  onQuickAddAthlete,
  onRemoveAthleteFromInsurance,
  onOpenSingleModal,
  onDownloadAttestation,
  onWhatsAppReminder
}) {
  return (
    <>
      {/* Barre d'action groupée si éléments sélectionnés */}
      {selectedAthleteIds.length > 0 && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderTop: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div className="flex items-center gap-2">
            <CheckSquare size={17} color="#818cf8" />
            <strong style={{ fontSize: '0.85rem', color: '#818cf8' }}>
              {selectedAthleteIds.length} athlète(s) sélectionné(s)
            </strong>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* BOUTON POUR AJOUTER LA SÉLECTION À L'ASSURANCE */}
            <Button 
              variant="primary"
              onClick={onOpenBatchModalForSelected}
              style={{ 
                fontSize: '0.78rem', 
                padding: '0.4rem 0.85rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px',
                backgroundColor: '#10b981',
                borderColor: '#10b981',
                color: '#ffffff'
              }}
              title="Ajouter tous les athlètes sélectionnés à la liste d'assurance"
            >
              <UserPlus size={14} /> + Ajouter la sélection à l'assurance
            </Button>

            {/* BOUTON POUR SUPPRIMER LA SÉLECTION DE L'ASSURANCE */}
            <Button 
              variant="secondary"
              onClick={onBatchDeleteSelected}
              style={{ 
                fontSize: '0.78rem', 
                padding: '0.4rem 0.85rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px',
                borderColor: 'rgba(239, 68, 68, 0.4)', 
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.08)'
              }}
              title="Supprimer la police d'assurance des athlètes sélectionnés (Retirer de la liste)"
            >
              <Trash2 size={14} /> Supprimer de la liste d'assurance
            </Button>

            {/* RELANCES WHATSAPP EN MASSE */}
            <button
              type="button"
              onClick={onOpenWhatsAppModalForSelected}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Envoyer des rappels WhatsApp ciblés pour les athlètes sélectionnés"
            >
              <Send size={13} /> Relance WhatsApp ({selectedAthleteIds.length})
            </button>

            {/* BORDEREAU FÉDÉRAL FAN */}
            <button
              type="button"
              onClick={onGenerateBordereauFederalFan}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Générer le bordereau officiel FAN pour la sélection"
            >
              <Award size={13} className="text-amber-400" /> Bordereau FAN ({selectedAthleteIds.length})
            </button>

            <Button 
              variant="secondary"
              onClick={onOpenBordereauModalForSelected}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <FileText size={14} /> Bordereau Compagnie ({selectedAthleteIds.length})
            </Button>

            <button
              onClick={() => setSelectedAthleteIds([])}
              className="text-xs text-[var(--text-muted)] hover:text-white px-2 py-1 cursor-pointer"
            >
              Désélectionner
            </button>
          </div>
        </div>
      )}

      {/* TABLEAU DES ASSURANCES */}
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '0.85rem 1rem', width: '40px', textAlign: 'center' }}>
                <button 
                  onClick={onToggleSelectAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                >
                  {selectedAthleteIds.length > 0 && selectedAthleteIds.length === filteredAthletes.length ? (
                    <CheckSquare size={16} color="#818cf8" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th style={{ padding: '0.85rem 1rem' }}>Athlète</th>
              <th style={{ padding: '0.85rem 1rem' }}>Groupe</th>
              <th style={{ padding: '0.85rem 1rem' }}>Statut Couverture</th>
              <th style={{ padding: '0.85rem 1rem' }}>Compagnie & Police</th>
              <th style={{ padding: '0.85rem 1rem' }}>Période de Validité</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingAthletes || loadingAssurances ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <div className="flex flex-col gap-3">
                    <Skeleton height="35px" />
                    <Skeleton height="35px" />
                    <Skeleton height="35px" />
                  </div>
                </td>
              </tr>
            ) : filteredAthletes.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-[var(--text-muted)]">
                  <Shield size={36} className="mx-auto mb-2 opacity-30" />
                  Aucun athlète ne correspond aux filtres actuels.
                </td>
              </tr>
            ) : (
              filteredAthletes.map(ath => {
                const isSelected = selectedAthleteIds.includes(ath.id);
                const st = ath.insuranceStatus;
                const ass = ath.assurance;

                return (
                  <tr 
                    key={ath.id}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      transition: 'background-color 0.15s'
                    }}
                    className="hover:bg-[var(--table-row-hover)]"
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => onToggleSelectAthlete(ath.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', margin: '0 auto' }}
                      >
                        {isSelected ? (
                          <CheckSquare size={16} color="#818cf8" />
                        ) : (
                          <Square size={16} color="var(--text-muted)" />
                        )}
                      </button>
                    </td>

                    {/* Athlète */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div className="flex items-center gap-2.5">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {(ath.nom?.charAt(0) || '') + (ath.prenom?.charAt(0) || '')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                              {(ath.nom || '').toUpperCase()} {ath.prenom}
                            </strong>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                              {ath.federalCategory?.label?.split('(')[0]?.trim() || 'Adhérent'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {ath.telephone || ath.telephone_parent || 'Sans numéro'}
                            {ath.date_naissance && ` • Né(e) le ${new Date(ath.date_naissance).toLocaleDateString('fr-FR')}${ath.lieu_naissance ? ` à ${ath.lieu_naissance}` : ''} (${ath.federalCategory?.age} ans)`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Groupe */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 600, 
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        display: 'inline-block'
                      }}>
                        {ath.groupes?.nom || ath.groupe || 'Non assigné'}
                      </span>
                    </td>

                    {/* Statut Couverture Dynamique */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {st.code === 'A_JOUR' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                          <span>À jour ({st.daysLeft}j)</span>
                        </span>
                      ) : st.code === 'EXPIRE_BIENTOT' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 animate-pulse">
                          <Clock size={13} className="text-amber-500 flex-shrink-0" />
                          <span>Expire sous {st.daysLeft}j</span>
                        </span>
                      ) : st.code === 'EXPIREE' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                          <X size={13} className="text-rose-500 flex-shrink-0" />
                          <span>Expirée ({Math.abs(st.daysLeft)}j)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
                          <span>Non Assuré (Bloqué)</span>
                        </span>
                      )}
                    </td>

                    {/* Compagnie & N° Police */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {ass ? (
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>
                            {ass.compagnie?.split('(')[0].trim()}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', fontFamily: 'monospace' }}>
                            {ass.numero_police}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Aucune police active
                        </span>
                      )}
                    </td>

                    {/* Validité */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {ass?.date_fin ? (
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'block' }}>
                            Jusqu'au {new Date(ass.date_fin).toLocaleDateString('fr-FR')}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Depuis {ass.date_debut ? new Date(ass.date_debut).toLocaleDateString('fr-FR') : '-'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                          Non couvert
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* SI NON ASSURÉ OU EXPIRÉ : BOUTON "+ AJOUTER À L'ASSURANCE" */}
                        {(!ass || st.code === 'NON_ASSURE' || st.code === 'EXPIREE') ? (
                          <button
                            onClick={() => onQuickAddAthlete(ath)}
                            title="Ajouter immédiatement cet athlète à la liste d'assurance (Souscription 1 an)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 11px',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: '0 2px 5px rgba(16, 185, 129, 0.25)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <UserPlus size={13} /> + Ajouter à l'assurance
                          </button>
                        ) : (
                          /* SI ASSURÉ : BOUTON "RETIRER DE LA LISTE" */
                          <button
                            onClick={() => onRemoveAthleteFromInsurance(ath)}
                            title="Retirer cet athlète de la liste d'assurance (Supprimer sa police)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <UserMinus size={13} /> Retirer de la liste
                          </button>
                        )}

                        {/* Éditer / Renouveler */}
                        <button
                          onClick={() => onOpenSingleModal(ath)}
                          title={ass ? "Modifier ou renouveler la police d'assurance" : "Personnaliser les dates ou le contrat"}
                          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-[var(--bg-tertiary)]"
                        >
                          <Edit size={15} />
                        </button>

                        {/* Attestation PDF */}
                        <button
                          onClick={() => onDownloadAttestation(ath)}
                          title="Télécharger l'Attestation Individuelle d'Assurance (PDF)"
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-tertiary)]"
                        >
                          <FileText size={15} />
                        </button>

                        {/* Relance WhatsApp */}
                        <button
                          onClick={() => onWhatsAppReminder(ath)}
                          title="Envoyer un rappel de renouvellement d'assurance par WhatsApp"
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-[var(--bg-tertiary)]"
                        >
                          <MessageSquare size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
