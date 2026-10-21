import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  RefreshCw, 
  UserPlus, 
  Building2, 
  History, 
  Send, 
  Award,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { Button } from '../components/ui';
import { supabase } from '../supabaseClient';
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
import InsuranceWhatsAppModal from '../components/InsuranceWhatsAppModal';
import InsuranceOcrModal from '../components/InsuranceOcrModal';
import InsurancePartnersModal from '../components/InsurancePartnersModal';
import InsuranceAuditModal from '../components/InsuranceAuditModal';
import { logInsuranceAction } from '../utils/insuranceAudit';

import {
  InsuranceKPIs,
  InsuranceFilterBar,
  InsuranceTable,
  InsuranceSingleModal,
  InsuranceBatchModal,
  InsuranceBordereauModal,
  InsuranceAddAthletesModal
} from '../components/insurance';

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
    quickInsureAthlete,
    getAthleteAssurance,
    sqlSetupScript,
    fetchAssurances
  } = useAssurances();

  // Chargement automatique des athlètes actifs au montage (exclut les archivés)
  useEffect(() => {
    fetchAthletes(false);
  }, [fetchAthletes]);

  // Synchronisation proactive du lieu de naissance depuis les inscriptions si manquant
  useEffect(() => {
    const syncMissingLieux = async () => {
      try {
        const missingAthletes = athletes.filter(a => !a.lieu_naissance && a.nom && a.prenom);
        if (!missingAthletes.length) return;

        const { data: inscData, error: inscError } = await supabase
          .from('inscriptions')
          .select('nom, prenom, lieu_naissance')
          .not('lieu_naissance', 'is', null);

        if (!inscError && inscData && inscData.length > 0) {
          for (const ath of missingAthletes) {
            const match = inscData.find(i => 
              i.nom?.trim().toUpperCase() === ath.nom?.trim().toUpperCase() &&
              i.prenom?.trim().toLowerCase() === ath.prenom?.trim().toLowerCase() &&
              i.lieu_naissance?.trim()
            );
            if (match && match.lieu_naissance) {
              await supabase
                .from('athletes')
                .update({ lieu_naissance: match.lieu_naissance.trim() })
                .eq('id', ath.id);
              ath.lieu_naissance = match.lieu_naissance.trim();
            }
          }
        }
      } catch (err) {
        console.warn('Sync lieu_naissance background warning:', err);
      }
    };

    if (athletes.length > 0) {
      syncMissingLieux();
    }
  }, [athletes]);

  // Filtres & Recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [viewTab, setViewTab] = useState('ALL'); // 'ALL' | 'INSURED' | 'NOT_INSURED'
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, A_JOUR, EXPIRE_BIENTOT, NON_ASSURE
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [compagnieFilter, setCompagnieFilter] = useState('ALL');
  const [federalCategoryFilter, setFederalCategoryFilter] = useState('ALL');
  const [urgencyFilterOnly, setUrgencyFilterOnly] = useState(false);

  // Modales Intelligentes Dédiées
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppTargetAthletes, setWhatsAppTargetAthletes] = useState([]);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showPartnersModal, setShowPartnersModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Sélection multiple
  const [selectedAthleteIds, setSelectedAthleteIds] = useState([]);

  // Modales Internes
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddAthletesModal, setShowAddAthletesModal] = useState(false);
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
    let localInsc = [];
    try {
      localInsc = JSON.parse(localStorage.getItem('local_inscriptions_backup') || '[]');
    } catch {}

    return athletes
      .filter(ath => ath.est_actif !== false)
      .map(ath => {
        const assurance = getAthleteAssurance(ath.id);
        const statusInfo = calculateInsuranceStatus(assurance);
        const federalCategory = getAthleteFederalCategory(ath.date_naissance);

        let lieuNaissance = ath.lieu_naissance || ath.lieu_de_naissance || ath.lieuNaissance || ath.lieu || null;
        if (!lieuNaissance && localInsc.length > 0) {
          const matched = localInsc.find(i => 
            i.nom?.trim().toUpperCase() === ath.nom?.trim().toUpperCase() && 
            i.prenom?.trim().toLowerCase() === ath.prenom?.trim().toLowerCase()
          );
          if (matched?.lieu_naissance) {
            lieuNaissance = matched.lieu_naissance.trim();
          }
        }

        return {
          ...ath,
          lieu_naissance: lieuNaissance || '',
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
    if (selectedAthleteIds.length > 0) {
      const nonAssuresSelected = selectedAthleteIds.filter(id => {
        const ath = enrichedAthletes.find(a => a.id === id);
        return ath && (ath.insuranceStatus.code === 'NON_ASSURE' || ath.insuranceStatus.code === 'EXPIREE');
      });
      setSelectedForAdd(nonAssuresSelected.length > 0 ? nonAssuresSelected : selectedAthleteIds);
    } else {
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

  // Retirer un athlète de la liste d'assurance
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

  // Retirer la sélection de la liste d'assurance
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

  // Générer Bordereau Collectif PDF
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
      console.error('Erreur bordereau assurance:', err);
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

  // Centre de relances WhatsApp
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

  // Bordereau Fédéral FAN & DJS
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
      console.error('Erreur bordereau fédéral FAN:', err);
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
    const updateForm = prev => ({
      ...prev,
      compagnie: partner.nom,
      montant: partner.tarifNegocie,
      numero_police: partner.policeGroupe
    });
    setSingleForm(updateForm);
    setBatchForm(updateForm);
    setAddModalForm(updateForm);
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
      'Lieu de Naissance': ath.lieu_naissance || ath.lieu_de_naissance || ath.lieuNaissance || ath.lieu || '',
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
          {/* Relances Automatisées WhatsApp */}
          <button 
            type="button"
            onClick={() => handleOpenWhatsAppModal()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            title="Ouvrir le centre de relances automatisées par WhatsApp pour les non-assurés"
          >
            <Send size={14} />
            Relances WhatsApp ({stats.nonAssure})
          </button>

          {/* Scanner OCR */}
          <button 
            type="button"
            onClick={() => setShowOcrModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-indigo-600/20 transition cursor-pointer"
            title="Glisser-déposer une attestation papier ou PDF pour reconnaissance OCR instantanée"
          >
            <Sparkles size={14} />
            Scanner OCR
          </button>

          {/* Accords Cadres */}
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

          {/* Journal d'Audit */}
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

      {/* BANNIÈRE TABLE MANQUANTE SUPABASE */}
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
      <InsuranceKPIs stats={stats} />

      {/* BARRE D'OUTILS ET FILTRES */}
      <InsuranceFilterBar 
        viewTab={viewTab}
        setViewTab={setViewTab}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        groupFilter={groupFilter}
        setGroupFilter={setGroupFilter}
        groupes={groupes}
        compagnieFilter={compagnieFilter}
        setCompagnieFilter={setCompagnieFilter}
        compagniesList={COMPAGNIES_ASSURANCE}
        federalCategoryFilter={federalCategoryFilter}
        setFederalCategoryFilter={setFederalCategoryFilter}
        urgencyFilterOnly={urgencyFilterOnly}
        setUrgencyFilterOnly={setUrgencyFilterOnly}
        onExportCsv={handleExportCsv}
      />

      {/* TABLEAU DES ASSURANCES */}
      <InsuranceTable 
        filteredAthletes={filteredAthletes}
        selectedAthleteIds={selectedAthleteIds}
        setSelectedAthleteIds={setSelectedAthleteIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectAthlete={handleToggleSelectAthlete}
        loadingAthletes={loadingAthletes}
        loadingAssurances={loadingAssurances}
        onOpenBatchModalForSelected={() => {
          setBatchForm(prev => ({ ...prev, targetType: 'selected' }));
          setShowBatchModal(true);
        }}
        onBatchDeleteSelected={handleBatchDeleteSelected}
        onOpenWhatsAppModalForSelected={() => handleOpenWhatsAppModal(enrichedAthletes.filter(a => selectedAthleteIds.includes(a.id)))}
        onGenerateBordereauFederalFan={handleGenerateBordereauFederalFan}
        onOpenBordereauModalForSelected={() => handleOpenBordereauModal('selected')}
        onQuickAddAthlete={handleQuickAddAthlete}
        onRemoveAthleteFromInsurance={handleRemoveAthleteFromInsurance}
        onOpenSingleModal={handleOpenSingleModal}
        onDownloadAttestation={handleDownloadAttestation}
        onWhatsAppReminder={handleWhatsAppReminder}
      />

      {/* MODALE 1 : ASSURANCE INDIVIDUELLE */}
      <InsuranceSingleModal 
        isOpen={showSingleModal}
        onClose={() => setShowSingleModal(false)}
        editingAssurance={editingAssurance}
        targetAthlete={targetAthlete}
        singleForm={singleForm}
        setSingleForm={setSingleForm}
        onSubmit={handleSubmitSingleForm}
        enrichedAthletes={enrichedAthletes}
        compagniesList={COMPAGNIES_ASSURANCE}
        typesCouverture={TYPES_COUVERTURE}
      />

      {/* MODALE 2 : SOUSCRIPTION GROUPÉE */}
      <InsuranceBatchModal 
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        batchForm={batchForm}
        setBatchForm={setBatchForm}
        onSubmit={handleSubmitBatchForm}
        selectedCount={selectedAthleteIds.length}
        groupes={groupes}
        compagniesList={COMPAGNIES_ASSURANCE}
        typesCouverture={TYPES_COUVERTURE}
      />

      {/* MODALE 3 : BORDEREAU COLLECTIF PDF */}
      <InsuranceBordereauModal 
        isOpen={showBordereauModal}
        onClose={() => setShowBordereauModal(false)}
        bordereauForm={bordereauForm}
        setBordereauForm={setBordereauForm}
        onSubmit={handleGenerateBordereau}
        stats={stats}
        selectedCount={selectedAthleteIds.length}
        groupes={groupes}
        compagniesList={COMPAGNIES_ASSURANCE}
      />

      {/* MODALE 4 : AJOUTER DES ATHLÈTES À LA LISTE */}
      <InsuranceAddAthletesModal 
        isOpen={showAddAthletesModal}
        onClose={() => setShowAddAthletesModal(false)}
        selectedForAdd={selectedForAdd}
        setSelectedForAdd={setSelectedForAdd}
        modalCandidateAthletes={modalCandidateAthletes}
        modalSearchQuery={modalSearchQuery}
        setModalSearchQuery={setModalSearchQuery}
        modalGroupFilter={modalGroupFilter}
        setModalGroupFilter={setModalGroupFilter}
        addModalForm={addModalForm}
        setAddModalForm={setAddModalForm}
        onSubmit={handleSubmitAddAthletesModal}
        groupes={groupes}
        compagniesList={COMPAGNIES_ASSURANCE}
      />

      {/* MODALE RELANCES AUTOMATISÉES WHATSAPP */}
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
