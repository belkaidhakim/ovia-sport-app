import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Search, QrCode, Edit, Printer, Download, Upload, Trash2, Mail, 
  MessageSquare, Send, CheckSquare, UserPlus, Timer, Users, Award, Waves, 
  FileText, HeartPulse, Shield, AlertTriangle, RotateCcw, Check, Ban, 
  CreditCard, Sparkles, X, CheckCircle2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BadgeGenerator from '../components/BadgeGenerator';
import AthletePerformancesModal from '../components/AthletePerformancesModal';
import { getSwimmingCategory, detectSiblingGroups } from '../utils/swimmingCategories';
import { generateBadgeSheetPDF } from '../utils/badgeSheetPdfGenerator';
import { generateOfficialRegistrationFormPdf } from '../utils/registrationFormPdfGenerator';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { useAthletes } from '../hooks/useAthletes';
import { useGroupes } from '../hooks/useGroupes';
import { Card, Button, Badge, Skeleton } from '../components/ui';
import PendingInscriptions from './PendingInscriptions';

const getInitials = (nom = '', prenom = '') => {
  const n = (nom || '').trim().charAt(0).toUpperCase();
  const p = (prenom || '').trim().charAt(0).toUpperCase();
  return `${n}${p}` || '?';
};

const getAgeAndCategory = (dateNaissance) => {
  if (!dateNaissance) return { age: null, category: 'N/A', dateStr: '-' };
  const birth = new Date(dateNaissance);
  if (isNaN(birth.getTime())) return { age: null, category: 'N/A', dateStr: '-' };
  
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

  let category = 'Senior';
  if (age < 7) category = 'Baby (U7)';
  else if (age <= 9) category = 'Poussin (U9)';
  else if (age <= 11) category = 'Pupille (U11)';
  else if (age <= 13) category = 'Benjamin (U13)';
  else if (age <= 15) category = 'Minime (U15)';
  else if (age <= 17) category = 'Cadet (U17)';
  else if (age <= 19) category = 'Junior (U20)';
  else if (age >= 35) category = 'Master (+35)';

  return { age, category, dateStr: birth.toLocaleDateString('fr-FR') };
};

const getCotisationStatus = (cotisationsArr, cardStatut) => {
  if (!cotisationsArr || cotisationsArr.length === 0) {
    return { type: 'pending', label: 'Cotis. En attente', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
  }
  const sorted = [...cotisationsArr].sort((a, b) => new Date(b.periode_couverte_fin) - new Date(a.periode_couverte_fin));
  const latest = sorted[0];
  const endDate = new Date(latest.periode_couverte_fin);
  const now = new Date();

  const monthNames = ['Janv', 'Fév', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const monthName = monthNames[endDate.getMonth()];

  if (endDate < now || cardStatut === 'EXPIREE' || cardStatut === 'SUSPENDUE') {
    return { type: 'expired', label: `Expiré (${monthName})`, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  } else {
    return { type: 'paid', label: `Payé (${monthName})`, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
  }
};

const getPresenceGauge = (presencesArr) => {
  const count = Array.isArray(presencesArr) ? presencesArr.length : 0;
  const target = 8;
  const percent = Math.min(100, Math.round((count / target) * 100));
  
  let color = '#10b981';
  if (percent < 50) color = '#ef4444';
  else if (percent < 75) color = '#f59e0b';

  return { count, target, percent, color };
};

// 🟢 Smart Access métrique : 3 états dynamiques (Phase 2)
const getSmartAccess = (athlete) => {
  const cardStatut = athlete.cartes_acces?.statut || (Array.isArray(athlete.cartes_acces) && athlete.cartes_acces[0]?.statut) || 'ACTIVE';
  const presencesCount = Array.isArray(athlete.presences) ? athlete.presences.length : 0;
  const cotisations = athlete.cotisations || [];
  
  const sortedCotis = [...cotisations].sort((a, b) => new Date(b.periode_couverte_fin) - new Date(a.periode_couverte_fin));
  const latestCotis = sortedCotis[0];
  const isCotisPaid = latestCotis && new Date(latestCotis.periode_couverte_fin) >= new Date();

  if (cardStatut === 'SUSPENDUE' || cardStatut === 'BLOQUE') {
    return {
      code: 'BLOQUE',
      label: 'Bloqué',
      sublabel: 'Carte suspendue',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.35)'
    };
  }

  if (presencesCount >= 8) {
    return {
      code: 'BLOQUE',
      label: 'Bloqué',
      sublabel: 'Forfait 8/8 épuisé',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.35)'
    };
  }

  if (isCotisPaid) {
    return {
      code: 'AUTORISE',
      label: 'Autorisé',
      sublabel: `${Math.max(0, 8 - presencesCount)} séance(s) rest.`,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)'
    };
  }

  // Tolérance pour impayé mais <= 2 séances
  if (presencesCount <= 2) {
    return {
      code: 'TOLERANCE',
      label: 'Tolérance',
      sublabel: `Essai (${presencesCount}/2)`,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.35)'
    };
  }

  return {
    code: 'BLOQUE',
    label: 'Bloqué',
    sublabel: 'Cotis. impayée',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)'
  };
};

export default function AthletesList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    athletes, 
    archivedAthletes,
    loading, 
    loadingArchived,
    fetchAthletes, 
    fetchArchivedAthletes,
    archiveAthlete, 
    restoreAthlete,
    toggleAccessStatus,
    bulkUpdateGroup,
    bulkToggleAccess,
    bulkValidateCotisation
  } = useAthletes();

  const { groupes } = useGroupes();

  // Navigation par onglets (Phase 3)
  const initialTab = searchParams.get('tab') === 'inscriptions' ? 'inscriptions' : 'membres';
  const [activeMainTab, setActiveMainTab] = useState(initialTab);
  const [pendingCount, setPendingCount] = useState(0);

  // Filtres (Phase 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [cotisationFilter, setCotisationFilter] = useState('all'); // Toutes, a_jour, en_attente, quota_epuise, expire
  const [statusFilter, setStatusFilter] = useState('all'); // all, AUTORISE, TOLERANCE, BLOQUE
  const [genderFilter, setGenderFilter] = useState('all');

  // Sélection & Actions groupées (Phase 1)
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [showBulkGroupModal, setShowBulkGroupModal] = useState(false);
  const [selectedBulkGroup, setSelectedBulkGroup] = useState('');
  const [showBulkCotisModal, setShowBulkCotisModal] = useState(false);
  const [bulkCotisMontant, setBulkCotisMontant] = useState(3000);
  const [bulkCotisMode, setBulkCotisMode] = useState('Espèces');

  // Modales existantes
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [performanceAthlete, setPerformanceAthlete] = useState(null);
  const [showBulkPrint, setShowBulkPrint] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [messageSubject, setMessageSubject] = useState("Ovia Sport - Information");
  const [messageBody, setMessageBody] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("horaire");
  const fileInputRef = useRef(null);

  // Détection des fratries
  const siblingMap = useMemo(() => detectSiblingGroups(athletes), [athletes]);

  // Synchronisation URL param tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'inscriptions') setActiveMainTab('inscriptions');
    else if (tabParam === 'archives') {
      setActiveMainTab('archives');
      fetchArchivedAthletes();
    }
  }, [searchParams, fetchArchivedAthletes]);

  // Récupération du compteur d'inscriptions en attente
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { count, error } = await supabase
          .from('inscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'EN_ATTENTE');
        if (!error && count !== null) {
          setPendingCount(count);
        }
      } catch {}
    };
    fetchPending();
  }, [activeMainTab]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  useEffect(() => {
    const gParam = searchParams.get('groupe');
    const sParam = searchParams.get('search');
    if (gParam) {
      setGroupFilter(gParam);
      setSearchQuery('');
    } else if (sParam) {
      setGroupFilter(sParam);
      setSearchQuery('');
    }
  }, [searchParams]);

  const handleTemplateChange = (templateType) => {
    setMessageTemplate(templateType);
    if (templateType === "horaire") {
      setMessageSubject("Ovia Sport - Changement d'horaire d'entraînement");
      setMessageBody("Bonjour,\n\nNous vous informons qu'un changement d'horaire aura lieu pour les prochains entraînements. Merci de consulter le planning mis à jour auprès du club.\n\nSportivement,\nL'équipe d'Ovia Sport");
    } else if (templateType === "paiement") {
      setMessageSubject("Ovia Sport - Rappel de cotisation mensuelle");
      setMessageBody("Bonjour,\n\nCeci est un rappel concernant votre cotisation du mois. Merci de régulariser votre paiement auprès du secrétariat du club.\n\nCordialement,\nL'administration");
    } else if (templateType === "convocation") {
      setMessageSubject("Ovia Sport - Convocation Compétition");
      setMessageBody("Bonjour,\n\nVous êtes convoqué(e) à la prochaine rencontre sportive du club. Merci de valider votre présence auprès de votre entraîneur.\n\nSportivement,\nLe Staff Technique");
    }
  };

  const handleDelete = async (athleteId) => {
    if (!window.confirm("Voulez-vous vraiment archiver ce membre ? Vous pourrez le retrouver et le restaurer à tout moment dans l'onglet Archives.")) return;
    await archiveAthlete(athleteId);
  };

  const handleExport = () => {
    const exportData = filteredAthletes.map(a => ({
      nom: a.nom,
      prenom: a.prenom,
      sexe: a.sexe || '',
      groupe: a.groupes?.nom || a.groupe || '',
      date_naissance: a.date_naissance ? new Date(a.date_naissance).toLocaleDateString('fr-FR') : '',
      telephone: a.telephone || '',
      certificat_medical_valide: a.certificat_medical_valide ? 'OUI' : 'NON',
      numero_licence: a.numero_licence || '',
      date_inscription: a.date_inscription ? new Date(a.date_inscription).toLocaleDateString('fr-FR') : ''
    }));

    const csv = Papa.unparse(exportData, { delimiter: ";" });
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export_athletes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSelected = () => {
    const selectedList = athletes.filter(a => selectedAthletes.includes(a.id));
    if (selectedList.length === 0) {
      toast.error('Aucun membre sélectionné');
      return;
    }
    const exportData = selectedList.map(a => ({
      nom: a.nom,
      prenom: a.prenom,
      sexe: a.sexe || '',
      groupe: a.groupes?.nom || a.groupe || '',
      telephone: a.telephone || '',
      certificat_medical_valide: a.certificat_medical_valide ? 'OUI' : 'NON',
      numero_licence: a.numero_licence || ''
    }));
    const csv = Papa.unparse(exportData, { delimiter: ";" });
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `selection_membres_${selectedList.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Export de ${selectedList.length} membre(s) téléchargé`);
  };

  const handleExportBadgeSheet = async (targetList = null) => {
    const list = targetList || athletes.filter(a => selectedAthletes.includes(a.id));
    if (!list || list.length === 0) {
      toast.error('Sélectionnez au moins un athlète pour exporter la planche de badges.');
      return;
    }
    const toastId = toast.loading(`Génération de la planche PDF (${list.length} badges CR80)...`);
    try {
      await generateBadgeSheetPDF(list, `Planche_Badges_OVS_${list.length}_membres.pdf`);
      toast.success('Planche de badges générée avec succès ! 🖨️', { id: toastId });
    } catch (err) {
      console.error('Error generating badge sheet PDF:', err);
      toast.error('Erreur lors de la génération de la planche PDF.', { id: toastId });
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading("Importation du fichier CSV...");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        let importedCount = 0;
        let skippedCount = 0;

        for (const row of rows) {
          if (!row.nom || !row.prenom) {
            skippedCount++;
            continue;
          }

          const isDuplicate = athletes.some(a => 
            a.nom.toLowerCase() === row.nom.toLowerCase() && 
            a.prenom.toLowerCase() === row.prenom.toLowerCase()
          );

          if (isDuplicate) {
            skippedCount++;
            continue;
          }

          const token_qr = `CLUB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          let date_naissance = null;
          if (row.date_naissance) {
            const parts = row.date_naissance.split('/');
            if (parts.length === 3) {
              date_naissance = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
              const d = new Date(row.date_naissance);
              if (!isNaN(d.getTime())) date_naissance = d.toISOString().split('T')[0];
            }
          }

          try {
            const { error } = await supabase
              .from('athletes')
              .insert([{
                nom: row.nom,
                prenom: row.prenom,
                sexe: row.sexe || null,
                groupe: row.groupe || null,
                telephone: row.telephone || null,
                date_naissance: date_naissance,
                token_qr
              }]);
              
            if (!error) importedCount++;
          } catch (err) {
            console.error("Erreur import", err);
          }
        }

        toast.success(`${importedCount} athlètes importés avec succès. ${skippedCount > 0 ? `(${skippedCount} ignorés car doublons)` : ''}`, { id: toastId });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchAthletes();
      },
      error: (error) => {
        console.error("Parse error:", error);
        toast.error("Erreur lors de la lecture du fichier CSV.", { id: toastId });
      }
    });
  };

  // Filtrage combiné (Phase 1)
  const filteredAthletes = useMemo(() => {
    return athletes.filter(athlete => {
      const nom = (athlete.nom || '').toLowerCase();
      const prenom = (athlete.prenom || '').toLowerCase();
      const groupeNom = (athlete.groupes?.nom || athlete.groupe || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || nom.includes(q) || prenom.includes(q) || groupeNom.includes(q);

      const gFilter = groupFilter.toLowerCase().trim();
      const matchesGroup = groupFilter === 'all' || 
                           groupeNom === gFilter || 
                           groupeNom.includes(gFilter) ||
                           String(athlete.groupe_id) === String(groupFilter);

      // Smart Access (3 statuts : AUTORISE, TOLERANCE, BLOQUE)
      const smartAccess = getSmartAccess(athlete);
      const matchesStatus = statusFilter === 'all' || smartAccess.code === statusFilter;

      // Filtre 4 : Cotisation
      const cotisInfo = getCotisationStatus(athlete.cotisations, athlete.cartes_acces?.statut);
      const presenceCount = Array.isArray(athlete.presences) ? athlete.presences.length : 0;
      let matchesCotisation = true;
      if (cotisationFilter === 'a_jour') {
        matchesCotisation = cotisInfo.type === 'paid';
      } else if (cotisationFilter === 'en_attente') {
        matchesCotisation = cotisInfo.type === 'pending';
      } else if (cotisationFilter === 'quota_epuise') {
        matchesCotisation = presenceCount >= 8;
      } else if (cotisationFilter === 'expire') {
        matchesCotisation = cotisInfo.type === 'expired';
      }

      // Filtre par sexe (M / F)
      const sexe = (athlete.sexe || '').trim().toUpperCase();
      const matchesGender = genderFilter === 'all' || sexe === genderFilter;

      return matchesSearch && matchesGroup && matchesStatus && matchesCotisation && matchesGender;
    });
  }, [athletes, searchQuery, groupFilter, statusFilter, cotisationFilter, genderFilter]);

  return (
    <div>
      <div className="no-print">
        
        {/* HEADER DU MODULE ATHLÈTES */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
          <div>
            <h1>Gestion des Membres</h1>
            <p style={{ marginBottom: 0 }}>Annuaire sportif, profils, suivi médical et assiduité en bassin.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleImport} 
              style={{ display: 'none' }} 
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Importer CSV
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              <Download size={16} /> Exporter CSV
            </Button>

            <Link to="/athletes/new" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                <Plus size={16} /> + Nouvel Athlète
              </Button>
            </Link>
          </div>
        </div>

        {/* SYSTÈME D'ONGLETS SUPÉRIEUR (PHASE 3) */}
        <div className="flex items-center gap-2 mb-6 border-b border-[var(--border-color)] pb-3 overflow-x-auto no-print">
          <button
            onClick={() => {
              setActiveMainTab('membres');
              setSearchParams({});
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeMainTab === 'membres'
                ? 'bg-[var(--accent-primary)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)]'
            }`}
            style={{ border: 'none' }}
          >
            <Users size={16} />
            <span>Tous les membres</span>
            <span style={{ 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              padding: '1px 7px', 
              borderRadius: '10px', 
              backgroundColor: activeMainTab === 'membres' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)' 
            }}>
              {athletes.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab('inscriptions');
              setSearchParams({ tab: 'inscriptions' });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeMainTab === 'inscriptions'
                ? 'bg-[#f59e0b] text-black shadow-md font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)]'
            }`}
            style={{ border: 'none' }}
          >
            <UserPlus size={16} />
            <span>Inscriptions en attente</span>
            {pendingCount > 0 && (
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 800, 
                padding: '1px 7px', 
                borderRadius: '10px', 
                backgroundColor: activeMainTab === 'inscriptions' ? '#000' : '#f59e0b', 
                color: activeMainTab === 'inscriptions' ? '#fff' : '#000' 
              }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveMainTab('archives');
              setSearchParams({ tab: 'archives' });
              fetchArchivedAthletes();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeMainTab === 'archives'
                ? 'bg-[var(--accent-primary)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--table-row-hover)]'
            }`}
            style={{ border: 'none' }}
          >
            <RotateCcw size={16} />
            <span>Archives / Anciens</span>
            {archivedAthletes.length > 0 && (
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 800, 
                padding: '1px 7px', 
                borderRadius: '10px', 
                backgroundColor: 'rgba(255,255,255,0.15)' 
              }}>
                {archivedAthletes.length}
              </span>
            )}
          </button>
        </div>

        {/* ONGLET 2 : INSCRIPTIONS EN ATTENTE EMBARQUÉES */}
        {activeMainTab === 'inscriptions' && (
          <div className="mt-2">
            <PendingInscriptions embedded={true} />
          </div>
        )}

        {/* ONGLET 3 : ARCHIVES / ANCIENS */}
        {activeMainTab === 'archives' && (
          <Card noPadding>
            <div className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Membres archivés ou inactifs</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ces membres ne peuvent plus accéder au bassin via le Scanner QR. Vous pouvez les restaurer à tout moment.</p>
            </div>
            {loadingArchived ? (
              <div className="p-6 flex flex-col gap-3">
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </div>
            ) : archivedAthletes.length === 0 ? (
              <div className="p-12 text-center text-muted">
                <RotateCcw size={32} className="mx-auto mb-2 opacity-30" />
                Aucun membre dans les archives.
              </div>
            ) : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Membre</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Dernier Groupe</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Date d'inscription</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedAthletes.map(arch => (
                      <tr key={arch.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{arch.nom} {arch.prenom}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{arch.telephone || 'Sans tél'}</div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className="text-sm font-semibold">{arch.groupes?.nom || arch.groupe || 'Non assigné'}</span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {arch.date_inscription ? new Date(arch.date_inscription).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <Button 
                            variant="secondary"
                            onClick={() => restoreAthlete(arch.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                          >
                            <RotateCcw size={14} /> Réactiver le membre
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ONGLET 1 : TOUS LES MEMBRES (TABLE PRINCIPALE) */}
        {activeMainTab === 'membres' && (
          <>
            {/* BANDEAU D'ACTIONS EN LOT (BULK ACTIONS - PHASE 1) */}
            {selectedAthletes.length > 0 && (
              <div 
                className="p-3 px-5 mb-4 rounded-xl flex flex-wrap justify-between items-center gap-3 no-print"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <div className="flex items-center gap-3">
                  <CheckSquare size={20} style={{ color: 'var(--accent-primary-hover)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {selectedAthletes.length} membre{selectedAthletes.length > 1 ? 's' : ''} sélectionné{selectedAthletes.length > 1 ? 's' : ''}
                  </span>
                  <button 
                    onClick={() => setSelectedAthletes([])} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Désélectionner tout
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {/* Changer de groupe */}
                  <Button 
                    variant="secondary"
                    onClick={() => setShowBulkGroupModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                    title="Changer le groupe des athlètes sélectionnés"
                  >
                    <Users size={15} /> Changer groupe
                  </Button>

                  {/* Valider cotisation */}
                  <Button 
                    variant="secondary"
                    onClick={() => setShowBulkCotisModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                    title="Valider la cotisation mensuelle pour la sélection"
                  >
                    <CreditCard size={15} /> Valider cotisation
                  </Button>

                  {/* Suspendre accès */}
                  <Button 
                    variant="secondary"
                    onClick={() => bulkToggleAccess(selectedAthletes, 'SUSPENDUE')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                    title="Suspendre temporairement l'accès"
                  >
                    <Ban size={15} /> Suspendre accès
                  </Button>

                  {/* Activer accès */}
                  <Button 
                    variant="secondary"
                    onClick={() => bulkToggleAccess(selectedAthletes, 'ACTIVE')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                    title="Réactiver l'accès en bassin"
                  >
                    <Check size={15} /> Activer accès
                  </Button>

                  {/* Planche PDF Badges CR80 */}
                  <Button 
                    variant="secondary" 
                    onClick={() => handleExportBadgeSheet()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <Printer size={15} /> Planche Badges CR80
                  </Button>

                  {/* Exporter CSV sélection */}
                  <Button 
                    variant="secondary" 
                    onClick={handleExportSelected}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <Download size={15} /> Exporter CSV
                  </Button>

                  {/* Relance WhatsApp / Email */}
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      handleTemplateChange('horaire');
                      setShowBulkMessageModal(true);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                  >
                    <MessageSquare size={15} /> Message / Relance ({selectedAthletes.length})
                  </Button>
                </div>
              </div>
            )}

            <Card noPadding>
              {/* BARRE DE FILTRES REFONDUE (GRILLE CSS FLEXIBLE - PHASE 1) */}
              <div className="p-4 flex flex-wrap gap-3 items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
                {/* 1. Recherche par nom / prénom / groupe */}
                <div className="relative" style={{ minWidth: '220px', flex: '1 1 220px' }}>
                  <Search size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, groupe..." 
                    className="form-input" 
                    style={{ paddingLeft: '2.4rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* 2. Filtre Groupe */}
                <select 
                  className="form-select" 
                  style={{ minWidth: '170px', flex: '0 1 auto' }}
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                >
                  <option value="all">👥 Tous les groupes</option>
                  {groupes.map(g => (
                    <option key={g.id} value={g.nom}>{g.nom}</option>
                  ))}
                </select>

                {/* 3. Filtre Cotisation (4ème filtre ajouté - Phase 1) */}
                <select 
                  className="form-select" 
                  style={{ minWidth: '175px', flex: '0 1 auto' }}
                  value={cotisationFilter}
                  onChange={(e) => setCotisationFilter(e.target.value)}
                >
                  <option value="all">💳 Toutes cotisations</option>
                  <option value="a_jour">🟢 À jour (Payé)</option>
                  <option value="en_attente">🟠 En attente</option>
                  <option value="quota_epuise">🔴 Quota épuisé (8/8)</option>
                  <option value="expire">⚠️ Expirée</option>
                </select>

                {/* 4. Filtre Statut d'Accès Dynamique (Smart Access - Phase 2) */}
                <select 
                  className="form-select" 
                  style={{ minWidth: '160px', flex: '0 1 auto' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">⚡ Tous accès</option>
                  <option value="AUTORISE">🟢 Autorisé</option>
                  <option value="TOLERANCE">🟠 Tolérance / Essai</option>
                  <option value="BLOQUE">🔴 Bloqué</option>
                </select>

                {/* 5. Filtre Sexe */}
                <select 
                  className="form-select" 
                  style={{ minWidth: '135px', flex: '0 1 auto' }}
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="all">🚻 Tous sexes</option>
                  <option value="M">👨 Masculin (M)</option>
                  <option value="F">👩 Féminin (F)</option>
                </select>
              </div>

              {loading ? (
                <div className="p-8 flex flex-col gap-4">
                  <Skeleton height="42px" />
                  <Skeleton height="42px" />
                  <Skeleton height="42px" />
                </div>
              ) : (
                <>
                  {/* TABLEAU DES DONNÉES AVEC COLONNE FUSIONNÉE PROFIL SPORTIF (PHASE 1) */}
                  <div className="responsive-table-desktop table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '920px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <th style={{ padding: '0.85rem 1rem', width: '40px' }}>
                            <input 
                              type="checkbox" 
                              checked={filteredAthletes.length > 0 && selectedAthletes.length === filteredAthletes.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAthletes(filteredAthletes.map(a => a.id));
                                } else {
                                  setSelectedAthletes([]);
                                }
                              }}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </th>
                          <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Membre & Dossier</th>
                          {/* COLONNE FUSIONNÉE : PROFIL SPORTIF (GROUPE + CATÉGORIE) */}
                          <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Profil Sportif</th>
                          <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Cotisation</th>
                          <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Assiduité (Séances)</th>
                          <th style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>Smart Access</th>
                          <th style={{ padding: '0.85rem 1rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAthletes.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-muted">Aucun membre ne correspond à vos critères de recherche.</td>
                          </tr>
                        ) : filteredAthletes.map(athlete => {
                          const { age, category, dateStr } = getAgeAndCategory(athlete.date_naissance);
                          const swimCat = getSwimmingCategory(athlete.date_naissance);
                          const cotisInfo = getCotisationStatus(athlete.cotisations, athlete.cartes_acces?.statut);
                          const presence = getPresenceGauge(athlete.presences);
                          const smartAccess = getSmartAccess(athlete);

                          return (
                            <tr key={athlete.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              {/* Checkbox */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedAthletes.includes(athlete.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAthletes(prev => [...prev, athlete.id]);
                                    } else {
                                      setSelectedAthletes(prev => prev.filter(id => id !== athlete.id));
                                    }
                                  }}
                                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                />
                              </td>

                              {/* Membre + Dossier Médical / Licence (Phase 2) */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div className="flex items-center gap-3">
                                  {(athlete.photo || athlete.photo_url) ? (
                                    <img 
                                      src={athlete.photo || athlete.photo_url} 
                                      alt={`${athlete.nom} ${athlete.prenom}`} 
                                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent-primary-hover)', flexShrink: 0 }} 
                                    />
                                  ) : (
                                    <div 
                                      style={{ 
                                        width: '38px', 
                                        height: '38px', 
                                        borderRadius: '50%', 
                                        backgroundColor: 'rgba(99, 102, 241, 0.15)', 
                                        border: '1.5px solid rgba(99, 102, 241, 0.3)', 
                                        color: 'var(--accent-primary-hover)',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontWeight: 700, 
                                        fontSize: '0.85rem',
                                        flexShrink: 0
                                      }}
                                    >
                                      {getInitials(athlete.nom, athlete.prenom)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                                      {athlete.nom} {athlete.prenom}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                      {athlete.sexe || '-'} • {athlete.telephone || 'Sans tél'}
                                    </div>
                                    
                                    {/* Indicateurs Suivi Médical & Licence (Phase 2) */}
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                      {athlete.certificat_medical_valide ? (
                                        <span 
                                          title="Certificat médical conforme et validé"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.67rem', fontWeight: 700, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '1px 6px', borderRadius: '4px' }}
                                        >
                                          <HeartPulse size={11} /> Médical OK
                                        </span>
                                      ) : (
                                        <span 
                                          title="Certificat médical manquant ou à renouveler"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.67rem', fontWeight: 700, color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)', padding: '1px 6px', borderRadius: '4px' }}
                                        >
                                          <AlertTriangle size={11} /> Médical manquant
                                        </span>
                                      )}

                                      {athlete.numero_licence && (
                                        <span 
                                          title={`Licence fédérale: ${athlete.numero_licence}`}
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.67rem', fontWeight: 700, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.12)', padding: '1px 6px', borderRadius: '4px' }}
                                        >
                                          <Shield size={11} /> Lic. {athlete.numero_licence}
                                        </span>
                                      )}

                                      {siblingMap.has(athlete.id) && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '1px 6px', borderRadius: '4px', fontSize: '0.67rem', fontWeight: 700, backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                                          👨‍👩‍👧‍👦 Fratrie ({siblingMap.get(athlete.id).siblingIndex}e enf.{siblingMap.get(athlete.id).discountPercent > 0 ? ` -${siblingMap.get(athlete.id).discountPercent}%` : ''})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* COLONNE FUSIONNÉE : PROFIL SPORTIF (GROUPE + CATÉGORIE FINA) */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div className="flex flex-col gap-1">
                                  <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {athlete.groupes?.nom || athlete.groupe || 'Non assigné'}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span style={{ 
                                      padding: '2px 7px', 
                                      borderRadius: '6px', 
                                      backgroundColor: swimCat.badgeBg, 
                                      fontSize: '0.7rem', 
                                      fontWeight: 700, 
                                      color: swimCat.color,
                                      border: `1px solid ${swimCat.color}35`,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}>
                                      {swimCat.label}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                      {age !== null ? `${age} ans` : ''} ({dateStr})
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Cotisation */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span style={{ padding: '3px 10px', borderRadius: '12px', backgroundColor: cotisInfo.bg, color: cotisInfo.color, fontSize: '0.75rem', fontWeight: 700, display: 'inline-block' }}>
                                  {cotisInfo.label}
                                </span>
                              </td>

                              {/* Assiduité (Séances) */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ minWidth: '105px' }}>
                                  <div className="flex justify-between text-xs mb-1" style={{ fontSize: '0.74rem' }}>
                                    <span style={{ fontWeight: 600 }}>{presence.count}/{presence.target}</span>
                                    <span style={{ color: presence.color, fontWeight: 700 }}>{presence.percent}%</span>
                                  </div>
                                  <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${presence.percent}%`, backgroundColor: presence.color, borderRadius: '3px' }} />
                                  </div>
                                </div>
                              </td>

                              {/* Smart Access (3 États Dynamiques - Phase 2) */}
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <button 
                                  onClick={() => toggleAccessStatus(athlete.id, athlete.cartes_acces)}
                                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                                  title="Cliquer pour suspendre ou réactiver manuellement la carte"
                                >
                                  <div style={{
                                    display: 'inline-flex',
                                    flexDirection: 'column',
                                    padding: '3px 8px',
                                    borderRadius: '8px',
                                    backgroundColor: smartAccess.bg,
                                    border: `1px solid ${smartAccess.borderColor}`,
                                    color: smartAccess.color
                                  }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: smartAccess.color }} />
                                      {smartAccess.label}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>
                                      {smartAccess.sublabel}
                                    </span>
                                  </div>
                                </button>
                              </td>

                              {/* Actions Dégagées et Confortables */}
                              <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                <div className="flex justify-end gap-1.5">
                                  <Button 
                                    variant="secondary" 
                                    style={{ padding: '0.4rem 0.65rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                                    onClick={() => setPerformanceAthlete(athlete)}
                                    title="Suivi des chronos et temps de référence en natation"
                                  >
                                    <Timer size={14} /> Chronos
                                  </Button>
                                  <Link to={`/athletes/edit/${athlete.id}`}>
                                    <Button variant="secondary" style={{ padding: '0.4rem 0.65rem' }} title="Modifier la fiche athlète">
                                      <Edit size={14} />
                                    </Button>
                                  </Link>
                                  <Button 
                                    variant="secondary" 
                                    style={{ padding: '0.4rem 0.65rem' }}
                                    onClick={() => setSelectedAthlete(athlete)}
                                    title="Générer / Imprimer le Badge QR"
                                  >
                                    <QrCode size={14} />
                                  </Button>
                                  <Button 
                                    variant="secondary" 
                                    style={{ padding: '0.4rem 0.55rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                    onClick={() => handleDelete(athlete.id)}
                                    title="Archiver ce membre"
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Version Mobile Ergonomique */}
                  <div className="responsive-cards-mobile">
                    {filteredAthletes.length === 0 ? (
                      <div className="p-8 text-center text-muted">Aucun membre trouvé.</div>
                    ) : filteredAthletes.map(athlete => {
                      const { age, dateStr } = getAgeAndCategory(athlete.date_naissance);
                      const swimCat = getSwimmingCategory(athlete.date_naissance);
                      const cotisInfo = getCotisationStatus(athlete.cotisations, athlete.cartes_acces?.statut);
                      const presence = getPresenceGauge(athlete.presences);
                      const smartAccess = getSmartAccess(athlete);

                      return (
                        <div 
                          key={athlete.id}
                          className="p-4 rounded-xl flex flex-col gap-3"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <div className="flex items-center justify-between w-full pb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                checked={selectedAthletes.includes(athlete.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAthletes(prev => [...prev, athlete.id]);
                                  } else {
                                    setSelectedAthletes(prev => prev.filter(id => id !== athlete.id));
                                  }
                                }}
                                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                  {athlete.nom} {athlete.prenom}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {athlete.groupes?.nom || athlete.groupe || 'Non assigné'}
                                </div>
                              </div>
                            </div>

                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              backgroundColor: smartAccess.bg,
                              color: smartAccess.color
                            }}>
                              {smartAccess.label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span style={{ padding: '2px 8px', borderRadius: '8px', backgroundColor: swimCat.badgeBg, color: swimCat.color, fontSize: '0.72rem', fontWeight: 700 }}>
                              {swimCat.label} {age !== null ? `(${age} ans)` : ''}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: '8px', backgroundColor: cotisInfo.bg, color: cotisInfo.color, fontSize: '0.72rem', fontWeight: 700 }}>
                              {cotisInfo.label}
                            </span>
                            {athlete.certificat_medical_valide ? (
                              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <HeartPulse size={12} /> Certificat OK
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <AlertTriangle size={12} /> Sans Certificat
                              </span>
                            )}
                          </div>

                          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px' }}>
                            <div className="flex justify-between text-xs mb-1">
                              <span style={{ color: 'var(--text-muted)' }}>Assiduité : <strong>{presence.count}/{presence.target} séances</strong></span>
                              <span style={{ color: presence.color, fontWeight: 700 }}>{presence.percent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${presence.percent}%`, backgroundColor: presence.color, borderRadius: '3px' }} />
                            </div>
                          </div>

                          <div className="flex justify-center gap-2 w-full pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <Button 
                              variant="secondary" 
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#38bdf8' }}
                              onClick={() => setPerformanceAthlete(athlete)}
                            >
                              <Timer size={14} /> Chronos
                            </Button>
                            <Link to={`/athletes/edit/${athlete.id}`}>
                              <Button variant="secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                                <Edit size={14} /> Modifier
                              </Button>
                            </Link>
                            <Button 
                              variant="secondary" 
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => setSelectedAthlete(athlete)}
                            >
                              <QrCode size={14} /> Badge
                            </Button>
                            <Button 
                              variant="secondary" 
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#ef4444' }}
                              onClick={() => handleDelete(athlete.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </>
        )}
      </div>

      {/* MODALE CHANGEMENT DE GROUPE EN LOT (PHASE 1) */}
      {showBulkGroupModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel p-6" style={{ width: '450px', maxWidth: '95vw', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 className="mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Users size={20} style={{ color: '#38bdf8' }} /> Changer de groupe ({selectedAthletes.length} membres)
            </h3>
            <p className="text-muted text-xs mb-4">
              Sélectionnez le nouveau groupe auquel affecter les membres cochés :
            </p>
            <div className="mb-4">
              <label className="form-label text-xs font-semibold text-muted mb-1 block">Nouveau groupe cible :</label>
              <select 
                className="form-select w-full"
                value={selectedBulkGroup}
                onChange={(e) => setSelectedBulkGroup(e.target.value)}
              >
                <option value="">-- Choisir un groupe --</option>
                {groupes.map(g => (
                  <option key={g.id} value={g.id}>{g.nom}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <Button variant="secondary" onClick={() => setShowBulkGroupModal(false)}>Annuler</Button>
              <Button 
                variant="primary"
                disabled={!selectedBulkGroup}
                onClick={async () => {
                  const grp = groupes.find(g => String(g.id) === String(selectedBulkGroup));
                  if (grp) {
                    await bulkUpdateGroup(selectedAthletes, grp.id, grp.nom);
                    setShowBulkGroupModal(false);
                    setSelectedAthletes([]);
                  }
                }}
              >
                Appliquer la réaffectation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE VALIDATION COTISATION EN LOT (PHASE 1) */}
      {showBulkCotisModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel p-6" style={{ width: '450px', maxWidth: '95vw', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 className="mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CreditCard size={20} style={{ color: '#10b981' }} /> Valider cotisation ({selectedAthletes.length} membres)
            </h3>
            <p className="text-muted text-xs mb-4">
              Cette action enregistre un règlement de cotisation et prolonge la validité de l'accès de 30 jours pour tous les membres sélectionnés.
            </p>
            <div className="mb-3">
              <label className="form-label text-xs font-semibold text-muted mb-1 block">Montant unitaire (DA) :</label>
              <input 
                type="number" 
                className="form-input w-full"
                value={bulkCotisMontant}
                onChange={(e) => setBulkCotisMontant(Number(e.target.value))}
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-xs font-semibold text-muted mb-1 block">Mode de paiement :</label>
              <select 
                className="form-select w-full"
                value={bulkCotisMode}
                onChange={(e) => setBulkCotisMode(e.target.value)}
              >
                <option value="Espèces">Espèces</option>
                <option value="Virement CCP / BaridiMob">Virement CCP / BaridiMob</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <Button variant="secondary" onClick={() => setShowBulkCotisModal(false)}>Annuler</Button>
              <Button 
                variant="primary"
                onClick={async () => {
                  await bulkValidateCotisation(selectedAthletes, bulkCotisMontant, bulkCotisMode);
                  setShowBulkCotisModal(false);
                  setSelectedAthletes([]);
                }}
              >
                Confirmer le règlement ({selectedAthletes.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE BADGE D'ACCÈS INDIVIDUEL */}
      {selectedAthlete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel p-6" style={{ width: '540px', maxWidth: '95vw', position: 'relative' }}>
            <button 
              onClick={() => setSelectedAthlete(null)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              &times;
            </button>
            <h2 className="mb-4 text-center">Badge d'accès</h2>
            <BadgeGenerator athlete={selectedAthlete} />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={() => setSelectedAthlete(null)}>Fermer</Button>
              <Button 
                variant="secondary"
                onClick={async () => {
                  try {
                    toast.loading("Génération de la fiche d'inscription officielle...", { id: 'athlete-dossier' });
                    await generateOfficialRegistrationFormPdf({
                      data: selectedAthlete,
                      photoBase64: selectedAthlete.photo || selectedAthlete.photo_url,
                      selectedGroupeNom: selectedAthlete.groupes?.nom || selectedAthlete.groupe
                    });
                    toast.success("Fiche PDF générée et téléchargée !", { id: 'athlete-dossier' });
                  } catch (e) {
                    toast.error("Erreur: " + e.message, { id: 'athlete-dossier' });
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileText size={16} /> Fiche d'adhésion (PDF)
              </Button>
              <Button variant="primary" onClick={() => window.print()}>
                <Printer size={16} /> Imprimer le badge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE COMMUNICATION GROUPÉE */}
      {showBulkMessageModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel p-6" style={{ width: '650px', maxWidth: '95vw', position: 'relative', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setShowBulkMessageModal(false)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}
            >
              &times;
            </button>

            <h2 className="mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <MessageSquare size={22} style={{ color: 'var(--accent-primary-hover)' }} /> Communication Groupée
            </h2>
            <p className="text-muted text-sm mb-4">
              Envoi d'un message aux <strong>{selectedAthletes.length} membres</strong> sélectionnés.
            </p>

            <div className="mb-4">
              <label className="form-label text-xs font-semibold text-muted mb-2 block">Modèles rapides :</label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={messageTemplate === 'horaire' ? 'primary' : 'secondary'} 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => handleTemplateChange('horaire')}
                >
                  📢 Horaire
                </Button>
                <Button 
                  variant={messageTemplate === 'paiement' ? 'primary' : 'secondary'} 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => handleTemplateChange('paiement')}
                >
                  💳 Cotisation
                </Button>
                <Button 
                  variant={messageTemplate === 'convocation' ? 'primary' : 'secondary'} 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => handleTemplateChange('convocation')}
                >
                  🏆 Convocation
                </Button>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-xs font-semibold text-muted mb-1 block">Sujet de l'e-mail / Titre :</label>
              <input 
                type="text" 
                className="form-input" 
                value={messageSubject} 
                onChange={(e) => setMessageSubject(e.target.value)} 
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-xs font-semibold text-muted mb-1 block">Contenu du message :</label>
              <textarea 
                className="form-input" 
                rows={5} 
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <Button 
                variant="secondary" 
                onClick={() => {
                  const selectedList = athletes.filter(a => selectedAthletes.includes(a.id));
                  const phoneNumbers = selectedList.map(a => a.telephone).filter(Boolean).join(', ');
                  navigator.clipboard.writeText(`Destinataires: ${phoneNumbers}\n\n${messageBody}`);
                  toast.success(`${selectedList.length} numéros et message copiés !`);
                }}
              >
                <MessageSquare size={16} /> Copier Numéros & SMS ({selectedAthletes.length})
              </Button>

              <Button 
                variant="primary"
                onClick={() => {
                  const selectedList = athletes.filter(a => selectedAthletes.includes(a.id));
                  const emails = selectedList.map(a => a.email).filter(Boolean).join(',');
                  if (!emails) {
                    toast.error("Aucune adresse e-mail trouvée parmi les membres sélectionnés.");
                    return;
                  }
                  const mailtoUrl = `mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(messageSubject)}&body=${encodeURIComponent(messageBody)}`;
                  window.location.href = mailtoUrl;
                  toast.success("Client e-mail ouvert avec les destinataires en CCI !");
                }}
              >
                <Mail size={16} /> Envoyer par E-mail Groupé
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PLANCHE DE BADGES EN APERÇU IMPRESSION */}
      {showBulkPrint && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg-color)', zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div className="p-4 flex justify-between items-center no-print" style={{ backgroundColor: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 10 }}>
            <h2>Impression multiple ({selectedAthletes.length} badges)</h2>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setShowBulkPrint(false)}>Annuler</Button>
              <Button variant="primary" onClick={() => window.print()}>
                <Printer size={18} /> Lancer l'impression
              </Button>
            </div>
          </div>
          
          <div className="p-8 print-container flex flex-wrap gap-8 justify-center items-start" style={{ minHeight: '100vh', backgroundColor: '#e2e8f0' }}>
            {athletes.filter(a => selectedAthletes.includes(a.id)).map(athlete => (
              <div key={athlete.id} className="badge-wrapper-print" style={{ pageBreakInside: 'avoid' }}>
                <BadgeGenerator athlete={athlete} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALE DE SUIVI DES CHRONOS ET PERFORMANCES */}
      {performanceAthlete && (
        <AthletePerformancesModal
          athlete={performanceAthlete}
          onClose={() => setPerformanceAthlete(null)}
        />
      )}
    </div>
  );
}
