import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Download, Link2, Plus, Printer, Mail,
  ExternalLink, ShieldCheck, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Trash2, RotateCcw, X
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BadgeGenerator from '../components/BadgeGenerator';
import AthletePerformancesModal from '../components/AthletePerformancesModal';
import ConfirmModal from '../components/ConfirmModal';
import { detectSiblingGroups } from '../utils/swimmingCategories';
import { getCotisationStatus, getSmartAccess } from '../utils/athleteHelpers';
import { generateBadgeSheetPDF } from '../utils/badgeSheetPdfGenerator';
import { generateOfficialRegistrationFormPdf } from '../utils/registrationFormPdfGenerator';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { useAthletes } from '../hooks/useAthletes';
import { useGroupes } from '../hooks/useGroupes';
import { useRegistrationSettings } from '../hooks/useRegistrationSettings';
import PendingInscriptions from './PendingInscriptions';

// Sous-composants modulaires
import AthletesKPIs from '../components/athletes/AthletesKPIs';
import AthletesFilterBar from '../components/athletes/AthletesFilterBar';
import AthleteTableRow from '../components/athletes/AthleteTableRow';
import SmartAccessModal from '../components/athletes/SmartAccessModal';
import { 
  BulkGroupModal, 
  BulkCotisationModal, 
  BulkMessageModal 
} from '../components/athletes/BulkActionModals';

export default function AthletesList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Données de base via hooks
  const { 
    athletes, 
    archivedAthletes, 
    loading, 
    loadingArchived, 
    fetchAthletes, 
    fetchArchivedAthletes, 
    archiveAthlete, 
    restoreAthlete,
    updateSmartAccess
  } = useAthletes();

  const { groupes } = useGroupes();
  const { isOpen: inscriptionsOuvertes, toggleInscriptions } = useRegistrationSettings();

  // Onglet actif : 'tous', 'attente', 'archives'
  const initialTab = searchParams.get('tab') === 'inscriptions' ? 'attente' : 
                     searchParams.get('tab') === 'archives' ? 'archives' : 'tous';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pendingCount, setPendingCount] = useState(0);

  // Filtres (avec prise en charge du paramètre URL ?search=...)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [groupFilter, setGroupFilter] = useState('');
  const [cotisationFilter, setCotisationFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sélections & Actions groupées
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [showBulkGroupModal, setShowBulkGroupModal] = useState(false);
  const [showBulkCotisModal, setShowBulkCotisModal] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);

  // Modales & Confirmations
  const [selectedAthleteForBadge, setSelectedAthleteForBadge] = useState(null);
  const [performanceAthlete, setPerformanceAthlete] = useState(null);
  const [activeMenuAthleteId, setActiveMenuAthleteId] = useState(null);
  const [smartAccessModalAthlete, setSmartAccessModalAthlete] = useState(null);
  const [athleteToArchive, setAthleteToArchive] = useState(null);
  const [athleteToRestore, setAthleteToRestore] = useState(null);

  const fileInputRef = useRef(null);

  // Détection des fratries (mémoïsé)
  const siblingMap = useMemo(() => detectSiblingGroups(athletes), [athletes]);

  // Synchronisation avec l'URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'inscriptions') {
      setActiveTab('attente');
    } else if (tabParam === 'archives') {
      setActiveTab('archives');
      fetchArchivedAthletes();
    } else {
      setActiveTab('tous');
    }

    const searchQuery = searchParams.get('search');
    if (searchQuery !== null) {
      setSearch(searchQuery);
    }
  }, [searchParams, fetchArchivedAthletes]);

  // Réinitialiser la pagination lors d'un changement de filtre
  useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter, accessFilter, cotisationFilter, genderFilter]);

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
  }, [activeTab]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  // Fermer le menu d'action au clic externe
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuAthleteId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Copier le lien public
  const handleCopyPublicLink = () => {
    const url = `${window.location.origin}/inscription`;
    navigator.clipboard.writeText(url);
    toast.success("Lien du formulaire public copié ! 🔗", {
      icon: '📋',
      duration: 3000
    });
  };

  // Exporter en CSV
  const handleExport = () => {
    const listToExport = filteredAthletes;
    if (listToExport.length === 0) {
      toast.error("Aucun athlète à exporter.");
      return;
    }
    const exportData = listToExport.map(a => ({
      nom: a.nom,
      prenom: a.prenom,
      sexe: a.sexe || '',
      groupe: a.groupes?.nom || a.groupe || '',
      date_naissance: a.date_naissance ? new Date(a.date_naissance).toLocaleDateString('fr-FR') : '',
      lieu_naissance: a.lieu_naissance || '',
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
    link.setAttribute("download", `export_athletes_ovia_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${listToExport.length} athlètes exportés en CSV`);
  };

  // Importer CSV
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

          const token_qr = `OVS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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
            const { data: newAthlete, error } = await supabase
              .from('athletes')
              .insert([{
                nom: row.nom.trim().toUpperCase(),
                prenom: row.prenom.trim().charAt(0).toUpperCase() + row.prenom.trim().slice(1),
                sexe: row.sexe || null,
                groupe: row.groupe || null,
                telephone: row.telephone || null,
                date_naissance: date_naissance,
                lieu_naissance: (row.lieu_naissance || row['Lieu de Naissance'] || row['lieu_de_naissance'] || row['Lieu'] || row['lieu'] || '').trim() || null,
                token_qr,
                est_actif: true
              }])
              .select()
              .single();
              
            if (!error && newAthlete?.id) {
              importedCount++;
              try {
                await supabase.from('cartes_acces').insert([{
                  athlete_id: newAthlete.id,
                  statut: 'ACTIVE',
                  date_emission: new Date().toISOString()
                }]);
              } catch (_) {}
            }
          } catch (err) {
            console.error("Erreur import", err);
          }
        }

        toast.success(`${importedCount} athlètes importés avec succès. ${skippedCount > 0 ? `(${skippedCount} doublons ignorés)` : ''}`, { id: toastId });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchAthletes();
      },
      error: (error) => {
        console.error("Parse error:", error);
        toast.error("Erreur lors de la lecture du fichier CSV.", { id: toastId });
      }
    });
  };

  // Bascule du certificat médical
  const toggleMedicalCert = async (athleteId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('athletes')
        .update({ certificat_medical_valide: newStatus })
        .eq('id', athleteId);

      if (error) throw error;
      toast.success(newStatus ? "Certificat médical validé !" : "Certificat médical marqué comme manquant.");
      fetchAthletes();
    } catch (err) {
      console.error('Erreur certificat médical:', err);
      toast.error("Erreur mise à jour certificat");
    }
  };

  // Export Planche PDF
  const handleExportBadgeSheet = async () => {
    const list = selectedAthletes.length > 0 
      ? athletes.filter(a => selectedAthletes.includes(a.id))
      : filteredAthletes;

    if (!list || list.length === 0) {
      toast.error("Sélectionnez au moins un athlète.");
      return;
    }

    const toastId = toast.loading(`Génération de la planche PDF (${list.length} badges)...`);
    try {
      await generateBadgeSheetPDF(list, `Planche_Badges_OviaSport_${list.length}_membres.pdf`);
      toast.success('Planche de badges générée avec succès ! 🖨️', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la génération de la planche PDF.', { id: toastId });
    }
  };

  // Filtrage combiné (mémoïsé)
  const filteredAthletes = useMemo(() => {
    return athletes.filter(athlete => {
      const nom = (athlete.nom || '').toLowerCase();
      const prenom = (athlete.prenom || '').toLowerCase();
      const groupeNom = (athlete.groupes?.nom || athlete.groupe || '').toLowerCase();
      const telephone = (athlete.telephone || '').replace(/\s+/g, '');
      const q = search.toLowerCase().trim().replace(/\s+/g, '');

      const matchesSearch = !q || nom.includes(q) || prenom.includes(q) || groupeNom.includes(q) || telephone.includes(q);

      const gFilter = groupFilter.toLowerCase().trim();
      const matchesGroup = !groupFilter || 
                           groupeNom === gFilter || 
                           groupeNom.includes(gFilter) ||
                           String(athlete.groupe_id) === String(groupFilter);

      // Smart Access
      const smartAccess = getSmartAccess(athlete);
      let matchesAccess = true;
      if (accessFilter === 'autorise') matchesAccess = smartAccess.code === 'AUTORISE';
      else if (accessFilter === 'essai') matchesAccess = smartAccess.code === 'TOLERANCE';
      else if (accessFilter === 'bloque') matchesAccess = smartAccess.code === 'BLOQUE';

      // Cotisation
      const cotisInfo = getCotisationStatus(athlete.cotisations, athlete.cartes_acces?.statut);
      const presenceCount = Array.isArray(athlete.presences) ? athlete.presences.length : 0;
      let matchesCotisation = true;
      if (cotisationFilter === 'paye') matchesCotisation = cotisInfo.type === 'paid';
      else if (cotisationFilter === 'attente') matchesCotisation = cotisInfo.type === 'pending';
      else if (cotisationFilter === 'epuise') matchesCotisation = presenceCount >= 8;

      // Sexe
      const sexe = (athlete.sexe || '').trim().toUpperCase();
      const matchesGender = !genderFilter || sexe === genderFilter;

      return matchesSearch && matchesGroup && matchesAccess && matchesCotisation && matchesGender;
    });
  }, [athletes, search, groupFilter, accessFilter, cotisationFilter, genderFilter]);

  // Pagination & Découpage
  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredAthletes.length / itemsPerPage));
  
  const paginatedAthletes = useMemo(() => {
    if (itemsPerPage === -1) return filteredAthletes;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAthletes.slice(start, start + itemsPerPage);
  }, [filteredAthletes, currentPage, itemsPerPage]);

  const startIndex = filteredAthletes.length === 0 ? 0 : itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = itemsPerPage === -1 ? filteredAthletes.length : Math.min(filteredAthletes.length, currentPage * itemsPerPage);

  // Statistiques KPI Directeur Sportif
  const totalActifs = athletes.length;
  const payeCount = athletes.filter(a => getCotisationStatus(a.cotisations, a.cartes_acces?.statut).type === 'paid').length;
  const enAttenteCount = totalActifs - payeCount;
  const autorisesAccessCount = athletes.filter(a => getSmartAccess(a).code === 'AUTORISE').length;
  const essaiAccessCount = athletes.filter(a => getSmartAccess(a).code === 'TOLERANCE').length;
  const medicalCount = athletes.filter(a => a.certificat_medical_valide).length;
  const medicalPercent = totalActifs > 0 ? Math.round((medicalCount / totalActifs) * 100) : 0;

  // Gestion de la sélection par case à cocher (sur la page courante)
  const toggleSelectAll = () => {
    if (selectedAthletes.length === paginatedAthletes.length && paginatedAthletes.length > 0) {
      setSelectedAthletes([]);
    } else {
      setSelectedAthletes(paginatedAthletes.map(a => a.id));
    }
  };

  const toggleSelectAthlete = (id) => {
    setSelectedAthletes(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Téléchargement fiche officielle PDF
  const handleDownloadPdfForm = async (athlete) => {
    try {
      toast.loading("Génération de la fiche PDF...", { id: 'dossier' });
      await generateOfficialRegistrationFormPdf({
        data: athlete,
        photoBase64: athlete.photo || athlete.photo_url,
        selectedGroupeNom: athlete.groupes?.nom || athlete.groupe
      });
      toast.success("Fiche d'inscription téléchargée !", { id: 'dossier' });
    } catch (e) {
      toast.error("Erreur PDF: " + e.message, { id: 'dossier' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 lg:p-8 space-y-6 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Input fichier caché pour import CSV */}
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleImport} 
        style={{ display: 'none' }} 
      />

      {/* =========================================================
          1. EN-TÊTE EXÉCUTIF
      ========================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Gestion des Membres
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
              {totalActifs} Actifs
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
            Annuaire sportif, suivi médical, cotisations et contrôle d'accès en bassin.
          </p>
        </div>

        {/* Barre d'outils unifiée */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Inscriptions */}
          <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                inscriptionsOuvertes ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {inscriptionsOuvertes ? "Inscriptions Ouvertes" : "Inscriptions Fermées"}
            </span>
            <button
              onClick={() => toggleInscriptions()}
              className={`text-xs font-semibold px-2 py-0.5 rounded transition cursor-pointer ${
                inscriptionsOuvertes
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
              }`}
            >
              {inscriptionsOuvertes ? "Fermer" : "Ouvrir"}
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* Actions secondaires */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Importer CSV
          </button>
          
          <button 
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter
          </button>

          <button 
            onClick={handleCopyPublicLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-slate-500" />
            Copier Lien
          </button>

          {/* Bouton Primaire Unique */}
          <Link 
            to="/athletes/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nouvel Athlète
          </Link>
        </div>
      </div>

      {/* =========================================================
          2. CARTES KPI RAPIDES
      ========================================================= */}
      <AthletesKPIs 
        totalActifs={totalActifs}
        payeCount={payeCount}
        enAttenteCount={enAttenteCount}
        autorisesAccessCount={autorisesAccessCount}
        essaiAccessCount={essaiAccessCount}
        medicalPercent={medicalPercent}
      />

      {/* =========================================================
          3. NAVIGATION PAR ONGLETS & FILTRES
      ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Sous-navigation (Tabs) */}
        <div className="flex flex-wrap items-center justify-between px-4 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setActiveTab("tous");
                setSearchParams({});
              }}
              className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "tous"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Tous les membres
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === "tous" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}>
                {totalActifs}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("attente");
                setSearchParams({ tab: 'inscriptions' });
              }}
              className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "attente"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Inscriptions en attente
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                pendingCount > 0 ? "bg-amber-500 text-slate-950" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("archives");
                setSearchParams({ tab: 'archives' });
                fetchArchivedAthletes();
              }}
              className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === "archives"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Archives / Anciens
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                {archivedAthletes.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 pb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Link to="/assurances" className="hover:text-blue-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Assurances
            </Link>
            <span>•</span>
            <a href="/inscription" target="_blank" rel="noreferrer" className="hover:text-blue-600 flex items-center gap-1">
              Formulaire Public <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* CONTENU SELON L'ONGLET ACTIF */}
        {activeTab === 'attente' ? (
          <div className="p-4">
            <PendingInscriptions embedded={true} />
          </div>
        ) : activeTab === 'archives' ? (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Membres Archivés</h3>
                <p className="text-xs text-slate-500">Ces athlètes n'ont plus accès au pointage. Vous pouvez les restaurer d'un simple clic.</p>
              </div>
              <Link to="/archives" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                Module complet Archives <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {loadingArchived ? (
              <div className="p-8 text-center text-sm text-slate-500">Chargement des archives...</div>
            ) : archivedAthletes.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Aucun athlète dans les archives.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-4">Membre</th>
                      <th className="py-2.5 px-4">Groupe</th>
                      <th className="py-2.5 px-4">Date Inscription</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {archivedAthletes.map(arch => (
                      <tr key={arch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold">{arch.nom} {arch.prenom}</td>
                        <td className="py-3 px-4">{arch.groupes?.nom || arch.groupe || '-'}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {arch.date_inscription ? new Date(arch.date_inscription).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setAthleteToRestore(arch)}
                            className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                          >
                            Réactiver le membre
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Barre de Recherche & Filtres */}
            <AthletesFilterBar 
              search={search}
              setSearch={setSearch}
              groupFilter={groupFilter}
              setGroupFilter={setGroupFilter}
              cotisationFilter={cotisationFilter}
              setCotisationFilter={setCotisationFilter}
              accessFilter={accessFilter}
              setAccessFilter={setAccessFilter}
              genderFilter={genderFilter}
              setGenderFilter={setGenderFilter}
              groupes={groupes}
            />

            {/* BANDEAU D'ACTIONS GROUPÉES */}
            {selectedAthletes.length > 0 && (
              <div className="p-3 px-4 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">
                    {selectedAthletes.length} membre(s) sélectionné(s)
                  </span>
                  <button 
                    onClick={() => setSelectedAthletes([])}
                    className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Désélectionner tout
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => setShowBulkGroupModal(true)}
                    className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 transition cursor-pointer"
                  >
                    Changer groupe
                  </button>
                  <button 
                    onClick={() => setShowBulkCotisModal(true)}
                    className="px-2.5 py-1.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Valider cotisation
                  </button>
                  <button 
                    onClick={() => handleExportBadgeSheet()}
                    className="px-2.5 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Planche Badges CR80
                  </button>
                  <button 
                    onClick={() => setShowBulkMessageModal(true)}
                    className="px-2.5 py-1.5 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> Message Groupé
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                4. TABLEAU DES ATHLÈTES
            ========================================================= */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input 
                        type="checkbox" 
                        checked={paginatedAthletes.length > 0 && selectedAthletes.length === paginatedAthletes.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                      />
                    </th>
                    <th className="py-3.5 px-4">Membre & Dossier</th>
                    <th className="py-3.5 px-4">Profil Sportif</th>
                    <th className="py-3.5 px-4">Cotisation</th>
                    <th className="py-3.5 px-4">Assiduité (Séances)</th>
                    <th className="py-3.5 px-4">Smart Access</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        Chargement des nageurs...
                      </td>
                    </tr>
                  ) : filteredAthletes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        Aucun membre trouvé correspondant aux filtres.
                      </td>
                    </tr>
                  ) : (
                    paginatedAthletes.map((athlete) => (
                      <AthleteTableRow
                        key={athlete.id}
                        athlete={athlete}
                        isSelected={selectedAthletes.includes(athlete.id)}
                        onToggleSelect={toggleSelectAthlete}
                        siblingInfo={siblingMap.get(athlete.id)}
                        onToggleMedicalCert={toggleMedicalCert}
                        onOpenSmartAccess={(a) => setSmartAccessModalAthlete(a)}
                        onOpenChronos={(a) => setPerformanceAthlete(a)}
                        onOpenBadge={(a) => setSelectedAthleteForBadge(a)}
                        activeMenuId={activeMenuAthleteId}
                        setActiveMenuId={setActiveMenuAthleteId}
                        onArchive={(a) => setAthleteToArchive(a)}
                        onDownloadPdfForm={handleDownloadPdfForm}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Barre de pagination professionnelle */}
            {filteredAthletes.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/20 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Affichage</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                  >
                    <option value={15}>15 par page</option>
                    <option value={25}>25 par page</option>
                    <option value={50}>50 par page</option>
                    <option value={100}>100 par page</option>
                    <option value={-1}>Tous ({filteredAthletes.length})</option>
                  </select>
                  <span>
                    • <strong className="text-slate-700 dark:text-slate-200">{startIndex}</strong> à <strong className="text-slate-700 dark:text-slate-200">{endIndex}</strong> sur <strong className="text-slate-700 dark:text-slate-200">{filteredAthletes.length}</strong> membre{filteredAthletes.length > 1 ? 's' : ''}
                  </span>
                </div>

                {itemsPerPage !== -1 && totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                      title="Première page"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                      title="Page précédente"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-3 py-1 font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg">
                      Page {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                      title="Page suivante"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                      title="Dernière page"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* =========================================================
          5. MODALES INTERACTIVES
      ========================================================= */}

      {/* MODALE BADGE INDIVIDUEL */}
      {selectedAthleteForBadge && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full relative shadow-2xl">
            <button 
              onClick={() => setSelectedAthleteForBadge(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white mb-4 text-center">Badge d'Accès Officiel</h2>
            <BadgeGenerator athlete={selectedAthleteForBadge} />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => setSelectedAthleteForBadge(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition cursor-pointer"
              >
                Fermer
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimer le Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CHRONOS & PERFORMANCES */}
      {performanceAthlete && (
        <AthletePerformancesModal
          athlete={performanceAthlete}
          onClose={() => setPerformanceAthlete(null)}
        />
      )}

      {/* MODALES D'ACTIONS EN MASSE */}
      <BulkGroupModal
        isOpen={showBulkGroupModal}
        onClose={() => setShowBulkGroupModal(false)}
        selectedAthletes={selectedAthletes}
        groupes={groupes}
        onComplete={() => {
          setSelectedAthletes([]);
          fetchAthletes();
        }}
      />

      <BulkCotisationModal
        isOpen={showBulkCotisModal}
        onClose={() => setShowBulkCotisModal(false)}
        selectedAthletes={selectedAthletes}
        onComplete={() => {
          setSelectedAthletes([]);
          fetchAthletes();
        }}
      />

      <BulkMessageModal
        isOpen={showBulkMessageModal}
        onClose={() => setShowBulkMessageModal(false)}
        selectedAthletes={selectedAthletes}
        athletes={athletes}
      />

      {/* MODALE CHANGEMENT SMART ACCESS */}
      <SmartAccessModal
        athlete={smartAccessModalAthlete}
        onClose={() => setSmartAccessModalAthlete(null)}
        onApply={updateSmartAccess}
      />

      {/* MODALE DE CONFIRMATION D'ARCHIVAGE */}
      <ConfirmModal
        isOpen={Boolean(athleteToArchive)}
        title="Archiver ce membre"
        message={`Êtes-vous sûr de vouloir archiver ${athleteToArchive?.nom} ${athleteToArchive?.prenom} ? Il n'apparaîtra plus dans les listes actives mais restera conservé dans l'onglet Archives.`}
        confirmText="Archiver le membre"
        cancelText="Annuler"
        confirmVariant="danger"
        icon={Trash2}
        onConfirm={async () => {
          if (athleteToArchive) {
            await archiveAthlete(athleteToArchive.id);
            setAthleteToArchive(null);
          }
        }}
        onCancel={() => setAthleteToArchive(null)}
      />

      {/* MODALE DE CONFIRMATION DE RESTAURATION */}
      <ConfirmModal
        isOpen={Boolean(athleteToRestore)}
        title="Réactiver ce membre"
        message={`Confirmer la réactivation de ${athleteToRestore?.nom} ${athleteToRestore?.prenom} dans l'annuaire actif ? Son accès au club sera rétabli.`}
        confirmText="Réactiver le membre"
        cancelText="Annuler"
        confirmVariant="primary"
        icon={RotateCcw}
        onConfirm={async () => {
          if (athleteToRestore) {
            await restoreAthlete(athleteToRestore.id);
            setAthleteToRestore(null);
            fetchAthletes();
            fetchArchivedAthletes();
          }
        }}
        onCancel={() => setAthleteToRestore(null)}
      />

    </div>
  );
}

export { AthletesList as AthletesAdminPro };
