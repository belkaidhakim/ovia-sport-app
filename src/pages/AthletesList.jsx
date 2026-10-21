import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, Upload, Download, Link2, ShieldCheck, Plus, Users, 
  CreditCard, Zap, Timer, MoreVertical, CheckCircle2, Clock, 
  Phone, QrCode, ExternalLink,
  Edit, Printer, Trash2, Mail, MessageSquare,
  Check, RotateCcw, X, FileText, ChevronDown
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
import { useRegistrationSettings } from '../hooks/useRegistrationSettings';
import PendingInscriptions from './PendingInscriptions';

// Utilitaires de statut & calculs
const getAgeAndCategory = (dateNaissance, sexe = null) => {
  if (!dateNaissance) return { age: null, category: 'N/A', dateStr: '-' };
  const birth = new Date(dateNaissance);
  if (isNaN(birth.getTime())) return { age: null, category: 'N/A', dateStr: '-' };
  
  const cat = getSwimmingCategory(dateNaissance, sexe);
  return { 
    age: cat.age, 
    category: cat.simpleName, 
    catBadge: cat.catBadge,
    fanaCategory: cat.fanaCategory, 
    dateStr: birth.toLocaleDateString('fr-FR') 
  };
};

const getCotisationStatus = (cotisationsArr, cardStatut) => {
  if (!cotisationsArr || cotisationsArr.length === 0) {
    return { type: 'pending', label: 'En attente' };
  }
  const sorted = [...cotisationsArr].sort((a, b) => new Date(b.periode_couverte_fin) - new Date(a.periode_couverte_fin));
  const latest = sorted[0];
  const endDate = new Date(latest.periode_couverte_fin);
  const now = new Date();

  const monthNames = ['Janv', 'Fév', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const monthName = monthNames[endDate.getMonth()];

  if (endDate < now || cardStatut === 'EXPIREE' || cardStatut === 'SUSPENDUE') {
    return { type: 'expired', label: `Expiré (${monthName})` };
  } else {
    return { type: 'paid', label: `Payé (${monthName})` };
  }
};

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
      label: 'Accès Bloqué',
      sublabel: 'Carte suspendue',
      variant: 'danger'
    };
  }

  if (presencesCount >= 8) {
    return {
      code: 'BLOQUE',
      label: 'Accès Bloqué',
      sublabel: 'Quota 8/8 épuisé',
      variant: 'danger'
    };
  }

  if (isCotisPaid) {
    return {
      code: 'AUTORISE',
      label: 'Accès Autorisé',
      sublabel: `${Math.max(0, 8 - presencesCount)} séance(s) rest.`,
      variant: 'success'
    };
  }

  if (presencesCount <= 2) {
    return {
      code: 'TOLERANCE',
      label: `Tolérance Essai (${presencesCount}/2)`,
      sublabel: 'Période d\'essai',
      variant: 'warning'
    };
  }

  return {
    code: 'BLOQUE',
    label: 'Accès Bloqué',
    sublabel: 'Cotis. impayée',
    variant: 'danger'
  };
};

export default function AthletesList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Données de base
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

  // Filtres
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [cotisationFilter, setCotisationFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Sélections & Actions groupées
  const [selectedAthletes, setSelectedAthletes] = useState([]);
  const [showBulkGroupModal, setShowBulkGroupModal] = useState(false);
  const [selectedBulkGroup, setSelectedBulkGroup] = useState('');
  const [showBulkCotisModal, setShowBulkCotisModal] = useState(false);
  const [bulkCotisMontant, setBulkCotisMontant] = useState(3000);
  const [bulkCotisMode, setBulkCotisMode] = useState('Espèces');
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [messageBody, setMessageBody] = useState('');

  // Modales
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [performanceAthlete, setPerformanceAthlete] = useState(null);
  const [activeMenuAthleteId, setActiveMenuAthleteId] = useState(null);

  // Modale de changement manuel Smart Access
  const [smartAccessModalAthlete, setSmartAccessModalAthlete] = useState(null);
  const [smartAccessTargetAction, setSmartAccessTargetAction] = useState('AUTORISE');
  const [smartAccessProlongCotis, setSmartAccessProlongCotis] = useState(false);
  const [smartAccessResetQuota, setSmartAccessResetQuota] = useState(false);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);

  const handleApplySmartAccess = async () => {
    if (!smartAccessModalAthlete) return;
    setIsUpdatingAccess(true);
    await updateSmartAccess(smartAccessModalAthlete.id, smartAccessTargetAction, {
      addCotisation: smartAccessProlongCotis,
      resetPresences: smartAccessResetQuota,
      adjustPresences: true
    });
    setIsUpdatingAccess(false);
    setSmartAccessModalAthlete(null);
  };

  const fileInputRef = useRef(null);

  // Détection des fratries
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
  }, [activeTab]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  // Fermer le menu d'action en cliquant ailleurs
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
            const { error } = await supabase
              .from('athletes')
              .insert([{
                nom: row.nom,
                prenom: row.prenom,
                sexe: row.sexe || null,
                groupe: row.groupe || null,
                telephone: row.telephone || null,
                date_naissance: date_naissance,
                lieu_naissance: (row.lieu_naissance || row['Lieu de Naissance'] || row['lieu_de_naissance'] || row['Lieu'] || row['lieu'] || '').trim() || null,
                token_qr
              }]);
              
            if (!error) importedCount++;
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

  // Filtrage combiné
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

  // Statistiques KPI Directeur Sportif
  const totalActifs = athletes.length;
  const payeCount = athletes.filter(a => getCotisationStatus(a.cotisations, a.cartes_acces?.statut).type === 'paid').length;
  const enAttenteCount = totalActifs - payeCount;
  const autorisesAccessCount = athletes.filter(a => getSmartAccess(a).code === 'AUTORISE').length;
  const essaiAccessCount = athletes.filter(a => getSmartAccess(a).code === 'TOLERANCE').length;
  const medicalCount = athletes.filter(a => a.certificat_medical_valide).length;
  const medicalPercent = totalActifs > 0 ? Math.round((medicalCount / totalActifs) * 100) : 0;

  // Gestion de la sélection par case à cocher
  const toggleSelectAll = () => {
    if (selectedAthletes.length === filteredAthletes.length) {
      setSelectedAthletes([]);
    } else {
      setSelectedAthletes(filteredAthletes.map(a => a.id));
    }
  };

  const toggleSelectAthlete = (id) => {
    setSelectedAthletes(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
          1. EN-TÊTE EXÉCUTIF (1 SEULE LIGNE)
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
          <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Importer CSV
          </button>
          
          <button 
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter
          </button>

          <button 
            onClick={handleCopyPublicLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-slate-500" />
            Copier Lien
          </button>

          {/* Bouton Primaire Unique */}
          <Link 
            to="/athletes/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nouvel Athlète
          </Link>
        </div>
      </div>

      {/* =========================================================
          2. CARTES KPI RAPIDES (VUE DIRECTEUR SPORTIF)
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Effectif */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Effectif Total</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalActifs} <span className="text-xs font-normal text-slate-500">nageurs</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Cotisations */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cotisations à jour</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {payeCount} / {totalActifs}{" "}
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                ({enAttenteCount} en attente)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Smart Access */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Smart Access (Bassin)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {autorisesAccessCount}{" "}
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                ({essaiAccessCount} en période d'essai)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Dossiers Médicaux */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dossiers Médicaux</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {medicalPercent}% <span className="text-xs font-normal text-slate-500">Conformes</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* =========================================================
          3. NAVIGATION PAR ONGLETS + FILTRES SUR UNE SEULE LIGNE
      ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Sous-navigation (Tabs + Raccourcis) */}
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
                            onClick={() => restoreAthlete(arch.id)}
                            className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
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
            {/* Barre de Recherche & Filtres alignés horizontalement */}
            <div className="p-3.5 flex flex-col lg:flex-row items-center gap-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un nageur par nom, prénom, téléphone, groupe..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
                <select 
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="">Tous les groupes</option>
                  {groupes.map(g => (
                    <option key={g.id} value={g.nom}>{g.nom}</option>
                  ))}
                </select>

                <select 
                  value={cotisationFilter}
                  onChange={(e) => setCotisationFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="">Toutes cotisations</option>
                  <option value="paye">À jour (Payé)</option>
                  <option value="attente">En attente</option>
                  <option value="epuise">Quota épuisé (8/8)</option>
                </select>

                <select 
                  value={accessFilter}
                  onChange={(e) => setAccessFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="">Tous accès</option>
                  <option value="autorise">Autorisé</option>
                  <option value="essai">Tolérance / Essai</option>
                  <option value="bloque">Bloqué</option>
                </select>

                <select 
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 focus:border-blue-600 outline-none cursor-pointer"
                >
                  <option value="">Tous sexes</option>
                  <option value="M">Masculin (M)</option>
                  <option value="F">Féminin (F)</option>
                </select>
              </div>
            </div>

            {/* BANDEAU D'ACTIONS GROUPÉES QUAND DES CASES SONT COCHÉES */}
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
                    className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold hover:bg-slate-100 transition"
                  >
                    Changer groupe
                  </button>
                  <button 
                    onClick={() => setShowBulkCotisModal(true)}
                    className="px-2.5 py-1.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                  >
                    Valider cotisation
                  </button>
                  <button 
                    onClick={() => handleExportBadgeSheet()}
                    className="px-2.5 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Planche Badges CR80
                  </button>
                  <button 
                    onClick={() => setShowBulkMessageModal(true)}
                    className="px-2.5 py-1.5 rounded bg-purple-600 text-white font-bold hover:bg-purple-700 transition flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" /> Message Groupé
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================
                4. TABLEAU DES ATHLÈTES (DATA GRID PRO)
            ========================================================= */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedAthletes.length > 0 && selectedAthletes.length === filteredAthletes.length}
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
                    filteredAthletes.map((athlete) => {
                      const initiales = `${(athlete.nom?.[0] || '').toUpperCase()}${(athlete.prenom?.[0] || '').toUpperCase()}`;
                      const seancesEffectuees = Array.isArray(athlete.presences) ? athlete.presences.length : 0;
                      const seancesMax = 8;
                      const pourcentageSeances = Math.min(100, Math.round((seancesEffectuees / seancesMax) * 100));

                      const { age, dateStr } = getAgeAndCategory(athlete.date_naissance, athlete.sexe);
                      const swimCat = getSwimmingCategory(athlete);
                      const cotisInfo = getCotisationStatus(athlete.cotisations, athlete.cartes_acces?.statut);
                      const smartAccess = getSmartAccess(athlete);
                      const siblingInfo = siblingMap.get(athlete.id);
                      const isSelected = selectedAthletes.includes(athlete.id);

                      return (
                        <tr
                          key={athlete.id}
                          className={`transition-colors group ${
                            isSelected 
                              ? 'bg-blue-50/50 dark:bg-blue-950/20' 
                              : 'hover:bg-blue-50/30 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 pl-4 pr-2 align-middle">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectAthlete(athlete.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* 1. Membre & Dossier */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-athlete-drawer', { detail: athlete }))}
                                title="Ouvrir la fiche rapide latérale"
                                className="cursor-pointer hover:scale-105 transition shrink-0 bg-transparent border-none p-0"
                              >
                                {athlete.photo ? (
                                  <img 
                                    src={athlete.photo} 
                                    alt={athlete.prenom} 
                                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-700"
                                  />
                                ) : (
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 border ${
                                      athlete.sexe === "F"
                                        ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800"
                                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                    }`}
                                  >
                                    {initiales || 'OS'}
                                  </div>
                                )}
                              </button>

                              <div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-athlete-drawer', { detail: athlete }))}
                                    className="font-black text-slate-900 dark:text-white hover:text-blue-600 transition text-left cursor-pointer bg-transparent border-none p-0"
                                  >
                                    {athlete.nom?.toUpperCase()} {athlete.prenom}
                                  </button>
                                  
                                  {/* Certificat Médical Toggle rapide */}
                                  <button
                                    onClick={() => toggleMedicalCert(athlete.id, athlete.certificat_medical_valide)}
                                    title={athlete.certificat_medical_valide ? "Certificat Médical Conforme (Cliquer pour désactiver)" : "Certificat Médical Manquant (Cliquer pour valider)"}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition ${
                                      athlete.certificat_medical_valide
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:border-amber-400"
                                    }`}
                                  >
                                    <CheckCircle2 className={`w-3 h-3 ${athlete.certificat_medical_valide ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                    {athlete.certificat_medical_valide ? "Médical OK" : "Sans Certif"}
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  <a 
                                    href={`tel:${athlete.telephone}`}
                                    className="inline-flex items-center gap-1 font-medium hover:text-blue-600 transition"
                                  >
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {athlete.telephone || 'Non renseigné'}
                                  </a>

                                  {siblingInfo && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                      Fratrie ({siblingInfo.siblingIndex}e enf.{" "}
                                      <strong className="text-violet-900 dark:text-violet-200">
                                        -{siblingInfo.discountPercent}%
                                      </strong>)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Profil Sportif */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                    athlete.groupes?.nom?.toLowerCase().includes('compétition') || athlete.groupes?.nom?.toLowerCase().includes('entraînement')
                                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                      : "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                  }`}
                                >
                                  {athlete.groupes?.nom || athlete.groupe || 'Section Natation'}
                                </span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  • {swimCat.simpleName || 'CAT: -'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {age !== null ? `${age} ans` : '-'} ({dateStr}{athlete.lieu_naissance ? ` à ${athlete.lieu_naissance}` : ''})
                              </span>
                            </div>
                          </td>

                          {/* 3. Cotisation */}
                          <td className="py-3.5 px-4 align-middle">
                            {cotisInfo.type === 'paid' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                À jour (Payé)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                En attente
                              </span>
                            )}
                          </td>

                          {/* 4. Assiduité (Jauge 8 séances) */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="w-36">
                              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                                <span className="text-slate-800 dark:text-slate-200">
                                  {seancesEffectuees} / {seancesMax}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">{pourcentageSeances}%</span>
                              </div>
                              {/* 8 segments visuels */}
                              <div className="grid grid-cols-8 gap-1">
                                {Array.from({ length: seancesMax }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`h-1.5 rounded-xs transition-all ${
                                      idx < seancesEffectuees
                                        ? "bg-blue-600 dark:bg-blue-500"
                                        : "bg-slate-200 dark:bg-slate-800"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* 5. Smart Access */}
                          <td className="py-3.5 px-4 align-middle">
                            <button
                              type="button"
                              onClick={() => {
                                setSmartAccessModalAthlete(athlete);
                                setSmartAccessTargetAction(smartAccess.code === 'AUTORISE' ? 'BLOQUE' : 'AUTORISE');
                                setSmartAccessProlongCotis(false);
                                setSmartAccessResetQuota(false);
                              }}
                              className="group inline-flex items-center gap-1.5 p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
                              title="Cliquer pour changer le Smart Access de ce membre"
                            >
                              {smartAccess.code === 'AUTORISE' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 group-hover:border-emerald-400">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  Accès Autorisé
                                  <ChevronDown size={11} className="opacity-50 group-hover:opacity-100 ml-0.5" />
                                </span>
                              ) : smartAccess.code === 'TOLERANCE' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 group-hover:border-amber-400">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                  {smartAccess.label}
                                  <ChevronDown size={11} className="opacity-50 group-hover:opacity-100 ml-0.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 group-hover:border-rose-400">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  {smartAccess.label}
                                  <ChevronDown size={11} className="opacity-50 group-hover:opacity-100 ml-0.5" />
                                </span>
                              )}
                            </button>
                          </td>

                          {/* 6. Actions */}
                          <td className="py-3.5 pl-4 pr-6 align-middle text-right">
                            <div className="inline-flex items-center justify-end gap-1.5 relative">
                              <button
                                onClick={() => setPerformanceAthlete(athlete)}
                                title="Performances & Chronos"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 transition shadow-sm cursor-pointer"
                              >
                                <Timer className="w-3.5 h-3.5" />
                                Chronos
                              </button>

                              <button
                                onClick={() => setSelectedAthlete(athlete)}
                                title="Carte QR Code d'accès"
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>

                              {/* Menu 3 points */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuAthleteId(activeMenuAthleteId === athlete.id ? null : athlete.id);
                                  }}
                                  title="Plus d'actions"
                                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                                {activeMenuAthleteId === athlete.id && (
                                  <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
                                  >
                                    <button
                                      onClick={() => {
                                        setActiveMenuAthleteId(null);
                                        setSmartAccessModalAthlete(athlete);
                                        setSmartAccessTargetAction(smartAccess.code === 'AUTORISE' ? 'BLOQUE' : 'AUTORISE');
                                        setSmartAccessProlongCotis(false);
                                        setSmartAccessResetQuota(false);
                                      }}
                                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 cursor-pointer"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" /> Changer Smart Access
                                    </button>

                                    <Link 
                                      to={`/athletes/edit/${athlete.id}`}
                                      className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    >
                                      <Edit className="w-3.5 h-3.5" /> Modifier la fiche
                                    </Link>
                                    
                                    <button 
                                      onClick={async () => {
                                        setActiveMenuAthleteId(null);
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
                                      }}
                                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                    >
                                      <FileText className="w-3.5 h-3.5" /> Fiche officielle PDF
                                    </button>

                                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

                                    <button 
                                      onClick={() => {
                                        setActiveMenuAthleteId(null);
                                        if (window.confirm(`Confirmer l'archivage de ${athlete.nom} ${athlete.prenom} ?`)) {
                                          archiveAthlete(athlete.id);
                                        }
                                      }}
                                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Archiver le membre
                                    </button>
                                  </div>
                                )}
                              </div>
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
        )}

      </div>

      {/* =========================================================
          5. MODALES INTERACTIVES DU MODULE
      ========================================================= */}

      {/* MODALE BADGE INDIVIDUEL */}
      {selectedAthlete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full relative shadow-2xl">
            <button 
              onClick={() => setSelectedAthlete(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold text-white mb-4 text-center">Badge d'Accès Officiel</h2>
            <BadgeGenerator athlete={selectedAthlete} />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => setSelectedAthlete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition"
              >
                Fermer
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-blue-500/25"
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

      {/* MODALE CHANGEMENT DE GROUPE EN MASSE */}
      {showBulkGroupModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Changer le groupe d'entraînement</h3>
            <p className="text-xs text-slate-500 mb-4">
              Sélectionnez le nouveau groupe pour les <strong>{selectedAthletes.length} membres</strong> sélectionnés.
            </p>
            <select
              value={selectedBulkGroup}
              onChange={(e) => setSelectedBulkGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm mb-4"
            >
              <option value="">Sélectionner un groupe...</option>
              {groupes.map(g => (
                <option key={g.id} value={g.id}>{g.nom}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkGroupModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!selectedBulkGroup) {
                    toast.error("Veuillez sélectionner un groupe.");
                    return;
                  }
                  try {
                    const g = groupes.find(item => item.id === selectedBulkGroup);
                    const { error } = await supabase
                      .from('athletes')
                      .update({ groupe_id: selectedBulkGroup, groupe: g?.nom || null })
                      .in('id', selectedAthletes);
                    if (error) throw error;
                    toast.success("Groupes mis à jour !");
                    setShowBulkGroupModal(false);
                    setSelectedAthletes([]);
                    fetchAthletes();
                  } catch (e) {
                    toast.error("Erreur: " + e.message);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE VALIDATION COTISATION EN MASSE */}
      {showBulkCotisModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Règlement groupé des cotisations</h3>
            <p className="text-xs text-slate-500 mb-4">
              Valider la cotisation mensuelle pour les <strong>{selectedAthletes.length} membres</strong> sélectionnés.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Montant par nageur (DA) :</label>
                <input 
                  type="number" 
                  value={bulkCotisMontant}
                  onChange={(e) => setBulkCotisMontant(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mode de règlement :</label>
                <select
                  value={bulkCotisMode}
                  onChange={(e) => setBulkCotisMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                >
                  <option value="Espèces">Espèces</option>
                  <option value="Virement">Virement bancaire</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkCotisModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    const now = new Date();
                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    const records = selectedAthletes.map(athleteId => ({
                      athlete_id: athleteId,
                      montant_paye: bulkCotisMontant,
                      date_paiement: now.toISOString(),
                      periode_couverte_fin: nextMonth.toISOString(),
                      mode_paiement: bulkCotisMode
                    }));
                    const { error } = await supabase.from('cotisations').insert(records);
                    if (error) throw error;
                    toast.success(`Cotisations validées pour ${selectedAthletes.length} membres !`);
                    setShowBulkCotisModal(false);
                    setSelectedAthletes([]);
                    fetchAthletes();
                  } catch (e) {
                    toast.error("Erreur: " + e.message);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Confirmer le règlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE MESSAGE GROUPÉ */}
      {showBulkMessageModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" /> Communication Groupée
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Envoi aux <strong>{selectedAthletes.length} membres</strong> sélectionnés.
            </p>
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Message :</label>
              <textarea 
                rows={4}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Écrivez votre annonce ou consigne ici..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <button
                onClick={() => {
                  const selectedList = athletes.filter(a => selectedAthletes.includes(a.id));
                  const phones = selectedList.map(a => a.telephone).filter(Boolean).join(', ');
                  navigator.clipboard.writeText(`Numéros : ${phones}\n\n${messageBody}`);
                  toast.success("Numéros copiés dans le presse-papier !");
                }}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Copier SMS & Numéros
              </button>
              <button
                onClick={() => setShowBulkMessageModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE GESTION DU SMART ACCESS */}
      {smartAccessModalAthlete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                    Changer Smart Access
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                    Contrôle des droits d'accès au bassin & scanner QR
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSmartAccessModalAthlete(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profil de l'athlète */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white m-0">
                  {smartAccessModalAthlete.nom?.toUpperCase()} {smartAccessModalAthlete.prenom}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                  Section : {smartAccessModalAthlete.groupes?.nom || smartAccessModalAthlete.groupe || 'Générale'} • {Array.isArray(smartAccessModalAthlete.presences) ? smartAccessModalAthlete.presences.length : 0}/8 séances consommées
                </p>
              </div>
              <div>
                {(() => {
                  const sa = getSmartAccess(smartAccessModalAthlete);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      sa.code === 'AUTORISE' 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : sa.code === 'TOLERANCE'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    }`}>
                      {sa.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Choix des options Smart Access */}
            <div className="space-y-3 mb-5">
              {/* Option 1: AUTORISE */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  smartAccessTargetAction === 'AUTORISE' 
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="smart_access_action"
                  value="AUTORISE"
                  checked={smartAccessTargetAction === 'AUTORISE'}
                  onChange={() => setSmartAccessTargetAction('AUTORISE')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Autoriser l'Accès (Passage libre)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                    Active la carte d'accès. Le membre peut scanner son badge QR et entrer immédiatement.
                  </p>

                  {smartAccessTargetAction === 'AUTORISE' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smartAccessProlongCotis}
                          onChange={(e) => setSmartAccessProlongCotis(e.target.checked)}
                          className="rounded"
                        />
                        <span>Régulariser / Prolonger la cotisation (30 jours • 3 000 DA)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smartAccessResetQuota}
                          onChange={(e) => setSmartAccessResetQuota(e.target.checked)}
                          className="rounded"
                        />
                        <span>Réinitialiser les séances consommées (0/8)</span>
                      </label>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 2: TOLERANCE */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  smartAccessTargetAction === 'TOLERANCE' 
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="smart_access_action"
                  value="TOLERANCE"
                  checked={smartAccessTargetAction === 'TOLERANCE'}
                  onChange={() => setSmartAccessTargetAction('TOLERANCE')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Tolérance / Période d'Essai
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                    Autorise le passage au scanner avec avertissement jaune (séance d'essai accordée sans cotisation).
                  </p>
                </div>
              </label>

              {/* Option 3: BLOQUE */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  smartAccessTargetAction === 'BLOQUE' 
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="smart_access_action"
                  value="BLOQUE"
                  checked={smartAccessTargetAction === 'BLOQUE'}
                  onChange={() => setSmartAccessTargetAction('BLOQUE')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Bloquer l'Accès (Suspendre la carte)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                    Suspend la carte d'accès. Le scanner affichera systématiquement « ACCÈS BLOQUÉ ».
                  </p>
                </div>
              </label>

              {/* Option 4: RESET_QUOTA */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition ${
                  smartAccessTargetAction === 'RESET_QUOTA' 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="smart_access_action"
                  value="RESET_QUOTA"
                  checked={smartAccessTargetAction === 'RESET_QUOTA'}
                  onChange={() => setSmartAccessTargetAction('RESET_QUOTA')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={13} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Réinitialiser le Quota (Nouveau forfait 8 séances)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                    Remet les présences à 0 et réactive la carte pour débuter un cycle complet de 8 séances.
                  </p>
                </div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSmartAccessModalAthlete(null)}
                disabled={isUpdatingAccess}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleApplySmartAccess}
                disabled={isUpdatingAccess}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                {isUpdatingAccess ? "Application..." : "Appliquer la modification"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export { AthletesList as AthletesAdminPro };
