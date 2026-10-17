import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Users, 
  MessageSquare, 
  Calendar, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  CheckSquare, 
  Square, 
  ExternalLink,
  Phone,
  RefreshCw,
  X,
  UserPlus,
  UserMinus,
  UserCheck,
  Check,
  Building2,
  History,
  Send,
  Award,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { Card, StatCard, Button, Badge, Skeleton } from '../components/ui';
import { useAthletes } from '../hooks/useAthletes';
import { useGroupes } from '../hooks/useGroupes';
import { 
  useAssurances, 
  COMPAGNIES_ASSURANCE, 
  TYPES_COUVERTURE, 
  calculateInsuranceStatus 
} from '../hooks/useAssurances';
import { 
  generateBordereauCollectifPdf, 
  generateAttestationAssurancePdf,
  generateBordereauFederalFanPdf
} from '../utils/insurancePdfGenerator';
import { formatDA, formatWhatsAppPhone } from '../utils/formatters';
import InsuranceWhatsAppModal from '../components/InsuranceWhatsAppModal';
import InsuranceOcrModal from '../components/InsuranceOcrModal';
import InsurancePartnersModal from '../components/InsurancePartnersModal';
import InsuranceAuditModal, { logInsuranceAction } from '../components/InsuranceAuditModal';

export default function InsuranceManagement() {
  const { athletes, loading: loadingAthletes, fetchAthletes } = useAthletes();
  const { groupes } = useGroupes();
  const { 
    assurances, 
    loading: loadingAssurances, 
    isTableMissing, 
    saveAssurance, 
    batchSouscrire, 
    deleteAssurance,
    batchDeleteAssurances,
    removeAthleteFromInsurance,
    quickInsureAthlete,
    getAthleteAssurance,
    sqlSetupScript,
    fetchAssurances
  } = useAssurances();

  // Chargement automatique des athlètes actifs au montage (exclut les archivés)
  useEffect(() => {
    fetchAthletes(false);
  }, [fetchAthletes]);

  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState('ALL'); // 'ALL' | 'INSURED' | 'NOT_INSURED'
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, A_JOUR, EXPIRE_BIENTOT, NON_ASSURE
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [compagnieFilter, setCompagnieFilter] = useState('ALL');
  const [federalCategoryFilter, setFederalCategoryFilter] = useState('ALL');
  const [urgencyFilterOnly, setUrgencyFilterOnly] = useState(false);

  // Nouveaux Modales Intelligentes
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTargetAthletes, setWhatsAppTargetAthletes] = useState([]);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Sélection multiple
  const [selectedAthleteIds, setSelectedAthleteIds] = useState([]);

  // Modales
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddAthletesModal, setShowAddAthletesModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [editingAssurance, setEditingAssurance] = useState(null);
  const [targetAthlete, setTargetAthlete] = useState(null);

  // Formulaire de la modale "Ajouter des Athlètes à la Liste"
  const [selectedForAdd, setSelectedForAdd] = useState([]);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalGroupFilter, setModalGroupFilter] = useState('ALL');
  const [addModalForm, setAddModalForm] = useState({
    compagnie: 'SAA (Société Nationale d\'Assurance)',
    numero_police: `POL-ASSUR-${new Date().getFullYear()}`,
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type_couverture: 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
    montant: 1500,
    notes: 'Ajout à la liste d\'assurance club'
  });

  // Formulaire d'assurance individuelle
  const [singleForm, setSingleForm] = useState({
    athlete_id: '',
    compagnie: 'SAA (Société Nationale d\'Assurance)',
    numero_police: '',
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type_couverture: 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
    montant: 1500,
    notes: ''
  });

  // Formulaire de souscription groupée
  const [batchForm, setBatchForm] = useState({
    targetType: 'selected', // 'selected' | 'group'
    targetGroupId: '',
    compagnie: 'SAA (Société Nationale d\'Assurance)',
    numero_police: `POL-COLL-${new Date().getFullYear()}`,
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type_couverture: 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
    montant: 1500,
    notes: 'Souscription collective saison 2026/2027'
  });

  // Modal & Formulaire Bordereau Collectif
  const [showBordereauModal, setShowBordereauModal] = useState(false);
  const [bordereauForm, setBordereauForm] = useState({
    targetType: 'non_assures', // 'non_assures' | 'selected' | 'group' | 'all'
    targetGroupId: '',
    compagnie: 'SAA (Société Nationale d\'Assurance)',
    numero_police: `BORD-OVIA-${new Date().getFullYear()}/01`,
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type_couverture: 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
    montant: 1500,
    autoEnregistrer: false
  });

  // Calcul automatique de la catégorie d'âge sportive fédérale (FAN)
  const getAthleteFederalCategory = (dateNaissance) => {
    if (!dateNaissance) return { age: null, label: 'Seniors (18+ ans)', code: 'SENIORS' };
    const birthYear = new Date(dateNaissance).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    if (age <= 7) return { age, label: 'École (<8 ans)', code: 'ECOLE' };
    if (age <= 9) return { age, label: 'Poussins (9-10 ans)', code: 'POUSSINS' };
    if (age <= 11) return { age, label: 'Benjamins (11-12 ans)', code: 'BENJAMINS' };
    if (age <= 13) return { age, label: 'Minimes (13-14 ans)', code: 'MINIMES' };
    if (age <= 15) return { age, label: 'Cadets (15-16 ans)', code: 'CADETS' };
    if (age <= 17) return { age, label: 'Juniors (17-18 ans)', code: 'JUNIORS' };
    return { age, label: 'Seniors (18+ ans)', code: 'SENIORS' };
  };

  // Fusionner chaque athlète ACTIF avec son assurance active & catégorie fédérale
  const enrichedAthletes = useMemo(() => {
    return athletes
      .filter(ath => ath.est_actif !== false)
      .map(ath => {
        const assurance = getAthleteAssurance(ath.id);
        const statusInfo = calculateInsuranceStatus(assurance);
        const federalCategory = getAthleteFederalCategory(ath.date_naissance);
        return {
          ...ath,
          assurance,
          insuranceStatus: statusInfo,
          federalCategory
        };
      });
  }, [athletes, getAthleteAssurance]);

  // Filtrage combiné (recherche, statut, groupe, compagnie, catégorie fédérale, urgence)
  const filteredAthletes = useMemo(() => {
    return enrichedAthletes.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const nom = (item.nom || '').toLowerCase();
      const prenom = (item.prenom || '').toLowerCase();
      const police = (item.assurance?.numero_police || '').toLowerCase();
      const matchesSearch = !q || nom.includes(q) || prenom.includes(q) || police.includes(q);

      // Filtre d'onglet Vue de la Liste
      const matchesTab = 
        viewTab === 'ALL' ||
        (viewTab === 'INSURED' && (item.insuranceStatus.code === 'A_JOUR' || item.insuranceStatus.code === 'EXPIRE_BIENTOT')) ||
        (viewTab === 'NOT_INSURED' && (item.insuranceStatus.code === 'NON_ASSURE' || item.insuranceStatus.code === 'EXPIREE'));

      const matchesStatus = 
        statusFilter === 'ALL' || 
        (statusFilter === 'A_JOUR' && item.insuranceStatus.code === 'A_JOUR') ||
        (statusFilter === 'EXPIRE_BIENTOT' && item.insuranceStatus.code === 'EXPIRE_BIENTOT') ||
        (statusFilter === 'NON_ASSURE' && (item.insuranceStatus.code === 'NON_ASSURE' || item.insuranceStatus.code === 'EXPIREE'));

      const grpId = item.groupe_id ? String(item.groupe_id) : (item.groupes?.id ? String(item.groupes.id) : '');
      const grpNom = (item.groupes?.nom || item.groupe || '').toLowerCase();
      const matchesGroup = 
        groupFilter === 'ALL' || 
        grpId === String(groupFilter) || 
        grpNom.includes(groupFilter.toLowerCase());

      const comp = item.assurance?.compagnie || '';
      const matchesCompagnie = compagnieFilter === 'ALL' || comp === compagnieFilter;

      const matchesFederalCategory = federalCategoryFilter === 'ALL' || item.federalCategory.code === federalCategoryFilter;

      const matchesUrgency = !urgencyFilterOnly || 
        item.insuranceStatus.code === 'NON_ASSURE' || 
        item.insuranceStatus.code === 'EXPIREE' || 
        (item.insuranceStatus.code === 'EXPIRE_BIENTOT' && (item.insuranceStatus.daysLeft <= 15));

      return matchesSearch && matchesTab && matchesStatus && matchesGroup && matchesCompagnie && matchesFederalCategory && matchesUrgency;
    });
  }, [enrichedAthletes, searchQuery, viewTab, statusFilter, groupFilter, compagnieFilter, federalCategoryFilter, urgencyFilterOnly]);

  // Métriques & KPIs
  const stats = useMemo(() => {
    const total = enrichedAthletes.length;
    const aJour = enrichedAthletes.filter(a => a.insuranceStatus.code === 'A_JOUR').length;
    const expireBientot = enrichedAthletes.filter(a => a.insuranceStatus.code === 'EXPIRE_BIENTOT').length;
    const nonAssure = enrichedAthletes.filter(a => a.insuranceStatus.code === 'NON_ASSURE' || a.insuranceStatus.code === 'EXPIREE').length;
    const tauxConformite = total > 0 ? Math.round(((aJour + expireBientot) / total) * 100) : 0;
    
    // Total des primes enregistrées
    const totalPrimes = assurances.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0);

    return { total, aJour, expireBientot, nonAssure, tauxConformite, totalPrimes };
  }, [enrichedAthletes, assurances]);

  // Athlètes candidats à l'ajout dans la liste d'assurance (non assurés ou expirés)
  const modalCandidateAthletes = useMemo(() => {
    return enrichedAthletes.filter(ath => {
      const isCandidate = ath.insuranceStatus.code === 'NON_ASSURE' || ath.insuranceStatus.code === 'EXPIREE';
      if (!isCandidate) return false;

      const q = modalSearchQuery.toLowerCase().trim();
      const nom = (ath.nom || '').toLowerCase();
      const prenom = (ath.prenom || '').toLowerCase();
      const matchesSearch = !q || nom.includes(q) || prenom.includes(q);

      const grpId = ath.groupe_id ? String(ath.groupe_id) : (ath.groupes?.id ? String(ath.groupes.id) : '');
      const matchesGroup = modalGroupFilter === 'ALL' || grpId === String(modalGroupFilter);

      return matchesSearch && matchesGroup;
    });
  }, [enrichedAthletes, modalSearchQuery, modalGroupFilter]);

  // Gestion des sélections multiples
  const handleToggleSelectAll = () => {
    if (selectedAthleteIds.length === filteredAthletes.length) {
      setSelectedAthleteIds([]);
    } else {
      setSelectedAthleteIds(filteredAthletes.map(a => a.id));
    }
  };

  const handleToggleSelectAthlete = (id) => {
    setSelectedAthleteIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Ouvrir modal individuel pour un athlète
  const handleOpenSingleModal = (athlete = null) => {
    if (athlete) {
      setTargetAthlete(athlete);
      const existing = athlete.assurance;
      setEditingAssurance(existing);
      setSingleForm({
        athlete_id: athlete.id,
        compagnie: existing?.compagnie || 'SAA (Société Nationale d\'Assurance)',
        numero_police: existing?.numero_police || `POL-${athlete.nom?.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        date_debut: existing?.date_debut || new Date().toISOString().split('T')[0],
        date_fin: existing?.date_fin || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type_couverture: existing?.type_couverture || 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
        montant: existing?.montant !== undefined ? existing.montant : 1500,
        notes: existing?.notes || ''
      });
    } else {
      setTargetAthlete(null);
      setEditingAssurance(null);
      setSingleForm({
        athlete_id: enrichedAthletes[0]?.id || '',
        compagnie: 'SAA (Société Nationale d\'Assurance)',
        numero_police: `POL-${Date.now().toString().slice(-6)}`,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type_couverture: 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
        montant: 1500,
        notes: ''
      });
    }
    setShowSingleModal(true);
  };

  // Enregistrer assurance individuelle
  const handleSubmitSingleForm = async (e) => {
    e.preventDefault();
    if (!singleForm.athlete_id) {
      toast.error('Veuillez sélectionner un athlète.');
      return;
    }
    if (!singleForm.numero_police?.trim()) {
      toast.error('Veuillez indiquer un numéro de police d\'assurance.');
      return;
    }

    await saveAssurance({
      ...(editingAssurance ? { id: editingAssurance.id } : {}),
      athlete_id: singleForm.athlete_id,
      compagnie: singleForm.compagnie,
      numero_police: singleForm.numero_police.trim(),
      date_debut: singleForm.date_debut,
      date_fin: singleForm.date_fin,
      type_couverture: singleForm.type_couverture,
      montant: Number(singleForm.montant) || 0,
      notes: singleForm.notes || ''
    });

    setShowSingleModal(false);
  };

  // Soumission souscription groupée
  const handleSubmitBatchForm = async (e) => {
    e.preventDefault();
    let targetIds = [];

    if (batchForm.targetType === 'selected') {
      targetIds = selectedAthleteIds;
      if (!targetIds.length) {
        toast.error('Aucun athlète sélectionné avec les cases à cocher.');
        return;
      }
    } else {
      if (!batchForm.targetGroupId) {
        toast.error('Veuillez choisir un groupe cible.');
        return;
      }
      targetIds = enrichedAthletes
        .filter(a => String(a.groupe_id) === String(batchForm.targetGroupId) || a.groupes?.id === batchForm.targetGroupId)
        .map(a => a.id);

      if (!targetIds.length) {
        toast.error('Aucun athlète actif trouvé dans ce groupe.');
        return;
      }
    }

    const success = await batchSouscrire(targetIds, {
      compagnie: batchForm.compagnie,
      numero_police: batchForm.numero_police,
      date_debut: batchForm.date_debut,
      date_fin: batchForm.date_fin,
      type_couverture: batchForm.type_couverture,
      montant: batchForm.montant,
      notes: batchForm.notes
    });

    if (success) {
      setShowBatchModal(false);
      setSelectedAthleteIds([]);
    }
  };

  // Ouvrir la modale d'ajout d'athlètes à la liste d'assurance
  const handleOpenAddAthletesModal = () => {
    // Si des athlètes sont déjà cochés, pré-sélectionner ceux non-assurés
    if (selectedAthleteIds.length > 0) {
      const nonAssuresSelected = selectedAthleteIds.filter(id => {
        const ath = enrichedAthletes.find(a => a.id === id);
        return ath && (ath.insuranceStatus.code === 'NON_ASSURE' || ath.insuranceStatus.code === 'EXPIREE');
      });
      setSelectedForAdd(nonAssuresSelected.length > 0 ? nonAssuresSelected : selectedAthleteIds);
    } else {
      // Par défaut tous les non-assurés
      const nonAssures = enrichedAthletes
        .filter(a => a.insuranceStatus.code === 'NON_ASSURE' || a.insuranceStatus.code === 'EXPIREE')
        .map(a => a.id);
      setSelectedForAdd(nonAssures);
    }
    setModalSearchQuery('');
    setModalGroupFilter('ALL');
    setShowAddAthletesModal(true);
  };

  // Soumission de la modale d'ajout d'athlètes à la liste
  const handleSubmitAddAthletesModal = async (e) => {
    if (e) e.preventDefault();
    if (!selectedForAdd.length) {
      toast.error('Veuillez cocher au moins un athlète à ajouter à la liste d\'assurance.');
      return;
    }

    const success = await batchSouscrire(selectedForAdd, {
      compagnie: addModalForm.compagnie,
      numero_police: addModalForm.numero_police,
      date_debut: addModalForm.date_debut,
      date_fin: addModalForm.date_fin,
      type_couverture: addModalForm.type_couverture,
      montant: Number(addModalForm.montant) || 0,
      notes: addModalForm.notes
    });

    if (success) {
      setShowAddAthletesModal(false);
      setSelectedForAdd([]);
      setSelectedAthleteIds([]);
    }
  };

  // Ajout express en 1 clic pour un athlète
  const handleQuickAddAthlete = async (athlete) => {
    const toastId = toast.loading(`Ajout de ${athlete.nom} ${athlete.prenom} à l'assurance...`);
    try {
      const ok = await quickInsureAthlete(athlete);
      if (ok) {
        toast.success(`${athlete.nom} ${athlete.prenom} a été ajouté(e) à la liste d'assurance !`, { id: toastId });
      }
    } catch {
      toast.error("Erreur lors de l'ajout à l'assurance", { id: toastId });
    }
  };

  // Retirer un athlète de la liste d'assurance (supprimer la police)
  const handleRemoveAthleteFromInsurance = async (athlete) => {
    const existing = athlete.assurance || getAthleteAssurance(athlete.id);
    if (!existing) {
      toast.error(`${athlete.nom} ${athlete.prenom} n'a pas d'assurance active.`);
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous vraiment retirer ${athlete.nom} ${athlete.prenom} de la liste d'assurance ?\n\nSa police d'assurance sera supprimée et son statut passera à "Non Assuré".`
    );

    if (confirmed) {
      await deleteAssurance(existing.id);
    }
  };

  // Retirer la sélection de la liste d'assurance (suppression groupée)
  const handleBatchDeleteSelected = async () => {
    if (!selectedAthleteIds.length) return;
    const insuredSelected = selectedAthleteIds.filter(id => !!getAthleteAssurance(id));

    if (!insuredSelected.length) {
      toast.error("Aucun des athlètes sélectionnés ne possède d'assurance à retirer.");
      return;
    }

    const confirmed = window.confirm(
      `Attention : Vous allez retirer ${insuredSelected.length} athlète(s) de la liste d'assurance.\n\nConfirmez-vous la suppression de leur police d'assurance ?`
    );

    if (confirmed) {
      const ok = await batchDeleteAssurances(insuredSelected);
      if (ok) {
        setSelectedAthleteIds([]);
      }
    }
  };

  // Ouvrir modal de configuration du bordereau
  const handleOpenBordereauModal = (preferredTarget = null) => {
    setBordereauForm(prev => ({
      ...prev,
      targetType: preferredTarget || (selectedAthleteIds.length > 0 ? 'selected' : (stats.nonAssure > 0 ? 'non_assures' : 'all'))
    }));
    setShowBordereauModal(true);
  };

  // Générer Bordereau Collectif PDF (avec auto-enregistrement optionnel)
  const handleGenerateBordereau = async (e) => {
    if (e) e.preventDefault();
    let listToExport = [];

    if (bordereauForm.targetType === 'non_assures') {
      listToExport = enrichedAthletes.filter(a => a.insuranceStatus.code === 'NON_ASSURE' || a.insuranceStatus.code === 'EXPIREE');
    } else if (bordereauForm.targetType === 'selected') {
      listToExport = enrichedAthletes.filter(a => selectedAthleteIds.includes(a.id));
    } else if (bordereauForm.targetType === 'group') {
      if (!bordereauForm.targetGroupId) {
        toast.error('Veuillez sélectionner un groupe.');
        return;
      }
      listToExport = enrichedAthletes.filter(a => String(a.groupe_id) === String(bordereauForm.targetGroupId) || a.groupes?.id === bordereauForm.targetGroupId);
    } else {
      listToExport = enrichedAthletes;
    }

    if (!listToExport.length) {
      toast.error('Aucun athlète trouvé pour cette sélection.');
      return;
    }

    const toastId = toast.loading(`Génération du bordereau pour ${listToExport.length} athlète(s)...`);

    try {
      // Si l'utilisateur a choisi d'enregistrer automatiquement ces assurances :
      if (bordereauForm.autoEnregistrer) {
        await batchSouscrire(listToExport.map(a => a.id), {
          compagnie: bordereauForm.compagnie,
          numero_police: bordereauForm.numero_police,
          date_debut: bordereauForm.date_debut,
          date_fin: bordereauForm.date_fin,
          type_couverture: bordereauForm.type_couverture,
          montant: bordereauForm.montant,
          notes: 'Souscription via Bordereau Collectif'
        });
      }

      await generateBordereauCollectifPdf({
        compagnie: bordereauForm.compagnie,
        numeroPolice: bordereauForm.numero_police,
        dateDebut: bordereauForm.date_debut,
        dateFin: bordereauForm.date_fin,
        typeCouverture: bordereauForm.type_couverture,
        athletes: listToExport
      });

      toast.success(`Bordereau d'assurance généré (${listToExport.length} athlètes) !`, { id: toastId });
      setShowBordereauModal(false);
      setSelectedAthleteIds([]);
    } catch (err) {
      toast.error('Erreur lors de la génération du bordereau PDF', { id: toastId });
    }
  };

  // Générer Attestation Individuelle PDF
  const handleDownloadAttestation = async (athlete) => {
    const toastId = toast.loading(`Génération de l'attestation pour ${athlete.nom}...`);
    try {
      await generateAttestationAssurancePdf({
        athlete,
        assurance: athlete.assurance || {
          compagnie: 'SAA (Société Nationale d\'Assurance)',
          numero_police: 'POL-EN-COURS-2026',
          date_debut: new Date().toISOString().split('T')[0],
          date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type_couverture: 'Responsabilité Civile & Individuelle Accident'
        }
      });
      toast.success('Attestation d\'assurance téléchargée !', { id: toastId });
    } catch {
      toast.error('Erreur lors de la génération de l\'attestation', { id: toastId });
    }
  };

  // Centre de relances WhatsApp & SMS automatisées
  const handleOpenWhatsAppModal = (targetList = null) => {
    if (targetList && targetList.length > 0) {
      setWhatsAppTargetAthletes(targetList);
    } else if (selectedAthleteIds.length > 0) {
      setWhatsAppTargetAthletes(enrichedAthletes.filter(a => selectedAthleteIds.includes(a.id)));
    } else {
      const nonAssures = enrichedAthletes.filter(a => a.insuranceStatus.code === 'NON_ASSURE' || a.insuranceStatus.code === 'EXPIREE');
      setWhatsAppTargetAthletes(nonAssures);
    }
    setShowWhatsAppModal(true);
  };

  const handleWhatsAppReminder = (athlete) => {
    handleOpenWhatsAppModal([athlete]);
  };

  // Bordereau Fédéral FAN & DJS Bouira
  const handleGenerateBordereauFederalFan = async () => {
    const listToExport = selectedAthleteIds.length > 0
      ? enrichedAthletes.filter(a => selectedAthleteIds.includes(a.id))
      : (stats.nonAssure > 0 
          ? enrichedAthletes.filter(a => a.insuranceStatus.code === 'NON_ASSURE' || a.insuranceStatus.code === 'EXPIREE') 
          : enrichedAthletes);

    if (!listToExport.length) {
      toast.error('Aucun athlète à exporter dans le bordereau fédéral.');
      return;
    }

    const toastId = toast.loading(`Génération du Bordereau Fédéral FAN pour ${listToExport.length} athlète(s)...`);
    try {
      const activePartnerName = localStorage.getItem('ovia_active_insurance_partner_name') || 'SAA (Société Nationale d\'Assurance)';
      const activePolice = localStorage.getItem('ovia_active_insurance_partner_police') || 'CONV-FAN-OVIA-2026';

      await generateBordereauFederalFanPdf({
        compagnie: activePartnerName,
        numeroPolice: activePolice,
        saison: '2026 / 2027',
        athletes: listToExport
      });

      logInsuranceAction({
        athleteNom: `${listToExport.length} athlètes (Collectif)`,
        action: 'EXPORT_BORDEREAU',
        actionLabel: 'Génération Bordereau Officiel FAN / DJS',
        details: `Bordereau officiel FAN généré pour ${listToExport.length} athlètes`
      });

      toast.success(`Bordereau Officiel FAN téléchargé (${listToExport.length} athlètes) !`, { id: toastId });
    } catch (err) {
      toast.error('Erreur lors de la génération du bordereau fédéral', { id: toastId });
    }
  };

  // Traitement OCR intelligent
  const handleApplyOcrAssurance = async (ocrData) => {
    const toastId = toast.loading('Enregistrement de l\'assurance reconnue par OCR...');
    try {
      await saveAssurance({
        athlete_id: ocrData.athlete_id,
        compagnie: ocrData.compagnie,
        numero_police: ocrData.numero_police,
        date_debut: ocrData.date_debut,
        date_fin: ocrData.date_fin,
        type_couverture: ocrData.type_couverture,
        montant: ocrData.montant,
        notes: ocrData.notes
      });

      const ath = athletes.find(a => a.id === ocrData.athlete_id);
      logInsuranceAction({
        athleteNom: ath ? `${ath.nom} ${ath.prenom}` : 'Athlète',
        action: 'SOUSCRIPTION',
        actionLabel: 'Attestation scannée et importée par OCR',
        details: `${ocrData.compagnie} · Police ${ocrData.numero_police}`
      });

      toast.success('Assurance importée et validée avec succès !', { id: toastId });
    } catch {
      toast.error('Erreur lors de l\'enregistrement', { id: toastId });
    }
  };

  // Sélection d'un partenaire référent
  const handleSelectPartner = (partner) => {
    setSingleForm(prev => ({
      ...prev,
      compagnie: partner.nom,
      montant: partner.tarifNegocie,
      numero_police: partner.policeGroupe
    }));
    setBatchForm(prev => ({
      ...prev,
      compagnie: partner.nom,
      montant: partner.tarifNegocie,
      numero_police: partner.policeGroupe
    }));
    setAddModalForm(prev => ({
      ...prev,
      compagnie: partner.nom,
      montant: partner.tarifNegocie,
      numero_police: partner.policeGroupe
    }));
    logInsuranceAction({
      athleteNom: 'Club Ovia Sport',
      action: 'MODIFICATION',
      actionLabel: 'Changement de partenaire d\'assurance référent',
      details: `Partenaire actif défini sur ${partner.nom} (Tarif : ${partner.tarifNegocie} DA)`
    });
  };

  // Exporter en CSV / Excel
  const handleExportCsv = () => {
    const listToExport = selectedAthleteIds.length > 0
      ? enrichedAthletes.filter(a => selectedAthleteIds.includes(a.id))
      : filteredAthletes;

    const csvData = listToExport.map((ath, idx) => ({
      'N°': idx + 1,
      'Nom': (ath.nom || '').toUpperCase(),
      'Prénom': ath.prenom || '',
      'Sexe': ath.sexe || '',
      'Date de Naissance': ath.date_naissance ? new Date(ath.date_naissance).toLocaleDateString('fr-FR') : '',
      'Groupe': ath.groupes?.nom || ath.groupe || '',
      'Téléphone': ath.telephone || '',
      'Statut Assurance': ath.insuranceStatus.label,
      'Compagnie': ath.assurance?.compagnie || 'Non renseignée',
      'N° Police': ath.assurance?.numero_police || 'N/A',
      'Date Début': ath.assurance?.date_debut || '',
      'Date Fin': ath.assurance?.date_fin || '',
      'Prime (DA)': ath.assurance?.montant || 0
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Assurances_OviaSport_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fichier CSV exporté avec succès !');
  };

  return (
    <div>
      {/* EN-TÊTE PRINCIPAL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Gestion des Assurances</h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Supervision de la couverture d'assurance, conformité légale des athlètes, bordereaux collectifs et attestations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Relances Automatisées WhatsApp & SMS */}
          <button 
            type="button"
            onClick={() => handleOpenWhatsAppModal()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            title="Ouvrir le centre de relances automatisées par WhatsApp et SMS pour les non-assurés"
          >
            <Send size={14} />
            Relances WhatsApp ({stats.nonAssure})
          </button>

          {/* Scanner Intelligent OCR */}
          <button 
            type="button"
            onClick={() => setShowOcrModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-indigo-600/20 transition cursor-pointer"
            title="Glisser-déposer une attestation papier ou PDF pour reconnaissance OCR instantanée"
          >
            <Sparkles size={14} />
            Scanner OCR
          </button>

          {/* Accords Cadres & Partenaires */}
          <button 
            type="button"
            onClick={() => setShowPartnersModal(true)}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-sky-600/20 transition cursor-pointer"
            title="Gérer les conventions et tarifs négociés avec la SAA, CAAT, Macir Vie..."
          >
            <Building2 size={14} />
            Accords Cadres
          </button>

          {/* Bordereau Fédéral FAN */}
          <button 
            type="button"
            onClick={handleGenerateBordereauFederalFan}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer border border-slate-700"
            title="Générer le bordereau officiel pour la Fédération Algérienne de Natation (FAN) et la DJS"
          >
            <Award size={15} className="text-amber-400" />
            Bordereau FAN (PDF)
          </button>

          {/* Journal d'Audit & Traçabilité */}
          <button 
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Consulter l'historique de traçabilité des modifications d'assurance"
          >
            <History size={14} className="text-purple-500" />
            Audit
          </button>

          {/* Actualiser */}
          <Button 
            variant="secondary"
            onClick={() => {
              fetchAthletes(false);
              fetchAssurances();
              toast.success('Liste des athlètes et assurances actualisée !');
            }}
            title="Recharger la liste des athlètes et des assurances"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} className={loadingAthletes || loadingAssurances ? 'animate-spin' : ''} />
          </Button>

          {/* Bouton Ajouter à la Liste */}
          <Button 
            variant="primary"
            onClick={handleOpenAddAthletesModal}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              backgroundColor: '#10b981',
              borderColor: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.78rem',
              padding: '0.45rem 0.85rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
            }}
            title="Ajouter des athlètes à la liste d'assurance du club"
          >
            <UserPlus size={14} /> + Ajouter à la Liste
          </Button>
        </div>
      </div>

      {/* BANNIÈRE D'ALERTE DE SÉCURITÉ SI DES MEMBRES NE SONT PAS ASSURÉS */}
      {stats.nonAssure > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '1.25rem',
            padding: '0.9rem 1.25rem',
            borderRadius: '14px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div className="flex items-center gap-3">
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#ef4444', display: 'block' }}>
                Alerte Responsabilité Civile : {stats.nonAssure} athlète(s) sans assurance valide !
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Pour la sécurité du club et des adhérents, tout nageur accédant au bassin doit disposer d'une police active.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="primary"
              onClick={() => handleOpenBordereauModal('non_assures')}
              style={{ 
                fontSize: '0.78rem', 
                padding: '0.4rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#ef4444',
                borderColor: '#ef4444',
                color: '#ffffff'
              }}
              title="Générer directement le bordereau PDF pour tous les adhérents non encore assurés"
            >
              <FileText size={14} /> Bordereau Nouveaux Adhérents ({stats.nonAssure})
            </Button>

            <Button 
              variant="secondary"
              onClick={() => setStatusFilter('NON_ASSURE')}
              style={{ 
                fontSize: '0.78rem', 
                padding: '0.4rem 0.75rem', 
                borderColor: 'rgba(239, 68, 68, 0.4)', 
                color: '#ef4444' 
              }}
            >
              Filtrer la liste
            </Button>
          </div>
        </motion.div>
      )}

      {/* BANNIÈRE TABLE MANQUANTE SUPABASE (AVEC 1-CLIC SQL) */}
      {isTableMissing && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} color="#f59e0b" />
            <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
              Mode Stockage Local Actif (La table <code>assurances</code> n'est pas encore créée dans votre Supabase).
            </span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sqlSetupScript);
              toast.success('Script SQL copié ! Collez-le dans l\'éditeur SQL Supabase.');
            }}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '8px',
              backgroundColor: '#f59e0b',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Copy size={13} /> Copier le script SQL Supabase
          </button>
        </div>
      )}

      {/* CARTES DE STATISTIQUES / KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-slate-200 dark:text-slate-700"
                  fill="transparent"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={75.4}
                  strokeDashoffset={75.4 - (75.4 * stats.tauxConformite) / 100}
                  strokeLinecap="round"
                  className={stats.tauxConformite >= 75 ? "text-emerald-500" : stats.tauxConformite >= 40 ? "text-amber-500" : "text-rose-500"}
                  fill="transparent"
                />
              </svg>
            </div>
          }
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#10b981"
          label="Taux de Conformité"
          value={`${stats.tauxConformite}%`}
          subtitle={`${stats.aJour + stats.expireBientot} sur ${stats.total} membres couverts`}
          glowColor={stats.tauxConformite > 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
        />

        <StatCard 
          icon={<CheckCircle size={24} />}
          iconBg="rgba(16, 185, 129, 0.12)"
          iconColor="#10b981"
          label="Assurés à Jour"
          value={stats.aJour}
          subtitle="Couverture active (> 30 jours)"
        />

        <StatCard 
          icon={<AlertTriangle size={24} />}
          iconBg="rgba(245, 158, 11, 0.15)"
          iconColor="#f59e0b"
          label="Expirent Bientôt"
          value={stats.expireBientot}
          subtitle="À renouveler sous 30 jours"
        />

        <StatCard 
          icon={<ShieldAlert size={24} />}
          iconBg="rgba(239, 68, 68, 0.15)"
          iconColor="#ef4444"
          label="Non Couverts / Expirés"
          value={stats.nonAssure}
          subtitle="Urgent : régularisation requise"
        />
      </div>

      {/* ONGLETS DE VUE : LISTE D'ASSURANCE / NON ASSURÉS / TOUS */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setViewTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            viewTab === 'ALL'
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
          }`}
        >
          <Users size={14} />
          Tous les membres ({stats.total})
        </button>

        <button
          onClick={() => setViewTab('INSURED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            viewTab === 'INSURED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-[var(--bg-tertiary)] text-emerald-400 hover:text-emerald-300 border border-[var(--border-color)]'
          }`}
          title="Afficher uniquement les athlètes présents sur la liste d'assurance"
        >
          <ShieldCheck size={14} />
          🛡️ Liste d'Assurance ({stats.aJour + stats.expireBientot})
        </button>

        <button
          onClick={() => setViewTab('NOT_INSURED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            viewTab === 'NOT_INSURED'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-[var(--bg-tertiary)] text-rose-400 hover:text-rose-300 border border-[var(--border-color)]'
          }`}
          title="Afficher les athlètes sans assurance à ajouter à la liste"
        >
          <ShieldAlert size={14} />
          ⚠️ Non Assurés / À Ajouter ({stats.nonAssure})
        </button>
      </div>

      {/* BARRE D'OUTILS ET FILTRES */}
      <Card noPadding className="mb-6">
        <div className="p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text"
              placeholder="Rechercher par nom, prénom, numéro de police..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtres dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Statut Assurance */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Tous les statuts assurance</option>
              <option value="A_JOUR">🟢 À jour uniquement</option>
              <option value="EXPIRE_BIENTOT">🟠 Expire sous 30j</option>
              <option value="NON_ASSURE">🔴 Non assurés / Expirés</option>
            </select>

            {/* Groupe */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Tous les groupes</option>
              {groupes.map(g => (
                <option key={g.id} value={g.id}>{g.nom}</option>
              ))}
            </select>

            {/* Compagnie */}
            <select
              value={compagnieFilter}
              onChange={(e) => setCompagnieFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer max-w-[160px]"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Toutes compagnies</option>
              {COMPAGNIES_ASSURANCE.map(c => (
                <option key={c} value={c}>{c.split('(')[0].trim()}</option>
              ))}
            </select>

            {/* Catégorie d'Âge Fédérale FAN */}
            <select
              value={federalCategoryFilter}
              onChange={(e) => setFederalCategoryFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Toutes catégories d'âge</option>
              <option value="ECOLE">École (&lt;8 ans)</option>
              <option value="POUSSINS">Poussins (9-10 ans)</option>
              <option value="BENJAMINS">Benjamins (11-12 ans)</option>
              <option value="MINIMES">Minimes (13-14 ans)</option>
              <option value="CADETS">Cadets (15-16 ans)</option>
              <option value="JUNIORS">Juniors (17-18 ans)</option>
              <option value="SENIORS">Seniors (18+ ans)</option>
            </select>

            {/* Filtre Urgence Immédiate */}
            <button
              type="button"
              onClick={() => setUrgencyFilterOnly(!urgencyFilterOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                urgencyFilterOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-[var(--bg-tertiary)] text-slate-600 dark:text-slate-300 border-[var(--border-color)] hover:border-rose-400'
              }`}
              title="Filtrer uniquement les athlètes non assurés ou avec expiration imminente (< 15 jours)"
            >
              <ShieldAlert size={14} className={urgencyFilterOnly ? 'text-white' : 'text-rose-500'} />
              🚨 Urgences ({stats.nonAssure})
            </button>

            {/* Export CSV */}
            <Button 
              variant="secondary" 
              onClick={handleExportCsv}
              title="Exporter le tableau sous forme de tableur Excel/CSV"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={14} /> CSV
            </Button>
          </div>
        </div>

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
                onClick={() => {
                  setBatchForm(prev => ({ ...prev, targetType: 'selected' }));
                  setShowBatchModal(true);
                }}
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
                onClick={handleBatchDeleteSelected}
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
                onClick={() => handleOpenWhatsAppModal(enrichedAthletes.filter(a => selectedAthleteIds.includes(a.id)))}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Envoyer des rappels WhatsApp ciblés pour les athlètes sélectionnés"
              >
                <Send size={13} /> Relance WhatsApp ({selectedAthleteIds.length})
              </button>

              {/* BORDEREAU FÉDÉRAL FAN */}
              <button
                type="button"
                onClick={handleGenerateBordereauFederalFan}
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                title="Générer le bordereau officiel FAN pour la sélection"
              >
                <Award size={13} className="text-amber-400" /> Bordereau FAN ({selectedAthleteIds.length})
              </button>

              <Button 
                variant="secondary"
                onClick={() => handleOpenBordereauModal('selected')}
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
                    onClick={handleToggleSelectAll}
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
                          onClick={() => handleToggleSelectAthlete(ath.id)}
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
                              {ath.date_naissance && ` • Né(e) le ${new Date(ath.date_naissance).toLocaleDateString('fr-FR')} (${ath.federalCategory?.age} ans)`}
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
                              onClick={() => handleQuickAddAthlete(ath)}
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
                              onClick={() => handleRemoveAthleteFromInsurance(ath)}
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
                            onClick={() => handleOpenSingleModal(ath)}
                            title={ass ? "Modifier ou renouveler la police d'assurance" : "Personnaliser les dates ou le contrat"}
                            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-[var(--bg-tertiary)]"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Attestation PDF */}
                          <button
                            onClick={() => handleDownloadAttestation(ath)}
                            title="Télécharger l'Attestation Individuelle d'Assurance (PDF)"
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-tertiary)]"
                          >
                            <FileText size={15} />
                          </button>

                          {/* Relance WhatsApp */}
                          <button
                            onClick={() => handleWhatsAppReminder(ath)}
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
      </Card>

      {/* MODALE 1 : ASSURANCE INDIVIDUELLE / RENOUVELLEMENT */}
      <AnimatePresence>
        {showSingleModal && (
          <div className="modal-overlay" style={{ zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card modal-content"
              style={{ maxWidth: '540px', width: '95%' }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} color="#818cf8" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    {editingAssurance ? 'Renouveler / Modifier l\'Assurance' : 'Souscrire une Police Individuelle'}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowSingleModal(false)}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitSingleForm} className="flex flex-col gap-3">
                {/* Choix de l'athlète */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Athlète concerné *
                  </label>
                  {targetAthlete ? (
                    <div style={{
                      padding: '0.65rem 0.9rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}>
                      {(targetAthlete.nom || '').toUpperCase()} {targetAthlete.prenom} ({targetAthlete.groupes?.nom || targetAthlete.groupe || 'Standard'})
                    </div>
                  ) : (
                    <select
                      value={singleForm.athlete_id}
                      onChange={(e) => setSingleForm(prev => ({ ...prev, athlete_id: e.target.value }))}
                      required
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Sélectionner un athlète...</option>
                      {enrichedAthletes.map(a => (
                        <option key={a.id} value={a.id}>
                          {(a.nom || '').toUpperCase()} {a.prenom} ({a.groupes?.nom || a.groupe || 'Sans groupe'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Compagnie */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Compagnie d'Assurance *
                  </label>
                  <select
                    value={singleForm.compagnie}
                    onChange={(e) => setSingleForm(prev => ({ ...prev, compagnie: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {COMPAGNIES_ASSURANCE.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Numéro de police */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Numéro de Police / Référence *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: POL-2026-9874"
                    value={singleForm.numero_police}
                    onChange={(e) => setSingleForm(prev => ({ ...prev, numero_police: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Dates de début et fin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Date de début *
                    </label>
                    <input 
                      type="date"
                      required
                      value={singleForm.date_debut}
                      onChange={(e) => setSingleForm(prev => ({ ...prev, date_debut: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Date d'expiration *
                    </label>
                    <input 
                      type="date"
                      required
                      value={singleForm.date_fin}
                      onChange={(e) => setSingleForm(prev => ({ ...prev, date_fin: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Type de couverture & Montant */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Type de Couverture
                    </label>
                    <select
                      value={singleForm.type_couverture}
                      onChange={(e) => setSingleForm(prev => ({ ...prev, type_couverture: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {TYPES_COUVERTURE.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Prime payée (DA)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      step="any"
                      placeholder="1500"
                      value={singleForm.montant}
                      onChange={(e) => setSingleForm(prev => ({ ...prev, montant: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Notes / Remarques (Optionnel)
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: Quittance N° 124, certificat joint"
                    value={singleForm.notes}
                    onChange={(e) => setSingleForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                  <Button variant="secondary" type="button" onClick={() => setShowSingleModal(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit">
                    Valider la Police
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALE 2 : SOUSCRIPTION GROUPÉE (PAR GROUPE OU SÉLECTION) */}
      <AnimatePresence>
        {showBatchModal && (
          <div className="modal-overlay" style={{ zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card modal-content"
              style={{ maxWidth: '560px', width: '95%' }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Users size={20} color="#818cf8" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    Souscription Groupée d'Assurance
                  </h3>
                </div>
                <button 
                  onClick={() => setShowBatchModal(false)}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitBatchForm} className="flex flex-col gap-3">
                {/* Cible */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Cible de la souscription groupée *
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setBatchForm(prev => ({ ...prev, targetType: 'selected' }))}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        batchForm.targetType === 'selected'
                          ? 'bg-[var(--accent-primary)] text-white border-transparent'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      Membres cochés ({selectedAthleteIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchForm(prev => ({ ...prev, targetType: 'group' }))}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        batchForm.targetType === 'group'
                          ? 'bg-[var(--accent-primary)] text-white border-transparent'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      Tout un Groupe
                    </button>
                  </div>

                  {batchForm.targetType === 'group' && (
                    <select
                      value={batchForm.targetGroupId}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, targetGroupId: e.target.value }))}
                      required={batchForm.targetType === 'group'}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Sélectionner le groupe à assurer...</option>
                      {groupes.map(g => (
                        <option key={g.id} value={g.id}>{g.nom}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Compagnie */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Compagnie d'Assurance *
                  </label>
                  <select
                    value={batchForm.compagnie}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, compagnie: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {COMPAGNIES_ASSURANCE.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Numéro de police collective */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Numéro de Police Cadre / Bordereau *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: POL-COLL-2026/01"
                    value={batchForm.numero_police}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, numero_police: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Date de début *
                    </label>
                    <input 
                      type="date"
                      required
                      value={batchForm.date_debut}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, date_debut: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Date d'expiration *
                    </label>
                    <input 
                      type="date"
                      required
                      value={batchForm.date_fin}
                      onChange={(e) => setBatchForm(prev => ({ ...prev, date_fin: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Type de couverture */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Garantie / Couverture
                  </label>
                  <select
                    value={batchForm.type_couverture}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, type_couverture: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {TYPES_COUVERTURE.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                  <Button variant="secondary" type="button" onClick={() => setShowBatchModal(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit">
                    Appliquer la souscription
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODALE 3 : CONFIGURATION DU BORDEREAU COLLECTIF PDF */}
        {showBordereauModal && (
          <div className="modal-overlay" style={{ zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card modal-content"
              style={{ maxWidth: '580px', width: '95%' }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} color="#818cf8" />
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    Générateur de Bordereau Collectif (PDF)
                  </h3>
                </div>
                <button 
                  onClick={() => setShowBordereauModal(false)}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleGenerateBordereau} className="flex flex-col gap-3.5">
                {/* 1. Sélection de la cible */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1.5">
                    Quels athlètes inclure dans ce bordereau ? *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBordereauForm(prev => ({ ...prev, targetType: 'non_assures' }))}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        bordereauForm.targetType === 'non_assures'
                          ? 'bg-[var(--accent-primary)] text-white border-transparent shadow'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      <strong className="block text-xs font-bold">🔴 Nouveaux & Non-assurés</strong>
                      <span className="text-[0.7rem] opacity-80">{stats.nonAssure} athlète(s) à régulariser</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBordereauForm(prev => ({ ...prev, targetType: 'selected' }))}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        bordereauForm.targetType === 'selected'
                          ? 'bg-[var(--accent-primary)] text-white border-transparent shadow'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      <strong className="block text-xs font-bold">📋 Sélection cochée</strong>
                      <span className="text-[0.7rem] opacity-80">{selectedAthleteIds.length} athlète(s) coché(s)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBordereauForm(prev => ({ ...prev, targetType: 'group' }))}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        bordereauForm.targetType === 'group'
                          ? 'bg-[var(--accent-primary)] text-white border-transparent shadow'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      <strong className="block text-xs font-bold">👥 Tout un Groupe</strong>
                      <span className="text-[0.7rem] opacity-80">Sélectionner par niveau</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBordereauForm(prev => ({ ...prev, targetType: 'all' }))}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        bordereauForm.targetType === 'all'
                          ? 'bg-[var(--accent-primary)] text-white border-transparent shadow'
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-color)]'
                      }`}
                    >
                      <strong className="block text-xs font-bold">🌐 Tous les Membres</strong>
                      <span className="text-[0.7rem] opacity-80">Totalité du club ({stats.total})</span>
                    </button>
                  </div>

                  {bordereauForm.targetType === 'group' && (
                    <select
                      value={bordereauForm.targetGroupId}
                      onChange={(e) => setBordereauForm(prev => ({ ...prev, targetGroupId: e.target.value }))}
                      required={bordereauForm.targetType === 'group'}
                      className="w-full mt-2 px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Sélectionner le groupe...</option>
                      {groupes.map(g => (
                        <option key={g.id} value={g.id}>{g.nom}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Compagnie d'Assurance */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Compagnie d'Assurance Destinataire *
                  </label>
                  <select
                    value={bordereauForm.compagnie}
                    onChange={(e) => setBordereauForm(prev => ({ ...prev, compagnie: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {COMPAGNIES_ASSURANCE.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Référence de police / bordereau */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                    Référence de Police / Contrat-Cadre *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: BORD-OVIA-2026/01 ou POL-SAA-7890"
                    value={bordereauForm.numero_police}
                    onChange={(e) => setBordereauForm(prev => ({ ...prev, numero_police: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* 4. Dates de couverture */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Date de début *
                    </label>
                    <input 
                      type="date"
                      required
                      value={bordereauForm.date_debut}
                      onChange={(e) => setBordereauForm(prev => ({ ...prev, date_debut: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Date d'expiration *
                    </label>
                    <input 
                      type="date"
                      required
                      value={bordereauForm.date_fin}
                      onChange={(e) => setBordereauForm(prev => ({ ...prev, date_fin: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* 5. Option d'enregistrement automatique */}
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <input 
                    type="checkbox"
                    id="autoEnregistrerCheck"
                    checked={bordereauForm.autoEnregistrer}
                    onChange={(e) => setBordereauForm(prev => ({ ...prev, autoEnregistrer: e.target.checked }))}
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <label htmlFor="autoEnregistrerCheck" style={{ cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    <strong>Enregistrer automatiquement ces membres comme assurés</strong>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Cochez cette case si le contrat est déjà effectif : les athlètes inclus passeront immédiatement au vert 🟢 "À jour".
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--border-color)]">
                  <Button variant="secondary" type="button" onClick={() => setShowBordereauModal(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Download size={15} /> Télécharger le Bordereau PDF
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* MODALE 4 : AJOUTER DES ATHLÈTES À LA LISTE D'ASSURANCE */}
        {showAddAthletesModal && (
          <div className="modal-overlay" style={{ zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card modal-content"
              style={{ maxWidth: '640px', width: '95%' }}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                      Ajouter à la Liste d'Assurance
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Sélectionnez les athlètes à inscrire au contrat d'assurance du club.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddAthletesModal(false)}
                  className="text-[var(--text-muted)] hover:text-white cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitAddAthletesModal} className="flex flex-col gap-3.5">
                {/* 1. Sélection des athlètes candidats */}
                <div style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      1. Choisir les athlètes non assurés ({selectedForAdd.length} sélectionné{selectedForAdd.length > 1 ? 's' : ''})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedForAdd(modalCandidateAthletes.map(a => a.id))}
                        className="text-[0.72rem] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer bg-transparent border-none p-0"
                      >
                        Tout cocher ({modalCandidateAthletes.length})
                      </button>
                      <span className="text-muted text-[0.7rem]">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedForAdd([])}
                        className="text-[0.72rem] font-semibold text-[var(--text-muted)] hover:text-white cursor-pointer bg-transparent border-none p-0"
                      >
                        Tout décocher
                      </button>
                    </div>
                  </div>

                  {/* Filtres internes à la modale */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input 
                        type="text"
                        placeholder="Rechercher par nom..."
                        value={modalSearchQuery}
                        onChange={(e) => setModalSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <select
                      value={modalGroupFilter}
                      onChange={(e) => setModalGroupFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg text-xs border focus:outline-none cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="ALL">Tous les groupes</option>
                      {groupes.map(g => (
                        <option key={g.id} value={g.id}>{g.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Liste scrollable des athlètes candidats */}
                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    {modalCandidateAthletes.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                        Aucun athlète non assuré ne correspond à ce filtre.
                      </div>
                    ) : (
                      modalCandidateAthletes.map(ath => {
                        const isChecked = selectedForAdd.includes(ath.id);
                        return (
                          <div 
                            key={ath.id}
                            onClick={() => {
                              setSelectedForAdd(prev => 
                                isChecked ? prev.filter(x => x !== ath.id) : [...prev, ath.id]
                              );
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              cursor: 'pointer',
                              backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                              transition: 'background-color 0.1s'
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {isChecked ? (
                                <CheckSquare size={16} color="#10b981" />
                              ) : (
                                <Square size={16} color="var(--text-muted)" />
                              )}
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {(ath.nom || '').toUpperCase()} {ath.prenom}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-muted)'
                              }}>
                                {ath.groupes?.nom || ath.groupe || 'Standard'}
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                padding: '1px 5px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                fontWeight: 700
                              }}>
                                {ath.insuranceStatus.label}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 2. Détails de couverture */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Compagnie d'Assurance *
                    </label>
                    <select
                      value={addModalForm.compagnie}
                      onChange={(e) => setAddModalForm(prev => ({ ...prev, compagnie: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    >
                      {COMPAGNIES_ASSURANCE.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Numéro de Police / Référence *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: POL-COLL-2026/01"
                      value={addModalForm.numero_police}
                      onChange={(e) => setAddModalForm(prev => ({ ...prev, numero_police: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Dates & Prime */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Date de début
                    </label>
                    <input 
                      type="date"
                      required
                      value={addModalForm.date_debut}
                      onChange={(e) => setAddModalForm(prev => ({ ...prev, date_debut: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Date de fin (1 an)
                    </label>
                    <input 
                      type="date"
                      required
                      value={addModalForm.date_fin}
                      onChange={(e) => setAddModalForm(prev => ({ ...prev, date_fin: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                      Prime par athlète (DA)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      value={addModalForm.montant}
                      onChange={(e) => setAddModalForm(prev => ({ ...prev, montant: e.target.value }))}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--border-color)]">
                  <Button variant="secondary" type="button" onClick={() => setShowAddAthletesModal(false)}>
                    Annuler
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={selectedForAdd.length === 0}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      backgroundColor: selectedForAdd.length === 0 ? 'var(--bg-tertiary)' : '#10b981',
                      borderColor: selectedForAdd.length === 0 ? 'var(--border-color)' : '#10b981',
                      color: selectedForAdd.length === 0 ? 'var(--text-muted)' : '#ffffff',
                      cursor: selectedForAdd.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <UserPlus size={15} /> Ajouter ({selectedForAdd.length}) à la Liste d'Assurance
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALE RELANCES AUTOMATISÉES WHATSAPP & SMS */}
      <InsuranceWhatsAppModal 
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        athletes={whatsAppTargetAthletes}
        onReminderSent={(ath, type, tmplTitle) => {
          logInsuranceAction({
            athleteNom: `${ath.nom} ${ath.prenom}`,
            action: 'RELANCE_WHATSAPP',
            actionLabel: `Relance ${type} envoyée (${tmplTitle})`,
            details: `Envoyé au ${ath.telephone || ath.telephone_parent || 'Tuteur'}`
          });
        }}
      />

      {/* MODALE SCANNER INTELLIGENT OCR */}
      <InsuranceOcrModal 
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        athletes={enrichedAthletes}
        onApplyAssurance={handleApplyOcrAssurance}
      />

      {/* MODALE ACCORDS CADRES & PARTENAIRES */}
      <InsurancePartnersModal 
        isOpen={showPartnersModal}
        onClose={() => setShowPartnersModal(false)}
        onSelectPartner={handleSelectPartner}
      />

      {/* MODALE JOURNAL D'AUDIT & TRAÇABILITÉ */}
      <InsuranceAuditModal 
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
}
