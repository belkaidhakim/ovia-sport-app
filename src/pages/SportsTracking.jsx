import React, { useState, useEffect, useMemo } from 'react';
import { 
  Timer, Trophy, Users, Award, Plus, CheckCircle2, ChevronRight, 
  Calendar, Waves, Download, Search, Edit, ArrowUpRight, Sparkles, Filter, Check
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from '../components/ui';
import { useAthletes } from '../hooks/useAthletes';
import { useGroupes } from '../hooks/useGroupes';
import { SWIMMING_EVENTS, SWIMMING_STYLES, getSwimmingCategory } from '../utils/swimmingCategories';
import AthletePerformancesModal from '../components/AthletePerformancesModal';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const PERFORMANCES_STORAGE_PREFIX = 'scb_athlete_perfs_';

export default function SportsTracking() {
  const { athletes, loading: loadingAthletes } = useAthletes();
  const { groupes } = useGroupes();

  const [activeTab, setActiveTab] = useState('feuille_match'); // 'feuille_match' | 'records' | 'niveaux'
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('50_NL');
  const [bassin, setBassin] = useState('25m');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Saisie rapide : map { [athleteId]: { timeStr: '', rpe: '8', notes: '' } }
  const [batchTimes, setBatchTimes] = useState({});
  const [savingBatch, setSavingBatch] = useState(false);

  // Modale détaillée individuelle
  const [modalAthlete, setModalAthlete] = useState(null);

  // Recherche dans les records
  const [recordSearch, setRecordSearch] = useState('');

  // Initialisation du groupe sélectionné
  useEffect(() => {
    if (groupes.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groupes[0].id);
    }
  }, [groupes, selectedGroupId]);

  // Athlètes du groupe sélectionné
  const groupAthletes = useMemo(() => {
    if (!selectedGroupId) return [];
    return athletes.filter(a => 
      String(a.groupe_id) === String(selectedGroupId) || 
      (a.groupes?.nom && a.groupes.nom === groupes.find(g => String(g.id) === String(selectedGroupId))?.nom)
    );
  }, [athletes, selectedGroupId, groupes]);

  // Récupération des perfs locales de tous les athlètes
  const allPerformances = useMemo(() => {
    const list = [];
    athletes.forEach(athlete => {
      try {
        const stored = localStorage.getItem(`${PERFORMANCES_STORAGE_PREFIX}${athlete.id}`);
        if (stored) {
          const perfs = JSON.parse(stored);
          perfs.forEach(p => {
            list.push({ ...p, athlete });
          });
        }
      } catch {}
    });
    return list;
  }, [athletes]);

  // Calcul des Records Personnels (PB)
  const personalBests = useMemo(() => {
    const map = new Map();
    allPerformances.forEach(perf => {
      const key = `${perf.athlete.id}_${perf.event_id}_${perf.bassin || '25m'}`;
      const existing = map.get(key);
      if (!existing || perf.seconds < existing.seconds) {
        map.set(key, perf);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.seconds - b.seconds);
  }, [allPerformances]);

  // Gestion de la saisie sur la feuille de match
  const handleTimeChange = (athleteId, value) => {
    setBatchTimes(prev => ({
      ...prev,
      [athleteId]: {
        ...(prev[athleteId] || {}),
        timeStr: value
      }
    }));
  };

  // Enregistrement groupé de la feuille de match
  const handleSaveBatch = () => {
    const entriesToSave = Object.entries(batchTimes).filter(([_, data]) => data?.timeStr && data.timeStr.trim() !== '');

    if (entriesToSave.length === 0) {
      toast.error("Veuillez saisir au moins un chrono avant d'enregistrer.");
      return;
    }

    setSavingBatch(true);
    let count = 0;

    entriesToSave.forEach(([athleteId, data]) => {
      try {
        const key = `${PERFORMANCES_STORAGE_PREFIX}${athleteId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Parse time to seconds
        const clean = data.timeStr.trim().replace(',', '.');
        let sec = 0;
        const parts = clean.split(':');
        if (parts.length === 2) {
          sec = (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
        } else {
          sec = parseFloat(clean) || 0;
        }

        if (sec > 0) {
          const newPerf = {
            id: `perf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            event_id: selectedEventId,
            time_str: data.timeStr,
            seconds: sec,
            date_perf: testDate,
            bassin,
            contexte: 'Test Entraînement',
            observations: data.notes || '',
            created_at: new Date().toISOString()
          };

          existing.unshift(newPerf);
          localStorage.setItem(key, JSON.stringify(existing));
          count++;
        }
      } catch (err) {
        console.error("Erreur enregistrement chrono:", err);
      }
    });

    setSavingBatch(false);
    toast.success(`${count} chronos enregistrés avec succès sur la feuille de match ! ⏱️`);
    setBatchTimes({});
  };

  // Passage de niveau / Promotion de groupe
  const handlePromoteLevel = async (athleteId, nextGroupId, nextGroupName) => {
    if (!window.confirm(`Valider l'évaluation et promouvoir cet athlète dans le groupe « ${nextGroupName} » ?`)) return;

    try {
      const { error } = await supabase
        .from('athletes')
        .update({ groupe_id: nextGroupId, groupe: nextGroupName })
        .eq('id', athleteId);

      if (error) throw error;
      toast.success(`Félicitations ! L'athlète a validé son palier et passe en « ${nextGroupName} » 🏅`);
      window.location.reload();
    } catch (err) {
      console.error("Erreur promotion:", err);
      toast.error("Erreur lors de la mise à jour du groupe");
    }
  };

  const selectedEvent = SWIMMING_EVENTS.find(e => e.id === selectedEventId);

  return (
    <div>
      {/* HEADER DU MODULE SPORTIF */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1>Performances & Chronos</h1>
          <p style={{ marginBottom: 0 }}>Suivi chronométrique, feuilles de match collectives et passage de paliers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge status="ACTIVE" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
            <Waves size={14} style={{ marginRight: '5px' }} /> Saison Sportive Active
          </Badge>
        </div>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 flex items-center gap-3">
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
            <Timer size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{allPerformances.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chronos enregistrés</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <Trophy size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{personalBests.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Records Personnels (PB)</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{groupes.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paliers & Groupes encadrés</div>
          </div>
        </Card>
      </div>

      {/* SYSTÈME D'ONGLETS DU MODULE SPORTIF */}
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--border-color)] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('feuille_match')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'feuille_match'
              ? 'bg-[var(--accent-primary)] text-white shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)]'
          }`}
          style={{ border: 'none' }}
        >
          <Timer size={16} />
          <span>Feuille de Match (Saisie collective)</span>
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'records'
              ? 'bg-[var(--accent-primary)] text-white shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)]'
          }`}
          style={{ border: 'none' }}
        >
          <Trophy size={16} />
          <span>Palmarès & Records Personnels (PB)</span>
        </button>

        <button
          onClick={() => setActiveTab('niveaux')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'niveaux'
              ? 'bg-[var(--accent-primary)] text-white shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)]'
          }`}
          style={{ border: 'none' }}
        >
          <Award size={16} />
          <span>Passage de Paliers & Niveaux</span>
        </button>
      </div>

      {/* CONTENU ONGLET 1 : FEUILLE DE MATCH COLLECTIVE */}
      {activeTab === 'feuille_match' && (
        <Card noPadding>
          {/* BARRE DE PARAMÉTRAGE DU TEST */}
          <div className="p-4 flex flex-wrap gap-3 items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase block mb-1">Groupe / Équipe</label>
                <select 
                  className="form-select"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  style={{ minWidth: '170px' }}
                >
                  {groupes.map(g => (
                    <option key={g.id} value={g.id}>{g.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase block mb-1">Épreuve de Natation</label>
                <select 
                  className="form-select"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  style={{ minWidth: '190px' }}
                >
                  {SWIMMING_EVENTS.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase block mb-1">Bassin</label>
                <select 
                  className="form-select"
                  value={bassin}
                  onChange={(e) => setBassin(e.target.value)}
                  style={{ minWidth: '100px' }}
                >
                  <option value="25m">25m</option>
                  <option value="50m">50m</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase block mb-1">Date du test</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  style={{ minWidth: '140px' }}
                />
              </div>
            </div>

            <Button 
              variant="primary"
              onClick={handleSaveBatch}
              disabled={savingBatch || groupAthletes.length === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} /> Enregistrer la feuille de match
            </Button>
          </div>

          {/* TABLEAU FEUILLE DE MATCH */}
          {loadingAthletes ? (
            <div className="p-6 flex flex-col gap-3">
              <Skeleton height="40px" />
              <Skeleton height="40px" />
            </div>
          ) : groupAthletes.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              Aucun athlète dans ce groupe pour le moment.
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Nageur</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Catégorie</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Record Actuel (PB)</th>
                    <th style={{ padding: '0.85rem 1rem', width: '220px' }}>Chrono du Jour (ex: 32.45)</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Notes / Ressenti</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Historique</th>
                  </tr>
                </thead>
                <tbody>
                  {groupAthletes.map(athlete => {
                    const swimCat = getSwimmingCategory(athlete.date_naissance);
                    
                    // Trouver le PB existant sur l'épreuve
                    const pbKey = `${athlete.id}_${selectedEventId}_${bassin}`;
                    const currentPB = personalBests.find(pb => `${pb.athlete.id}_${pb.event_id}_${pb.bassin || '25m'}` === pbKey);

                    return (
                      <tr key={athlete.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{athlete.nom} {athlete.prenom}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{athlete.sexe || '-'}</div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '6px', 
                            backgroundColor: swimCat.badgeBg, 
                            color: swimCat.color, 
                            fontSize: '0.72rem', 
                            fontWeight: 700 
                          }}>
                            {swimCat.label}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          {currentPB ? (
                            <span style={{ fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Trophy size={13} /> {currentPB.time_str}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Premier test</span>
                          )}
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <input 
                            type="text" 
                            placeholder="ex: 00:32.45" 
                            className="form-input"
                            style={{ fontFamily: 'monospace', fontWeight: 700, width: '100%', maxWidth: '170px' }}
                            value={batchTimes[athlete.id]?.timeStr || ''}
                            onChange={(e) => handleTimeChange(athlete.id, e.target.value)}
                          />
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <input 
                            type="text" 
                            placeholder="Fréquence, virage..." 
                            className="form-input text-xs"
                            style={{ width: '100%', maxWidth: '220px' }}
                            value={batchTimes[athlete.id]?.notes || ''}
                            onChange={(e) => setBatchTimes(prev => ({
                              ...prev,
                              [athlete.id]: { ...(prev[athlete.id] || {}), notes: e.target.value }
                            }))}
                          />
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <Button 
                            variant="secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#38bdf8' }}
                            onClick={() => setModalAthlete(athlete)}
                          >
                            <Timer size={13} /> Fiche
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* CONTENU ONGLET 2 : PALMARÈS & RECORDS PERSONNELS */}
      {activeTab === 'records' && (
        <Card noPadding>
          <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Tableau d'Honneur & Records Personnels</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Meilleures performances chronométrées par nage et par bassin.</p>
            </div>
            <div className="relative" style={{ minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Filtrer par nageur, épreuve..." 
                className="form-input" 
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
              />
            </div>
          </div>

          {personalBests.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <Trophy size={32} className="mx-auto mb-2 opacity-30" />
              Aucun record chronométré pour l'instant. Utilisez la Feuille de Match pour saisir les premiers temps !
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Nageur</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Groupe</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Épreuve</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Bassin</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Record Personnel (PB)</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {personalBests
                    .filter(pb => {
                      const q = recordSearch.toLowerCase().trim();
                      if (!q) return true;
                      const name = `${pb.athlete.nom} ${pb.athlete.prenom}`.toLowerCase();
                      const ev = (SWIMMING_EVENTS.find(e => e.id === pb.event_id)?.label || '').toLowerCase();
                      return name.includes(q) || ev.includes(q);
                    })
                    .map((pb, index) => {
                      const evObj = SWIMMING_EVENTS.find(e => e.id === pb.event_id);
                      return (
                        <tr key={pb.id || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{pb.athlete.nom} {pb.athlete.prenom}</strong>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>
                            {pb.athlete.groupes?.nom || pb.athlete.groupe || '-'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontWeight: 600, color: '#38bdf8' }}>{evObj?.label || pb.event_id}</span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <Badge status="ACTIVE" style={{ fontSize: '0.7rem' }}>{pb.bassin || '25m'}</Badge>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Trophy size={14} /> {pb.time_str}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {pb.date_perf ? new Date(pb.date_perf).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <Button 
                              variant="secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => setModalAthlete(pb.athlete)}
                            >
                              Courbe
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* CONTENU ONGLET 3 : PASSAGE DE PALIERS & NIVEAUX */}
      {activeTab === 'niveaux' && (
        <div className="flex flex-col gap-5">
          <Card className="p-5" style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} style={{ color: 'var(--accent-secondary)' }} /> Grille d'Évaluation & Paliers Sportifs
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Suivez l'acquisition des compétences clés (Flottaison, Propulsion, Virages, 4 Nages). Lorsqu'un nageur valide l'ensemble des compétences de son palier, vous pouvez le promouvoir directement dans le groupe supérieur.
            </p>
          </Card>

          <Card noPadding>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Nageurs en cours d'évaluation</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validation des compétences et promotion de groupe en 1 clic.</p>
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Nageur</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Niveau Actuel</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Compétences Clés</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Promotion de Palier</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.slice(0, 15).map(athlete => {
                    const currentGroupName = athlete.groupes?.nom || athlete.groupe || 'Initiation';
                    
                    // Trouver le groupe suivant dans la progression
                    let nextGroup = null;
                    if (currentGroupName.toLowerCase().includes('initiation')) {
                      nextGroup = groupes.find(g => g.nom.toLowerCase().includes('apprentissage'));
                    } else if (currentGroupName.toLowerCase().includes('apprentissage')) {
                      nextGroup = groupes.find(g => g.nom.toLowerCase().includes('entraînement') || g.nom.toLowerCase().includes('entrainement'));
                    }

                    return (
                      <tr key={athlete.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{athlete.nom} {athlete.prenom}</strong>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: '#38bdf8' }}>{currentGroupName}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div className="flex flex-wrap gap-1.5">
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}>
                              ✓ Flottaison
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}>
                              ✓ Propulsion
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600 }}>
                              ⏳ Virage
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {nextGroup ? (
                            <Button 
                              variant="secondary"
                              onClick={() => handlePromoteLevel(athlete.id, nextGroup.id, nextGroup.nom)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                            >
                              <ArrowUpRight size={14} /> Passer en {nextGroup.nom}
                            </Button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Groupe Élite Max</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODALE INDIVIDUELLE DE PERFORMANCE / COURBE */}
      {modalAthlete && (
        <AthletePerformancesModal
          athlete={modalAthlete}
          onClose={() => setModalAthlete(null)}
        />
      )}
    </div>
  );
}
