import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSchedule } from '../hooks/useSchedule';
import { useGroupes } from '../hooks/useGroupes';
import { 
  Calendar as CalendarIcon, Plus, Clock, User, MapPin, 
  Edit2, Trash2, X, Zap, Info, Waves, LayoutGrid
} from 'lucide-react';
import { Button, PageHeader } from '../components/ui';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const DAYS = [
  { id: 0, label: 'Dimanche', short: 'Dim' },
  { id: 1, label: 'Lundi', short: 'Lun' },
  { id: 2, label: 'Mardi', short: 'Mar' },
  { id: 3, label: 'Mercredi', short: 'Mer' },
  { id: 4, label: 'Jeudi', short: 'Jeu' },
  { id: 5, label: 'Vendredi', short: 'Ven' },
  { id: 6, label: 'Samedi', short: 'Sam' },
];

export default function Schedule() {
  const { schedule, addSession, editSession, deleteSession } = useSchedule();
  const { groupes } = useGroupes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'pool'
  const [selectedPoolDay, setSelectedPoolDay] = useState(() => new Date().getDay());
  
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    startTime: '17:00',
    endTime: '18:30',
    groupId: '',
    groupName: '',
    coachName: '',
    poolLanes: 'Bassin 25m, Lignes 1-2',
    color: '#38bdf8'
  });

  const handleOpenModal = (session = null) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        dayOfWeek: session.dayOfWeek,
        startTime: session.startTime,
        endTime: session.endTime,
        groupId: session.groupId || '',
        groupName: session.groupName || '',
        coachName: session.coachName || '',
        poolLanes: session.poolLanes || '',
        color: session.color || '#38bdf8'
      });
    } else {
      setEditingSession(null);
      setFormData({
        dayOfWeek: 0,
        startTime: '17:00',
        endTime: '18:30',
        groupId: '',
        groupName: '',
        coachName: '',
        poolLanes: 'Bassin 25m, Lignes 1-2',
        color: '#38bdf8'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSession(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingSession) {
      await editSession(editingSession.id, formData);
    } else {
      await addSession(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    setSessionToDelete(id);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      await deleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  // Synchronisation intelligente vers la table groupes (pour le Dashboard)
  const handleSyncToGroups = async () => {
    try {
      setSyncing(true);
      if (!groupes || groupes.length === 0) {
        toast.error("Aucun groupe trouvé pour la synchronisation.");
        return;
      }

      let updatedCount = 0;
      for (const grp of groupes) {
        const matchingSessions = schedule.filter(
          s => (s.groupId && s.groupId === grp.id) || 
               (s.groupName && s.groupName.trim().toLowerCase() === grp.nom.trim().toLowerCase())
        );

        if (matchingSessions.length > 0) {
          const formattedHoraires = matchingSessions.map(s => {
            const dayObj = DAYS.find(d => d.id === s.dayOfWeek);
            return {
              jour: dayObj ? dayObj.label : 'Lundi',
              heure: s.startTime
            };
          });

          const { error } = await supabase
            .from('groupes')
            .update({ horaires: formattedHoraires })
            .eq('id', grp.id);

          if (!error) updatedCount++;
        }
      }

      if (updatedCount > 0) {
        toast.success(`${updatedCount} groupe(s) synchronisé(s) ! Les présences attendues sur le Dashboard sont à jour.`);
      } else {
        toast.info("Aucun créneau ne correspond aux groupes actuels. Vérifiez les noms de groupes.");
      }
    } catch (err) {
      console.error("Erreur synchronisation planning:", err);
      toast.error("Erreur lors de la synchronisation.");
    } finally {
      setSyncing(false);
    }
  };

  // Grouper les sessions par jour et les trier par heure
  const scheduleByDay = DAYS.map(day => {
    const daySessions = schedule
      .filter(s => s.dayOfWeek === day.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return { ...day, sessions: daySessions };
  });

  const colors = [
    { label: 'Bleu', value: '#38bdf8' },
    { label: 'Vert', value: '#10b981' },
    { label: 'Violet', value: '#a855f7' },
    { label: 'Orange', value: '#f97316' },
    { label: 'Rose', value: '#ec4899' },
    { label: 'Jaune', value: '#eab308' },
    { label: 'Rouge', value: '#ef4444' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête Exécutif */}
      <PageHeader
        eyebrow="Organisation & Bassins"
        eyebrowIcon={CalendarIcon}
        title="Planning Hebdomadaire"
        subtitle="Organisez les créneaux d'entraînement, l'affectation des groupes et les lignes d'eau."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button 
              variant="secondary" 
              onClick={handleSyncToGroups}
              disabled={syncing}
              className="flex items-center gap-2 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
              title="Met à jour les créneaux des groupes pour les afficher sur le Dashboard"
            >
              <Zap className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Synchronisation...' : 'Synchroniser avec le Dashboard'}
            </Button>
            <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
              <Plus size={18} /> Ajouter un créneau
            </Button>
          </div>
        }
      />

      {/* Barre de commutation : Grille Hebdomadaire vs Plan de Bassin (Couloirs 1 à 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'weekly'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grille Hebdomadaire (7 Jours)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('pool')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'pool'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>Plan de Bassin & Couloirs (Lignes 1–6)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 text-sky-500 shrink-0" />
          <span>
            <strong className="text-slate-800 dark:text-slate-200">{schedule.length} créneau(x)</strong> programmés sur la semaine
          </span>
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px]">
            {scheduleByDay.map((day) => (
              <div key={day.id} className="flex-1 min-w-[200px] flex flex-col gap-4">
                {/* En-tête du jour */}
                <div className="sticky top-0 z-10 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 text-center shadow-sm">
                  <h3 className="font-extrabold text-lg text-[var(--text-primary)]">{day.label}</h3>
                  <span className="text-xs font-bold text-muted bg-[var(--bg-tertiary)] px-2 py-1 rounded-md mt-2 inline-block">
                    {day.sessions.length} séance(s)
                  </span>
                </div>

                {/* Liste des séances */}
                <div className="flex flex-col gap-3">
                  {day.sessions.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed border-[var(--border-color)] rounded-xl text-muted text-sm font-medium">
                      Aucun créneau
                    </div>
                  ) : (
                    day.sessions.map(session => (
                      <div 
                        key={session.id} 
                        className="rounded-xl border shadow-sm p-4 relative group transition-all hover:-translate-y-1 hover:shadow-md"
                        style={{ 
                          backgroundColor: 'var(--bg-card)', 
                          borderColor: 'var(--border-color)',
                          borderLeftWidth: '6px',
                          borderLeftColor: session.color || '#38bdf8'
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-[var(--text-primary)] leading-tight pr-6">
                            {session.groupName || session.groupId || 'Séance'}
                          </div>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[var(--bg-card)] rounded-md shadow-sm border border-[var(--border-color)] p-1 z-10">
                            <button onClick={() => handleOpenModal(session)} className="p-1 hover:bg-sky-500/10 hover:text-sky-500 rounded transition-colors" title="Modifier">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(session.id)} className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded transition-colors" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 mt-3">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted">
                            <Clock size={14} className="text-sky-500" />
                            <span>{session.startTime} - {session.endTime}</span>
                          </div>
                          
                          {session.coachName && (
                            <div className="flex items-center gap-2 text-xs font-medium text-muted">
                              <User size={14} className="text-emerald-500" />
                              <span className="truncate">{session.coachName}</span>
                            </div>
                          )}
                          
                          {session.poolLanes && (
                            <div className="flex items-center gap-2 text-xs font-medium text-muted">
                              <MapPin size={14} className="text-rose-500" />
                              <span className="truncate">{session.poolLanes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VUE INTERACTIVE PLAN DE BASSIN & COULOIRS 1 À 6 */
        <div className="space-y-5">
          {/* Sélecteur de jour */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {DAYS.map((d) => {
                const isToday = d.id === new Date().getDay();
                const isSelected = d.id === selectedPoolDay;
                const count = scheduleByDay.find(s => s.id === d.id)?.sessions.length || 0;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedPoolDay(d.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{d.label}</span>
                    {isToday && (
                      <span className={`px-1.5 py-0.5 text-[9px] rounded-full uppercase font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        Auj.
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                      isSelected ? 'bg-sky-800 text-sky-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Maquette Visuelle du Bassin Olympique / Semi-Olympique (Couloirs 1 à 6) */}
          <div className="rounded-3xl border-2 border-sky-500/30 bg-gradient-to-b from-sky-950/90 via-slate-900 to-sky-950/90 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-sky-400/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white mb-0">
                     Occupation des Lignes d'Eau — {DAYS.find(d => d.id === selectedPoolDay)?.label}
                  </h3>
                  <p className="text-xs text-sky-300/80 mb-0">
                    Répartition des groupes par couloir de nage · Cliquez sur un créneau pour le modifier
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setEditingSession(null);
                  setFormData({
                    dayOfWeek: selectedPoolDay,
                    startTime: '17:00',
                    endTime: '18:30',
                    groupId: groupes[0]?.id || '',
                    groupName: groupes[0]?.nom || '',
                    coachName: '',
                    poolLanes: 'Couloir 1',
                    color: '#38bdf8'
                  });
                  setIsModalOpen(true);
                }}
                className="text-xs"
              >
                <Plus size={15} /> Affecter un couloir ce jour
              </Button>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((laneNum) => {
                const daySessions = scheduleByDay.find(d => d.id === selectedPoolDay)?.sessions || [];
                // Identifier les séances qui mentionnent ce couloir (ex: "Lignes 1-2", "Couloir 1", "1", ou répartition par index si non précisé)
                const laneSessions = daySessions.filter((sess, idx) => {
                  const text = String(sess.poolLanes || '').toLowerCase();
                  const rangeMatch = text.match(/(\d+)\s*[-àa]\s*(\d+)/);
                  if (rangeMatch) {
                    const start = parseInt(rangeMatch[1], 10);
                    const end = parseInt(rangeMatch[2], 10);
                    return laneNum >= start && laneNum <= end;
                  }
                  const digits = text.match(/\d+/g);
                  if (digits && digits.some(n => parseInt(n, 10) === laneNum)) {
                    return true;
                  }
                  // Si aucun numéro de ligne n'est mentionné dans poolLanes, afficher sur le couloir correspondant au modulo
                  if (!digits) {
                    return (idx % 6) + 1 === laneNum;
                  }
                  return false;
                });

                return (
                  <div
                    key={laneNum}
                    className="rounded-2xl border border-sky-400/20 bg-sky-900/20 backdrop-blur-xs p-3.5 flex flex-col md:flex-row md:items-center gap-4 relative"
                  >
                    {/* Plot de départ (Numéro de Couloir) */}
                    <div className="flex items-center gap-3 md:w-44 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex flex-col items-center justify-center text-white shrink-0 shadow-inner">
                        <span className="text-[9px] uppercase font-bold text-sky-300 leading-none">Ligne</span>
                        <span className="text-sm font-black leading-tight">#{laneNum}</span>
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white">Couloir {laneNum}</div>
                        <div className="text-[11px] text-sky-300/75">
                          {laneSessions.length > 0 ? `${laneSessions.length} créneau(x)` : 'Couloir libre'}
                        </div>
                      </div>
                    </div>

                    {/* Créneaux affectés sur la ligne d'eau */}
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                      {laneSessions.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSession(null);
                            setFormData({
                              dayOfWeek: selectedPoolDay,
                              startTime: '17:00',
                              endTime: '18:30',
                              groupId: groupes[0]?.id || '',
                              groupName: groupes[0]?.nom || '',
                              coachName: '',
                              poolLanes: `Couloir ${laneNum}`,
                              color: '#38bdf8'
                            });
                            setIsModalOpen(true);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-dashed border-sky-400/25 text-xs text-sky-300/70 hover:text-white hover:border-sky-400/60 hover:bg-sky-500/10 transition cursor-pointer"
                        >
                          + Programmer une séance sur le Couloir {laneNum}
                        </button>
                      ) : (
                        laneSessions.map((sess) => (
                          <div
                            key={`${laneNum}-${sess.id}`}
                            onClick={() => handleOpenModal(sess)}
                            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-white/15 cursor-pointer transition shadow-md flex items-center gap-3 group"
                            style={{ borderLeftWidth: '5px', borderLeftColor: sess.color || '#38bdf8' }}
                          >
                            <div>
                              <div className="text-xs font-extrabold text-white group-hover:text-sky-300 transition-colors">
                                {sess.groupName || 'Séance Club'}
                              </div>
                              <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-sky-400 font-semibold">
                                  <Clock size={11} /> {sess.startTime} – {sess.endTime}
                                </span>
                                {sess.coachName && (
                                  <span className="text-slate-400">· Coach {sess.coachName}</span>
                                )}
                              </div>
                            </div>
                            <Edit2 size={13} className="text-slate-500 group-hover:text-sky-400 transition-colors" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT/EDITION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {editingSession ? <Edit2 className="text-sky-500" /> : <Plus className="text-emerald-500" />}
                {editingSession ? 'Modifier le créneau' : 'Ajouter un créneau'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-black/5 rounded-full transition-colors text-muted">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="scheduleForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Jour</label>
                    <select 
                      required
                      className="form-input w-full"
                      value={formData.dayOfWeek}
                      onChange={e => setFormData({...formData, dayOfWeek: parseInt(e.target.value)})}
                    >
                      {DAYS.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Couleur</label>
                    <div className="flex gap-2">
                      {colors.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFormData({...formData, color: c.value})}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === c.value ? 'scale-110 border-[var(--text-primary)]' : 'border-transparent hover:scale-110'}`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Heure de début</label>
                    <input 
                      type="time" 
                      required
                      className="form-input w-full"
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Heure de fin</label>
                    <input 
                      type="time" 
                      required
                      className="form-input w-full"
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Groupe (Nom de la séance)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Élite, Avenirs..."
                    className="form-input w-full"
                    value={formData.groupName}
                    onChange={e => setFormData({...formData, groupName: e.target.value})}
                    list="groups-list"
                  />
                  <datalist id="groups-list">
                    {groupes.map(g => (
                      <option key={g.id} value={g.nom} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Entraîneur</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      type="text" 
                      placeholder="Nom de l'entraîneur (Optionnel)"
                      className="form-input w-full pl-10"
                      value={formData.coachName}
                      onChange={e => setFormData({...formData, coachName: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Bassin / Lignes d'eau</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      type="text" 
                      placeholder="Ex: Bassin 25m - Lignes 1,2,3 (Optionnel)"
                      className="form-input w-full pl-10"
                      value={formData.poolLanes}
                      onChange={e => setFormData({...formData, poolLanes: e.target.value})}
                    />
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModal}>Annuler</Button>
              <Button type="submit" form="scheduleForm">Enregistrer</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      <ConfirmModal
        isOpen={Boolean(sessionToDelete)}
        title="Supprimer ce créneau"
        message="Êtes-vous sûr de vouloir supprimer définitivement ce créneau d'entraînement du planning ?"
        confirmText="Supprimer le créneau"
        cancelText="Annuler"
        confirmVariant="danger"
        icon={Trash2}
        onConfirm={confirmDelete}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
}
