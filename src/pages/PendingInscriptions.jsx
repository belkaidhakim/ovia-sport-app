import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  Clock, 
  HeartPulse, 
  ShieldCheck, 
  Camera, 
  Trash2, 
  Copy, 
  ExternalLink,
  Printer, 
  X, 
  AlertTriangle, 
  MessageCircle, 
  RefreshCw, 
  Download, 
  Plus, 
  UserPlus, 
  Upload
} from 'lucide-react';
import { Card, Button, Skeleton } from '../components/ui';
import { useInscriptions } from '../hooks/useInscriptions';
import { useClubPricing } from '../hooks/useClubPricing';
import { calculateAge, formatWhatsAppPhone } from '../utils/formatters';
import { generateOfficialRegistrationFormPdf } from '../utils/registrationFormPdfGenerator';
import { compressImageFile } from '../utils/imageCompressor';
import BadgeGenerator from '../components/BadgeGenerator';
import RegistrationStatusToggle from '../components/RegistrationStatusToggle';

export default function PendingInscriptions({ embedded = false }) {
  const { 
    inscriptions, 
    loading, 
    isTableMissing,
    fetchInscriptions, 
    ajouterInscription,
    validerInscription, 
    validerMultipleInscriptions,
    rejeterInscription, 
    deleteInscription,
    deleteMultipleInscriptions
  } = useInscriptions();
  const { fraisInscription, cotisationAdhesion, totalAdhesion } = useClubPricing();

  const [activeTab, setActiveTab] = useState('EN_ATTENTE'); // 'EN_ATTENTE', 'VALIDE', 'REJETE', 'ALL'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Multi-sélection (Bulk Actions)
  const [selectedIds, setSelectedIds] = useState([]);

  // Modale d'examen détaillé
  const [selectedInscription, setSelectedInscription] = useState(null);
  
  // Option de paiement lors de la validation
  const [paymentForm, setPaymentForm] = useState({
    isPaid: true,
    montant: 3300,
    modePaiement: 'Espèces',
    periodeFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Synchroniser le montant par défaut lors du chargement des tarifs
  useEffect(() => {
    if (totalAdhesion) {
      setPaymentForm(prev => ({ ...prev, montant: totalAdhesion }));
    }
  }, [totalAdhesion]);

  // Modale de rejet
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    inscriptionIds: [],
    athleteName: '',
    motif: 'Certificat médical non conforme ou illisible'
  });

  // Modale de Badge QR après validation
  const [validatedAthleteBadge, setValidatedAthleteBadge] = useState(null);

  // Modale visionneuse de document
  const [documentViewer, setDocumentViewer] = useState({
    isOpen: false,
    title: '',
    src: null
  });

  useEffect(() => {
    fetchInscriptions();
  }, [fetchInscriptions]);

  // Statistiques compactes
  const stats = useMemo(() => {
    const pending = inscriptions.filter(i => i.statut === 'EN_ATTENTE').length;
    const validated = inscriptions.filter(i => i.statut === 'VALIDE').length;
    const rejected = inscriptions.filter(i => i.statut === 'REJETE').length;
    return { pending, validated, rejected, total: inscriptions.length };
  }, [inscriptions]);

  // Filtrage et recherche
  const filteredInscriptions = useMemo(() => {
    return inscriptions.filter(item => {
      if (activeTab !== 'ALL' && item.statut !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nom = (item.nom || '').toLowerCase();
        const prenom = (item.prenom || '').toLowerCase();
        const dossier = (item.numero_dossier || '').toLowerCase();
        const tel = (item.telephone || '').toLowerCase();
        const groupe = (item.groupes?.nom || item.groupe_nom || '').toLowerCase();
        return nom.includes(q) || prenom.includes(q) || dossier.includes(q) || tel.includes(q) || groupe.includes(q);
      }
      return true;
    });
  }, [inscriptions, activeTab, searchQuery]);

  // Gestion de la sélection multiple
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredInscriptions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInscriptions.map(i => i.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Validation en lot
  const handleBulkValidate = async () => {
    const itemsToValidate = inscriptions.filter(i => selectedIds.includes(i.id) && i.statut === 'EN_ATTENTE');
    if (itemsToValidate.length === 0) {
      toast.error('Aucun dossier en attente sélectionné.');
      return;
    }
    if (window.confirm(`Confirmez-vous la validation de ${itemsToValidate.length} dossier(s) ? Les profils athlètes et badges QR seront créés automatiquement.`)) {
      await validerMultipleInscriptions(itemsToValidate);
      setSelectedIds([]);
    }
  };

  // Rejet en lot
  const handleBulkReject = () => {
    const itemsToReject = inscriptions.filter(i => selectedIds.includes(i.id) && i.statut === 'EN_ATTENTE');
    if (itemsToReject.length === 0) {
      toast.error('Aucun dossier en attente sélectionné.');
      return;
    }
    setRejectionModal({
      isOpen: true,
      inscriptionIds: itemsToReject.map(i => i.id),
      athleteName: `${itemsToReject.length} dossiers sélectionnés`,
      motif: 'Dossier incomplet ou certificat médical manquant'
    });
  };

  // Validation individuelle avec prise en compte du paiement
  const handleSingleValidate = async (inscription) => {
    const newAthlete = await validerInscription(inscription, paymentForm);
    if (newAthlete) {
      if (selectedInscription && selectedInscription.id === inscription.id) {
        setSelectedInscription(null);
      }
      setValidatedAthleteBadge(newAthlete);
    }
  };

  // Confirmer le rejet (individuel ou en lot)
  const handleConfirmRejection = async () => {
    if (!rejectionModal.motif.trim()) {
      toast.error('Veuillez indiquer un motif de rejet.');
      return;
    }

    for (const id of rejectionModal.inscriptionIds) {
      await rejeterInscription(id, rejectionModal.motif);
    }

    setRejectionModal({ isOpen: false, inscriptionIds: [], athleteName: '', motif: '' });
    setSelectedIds([]);
    if (selectedInscription && rejectionModal.inscriptionIds.includes(selectedInscription.id)) {
      setSelectedInscription(null);
    }
  };

  // Modale d'ajout manuel d'une inscription
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newInscription, setNewInscription] = useState({
    nom: '',
    prenom: '',
    date_naissance: '',
    lieu_naissance: '',
    photo: null,
    photoPreview: null,
    certificat_medical: null,
    certificat_medical_name: '',
    extrait_naissance: null,
    extrait_naissance_name: '',
    sexe: 'Homme',
    nom_parent: '',
    telephone: '',
    groupe_nom: 'École / Éveil Aquatique',
    observations_medicales: ''
  });

  const handleModalPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 360, 460, 0.78);
      setNewInscription(prev => ({ ...prev, photo: compressed, photoPreview: compressed }));
    } catch {
      toast.error("Erreur chargement photo");
    }
  };

  const handleModalDocUpload = async (e, fieldKey, nameKey, label) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, 1200, 1600, 0.75);
      if (dataUrl) {
        setNewInscription(prev => ({
          ...prev,
          [fieldKey]: dataUrl,
          [nameKey]: file.name
        }));
        toast.success(`${label} prêt`);
      }
    } catch {
      toast.error(`Erreur chargement ${label}`);
    }
  };

  const handleAddNewInscription = async (e) => {
    e.preventDefault();
    if (!newInscription.nom.trim() || !newInscription.prenom.trim() || !newInscription.date_naissance || !newInscription.telephone.trim()) {
      toast.error('Veuillez renseigner tous les champs obligatoires (*)');
      return;
    }

    setIsAdding(true);
    const cleanPhone = newInscription.telephone.replace(/\s+/g, '');
    const res = await ajouterInscription({
      nom: newInscription.nom.trim().toUpperCase(),
      prenom: newInscription.prenom.trim(),
      date_naissance: newInscription.date_naissance,
      lieu_naissance: newInscription.lieu_naissance.trim() || null,
      photo: newInscription.photo || null,
      certificat_medical: newInscription.certificat_medical || null,
      extrait_naissance: newInscription.extrait_naissance || null,
      sexe: newInscription.sexe,
      telephone: cleanPhone,
      telephone_parent: cleanPhone,
      nom_parent: newInscription.nom_parent.trim(),
      groupe_nom: newInscription.groupe_nom,
      observations_medicales: newInscription.observations_medicales.trim() || (newInscription.nom_parent ? `Tuteur légal: ${newInscription.nom_parent.trim()}` : null)
    });

    setIsAdding(false);
    if (res.success) {
      setIsAddModalOpen(false);
      setNewInscription({
        nom: '',
        prenom: '',
        date_naissance: '',
        lieu_naissance: '',
        photo: null,
        photoPreview: null,
        certificat_medical: null,
        certificat_medical_name: '',
        extrait_naissance: null,
        extrait_naissance_name: '',
        sexe: 'Homme',
        nom_parent: '',
        telephone: '',
        groupe_nom: 'École / Éveil Aquatique',
        observations_medicales: ''
      });
    }
  };

  // Suppression groupée de dossiers
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('Aucun dossier sélectionné.');
      return;
    }
    if (window.confirm(`Confirmez-vous la suppression définitive de ${selectedIds.length} dossier(s) d'inscription ? Cette action est irréversible.`)) {
      await deleteMultipleInscriptions(selectedIds);
      setSelectedIds([]);
    }
  };

  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/inscription`;
    navigator.clipboard.writeText(publicUrl);
    toast.success('Lien public copié dans le presse-papiers !');
  };

  const copySqlScript = () => {
    const sql = `-- Script d'activation de la table des inscriptions
CREATE TABLE IF NOT EXISTS public.inscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_dossier TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  sexe TEXT CHECK (sexe IN ('Homme', 'Femme')),
  adresse TEXT,
  telephone TEXT NOT NULL,
  telephone_parent TEXT,
  nom_parent TEXT,
  groupe_id UUID REFERENCES public.groupes(id) ON DELETE SET NULL,
  groupe_nom TEXT,
  categorie TEXT,
  observations_medicales TEXT,
  photo TEXT,
  certificat_medical TEXT,
  autorisation_parentale TEXT,
  extrait_naissance TEXT,
  consentement_loi_18_07 BOOLEAN DEFAULT true NOT NULL,
  reglement_accepte BOOLEAN DEFAULT true NOT NULL,
  statut TEXT CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'REJETE')) DEFAULT 'EN_ATTENTE',
  motif_rejet TEXT,
  date_demande TIMESTAMPTZ DEFAULT NOW(),
  date_traitement TIMESTAMPTZ,
  traite_par UUID REFERENCES auth.users(id)
);

-- Colonnes de compatibilité étendue
ALTER TABLE public.inscriptions ADD COLUMN IF NOT EXISTS nom_parent TEXT;
ALTER TABLE public.inscriptions ADD COLUMN IF NOT EXISTS categorie TEXT;

ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit inscription" ON public.inscriptions;
CREATE POLICY "Public can submit inscription" ON public.inscriptions FOR INSERT WITH CHECK (statut = 'EN_ATTENTE');

DROP POLICY IF EXISTS "Admins and Staff can view all inscriptions" ON public.inscriptions;
CREATE POLICY "Admins and Staff can view all inscriptions" ON public.inscriptions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and Staff can update inscriptions" ON public.inscriptions;
CREATE POLICY "Admins and Staff can update inscriptions" ON public.inscriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete inscriptions" ON public.inscriptions;
CREATE POLICY "Admins can delete inscriptions" ON public.inscriptions FOR DELETE TO authenticated USING (true);`;
    navigator.clipboard.writeText(sql);
    toast.success('Script SQL copié ! Collez-le dans l\'éditeur SQL de votre Supabase.');
  };

  return (
    <div>
      {/* HEADER DE LA PAGE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        {!embedded ? (
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Inscriptions en Attente</h1>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>Examinez les dossiers d'adhésion en ligne, vérifiez les pièces justificatives et intégrez les nouveaux membres.</p>
          </div>
        ) : (
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Validation des Inscriptions</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Examinez les dossiers soumis et intégrez directement les nouveaux membres.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Composant Standard Ouverture / Fermeture des Inscriptions */}
          <RegistrationStatusToggle />

          <Button 
            variant="secondary" 
            onClick={() => {
              fetchInscriptions();
              toast.success("Demandes actualisées !");
            }}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Rafraîchir les demandes depuis la base de données"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualiser
          </Button>

          <Button 
            variant="primary" 
            onClick={() => setIsAddModalOpen(true)}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb', borderColor: '#2563eb' }}
            title="Saisir manuellement une nouvelle demande d'inscription"
          >
            <Plus size={15} /> Nouvelle Demande
          </Button>

          <Button 
            variant="secondary" 
            onClick={async () => {
              try {
                toast.loading("Génération du formulaire officiel vierge...", { id: 'blank-pdf-admin' });
                await generateOfficialRegistrationFormPdf({ isBlank: true, fraisInscription, cotisationAdhesion });
                toast.success("Formulaire vierge téléchargé !", { id: 'blank-pdf-admin' });
              } catch (e) {
                toast.error("Erreur: " + e.message, { id: 'blank-pdf-admin' });
              }
            }}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Télécharger le formulaire d'inscription officiel vierge (PDF)"
          >
            <Download size={15} /> Formulaire Vierge (PDF)
          </Button>
          <Button 
            variant="secondary" 
            onClick={copyPublicLink}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Copier le lien du formulaire public à partager aux athlètes"
          >
            <Copy size={15} /> Copier le lien
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => window.open('/inscription', '_blank')}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Ouvrir la page publique d'inscription dans un nouvel onglet"
          >
            <ExternalLink size={15} /> Formulaire Public
          </Button>
        </div>
      </div>

      {/* BANDEAU SI LA TABLE SUPABASE N'EST PAS ENCORE EXÉCUTÉE */}
      {isTableMissing && (
        <div 
          className="p-3 mb-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-sm"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#f8fafc' }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#f59e0b' }}>Activation de la base Supabase :</strong> Exécutez le script SQL dans votre console Supabase pour la synchronisation multi-appareils.
            </div>
          </div>
          <Button 
            variant="secondary"
            onClick={copySqlScript}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#f59e0b', color: '#000', fontWeight: 700, borderColor: '#f59e0b', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Copy size={14} /> Copier le Script SQL (1-clic)
          </Button>
        </div>
      )}

      {/* 1. DISPOSITION COMPACTE HORIZONTALE DES CARTES STATISTIQUES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-3 flex items-center justify-between" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>En attente</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.1 }}>{stats.pending}</div>
          </div>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={18} />
          </div>
        </Card>

        <Card className="p-3 flex items-center justify-between" style={{ borderLeft: '4px solid #10b981' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Validées</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-success)', lineHeight: 1.1 }}>{stats.validated}</div>
          </div>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
            <CheckCircle size={18} />
          </div>
        </Card>

        <Card className="p-3 flex items-center justify-between" style={{ borderLeft: '4px solid #ef4444' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Rejetées</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-danger)', lineHeight: 1.1 }}>{stats.rejected}</div>
          </div>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' }}>
            <XCircle size={18} />
          </div>
        </Card>

        <Card className="p-3 flex items-center justify-between" style={{ borderLeft: '4px solid #6366f1' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Dossiers</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#818cf8', lineHeight: 1.1 }}>{stats.total}</div>
          </div>
          <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Users size={18} />
          </div>
        </Card>
      </div>

      {/* BANDEAU FLOTTANT D'ACTIONS EN MASSE (BULK ACTIONS) */}
      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 mb-4 rounded-xl flex flex-wrap justify-between items-center gap-3"
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
              {selectedIds.length} dossier(s) sélectionné(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="primary" 
              onClick={handleBulkValidate}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--accent-success)', borderColor: 'var(--accent-success)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={15} /> Valider les sélectionnés
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleBulkReject}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <XCircle size={15} /> Rejeter
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleBulkDelete}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Supprimer définitivement la sélection"
            >
              <Trash2 size={15} /> Supprimer ({selectedIds.length})
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setSelectedIds([])}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            >
              Désélectionner
            </Button>
          </div>
        </motion.div>
      )}

      {/* ONGLETS & RECHERCHE */}
      <Card className="mb-6">
        <div className="p-3 px-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-[rgba(255,255,255,0.06)]">
          {/* Tabs */}
          <div className="flex gap-2">
            <button 
              className={`tab-btn ${activeTab === 'EN_ATTENTE' ? 'active' : ''}`}
              onClick={() => { setActiveTab('EN_ATTENTE'); setSelectedIds([]); }}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', backgroundColor: activeTab === 'EN_ATTENTE' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: activeTab === 'EN_ATTENTE' ? '#fff' : 'var(--text-muted)' }}
            >
              En attente ({stats.pending})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'VALIDE' ? 'active' : ''}`}
              onClick={() => { setActiveTab('VALIDE'); setSelectedIds([]); }}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', backgroundColor: activeTab === 'VALIDE' ? 'var(--accent-success)' : 'rgba(255,255,255,0.05)', color: activeTab === 'VALIDE' ? '#fff' : 'var(--text-muted)' }}
            >
              Validées ({stats.validated})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'REJETE' ? 'active' : ''}`}
              onClick={() => { setActiveTab('REJETE'); setSelectedIds([]); }}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', backgroundColor: activeTab === 'REJETE' ? 'var(--accent-danger)' : 'rgba(255,255,255,0.05)', color: activeTab === 'REJETE' ? '#fff' : 'var(--text-muted)' }}
            >
              Rejetées ({stats.rejected})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => { setActiveTab('ALL'); setSelectedIds([]); }}
              style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', backgroundColor: activeTab === 'ALL' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === 'ALL' ? '#fff' : 'var(--text-muted)' }}
            >
              Toutes ({stats.total})
            </button>
          </div>

          {/* Recherche & Actualisation */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Rechercher par nom, dossier..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '0.8rem', paddingBlock: '0.4rem' }}
              />
            </div>
            <button
              onClick={() => fetchInscriptions()}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.65rem', borderRadius: '8px' }}
              title="Actualiser les inscriptions"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* LISTE DES DOSSIERS */}
        {loading ? (
          <div className="p-6 flex flex-col gap-3">
            <Skeleton height="45px" />
            <Skeleton height="45px" />
            <Skeleton height="45px" />
          </div>
        ) : filteredInscriptions.length === 0 ? (
          <div className="p-10 text-center text-muted">
            <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
            <p style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Aucun dossier d'inscription dans cette vue
            </p>
            <p style={{ fontSize: '0.82rem', maxWidth: '460px', margin: '0 auto 1.25rem', color: 'var(--text-muted)' }}>
              Les pré-inscriptions soumises via le portail public apparaîtront automatiquement ici en temps réel.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button 
                variant="secondary" 
                onClick={() => fetchInscriptions()}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Actualiser la liste
              </Button>
              <Button 
                variant="primary" 
                onClick={() => window.open('/inscription', '_blank')}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} /> Ouvrir le portail d'inscription
              </Button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-left border-collapse" style={{ minWidth: '920px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th className="p-3 px-4" style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filteredInscriptions.length && filteredInscriptions.length > 0}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: 'pointer', accentColor: '#6366f1', width: '16px', height: '16px' }}
                    />
                  </th>
                  <th className="p-3">Dossier</th>
                  <th className="p-3">Candidat & Âge</th>
                  <th className="p-3">Section</th>
                  <th className="p-3">Contact Rapide</th>
                  <th className="p-3">Pièces Jointes</th>
                  <th className="p-3">Frais Inscription</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInscriptions.map((item) => {
                  const age = calculateAge(item.date_naissance);
                  const isMinor = age !== null && age < 18;
                  const waNumber = formatWhatsAppPhone(item.telephone_parent || item.telephone);
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent'
                      }}
                    >
                      {/* Checkbox */}
                      <td className="p-3 px-4">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          style={{ cursor: 'pointer', accentColor: '#6366f1', width: '16px', height: '16px' }}
                        />
                      </td>

                      {/* Dossier & Date */}
                      <td className="p-3">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                          {item.numero_dossier}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(item.date_demande).toLocaleDateString('fr-FR')}
                        </div>
                      </td>

                      {/* Candidat + Calcul Âge automatique */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.photo ? (
                              <img src={item.photo} alt={item.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Camera size={16} color="var(--text-muted)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                              {item.nom?.toUpperCase()} {item.prenom}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                              {item.date_naissance ? (
                                <>
                                  {new Date(item.date_naissance).toLocaleDateString('fr-FR')} · <strong style={{ color: '#10b981' }}>{age} ans</strong> ({item.sexe})
                                </>
                              ) : item.sexe}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Section */}
                      <td className="p-3 font-medium" style={{ fontSize: '0.85rem' }}>
                        {item.groupes?.nom || item.groupe_nom || <span className="text-muted">Non spécifié</span>}
                      </td>

                      {/* Contact Rapide (tel: et WhatsApp cliquable) */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <a 
                            href={`tel:${item.telephone}`} 
                            style={{ color: 'var(--text-primary)', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 600 }}
                            title="Appeler l'adhérent"
                          >
                            {item.telephone}
                          </a>
                          {waNumber && (
                            <a 
                              href={`https://wa.me/${waNumber}?text=Bonjour%20${encodeURIComponent(item.prenom || '')},%20concernant%20votre%20pré-inscription%20à%20Ovia%20Sport...`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center', padding: '2px', borderRadius: '4px', backgroundColor: 'rgba(37, 211, 102, 0.1)' }}
                              title="Contacter immédiatement sur WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}
                        </div>
                        {item.telephone_parent && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Parent : <a href={`tel:${item.telephone_parent}`} style={{ color: 'var(--text-muted)' }}>{item.telephone_parent}</a>
                          </div>
                        )}
                      </td>

                      {/* 2. LISIBILITÉ AMÉLIORÉE DES PIÈCES JOINTES (Vert ✔ / Rouge ❌) */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {/* Photo */}
                          <span 
                            title={item.photo ? "Photo d'identité fournie" : "Photo d'identité manquante"}
                            style={{ 
                              padding: '2px 6px', 
                              borderRadius: '6px', 
                              fontSize: '0.68rem', 
                              fontWeight: 700, 
                              backgroundColor: item.photo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                              color: item.photo ? '#10b981' : '#ef4444' 
                            }}
                          >
                            Photo {item.photo ? '✔' : '❌'}
                          </span>

                          {/* Certificat médical */}
                          <span 
                            title={item.certificat_medical ? "Certificat médical d'aptitude fourni" : "Certificat médical manquant"}
                            style={{ 
                              padding: '2px 6px', 
                              borderRadius: '6px', 
                              fontSize: '0.68rem', 
                              fontWeight: 700, 
                              backgroundColor: item.certificat_medical ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                              color: item.certificat_medical ? '#10b981' : '#ef4444' 
                            }}
                          >
                            Médical {item.certificat_medical ? '✔' : '❌'}
                          </span>

                          {/* Extrait de naissance */}
                          <span 
                            title={item.extrait_naissance ? "Extrait de naissance fourni" : "Extrait de naissance manquant"}
                            style={{ 
                              padding: '2px 6px', 
                              borderRadius: '6px', 
                              fontSize: '0.68rem', 
                              fontWeight: 700, 
                              backgroundColor: item.extrait_naissance ? 'rgba(2, 132, 199, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                              color: item.extrait_naissance ? '#0284c7' : '#ef4444' 
                            }}
                          >
                            Extrait {item.extrait_naissance ? '✔' : '❌'}
                          </span>

                          {/* Autorisation parentale (Obligatoire si mineur) */}
                          {isMinor ? (
                            <span 
                              title={item.autorisation_parentale ? "Autorisation parentale signée fournie" : "Autorisation parentale obligatoire manquante"}
                              style={{ 
                                padding: '2px 6px', 
                                borderRadius: '6px', 
                                fontSize: '0.68rem', 
                                fontWeight: 700, 
                                backgroundColor: item.autorisation_parentale ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                                color: item.autorisation_parentale ? '#10b981' : '#ef4444' 
                              }}
                            >
                              Parent {item.autorisation_parentale ? '✔' : '❌'}
                            </span>
                          ) : (
                            <span style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                              Majeur
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut Financier / Frais d'inscription */}
                      <td className="p-3">
                        {item.statut === 'VALIDE' ? (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            Payé
                          </span>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                            À encaisser
                          </span>
                        )}
                      </td>

                      {/* Statut Global */}
                      <td className="p-3">
                        {item.statut === 'EN_ATTENTE' && (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                            En Attente
                          </span>
                        )}
                        {item.statut === 'VALIDE' && (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
                            Validée
                          </span>
                        )}
                        {item.statut === 'REJETE' && (
                          <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' }}>
                            Rejetée
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="secondary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedInscription(item)}
                            title="Examiner le dossier complet et les pièces justificatives"
                          >
                            <Eye size={14} /> Examiner
                          </Button>
                          
                          {item.statut === 'EN_ATTENTE' && (
                            <>
                              <Button 
                                variant="primary" 
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', backgroundColor: 'var(--accent-success)', borderColor: 'var(--accent-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleSingleValidate(item)}
                                title="Valider et intégrer directement avec Badge QR"
                              >
                                <CheckCircle size={14} /> Valider
                              </Button>
                              <Button 
                                variant="secondary" 
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                                onClick={() => setRejectionModal({ isOpen: true, inscriptionIds: [item.id], athleteName: `${item.nom?.toUpperCase()} ${item.prenom}`, motif: 'Certificat médical non conforme ou illisible' })}
                                title="Rejeter le dossier"
                              >
                                <XCircle size={14} />
                              </Button>
                            </>
                          )}

                          <Button 
                            variant="secondary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                            onClick={() => {
                              if (window.confirm("Supprimer définitivement ce dossier d'inscription ?")) {
                                deleteInscription(item.id);
                              }
                            }}
                            title="Supprimer"
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
        )}
      </Card>

      {/* MODALE D'EXAMEN DÉTAILLÉ DU DOSSIER */}
      {selectedInscription && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-panel" style={{
            width: '860px',
            maxWidth: '96vw',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-[rgba(255,255,255,0.1)]" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-3">
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Dossier d'Inscription : {selectedInscription.numero_dossier}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Déposé le {new Date(selectedInscription.date_demande).toLocaleDateString('fr-FR')} à {new Date(selectedInscription.date_demande).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInscription(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6" style={{ overflowY: 'auto', flex: 1 }}>
              {/* Profil & Coordonnées */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Photo de profil */}
                <div className="text-center">
                  <div style={{ width: '130px', height: '160px', borderRadius: '12px', overflow: 'hidden', margin: '0 auto 8px', border: '2px solid rgba(99, 102, 241, 0.4)', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedInscription.photo ? (
                      <img src={selectedInscription.photo} alt="Photo profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div className="text-danger text-xs p-2 font-semibold">Photo non fournie ❌</div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Photo d'identité (Badge QR)</span>
                </div>

                {/* Données personnelles */}
                <div className="md:col-span-2 flex flex-col justify-between">
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedInscription.nom?.toUpperCase()} {selectedInscription.prenom}
                    </h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                      Section : {selectedInscription.groupes?.nom || selectedInscription.groupe_nom || 'Non spécifié'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <span className="text-muted block text-xs">Date & Lieu de Naissance :</span>
                      <strong>
                        {selectedInscription.date_naissance ? new Date(selectedInscription.date_naissance).toLocaleDateString('fr-FR') : '-'}
                        {selectedInscription.lieu_naissance ? ` à ${selectedInscription.lieu_naissance}` : ''}
                        {calculateAge(selectedInscription.date_naissance) !== null && (
                          <span style={{ color: '#10b981', marginLeft: '4px' }}>({calculateAge(selectedInscription.date_naissance)} ans)</span>
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Téléphone :</span>
                      <a href={`tel:${selectedInscription.telephone}`} style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
                        {selectedInscription.telephone}
                      </a>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Contact Parent / Tuteur :</span>
                      <strong>{selectedInscription.telephone_parent || 'Non renseigné'}</strong>
                    </div>
                    <div>
                      <span className="text-muted block text-xs">Adresse :</span>
                      <span>{selectedInscription.adresse || 'Non renseignée'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pièces Justificatives */}
              <div className="mb-6">
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pièces Justificatives Joints
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Certificat Médical */}
                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${selectedInscription.certificat_medical ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm flex items-center gap-2">
                        <HeartPulse size={16} color={selectedInscription.certificat_medical ? '#10b981' : '#ef4444'} /> Certificat Médical
                      </span>
                      {selectedInscription.certificat_medical ? (
                        <Button 
                          variant="secondary" 
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setDocumentViewer({ isOpen: true, title: 'Certificat Médical', src: selectedInscription.certificat_medical })}
                        >
                          <Eye size={13} /> Visualiser
                        </Button>
                      ) : (
                        <span className="text-danger text-xs font-bold">Non fourni ❌</span>
                      )}
                    </div>
                    <span className="text-xs text-muted block">
                      {selectedInscription.certificat_medical ? 'Document téléversé par le candidat' : 'Obligatoire avant délivrance du badge officiel'}
                    </span>
                  </div>

                  {/* Extrait de Naissance */}
                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: `1px solid ${selectedInscription.extrait_naissance ? 'rgba(2, 132, 199, 0.3)' : 'rgba(255, 255, 255, 0.08)'}` }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm flex items-center gap-2">
                        <FileText size={16} color={selectedInscription.extrait_naissance ? '#0284c7' : '#94a3b8'} /> Extrait de Naissance
                      </span>
                      {selectedInscription.extrait_naissance ? (
                        <Button 
                          variant="secondary" 
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setDocumentViewer({ isOpen: true, title: 'Extrait de Naissance', src: selectedInscription.extrait_naissance })}
                        >
                          <Eye size={13} /> Visualiser
                        </Button>
                      ) : (
                        <span className="text-muted text-xs">Non fourni</span>
                      )}
                    </div>
                    <span className="text-xs text-muted block">
                      {selectedInscription.extrait_naissance ? 'Justificatif d\'état civil téléversé' : 'À vérifier lors du dépôt physique'}
                    </span>
                  </div>

                  {/* Autorisation Parentale */}
                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm flex items-center gap-2">
                        <ShieldCheck size={16} color={selectedInscription.autorisation_parentale ? '#10b981' : '#f59e0b'} /> Autorisation Parentale
                      </span>
                      {selectedInscription.autorisation_parentale ? (
                        <Button 
                          variant="secondary" 
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => setDocumentViewer({ isOpen: true, title: 'Autorisation Parentale', src: selectedInscription.autorisation_parentale })}
                        >
                          <Eye size={13} /> Visualiser
                        </Button>
                      ) : (
                        <span className="text-muted text-xs">Non fournie</span>
                      )}
                    </div>
                    <span className="text-xs text-muted block">
                      {selectedInscription.autorisation_parentale ? 'Document d\'autorisation disponible' : 'Requise pour les athlètes de moins de 18 ans'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. OPTION DE PAIEMENT LORS DE LA VALIDATION */}
              {selectedInscription.statut === 'EN_ATTENTE' && (
                <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 font-bold text-sm text-white cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={paymentForm.isPaid}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, isPaid: e.target.checked }))}
                        style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                      />
                      <span>Encaisser Frais d'inscription ({fraisInscription} DA) & Droits d'adhésion ({cotisationAdhesion} DA) = {totalAdhesion} DA</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Active immédiatement la carte d'accès</span>
                  </div>

                  {paymentForm.isPaid && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="form-label text-xs font-semibold">Montant payé (DA)</label>
                        <input 
                          type="number"
                          value={paymentForm.montant}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, montant: e.target.value }))}
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label className="form-label text-xs font-semibold">Mode de règlement</label>
                        <select 
                          value={paymentForm.modePaiement}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, modePaiement: e.target.value }))}
                          className="form-select"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <option value="Espèces">Espèces</option>
                          <option value="Virement">Virement</option>
                          <option value="Chèque">Chèque</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label text-xs font-semibold">Période couverte jusqu'au</label>
                        <input 
                          type="date"
                          value={paymentForm.periodeFin}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, periodeFin: e.target.value }))}
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Remarques médicales & Loi 18-07 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-muted block text-xs mb-1 font-semibold">Observations Médicales :</span>
                  <span className="text-sm">{selectedInscription.observations_medicales || 'Aucune observation signalée.'}</span>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span className="text-success block text-xs mb-1 font-semibold">Conformité Loi 18-07 :</span>
                  <span className="text-xs text-slate-300">✔ Consentement explicite au traitement des données & acceptation du règlement validés.</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 flex flex-wrap justify-between items-center gap-3 border-t border-[rgba(255,255,255,0.1)]" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setSelectedInscription(null)}>
                  Fermer
                </Button>
                <Button 
                  variant="secondary"
                  onClick={async () => {
                    try {
                      toast.loading("Génération de la fiche d'inscription officielle...", { id: 'print-dossier' });
                      await generateOfficialRegistrationFormPdf({
                        data: selectedInscription,
                        numeroDossier: selectedInscription.numero_dossier,
                        photoBase64: selectedInscription.photo,
                        fraisInscription,
                        cotisationAdhesion,
                        selectedGroupeNom: selectedInscription.groupes?.nom || selectedInscription.groupe_nom
                      });
                      toast.success("Fiche PDF générée et téléchargée !", { id: 'print-dossier' });
                    } catch (e) {
                      toast.error("Erreur: " + e.message, { id: 'print-dossier' });
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Télécharger la fiche officielle complète au format PDF"
                >
                  <Printer size={15} /> Fiche Officielle (PDF)
                </Button>
                <Button 
                  variant="secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={async () => {
                    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le dossier de ${selectedInscription.nom?.toUpperCase()} ${selectedInscription.prenom} ?`)) {
                      await deleteInscription(selectedInscription.id);
                      setSelectedInscription(null);
                    }
                  }}
                  title="Supprimer définitivement ce dossier"
                >
                  <Trash2 size={15} /> Supprimer le dossier
                </Button>
              </div>

              {selectedInscription.statut === 'EN_ATTENTE' && (
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                    onClick={() => setRejectionModal({ isOpen: true, inscriptionIds: [selectedInscription.id], athleteName: `${selectedInscription.nom?.toUpperCase()} ${selectedInscription.prenom}`, motif: 'Certificat médical non conforme ou illisible' })}
                  >
                    <XCircle size={16} /> Rejeter
                  </Button>
                  <Button 
                    variant="primary" 
                    style={{ backgroundColor: 'var(--accent-success)', borderColor: 'var(--accent-success)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleSingleValidate(selectedInscription)}
                  >
                    <CheckCircle size={16} /> Valider l'inscription & Générer Badge
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE REJET (INDIVIDUEL OU BULK) */}
      {rejectionModal.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(5px)'
        }}>
          <Card style={{ width: '500px', maxWidth: '96vw', border: '1px solid rgba(239, 68, 68, 0.4)' }} className="p-6">
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} /> Rejeter la demande d'inscription
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Dossier : <strong>{rejectionModal.athleteName}</strong>
            </p>

            <div className="mb-4">
              <label className="form-label text-sm font-semibold">Motif du rejet :</label>
              <textarea 
                rows={3} 
                value={rejectionModal.motif}
                onChange={(e) => setRejectionModal(prev => ({ ...prev, motif: e.target.value }))}
                className="form-input"
                placeholder="Indiquez pourquoi ce dossier ne peut pas être accepté..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setRejectionModal({ isOpen: false, inscriptionIds: [], athleteName: '', motif: '' })}
              >
                Annuler
              </Button>
              <Button 
                variant="primary" 
                style={{ backgroundColor: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}
                onClick={handleConfirmRejection}
              >
                Confirmer le rejet
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* VISIONNEUSE DE DOCUMENTS */}
      {documentViewer.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="flex justify-between items-center w-full max-w-4xl mb-3 text-white">
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{documentViewer.title}</h3>
            <button 
              onClick={() => setDocumentViewer({ isOpen: false, title: '', src: null })}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px' }}
            >
              <X size={26} />
            </button>
          </div>

          <div style={{ maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto', backgroundColor: '#1e293b', borderRadius: '12px', padding: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            {documentViewer.src?.startsWith('data:application/pdf') ? (
              <iframe src={documentViewer.src} title="Document PDF" style={{ width: '800px', height: '70vh', border: 'none', maxWidth: '85vw' }} />
            ) : (
              <img src={documentViewer.src} alt={documentViewer.title} style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: '8px' }} />
            )}
          </div>
        </div>
      )}

      {/* MODALE DU BADGE QR APRÈS VALIDATION */}
      {validatedAthleteBadge && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(6px)'
        }}>
          <Card className="p-6 text-center" style={{ maxWidth: '560px', width: '100%', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Athlète Validé & Carte d'Accès Créée !
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {validatedAthleteBadge.nom?.toUpperCase()} {validatedAthleteBadge.prenom} a été intégré. Voici son Badge QR officiel prêt à être imprimé.
            </p>

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <BadgeGenerator athlete={validatedAthleteBadge} showEndDate={true} />
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setValidatedAthleteBadge(null)}>
                Fermer
              </Button>
              <Button 
                variant="primary" 
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Imprimer le Badge
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODALE DE CRÉATION MANUELLE D'UNE DEMANDE */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 125,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(6px)'
        }}>
          <Card className="p-6 w-full max-w-lg shadow-2xl border border-slate-700/60" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white m-0">Nouvelle Demande d'Inscription</h3>
                  <p className="text-xs text-slate-400 m-0">Saisie manuelle pour un athlète ou adhésion sur place</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNewInscription} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EX: BENALI"
                    value={newInscription.nom}
                    onChange={(e) => setNewInscription({ ...newInscription, nom: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prénom <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Anis"
                    value={newInscription.prenom}
                    onChange={(e) => setNewInscription({ ...newInscription, prenom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date de Naissance <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newInscription.date_naissance}
                    onChange={(e) => setNewInscription({ ...newInscription, date_naissance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lieu de Naissance
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Alger, Oran, Sétif..."
                    value={newInscription.lieu_naissance}
                    onChange={(e) => setNewInscription({ ...newInscription, lieu_naissance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sexe <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={newInscription.sexe}
                    onChange={(e) => setNewInscription({ ...newInscription, sexe: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Homme">Masculin (Homme)</option>
                    <option value="Femme">Féminin (Femme)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Photo d'identité (Badge QR)
                  </label>
                  <div className="flex items-center gap-2">
                    {newInscription.photoPreview ? (
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-blue-500 flex-shrink-0">
                        <img src={newInscription.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewInscription(prev => ({ ...prev, photo: null, photoPreview: null }))}
                          className="absolute inset-0 bg-black/60 text-rose-400 opacity-0 hover:opacity-100 flex items-center justify-center transition"
                          title="Supprimer la photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-dashed border-slate-600 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <Camera size={15} />
                      </div>
                    )}
                    <label className="cursor-pointer text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 flex-1 justify-center truncate">
                      <Upload size={13} />
                      <span>{newInscription.photoPreview ? "Changer" : "Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleModalPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom du Tuteur / Parent
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: BENALI Mohamed"
                    value={newInscription.nom_parent}
                    onChange={(e) => setNewInscription({ ...newInscription, nom_parent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Téléphone (WhatsApp) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0555123456"
                    value={newInscription.telephone}
                    onChange={(e) => setNewInscription({ ...newInscription, telephone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Section / Catégorie souhaitée
                </label>
                <select
                  value={newInscription.groupe_nom}
                  onChange={(e) => setNewInscription({ ...newInscription, groupe_nom: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="École / Éveil Aquatique">École / Éveil Aquatique</option>
                  <option value="Poussins (9-10 ans)">Poussins (9-10 ans)</option>
                  <option value="Benjamins (11-12 ans)">Benjamins (11-12 ans)</option>
                  <option value="Minimes (13-14 ans)">Minimes (13-14 ans)</option>
                  <option value="Cadets (15-16 ans)">Cadets (15-16 ans)</option>
                  <option value="Juniors (17-18 ans)">Juniors (17-18 ans)</option>
                  <option value="Seniors (18+ ans)">Seniors (18+ ans)</option>
                  <option value="Natation Adulte / Loisir">Natation Adulte / Loisir</option>
                </select>
              </div>

              {/* Documents justificatifs (Fiche d'inscription & Extrait de naissance) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Fiche / Certificat</span>
                    {newInscription.certificat_medical && <span className="text-[10px] text-emerald-400 font-bold">✔ Reçu</span>}
                  </label>
                  <label className="cursor-pointer flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-400 text-xs font-semibold transition truncate">
                    <Upload size={12} />
                    <span className="truncate">{newInscription.certificat_medical_name || "Joindre Fiche/Certif"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleModalDocUpload(e, 'certificat_medical', 'certificat_medical_name', "Fiche / Certificat")}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Extrait de Naissance</span>
                    {newInscription.extrait_naissance && <span className="text-[10px] text-emerald-400 font-bold">✔ Reçu</span>}
                  </label>
                  <label className="cursor-pointer flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-emerald-400 text-xs font-semibold transition truncate">
                    <Upload size={12} />
                    <span className="truncate">{newInscription.extrait_naissance_name || "Joindre Extrait N°12"}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleModalDocUpload(e, 'extrait_naissance', 'extrait_naissance_name', "Extrait de naissance")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observations / Remarques Médicales
                </label>
                <textarea
                  rows="2"
                  placeholder="Informations médicales, asthme, allergies, etc."
                  value={newInscription.observations_medicales}
                  onChange={(e) => setNewInscription({ ...newInscription, observations_medicales: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-700/50">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isAdding}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isAdding}
                  style={{ backgroundColor: '#2563eb', borderColor: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={15} /> {isAdding ? "Enregistrement..." : "Créer le dossier"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
