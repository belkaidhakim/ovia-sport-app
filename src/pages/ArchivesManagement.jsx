import React, { useState, useMemo, useEffect } from 'react';
import { 
  Archive, 
  RotateCcw, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Users, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  Eye, 
  X, 
  RefreshCw, 
  Phone, 
  Calendar, 
  Layers, 
  ShieldAlert, 
  ArrowUpDown,
  ExternalLink,
  MessageCircle,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { Card, StatCard, Button, Badge, Skeleton } from '../components/ui';
import { useAthletes } from '../hooks/useAthletes';
import { useGroupes } from '../hooks/useGroupes';
import { formatName, calculateAge, formatWhatsAppPhone } from '../utils/formatters';

export default function ArchivesManagement() {
  const { 
    archivedAthletes, 
    loadingArchived, 
    fetchArchivedAthletes, 
    restoreAthlete, 
    bulkRestoreAthletes,
    deleteAthletePermanently,
    bulkDeleteAthletesPermanently
  } = useAthletes();

  const { groupes } = useGroupes();

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedSexe, setSelectedSexe] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  // Multi-sélection
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals
  const [inspectAthlete, setInspectAthlete] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null); // athlete object or 'BULK'

  // Chargement initial
  useEffect(() => {
    fetchArchivedAthletes();
  }, [fetchArchivedAthletes]);

  // Filtrage et tri
  const filteredAthletes = useMemo(() => {
    let result = [...(archivedAthletes || [])];

    // Recherche texte
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(a => {
        const nom = (a.nom || '').toLowerCase();
        const prenom = (a.prenom || '').toLowerCase();
        const tel = (a.telephone || '').toLowerCase();
        const licence = (a.numero_licence || '').toLowerCase();
        const grp = (a.groupes?.nom || a.groupe || '').toLowerCase();
        return nom.includes(q) || prenom.includes(q) || tel.includes(q) || licence.includes(q) || grp.includes(q);
      });
    }

    // Filtre groupe
    if (selectedGroup !== 'ALL') {
      result = result.filter(a => (a.groupe_id === selectedGroup || a.groupe === selectedGroup || a.groupes?.nom === selectedGroup));
    }

    // Filtre sexe
    if (selectedSexe !== 'ALL') {
      result = result.filter(a => {
        const s = (a.sexe || '').toUpperCase();
        if (selectedSexe === 'M') return s === 'M' || s === 'MASCULIN' || s === 'HOMME';
        if (selectedSexe === 'F') return s === 'F' || s === 'FEMININ' || s === 'FEMME';
        return true;
      });
    }

    // Tri
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date_inscription || 0) - new Date(a.date_inscription || 0);
      }
      if (sortBy === 'date_asc') {
        return new Date(a.date_inscription || 0) - new Date(b.date_inscription || 0);
      }
      if (sortBy === 'nom_asc') {
        return (a.nom || '').localeCompare(b.nom || '');
      }
      if (sortBy === 'nom_desc') {
        return (b.nom || '').localeCompare(a.nom || '');
      }
      return 0;
    });

    return result;
  }, [archivedAthletes, searchTerm, selectedGroup, selectedSexe, sortBy]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = archivedAthletes.length;
    let hommes = 0;
    let femmes = 0;
    const groupsSet = new Set();

    archivedAthletes.forEach(a => {
      const s = (a.sexe || '').toUpperCase();
      if (s === 'M' || s === 'MASCULIN' || s === 'HOMME') hommes++;
      else if (s === 'F' || s === 'FEMININ' || s === 'FEMME') femmes++;

      const grp = a.groupes?.nom || a.groupe;
      if (grp) groupsSet.add(grp);
    });

    return {
      total,
      hommes,
      femmes,
      groupesCount: groupsSet.size
    };
  }, [archivedAthletes]);

  // Gestion de la sélection multiple
  const isAllSelected = filteredAthletes.length > 0 && filteredAthletes.every(a => selectedIds.includes(a.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAthletes.map(a => a.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Actions de restauration
  const handleRestoreOne = async (athlete) => {
    setIsProcessing(true);
    const success = await restoreAthlete(athlete.id);
    setIsProcessing(false);
    if (success) {
      setSelectedIds(prev => prev.filter(id => id !== athlete.id));
      if (inspectAthlete?.id === athlete.id) setInspectAthlete(null);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    const success = await bulkRestoreAthletes(selectedIds);
    setIsProcessing(false);
    if (success) {
      setSelectedIds([]);
    }
  };

  // Actions de suppression définitive
  const confirmDeleteAction = async () => {
    if (!deleteConfirmTarget) return;
    setIsProcessing(true);

    if (deleteConfirmTarget === 'BULK') {
      const success = await bulkDeleteAthletesPermanently(selectedIds);
      if (success) {
        setSelectedIds([]);
      }
    } else {
      const success = await deleteAthletePermanently(deleteConfirmTarget.id);
      if (success) {
        setSelectedIds(prev => prev.filter(id => id !== deleteConfirmTarget.id));
        if (inspectAthlete?.id === deleteConfirmTarget.id) setInspectAthlete(null);
      }
    }

    setIsProcessing(false);
    setDeleteConfirmTarget(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredAthletes.length === 0) {
      toast.error("Aucun enregistrement à exporter");
      return;
    }

    const dataToExport = filteredAthletes.map((a, index) => ({
      'N°': index + 1,
      'Nom': a.nom || '',
      'Prénom': a.prenom || '',
      'Sexe': a.sexe || '',
      'Groupe / Niveau': a.groupes?.nom || a.groupe || 'Non assigné',
      'Date de Naissance': a.date_naissance ? new Date(a.date_naissance).toLocaleDateString('fr-FR') : '',
      'Lieu de Naissance': a.lieu_naissance || '',
      'Âge': calculateAge(a.date_naissance) || '',
      'Téléphone': a.telephone || '',
      'Contact Urgence': a.contact_urgence || a.telephone_tuteur || '',
      'N° Licence': a.numero_licence || '',
      'Date Inscription': a.date_inscription ? new Date(a.date_inscription).toLocaleDateString('fr-FR') : '',
      'Statut': 'ARCHIVÉ / INACTIF'
    }));

    const csv = Papa.unparse(dataToExport);
    // Ajout du BOM UTF-8 pour affichage correct des caractères arabes et accents sous Excel
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `archives_membres_ovia_sport_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Fichier CSV exporté avec succès !");
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div 
              style={{ 
                padding: '10px', 
                borderRadius: '14px', 
                backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                color: '#f59e0b',
                display: 'inline-flex'
              }}
            >
              <Archive size={26} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Module Archives & Anciens Membres
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Consultez, réactivez en un clic ou gérez la rétention des athlètes et adhérents inactifs du club
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary"
            onClick={() => fetchArchivedAthletes()}
            disabled={loadingArchived}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={loadingArchived ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </Button>

          <Button 
            variant="primary"
            onClick={handleExportCSV}
            disabled={filteredAthletes.length === 0}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              backgroundColor: '#059669',
              borderColor: '#059669'
            }}
          >
            <Download size={16} />
            <span>Exporter CSV</span>
          </Button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Archive size={22} />}
          iconBg="rgba(245, 158, 11, 0.15)"
          iconColor="#f59e0b"
          glowColor="rgba(245, 158, 11, 0.25)"
          label="Total Dossiers Archivés"
          value={loadingArchived ? '...' : stats.total}
          subtitle="Adhérents inactifs réactivables"
        />

        <StatCard
          icon={<Users size={22} />}
          iconBg="rgba(56, 189, 248, 0.15)"
          iconColor="#38bdf8"
          glowColor="rgba(56, 189, 248, 0.25)"
          label="Répartition Genre"
          value={loadingArchived ? '...' : `${stats.hommes} H / ${stats.femmes} F`}
          subtitle="Hommes et Femmes archivés"
        />

        <StatCard
          icon={<Layers size={22} />}
          iconBg="rgba(168, 85, 247, 0.15)"
          iconColor="#a855f7"
          glowColor="rgba(168, 85, 247, 0.25)"
          label="Groupes Concernés"
          value={loadingArchived ? '...' : `${stats.groupesCount} groupe(s)`}
          subtitle="Historique des sections de nage"
        />

        <StatCard
          icon={<RotateCcw size={22} />}
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#10b981"
          glowColor="rgba(16, 185, 129, 0.25)"
          label="Restauration Immédiate"
          value="1 Clic"
          subtitle="Réactivation sans perte de données"
        />
      </div>

      {/* CONTROL & FILTER TOOLBAR */}
      <Card noPadding>
        <div className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Barre de recherche */}
          <div className="relative flex-1">
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, téléphone, groupe ou licence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border transition-all text-sm"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtres dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre Groupe */}
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm border cursor-pointer"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Tous les groupes</option>
              {groupes.map(g => (
                <option key={g.id} value={g.nom}>{g.nom}</option>
              ))}
            </select>

            {/* Filtre Sexe */}
            <select
              value={selectedSexe}
              onChange={(e) => setSelectedSexe(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm border cursor-pointer"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Tous les genres</option>
              <option value="M">Masculin (Garçons)</option>
              <option value="F">Féminin (Filles)</option>
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm border cursor-pointer"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="date_desc">Inscription : Plus récent</option>
              <option value="date_asc">Inscription : Plus ancien</option>
              <option value="nom_asc">Nom : A à Z</option>
              <option value="nom_desc">Nom : Z à A</option>
            </select>

            {(searchTerm || selectedGroup !== 'ALL' || selectedSexe !== 'ALL') && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGroup('ALL');
                  setSelectedSexe('ALL');
                }}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* BANDEAU D'ACTIONS MULTIPLES (BULK ACTIONS) */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              style={{ 
                backgroundColor: 'rgba(99, 102, 241, 0.12)', 
                borderTop: '1px solid rgba(99, 102, 241, 0.25)',
                borderBottom: '1px solid rgba(99, 102, 241, 0.25)' 
              }}
            >
              <div className="p-3 px-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} className="text-indigo-400" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedIds.length} membre(s) sélectionné(s)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    disabled={isProcessing}
                    onClick={handleBulkRestore}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      backgroundColor: '#10b981', 
                      borderColor: '#10b981',
                      fontSize: '0.85rem'
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>Réactiver la sélection ({selectedIds.length})</span>
                  </Button>

                  <Button
                    variant="secondary"
                    disabled={isProcessing}
                    onClick={() => setDeleteConfirmTarget('BULK')}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      color: '#f43f5e', 
                      borderColor: 'rgba(244, 63, 94, 0.4)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Supprimer définitivement</span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => setSelectedIds([])}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TABLEAU PRINCIPAL */}
        {loadingArchived ? (
          <div className="p-6 flex flex-col gap-3">
            <Skeleton height="50px" />
            <Skeleton height="50px" />
            <Skeleton height="50px" />
            <Skeleton height="50px" />
          </div>
        ) : filteredAthletes.length === 0 ? (
          <div className="p-16 text-center text-muted">
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#f59e0b'
              }}
            >
              <Archive size={32} />
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Aucun membre dans les archives
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
              {searchTerm || selectedGroup !== 'ALL' || selectedSexe !== 'ALL'
                ? "Aucun résultat ne correspond à vos filtres de recherche. Essayez de réinitialiser vos critères."
                : "Tous vos athlètes sont actuellement actifs. Les membres archivés apparaîtront automatiquement ici."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '40px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', margin: '0 auto' }}
                    >
                      {isAllSelected ? <CheckSquare size={18} className="text-indigo-400" /> : <Square size={18} />}
                    </button>
                  </th>
                  <th style={{ padding: '0.85rem 1rem' }}>Membre Archivé</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Ancien Groupe</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Contact</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date d'inscription</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Statut Accès</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.map(athlete => {
                  const isSelected = selectedIds.includes(athlete.id);
                  const nomComplet = formatName(athlete.nom, athlete.prenom);
                  const initials = `${(athlete.prenom || '')[0] || ''}${(athlete.nom || '')[0] || ''}`.toUpperCase();
                  const age = calculateAge(athlete.date_naissance);
                  const whatsappPhone = formatWhatsAppPhone(athlete.telephone);

                  return (
                    <tr 
                      key={athlete.id}
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                      className="hover:bg-[var(--table-row-hover)]"
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(athlete.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', margin: '0 auto' }}
                        >
                          {isSelected ? <CheckSquare size={18} className="text-indigo-400" /> : <Square size={18} />}
                        </button>
                      </td>

                      {/* Membre Info */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div className="flex items-center gap-3">
                          {athlete.photo_url ? (
                            <img 
                              src={athlete.photo_url} 
                              alt={nomComplet} 
                              className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]"
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                              style={{ 
                                backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                              }}
                            >
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                {nomComplet}
                              </span>
                              {athlete.sexe && (
                                <span 
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '6px',
                                    backgroundColor: (athlete.sexe === 'F' || athlete.sexe === 'FEMININ') ? 'rgba(236, 72, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                    color: (athlete.sexe === 'F' || athlete.sexe === 'FEMININ') ? '#ec4899' : '#38bdf8'
                                  }}
                                >
                                  {athlete.sexe}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted mt-0.5 flex-wrap">
                              {age !== null && <span>{age} ans</span>}
                              {athlete.date_naissance && (
                                <span>• Né(e) le {new Date(athlete.date_naissance).toLocaleDateString('fr-FR')}{athlete.lieu_naissance ? ` à ${athlete.lieu_naissance}` : ''}</span>
                              )}
                              {athlete.numero_licence && (
                                <span>• Lic: {athlete.numero_licence}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Groupe */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span 
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {athlete.groupes?.nom || athlete.groupe || 'Non assigné'}
                        </span>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {athlete.telephone ? (
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {athlete.telephone}
                            </span>
                            {whatsappPhone && (
                              <a
                                href={`https://wa.me/${whatsappPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Ouvrir WhatsApp"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981'
                                }}
                              >
                                <MessageCircle size={14} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Non renseigné</span>
                        )}
                      </td>

                      {/* Date inscription */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {athlete.date_inscription 
                          ? new Date(athlete.date_inscription).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) 
                          : '-'}
                      </td>

                      {/* Statut accès */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(245, 158, 11, 0.12)',
                            color: '#f59e0b'
                          }}
                        >
                          <Archive size={12} />
                          Archivé
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Clic Réactiver */}
                          <button
                            type="button"
                            onClick={() => handleRestoreOne(athlete)}
                            disabled={isProcessing}
                            title="Réactiver ce membre dans la liste active"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            className="hover:bg-[rgba(16,185,129,0.25)]"
                          >
                            <RotateCcw size={14} />
                            <span>Réactiver</span>
                          </button>

                          {/* Aperçu Fiche */}
                          <button
                            type="button"
                            onClick={() => setInspectAthlete(athlete)}
                            title="Consulter le dossier archivé"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                            className="hover:text-white hover:bg-[rgba(255,255,255,0.12)]"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Supprimer définitivement */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmTarget(athlete)}
                            disabled={isProcessing}
                            title="Supprimer définitivement ce membre"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(244, 63, 94, 0.08)',
                              border: '1px solid rgba(244, 63, 94, 0.25)',
                              color: '#f43f5e',
                              cursor: 'pointer'
                            }}
                            className="hover:bg-[rgba(244,63,94,0.2)]"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER AVEC COMPTEUR */}
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted" style={{ borderTop: '1px solid var(--border-color)' }}>
          <span>
            Affichage de <strong style={{ color: 'var(--text-primary)' }}>{filteredAthletes.length}</strong> membre(s) archivé(s) sur {archivedAthletes.length} au total
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            Les membres archivés n'ont plus accès au Scanner QR et ne sont plus comptabilisés dans les assurances actives.
          </span>
        </div>
      </Card>

      {/* MODAL 1 : CONSULTER LE DOSSIER ARCHIVÉ */}
      <AnimatePresence>
        {inspectAthlete && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-lg p-6 relative flex flex-col gap-5 overflow-hidden"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Entête */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ 
                      backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                      color: '#f59e0b',
                      border: '1px solid rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    {`${(inspectAthlete.prenom || '')[0] || ''}${(inspectAthlete.nom || '')[0] || ''}`.toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatName(inspectAthlete.nom, inspectAthlete.prenom)}
                    </h2>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        fontWeight: 700 
                      }}
                    >
                      Dossier Archivé / Inactif
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setInspectAthlete(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Détails du dossier */}
              <div className="space-y-3" style={{ fontSize: '0.85rem' }}>
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-muted block text-xs">Groupe d'origine</span>
                      <strong className="text-white">{inspectAthlete.groupes?.nom || inspectAthlete.groupe || 'Non assigné'}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Genre</span>
                      <strong className="text-white">{inspectAthlete.sexe || 'Non renseigné'}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Date & Lieu de Naissance</span>
                      <strong className="text-white">
                        {inspectAthlete.date_naissance ? new Date(inspectAthlete.date_naissance).toLocaleDateString('fr-FR') : 'Non renseigné'}
                        {inspectAthlete.lieu_naissance ? ` à ${inspectAthlete.lieu_naissance}` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Âge</span>
                      <strong className="text-white">
                        {calculateAge(inspectAthlete.date_naissance) ? `${calculateAge(inspectAthlete.date_naissance)} ans` : '-'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted block text-xs">Téléphone principal</span>
                      <strong className="text-white">{inspectAthlete.telephone || 'Non renseigné'}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Contact Urgence / Tuteur</span>
                      <strong className="text-white">{inspectAthlete.contact_urgence || inspectAthlete.telephone_tuteur || 'Non renseigné'}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Numéro de licence</span>
                      <strong className="text-white">{inspectAthlete.numero_licence || 'Non renseigné'}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Date d'inscription initiale</span>
                      <strong className="text-white">
                        {inspectAthlete.date_inscription ? new Date(inspectAthlete.date_inscription).toLocaleDateString('fr-FR') : 'Non renseigné'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <Button
                  variant="secondary"
                  onClick={() => setInspectAthlete(null)}
                >
                  Fermer
                </Button>
                
                <Button
                  variant="primary"
                  onClick={() => handleRestoreOne(inspectAthlete)}
                  disabled={isProcessing}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    backgroundColor: '#10b981', 
                    borderColor: '#10b981' 
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Réactiver ce membre</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2 : CONFIRMATION SUPPRESSION DÉFINITIVE */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-md p-6 relative flex flex-col gap-4 border-[rgba(244,63,94,0.3)]"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div 
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(244, 63, 94, 0.15)',
                    color: '#f43f5e'
                  }}
                >
                  <AlertTriangle size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Suppression Définitive
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700 }}>
                    Action irréversible (Nettoyage de base)
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="space-y-2">
                {deleteConfirmTarget === 'BULK' ? (
                  <p>
                    Vous êtes sur le point de supprimer définitivement <strong className="text-white">{selectedIds.length} membre(s)</strong>.
                  </p>
                ) : (
                  <p>
                    Vous êtes sur le point de supprimer définitivement le dossier de <strong className="text-white">{formatName(deleteConfirmTarget.nom, deleteConfirmTarget.prenom)}</strong>.
                  </p>
                )}
                
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                >
                  ⚠️ <strong>Attention :</strong> Toutes les données associées (cotisations passées, assurances, historique des passages au scanner et cartes d'accès) seront supprimées pour toujours.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <Button
                  variant="secondary"
                  disabled={isProcessing}
                  onClick={() => setDeleteConfirmTarget(null)}
                >
                  Annuler
                </Button>

                <Button
                  variant="primary"
                  disabled={isProcessing}
                  onClick={confirmDeleteAction}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    backgroundColor: '#f43f5e', 
                    borderColor: '#f43f5e' 
                  }}
                >
                  <Trash2 size={16} />
                  <span>{isProcessing ? 'Suppression...' : 'Supprimer Définitivement'}</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
