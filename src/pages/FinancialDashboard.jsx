import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { TrendingUp, Search, Download, AlertTriangle, FileText, Edit, TrendingDown, DollarSign, Trash2, Eye, Printer, X, Settings, Sliders, Coins, Sparkles, CheckCircle2, Users, MessageCircle, FileOutput } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { z } from 'zod';
import { useCotisations } from '../hooks/useCotisations';
import { useDepenses } from '../hooks/useDepenses';
import { useClubPricing } from '../hooks/useClubPricing';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Skeleton, Badge } from '../components/ui';
import { formatDA, formatDZ, formatName, formatWhatsAppPhone } from '../utils/formatters';
import { loadClubLogoBase64, generateMonthlyReportPDF } from '../utils/pdfHelpers';
import { detectSiblingGroups } from '../utils/swimmingCategories';
import { useTheme } from '../contexts/ThemeContext';

const paymentSchema = z.object({
  athlete_id: z.string().min(1, 'Veuillez sélectionner un athlète'),
  montant_paye: z.preprocess((val) => Number(val), z.number().positive('Le montant doit être supérieur à 0')),
  mode_paiement: z.enum(['Espèces', 'Virement CCP', 'BaridiMob', 'Chèque']),
  periode_couverte_fin: z.string().min(1, 'Veuillez sélectionner une date de fin'),
});

const depenseSchema = z.object({
  montant: z.preprocess((val) => Number(val), z.number().positive('Le montant doit être supérieur à 0')),
  description: z.string().min(2, 'Description requise'),
  categorie: z.enum(['Location Couloirs', 'Salaires Entraîneurs', 'Achat de Matériel', 'Frais Compétition', 'Autre']),
  date_depense: z.string().min(1, 'Date requise'),
});

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function FinancialDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { cotisations, loading: cotisLoading, fetchCotisations, deleteCotisation, addCotisation } = useCotisations();
  const { depenses, loading: depensesLoading, fetchDepenses, deleteDepense, addDepense } = useDepenses();
  const { user } = useAuth();
  const { fraisInscription, cotisationAdhesion, totalAdhesion, updatePricing } = useClubPricing();
  
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAthletes = useCallback(async () => {
    try {
      const { data: athletesData, error } = await supabase
        .from('athletes')
        .select('id, nom, prenom, telephone, contact_urgence, date_naissance, groupe, groupes(id, nom)')
        .eq('est_actif', true)
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur chargement athlètes (finances):', error);
      } else {
        setAthletes(athletesData || []);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);
  
  const [activeTab, setActiveTab] = useState('revenus'); // 'revenus' or 'depenses' or 'impayes'
  const [filterRevenueType, setFilterRevenueType] = useState('all'); // 'all', 'inscriptions', 'cotisations'

  // Modale Confirmation de Suppression
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null, // 'cotisation' | 'depense'
    item: null,
    isSubmitting: false,
  });

  const handleDeleteClick = (type, item) => {
    setDeleteModal({
      isOpen: true,
      type,
      item,
      isSubmitting: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.item) return;
    setDeleteModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      if (deleteModal.type === 'cotisation') {
        const success = await deleteCotisation(deleteModal.item.id);
        if (success) {
          setDeleteModal({ isOpen: false, type: null, item: null, isSubmitting: false });
        } else {
          setDeleteModal(prev => ({ ...prev, isSubmitting: false }));
        }
      } else if (deleteModal.type === 'depense') {
        const success = await deleteDepense(deleteModal.item.id);
        if (success) {
          setDeleteModal({ isOpen: false, type: null, item: null, isSubmitting: false });
        } else {
          setDeleteModal(prev => ({ ...prev, isSubmitting: false }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Modale Configuration Tarifs
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingFormData, setPricingFormData] = useState({ frais_inscription: 300, cotisation_adhesion: 3000 });

  useEffect(() => {
    setPricingFormData({ frais_inscription: fraisInscription, cotisation_adhesion: cotisationAdhesion });
  }, [fraisInscription, cotisationAdhesion]);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    await updatePricing(pricingFormData);
    setShowPricingModal(false);
  };
  
  // Forms (Encaisser & Dépense)
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const getDefaultFinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const initialFormState = { athlete_id: '', montant_paye: '', mode_paiement: 'Espèces', periode_couverte_fin: getDefaultFinDate() };
  const [formData, setFormData] = useState(initialFormState);
  
  const [showDepenseForm, setShowDepenseForm] = useState(false);
  const [editingDepenseId, setEditingDepenseId] = useState(null);
  const initialDepenseState = { montant: '', description: '', categorie: 'Location Couloirs', date_depense: new Date().toISOString().split('T')[0] };
  const [depenseData, setDepenseData] = useState(initialDepenseState);

  const siblingMap = useMemo(() => detectSiblingGroups(athletes), [athletes]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      paymentSchema.parse(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0]?.message || 'Données invalides');
        return;
      }
    }
    try {
      setLoading(true);
      if (editingPaymentId) {
        const { error } = await supabase.from('cotisations').update(formData).eq('id', editingPaymentId);
        if (error) throw error;
        toast.success('Paiement modifié avec succès !');
        await fetchCotisations();
      } else {
        await addCotisation(formData);
      }
      setShowPaymentForm(false);
      setEditingPaymentId(null);
      setFormData(initialFormState);
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDepenseSubmit = async (e) => {
    e.preventDefault();
    try {
      depenseSchema.parse(depenseData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0]?.message || 'Données invalides');
        return;
      }
    }
    try {
      setLoading(true);
      if (editingDepenseId) {
        const { error } = await supabase.from('depenses').update(depenseData).eq('id', editingDepenseId);
        if (error) throw error;
        toast.success('Dépense modifiée avec succès !');
        await fetchDepenses();
      } else {
        await addDepense({
          ...depenseData,
          created_by: user?.id
        });
      }
      setShowDepenseForm(false);
      setEditingDepenseId(null);
      setDepenseData(initialDepenseState);
    } catch (error) {
      toast.error('Erreur : ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Filters
  const [searchName, setSearchName] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchCotisations();
    fetchDepenses();
    fetchAthletes();
  }, [fetchCotisations, fetchDepenses, fetchAthletes]);

  useEffect(() => {
    if (showPaymentForm && athletes.length === 0) {
      fetchAthletes();
    }
  }, [showPaymentForm, athletes.length, fetchAthletes]);

  const filteredCotisations = useMemo(() => {
    let result = [...cotisations];
    if (searchName) {
      result = result.filter(c => 
        c.athletes?.nom?.toLowerCase().includes(searchName.toLowerCase()) || 
        c.athletes?.prenom?.toLowerCase().includes(searchName.toLowerCase())
      );
    }
    if (filterMonth !== 'all') {
      result = result.filter(c => new Date(c.date_paiement).getMonth() === parseInt(filterMonth));
    }
    if (filterYear !== 'all') {
      result = result.filter(c => new Date(c.date_paiement).getFullYear() === parseInt(filterYear));
    }
    if (filterRevenueType === 'inscriptions') {
      result = result.filter(c => Number(c.montant_paye) > 3000 || Number(c.montant_paye) === totalAdhesion); // Heuristique simple
    } else if (filterRevenueType === 'cotisations') {
      result = result.filter(c => Number(c.montant_paye) <= 3000);
    }
    return result.sort((a,b) => new Date(b.date_paiement) - new Date(a.date_paiement));
  }, [cotisations, searchName, filterMonth, filterYear, filterRevenueType, totalAdhesion]);
  
  const filteredDepenses = useMemo(() => {
    let result = [...depenses];
    if (searchName) {
      result = result.filter(d => d.description.toLowerCase().includes(searchName.toLowerCase()));
    }
    if (filterMonth !== 'all') {
      result = result.filter(d => new Date(d.date_depense).getMonth() === parseInt(filterMonth));
    }
    if (filterYear !== 'all') {
      result = result.filter(d => new Date(d.date_depense).getFullYear() === parseInt(filterYear));
    }
    return result.sort((a,b) => new Date(b.date_depense) - new Date(a.date_depense));
  }, [depenses, searchName, filterMonth, filterYear]);

  const stats = useMemo(() => {
    // Calcul basé sur les éléments FILTRÉS (ou totaux selon le besoin, ici on veut le total de la période filtrée)
    const totalRev = filteredCotisations.reduce((sum, c) => sum + Number(c.montant_paye), 0);
    const totalDep = filteredDepenses.reduce((sum, d) => sum + Number(d.montant), 0);
    
    // Heuristique : Nouvelle Inscription = Montant > 3000 (ex: 3300)
    const inscriptionsList = filteredCotisations.filter(c => Number(c.montant_paye) > 3000 || Number(c.montant_paye) === totalAdhesion);
    const renouvellementsList = filteredCotisations.filter(c => Number(c.montant_paye) <= 3000);

    const totalFraisInscription = inscriptionsList.reduce((sum, c) => sum + Number(c.montant_paye), 0);
    const totalCotisationsSportives = renouvellementsList.reduce((sum, c) => sum + Number(c.montant_paye), 0);

    // Groupement des dépenses pour le PieChart
    const depMap = {};
    filteredDepenses.forEach(d => {
      const cat = d.categorie || 'Autre';
      if (!depMap[cat]) depMap[cat] = 0;
      depMap[cat] += Number(d.montant);
    });
    const depensesByCategory = Object.keys(depMap).map(k => ({ name: k, value: depMap[k] }));

    return { 
      totalRevenue: totalRev, 
      totalFraisInscription,
      countFraisInscription: inscriptionsList.length,
      totalCotisationsSportives,
      countCotisations: renouvellementsList.length,
      totalDepenses: totalDep,
      beneficeNet: totalRev - totalDep,
      depensesByCategory
    };
  }, [filteredCotisations, filteredDepenses, totalAdhesion]);

  const expiredList = useMemo(() => {
    const now = new Date();
    const lastCotisMap = new Map();
    cotisations.forEach(c => {
      if (c.athlete_id && c.periode_couverte_fin) {
        const existing = lastCotisMap.get(c.athlete_id);
        const curDate = new Date(c.periode_couverte_fin);
        if (!existing || curDate > new Date(existing.periode_couverte_fin)) {
          lastCotisMap.set(c.athlete_id, c);
        }
      }
    });

    const list = [];
    lastCotisMap.forEach((c) => {
      if (new Date(c.periode_couverte_fin) < now) {
        const athlete = athletes.find(a => a.id === c.athlete_id);
        if (athlete) {
          list.push({ 
            ...c, 
            athletes: athlete, 
            endDateStr: new Date(c.periode_couverte_fin).toLocaleDateString('fr-FR') 
          });
        }
      }
    });
    return list.sort((a,b) => new Date(a.periode_couverte_fin) - new Date(b.periode_couverte_fin));
  }, [cotisations, athletes]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchName, filterMonth, filterYear, filterRevenueType]);
  const currentList = activeTab === 'revenus' ? filteredCotisations : (activeTab === 'depenses' ? filteredDepenses : expiredList);
  const totalPages = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE));
  const paginatedList = useMemo(() => currentList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [currentList, currentPage]);

  const exportToCSV = () => {
    // Basic CSV export logic
    let headers, rows, filename;
    if (activeTab === 'revenus') {
      headers = ['Date', 'Membre', 'Montant (DZ)', 'Mode de paiement', 'Date de fin couverte'];
      rows = filteredCotisations.map(c => [
        new Date(c.date_paiement).toLocaleDateString('fr-FR'),
        `${c.athletes?.nom} ${c.athletes?.prenom}`,
        c.montant_paye,
        c.mode_paiement,
        new Date(c.periode_couverte_fin).toLocaleDateString('fr-FR')
      ]);
      filename = `revenus_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ['Date', 'Description', 'Catégorie', 'Montant (DZ)'];
      rows = filteredDepenses.map(d => [
        new Date(d.date_depense).toLocaleDateString('fr-FR'),
        d.description,
        d.categorie,
        d.montant
      ]);
      filename = `depenses_${new Date().toISOString().split('T')[0]}.csv`;
    }
    const BOM = "\uFEFF";
    const csvContent = BOM + headers.join(";") + "\n" + rows.map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleMonthlyReport = async () => {
    const toastId = toast.loading('Génération du rapport de clôture...');
    try {
      await generateMonthlyReportPDF(stats, filterMonth, filterYear);
      toast.success('Rapport PDF généré !', { id: toastId });
    } catch (err) {
      toast.error('Erreur lors de la génération', { id: toastId });
      console.error(err);
    }
  };

  // ----- RECUS PDF GENERATION -----
  const generatePDFReceipt = async (cotisation, autoDownload = false) => {
    const toastId = toast.loading('Préparation du reçu...');
    try {
      let logoBase64 = null;
      try { logoBase64 = await loadClubLogoBase64(); } catch(e){}
      
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const receiptNumber = `OVS-REC-${cotisation.id ? cotisation.id.substring(0, 8).toUpperCase() : Date.now().toString().slice(-6)}`;
      const datePaiementStr = new Date(cotisation.date_paiement).toLocaleDateString('fr-FR');
      const endDateStr = new Date(cotisation.periode_couverte_fin).toLocaleDateString('fr-FR');
      const athleteFullName = `${(cotisation.athletes?.nom || 'NOM').toUpperCase()} ${cotisation.athletes?.prenom || ''}`;
      
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 5, 'F');
      doc.setFillColor(16, 185, 129); doc.rect(0, 5, 210, 2, 'F');
      if (logoBase64) doc.addImage(logoBase64, 'JPEG', 18, 12, 22, 22);
      
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(15, 23, 42);
      doc.text('OVIA SPORT', 45, 18);
      doc.setFontSize(8.5); doc.setTextColor(16, 185, 129);
      doc.text('REÇU DE PAIEMENT', 45, 23.5);

      doc.setFillColor(248, 250, 252); doc.roundedRect(140, 11, 52, 24, 3, 3, 'F');
      doc.setFontSize(8.5); doc.setTextColor(15, 23, 42);
      doc.text(receiptNumber, 166, 18, { align: 'center' });
      doc.setTextColor(100, 116, 139); doc.text(`Date: ${datePaiementStr}`, 166, 26, { align: 'center' });

      doc.setDrawColor(226, 232, 240); doc.line(18, 40, 192, 40);

      doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text("ADHÉRENT :", 18, 50);
      doc.setFontSize(14); doc.setTextColor(16, 185, 129);
      doc.text(athleteFullName, 18, 58);

      doc.setFontSize(10); doc.setTextColor(15, 23, 42);
      doc.text("DÉTAILS DU RÈGLEMENT :", 18, 70);
      
      doc.setFontSize(9); doc.setTextColor(100, 116, 139);
      doc.text("Montant payé :", 18, 80); doc.setTextColor(15, 23, 42); doc.text(`${formatDA(cotisation.montant_paye)}`, 60, 80);
      doc.setTextColor(100, 116, 139); doc.text("Période couverte :", 18, 88); doc.setTextColor(15, 23, 42); doc.text(`Jusqu'au ${endDateStr}`, 60, 88);
      doc.setTextColor(100, 116, 139); doc.text("Mode de paiement :", 18, 96); doc.setTextColor(15, 23, 42); doc.text(cotisation.mode_paiement || "Espèces", 60, 96);

      doc.setFillColor(255, 255, 255); doc.roundedRect(110, 120, 82, 40, 3, 3, 'F');
      doc.setDrawColor(203, 213, 225); doc.roundedRect(110, 120, 82, 40, 3, 3, 'S');
      doc.setFontSize(8); doc.text("Cachet & Signature Ovia Sport :", 116, 127);

      doc.setDrawColor(226, 232, 240); doc.line(18, 275, 192, 275);
      doc.setFontSize(7); doc.setTextColor(148, 163, 184);
      doc.text(`Reçu généré le ${new Date().toLocaleDateString('fr-FR')} - Ne peut être modifié.`, 105, 280, { align: 'center' });

      if (autoDownload) {
        doc.save(`${receiptNumber}.pdf`);
        toast.success('Reçu téléchargé !', { id: toastId });
      } else {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        toast.dismiss(toastId);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erreur PDF', { id: toastId });
    }
  };

  const getPaymentModeBadge = (mode) => {
    switch(mode) {
      case 'BaridiMob': return <Badge style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', borderColor: 'transparent' }}>🟡 BaridiMob</Badge>;
      case 'Virement CCP': return <Badge style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', borderColor: 'transparent' }}>🔵 CCP</Badge>;
      case 'Chèque': return <Badge style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#7c3aed', borderColor: 'transparent' }}>🟣 Chèque</Badge>;
      default: return <Badge style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669', borderColor: 'transparent' }}>🟢 Espèces</Badge>;
    }
  };

  return (
    <div className="pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1>Gestion Financière</h1>
          <p className="text-muted">Revenus, Dépenses et Clôture Mensuelle</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Phase 5 : Bouton Tarifs du Club */}
          <Button variant="secondary" onClick={() => setShowPricingModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Paramètres des tarifs">
            <Settings size={16} /> Tarifs
          </Button>
          {/* Phase 5 : Bouton Clôture Mensuelle */}
          <Button variant="secondary" onClick={handleMonthlyReport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileOutput size={16} /> Clôturer le mois (PDF)
          </Button>
          <Button variant="danger" onClick={() => { setActiveTab('depenses'); setShowDepenseForm(true); setEditingDepenseId(null); setDepenseData(initialDepenseState); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={16} /> + Dépense
          </Button>
          <Button variant="primary" onClick={() => { setActiveTab('revenus'); setShowPaymentForm(true); setEditingPaymentId(null); setFormData(initialFormState); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} /> + Encaisser
          </Button>
        </div>
      </div>

      {/* FILTRES GLOBAUX */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input type="text" placeholder="Rechercher (Nom ou Description)..." className="form-input pl-10 w-full" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
            </div>
          </div>
          <select className="form-select w-auto" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="all">Tous les mois</option>
            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select className="form-select w-auto" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="all">Toutes les années</option>
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </Card>

      {/* KPI CARDS (Phase 5: Ventilation des revenus) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* REVENUS (VENTILÉS) */}
        <Card className="p-5 flex flex-col justify-between" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Encaissements Globaux</p>
              <h2 className="text-2xl font-bold" style={{ color: '#10b981' }}>+ {formatDA(stats.totalRevenue)}</h2>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><TrendingUp size={24} /></div>
          </div>
          <div className="pt-3 border-t border-[var(--border-color)]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">Nouvelles Inscriptions ({stats.countFraisInscription}) :</span>
              <span className="font-semibold">{formatDA(stats.totalFraisInscription)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Renouvellements ({stats.countCotisations}) :</span>
              <span className="font-semibold">{formatDA(stats.totalCotisationsSportives)}</span>
            </div>
          </div>
        </Card>

        {/* DÉPENSES */}
        <Card className="p-5 flex flex-col justify-between" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Décaissements Globaux</p>
              <h2 className="text-2xl font-bold" style={{ color: '#ef4444' }}>- {formatDA(stats.totalDepenses)}</h2>
            </div>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><TrendingDown size={24} /></div>
          </div>
          <div className="pt-3 border-t border-[var(--border-color)]">
            <p className="text-xs text-muted mb-2">Répartition des dépenses :</p>
            {stats.depensesByCategory.length === 0 ? (
              <span className="text-xs italic text-muted">Aucune dépense</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.depensesByCategory.slice(0, 3).map((cat, i) => (
                  <span key={i} className="text-[10px] bg-slate-500/10 px-2 py-0.5 rounded">{cat.name}</span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* SOLDE */}
        <Card className="p-5 flex flex-col justify-between" style={{ borderLeft: `4px solid ${stats.beneficeNet >= 0 ? '#3b82f6' : '#f59e0b'}` }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Solde Net Période</p>
              <h2 className="text-2xl font-bold" style={{ color: stats.beneficeNet >= 0 ? '#3b82f6' : '#f59e0b' }}>
                {stats.beneficeNet > 0 ? '+' : ''} {formatDA(stats.beneficeNet)}
              </h2>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Coins size={24} /></div>
          </div>
          <div className="pt-3 border-t border-[var(--border-color)]">
            <p className="text-xs text-muted">Bénéfice opérationnel du club sur la période sélectionnée.</p>
          </div>
        </Card>
      </div>

      {/* GRAPHES : Revenus vs Dépenses ET Camembert Dépenses (Phase 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-base font-bold mb-4">Bilan Annuel</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={useMemo(() => {
              const m = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
              const r = Array(12).fill(0); const d = Array(12).fill(0);
              cotisations.filter(c => new Date(c.date_paiement).getFullYear() === parseInt(filterYear)).forEach(c => r[new Date(c.date_paiement).getMonth()] += Number(c.montant_paye));
              depenses.filter(x => new Date(x.date_depense).getFullYear() === parseInt(filterYear)).forEach(x => d[new Date(x.date_depense).getMonth()] += Number(x.montant));
              return m.map((name, i) => ({ name, Revenus: r[i], Dépenses: d[i] }));
            }, [cotisations, depenses, filterYear])}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} />
              <Legend iconType="circle" />
              <Bar dataKey="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Phase 5 : PieChart Dépenses */}
        <Card className="p-5 flex flex-col">
          <h3 className="text-base font-bold mb-2">Répartition des Dépenses</h3>
          <p className="text-xs text-muted mb-4">Catégorisation sur la période filtrée</p>
          <div className="flex-1 flex items-center justify-center">
            {stats.depensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.depensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {stats.depensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted">Aucune dépense.</div>
            )}
          </div>
          {/* Légende custom */}
          <div className="flex flex-wrap gap-2 mt-4">
            {stats.depensesByCategory.map((entry, index) => (
              <div key={`leg-${index}`} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                <span className="text-muted">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* GESTION DES LISTES */}
      <Card className="p-0 overflow-hidden">
        <div className="flex border-b border-[var(--border-color)]">
          <button className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'revenus' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-muted hover:bg-[var(--bg-tertiary)]'}`} onClick={() => setActiveTab('revenus')}>
            Encaissements ({filteredCotisations.length})
          </button>
          <button className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'depenses' ? 'border-[#ef4444] text-[#ef4444]' : 'border-transparent text-muted hover:bg-[var(--bg-tertiary)]'}`} onClick={() => setActiveTab('depenses')}>
            Dépenses ({filteredDepenses.length})
          </button>
          <button className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'impayes' ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-transparent text-muted hover:bg-[var(--bg-tertiary)]'}`} onClick={() => setActiveTab('impayes')}>
            Impayés / Retards ({expiredList.length})
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'revenus' && (
            <div className="table-responsive">
              <table style={{ minWidth: '850px' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Adhérent</th>
                    <th>Montant</th>
                    <th>Mode (Tags)</th>
                    <th>Période Couverte</th>
                    <th style={{ textAlign: 'right' }}>Actions (PDF / WA)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-6 text-muted">Aucun encaissement trouvé.</td></tr>
                  ) : (
                    paginatedList.map(cotis => {
                      const athleteName = cotis.athletes ? `${cotis.athletes.nom} ${cotis.athletes.prenom}` : 'Inconnu';
                      const wpPhone = cotis.athletes ? formatWhatsAppPhone(cotis.athletes.telephone || cotis.athletes.contact_urgence || cotis.athletes.telephone_tuteur) : null;
                      return (
                        <tr key={cotis.id}>
                          <td className="text-xs text-muted">{new Date(cotis.date_paiement).toLocaleDateString('fr-FR')}</td>
                          <td className="font-semibold text-sm">{athleteName}</td>
                          <td className="font-bold text-emerald-500">{formatDA(cotis.montant_paye)}</td>
                          <td>{getPaymentModeBadge(cotis.mode_paiement)}</td>
                          <td className="text-xs">Jusqu'au {new Date(cotis.periode_couverte_fin).toLocaleDateString('fr-FR')}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex justify-end items-center gap-1.5">
                              <button 
                                onClick={() => {
                                  setEditingPaymentId(cotis.id);
                                  setFormData({
                                    athlete_id: cotis.athlete_id || cotis.athletes?.id || '',
                                    montant_paye: cotis.montant_paye || '',
                                    mode_paiement: cotis.mode_paiement || 'Espèces',
                                    periode_couverte_fin: cotis.periode_couverte_fin ? cotis.periode_couverte_fin.split('T')[0] : getDefaultFinDate()
                                  });
                                  setShowPaymentForm(true);
                                }} 
                                className="btn-secondary flex items-center justify-center p-1.5 rounded text-amber-500 hover:bg-amber-500/10 cursor-pointer" 
                                title="Modifier cet encaissement"
                              >
                                <Edit size={14} />
                              </button>
                              <button onClick={() => generatePDFReceipt(cotis, true)} className="btn-secondary flex items-center justify-center p-1.5 rounded text-indigo-500 hover:bg-indigo-500/10 cursor-pointer" title="Télécharger Reçu PDF">
                                <Download size={14} />
                              </button>
                              {wpPhone && (
                                <a href={`https://wa.me/${wpPhone}?text=${encodeURIComponent(`Bonjour ${cotis.athletes?.prenom}, voici la confirmation de votre paiement de ${formatDA(cotis.montant_paye)} pour la cotisation Ovia Sport (valable jusqu'au ${new Date(cotis.periode_couverte_fin).toLocaleDateString('fr-FR')}). Merci !`)}`} target="_blank" rel="noreferrer" className="btn-secondary flex items-center justify-center p-1.5 rounded text-[#25D366] hover:bg-[#25D366]/10" title="Envoyer Reçu WhatsApp">
                                  <MessageCircle size={14} />
                                </a>
                              )}
                              <button 
                                onClick={() => handleDeleteClick('cotisation', cotis)} 
                                className="btn-secondary flex items-center justify-center p-1.5 rounded text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer" 
                                title="Supprimer cet encaissement"
                              >
                                <Trash2 size={14} />
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
          )}

          {activeTab === 'depenses' && (
            <div className="table-responsive">
              <table style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Catégorie</th>
                    <th>Description</th>
                    <th>Montant</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-6 text-muted">Aucune dépense trouvée.</td></tr>
                  ) : (
                    paginatedList.map(dep => (
                      <tr key={dep.id}>
                        <td className="text-xs text-muted">{new Date(dep.date_depense).toLocaleDateString('fr-FR')}</td>
                        <td><Badge style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{dep.categorie}</Badge></td>
                        <td className="text-sm">{dep.description}</td>
                        <td className="font-bold text-red-500">- {formatDA(dep.montant)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex justify-end items-center gap-1.5">
                            <button 
                              onClick={() => handleDeleteClick('depense', dep)} 
                              className="btn-secondary flex items-center justify-center p-1.5 rounded text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer" 
                              title="Supprimer cette dépense"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Phase 5 : Onglet Impayés avec WhatsApp Pré-rempli */}
          {activeTab === 'impayes' && (
            <div className="table-responsive">
              <table style={{ minWidth: '700px' }}>
                <thead>
                  <tr>
                    <th>Adhérent</th>
                    <th>Groupe (Tarif)</th>
                    <th>Date d'expiration</th>
                    <th>Retard</th>
                    <th style={{ textAlign: 'right' }}>Relance Rapide</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-6 text-emerald-500 font-bold"><CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" /> Aucun impayé !</td></tr>
                  ) : (
                    paginatedList.map(cotis => {
                      const athleteName = cotis.athletes ? `${cotis.athletes.nom} ${cotis.athletes.prenom}` : 'Inconnu';
                      const wpPhone = cotis.athletes ? formatWhatsAppPhone(cotis.athletes.telephone || cotis.athletes.contact_urgence || cotis.athletes.telephone_tuteur) : null;
                      const tarif = cotisationAdhesion || 3000;
                      
                      const retardDays = Math.max(0, Math.floor((new Date() - new Date(cotis.periode_couverte_fin)) / (1000 * 60 * 60 * 24)));
                      
                      return (
                        <tr key={`imp-${cotis.id}`} style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.03)' }}>
                          <td className="font-semibold text-sm">{athleteName}</td>
                          <td className="text-xs text-muted">{cotis.athletes?.groupes?.nom || cotis.athletes?.groupe || '-'} <br/><span className="text-[10px] text-red-400">Dû : {formatDA(tarif)}</span></td>
                          <td className="text-xs font-bold text-orange-500">{cotis.endDateStr}</td>
                          <td className="text-xs font-bold text-red-500">{retardDays} jour(s)</td>
                          <td style={{ textAlign: 'right' }}>
                            {wpPhone ? (
                              <a href={`https://wa.me/${wpPhone}?text=${encodeURIComponent(`Bonjour ${cotis.athletes?.prenom}, sauf erreur de notre part, votre cotisation Ovia Sport de ${formatDA(tarif)} a expiré le ${cotis.endDateStr}. Merci de régulariser la situation à la réception. Sportivement.`)}`} target="_blank" rel="noreferrer">
                                <Button variant="secondary" style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderColor: 'transparent', padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                                  <MessageCircle size={14} style={{ marginRight: '6px' }} /> Relancer
                                </Button>
                              </a>
                            ) : (
                              <span className="text-[10px] text-muted italic">Pas de numéro</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--border-color)]">
              <span className="text-xs text-muted">Page {currentPage} sur {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.4rem 0.8rem' }}>Précédent</Button>
                <Button variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '0.4rem 0.8rem' }}>Suivant</Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* MODALE CONFIRMATION DE SUPPRESSION (ENCAISSEMENT OU DÉPENSE) */}
      {deleteModal.isOpen && deleteModal.item && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(6px)'
        }}>
          <div className="glass-panel" style={{
            width: '480px',
            maxWidth: '96vw',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
              <div className="flex items-center gap-3">
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {deleteModal.type === 'cotisation' ? "Supprimer l'encaissement" : "Supprimer la dépense"}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Confirmation définitive de suppression
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setDeleteModal({ isOpen: false, type: null, item: null, isSubmitting: false })}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 p-3.5 rounded-xl mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-400 m-0 leading-relaxed">
                  Attention : cette suppression est <strong>immédiate et irréversible</strong>. Les totaux de revenus, dépenses et le solde net seront automatiquement recalculés.
                </p>
              </div>

              {deleteModal.type === 'cotisation' ? (
                <div className="p-4 rounded-xl mb-6 text-sm flex flex-col gap-2.5" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs font-semibold">Adhérent :</span>
                    <strong className="text-sm text-[var(--text-primary)]">
                      {deleteModal.item.athletes ? `${deleteModal.item.athletes.nom} ${deleteModal.item.athletes.prenom}` : 'Inconnu'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs font-semibold">Montant encaissé :</span>
                    <strong className="text-sm font-bold text-emerald-500">
                      + {formatDA(deleteModal.item.montant_paye)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs font-semibold">Date de règlement :</span>
                    <span className="text-xs">{new Date(deleteModal.item.date_paiement).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs font-semibold">Période couverte :</span>
                    <span className="text-xs">Jusqu'au {new Date(deleteModal.item.periode_couverte_fin).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {deleteModal.item.mode_paiement && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted text-xs font-semibold">Mode de paiement :</span>
                      <span className="text-xs">{deleteModal.item.mode_paiement}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl mb-6 text-sm flex flex-col gap-2.5" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs font-semibold">Description :</span>
                    <strong className="text-sm text-[var(--text-primary)]">{deleteModal.item.description}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs font-semibold">Catégorie :</span>
                    <Badge style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {deleteModal.item.categorie}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs font-semibold">Montant décaissé :</span>
                    <strong className="text-sm font-bold text-red-500">
                      - {formatDA(deleteModal.item.montant)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-xs font-semibold">Date de dépense :</span>
                    <span className="text-xs">{new Date(deleteModal.item.date_depense).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setDeleteModal({ isOpen: false, type: null, item: null, isSubmitting: false })}
                  disabled={deleteModal.isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  type="button" 
                  style={{ backgroundColor: '#ef4444', color: 'white', borderColor: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleConfirmDelete}
                  disabled={deleteModal.isSubmitting}
                >
                  {deleteModal.isSubmitting ? 'Suppression en cours...' : (
                    <>
                      <Trash2 size={16} /> Confirmer la suppression
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE ENCAISSER / NOUVEAU PAIEMENT */}
      {showPaymentForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(6px)'
        }}>
          <div className="glass-panel" style={{
            width: '560px',
            maxWidth: '96vw',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-3">
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {editingPaymentId ? 'Modifier un Encaissement' : 'Nouvel Encaissement'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Enregistrer une cotisation ou des frais d'adhésion
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setShowPaymentForm(false); setEditingPaymentId(null); setFormData(initialFormState); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6">
              {/* Presets rapides de montant */}
              <div className="mb-4">
                <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">Montants prédéfinis :</span>
                <div className="flex flex-wrap gap-2">
                  <button 
                    type="button"
                    style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', cursor: 'pointer' }}
                    onClick={() => setFormData(prev => ({ ...prev, montant_paye: fraisInscription }))}
                  >
                    📄 Frais Dossier ({formatDA(fraisInscription)})
                  </button>
                  <button 
                    type="button"
                    style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}
                    onClick={() => setFormData(prev => ({ ...prev, montant_paye: cotisationAdhesion }))}
                  >
                    🏅 Cotisation ({formatDA(cotisationAdhesion)})
                  </button>
                  <button 
                    type="button"
                    style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer' }}
                    onClick={() => setFormData(prev => ({ ...prev, montant_paye: totalAdhesion }))}
                  >
                    🌟 Inscription Totale ({formatDA(totalAdhesion)})
                  </button>
                </div>
              </div>

              {/* Suggestion réduction fratrie */}
              {formData.athlete_id && siblingMap.has(formData.athlete_id) && (() => {
                const sib = siblingMap.get(formData.athlete_id);
                const discountRate = sib.discountPercent;
                const discountedCotis = Math.round(cotisationAdhesion * (1 - discountRate / 100));
                return (
                  <div className="p-3 rounded-lg mb-4 flex flex-wrap items-center justify-between gap-2" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '1.2rem' }}>👨‍👩‍👧‍👦</span>
                      <div>
                        <strong style={{ color: '#818cf8', fontSize: '0.85rem' }}>Fratrie Détectée ({sib.familyCount} enfants)</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {sib.siblingIndex}e enfant · Réduction : <strong style={{ color: 'var(--accent-success)' }}>{discountRate > 0 ? `-${discountRate}%` : 'Plein tarif (1er)'}</strong>
                        </div>
                      </div>
                    </div>
                    {discountRate > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, montant_paye: discountedCotis }))}
                        style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-success)', border: '1px solid rgba(16, 185, 129, 0.4)', cursor: 'pointer' }}
                      >
                        Appliquer -{discountRate}% ({formatDA(discountedCotis)})
                      </button>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <div className="flex justify-between items-center mb-1">
                    <label className="form-label font-bold text-xs mb-0">Adhérent *</label>
                    <span className="text-[11px] text-muted">{athletes.length} membre(s) actif(s)</span>
                  </div>
                  <select 
                    className="form-select w-full" 
                    value={formData.athlete_id} 
                    onChange={(e) => {
                      const athleteId = e.target.value;
                      setFormData(prev => {
                        let nextMontant = prev.montant_paye;
                        if (!nextMontant || Number(nextMontant) === 0) {
                          if (siblingMap.has(athleteId)) {
                            const sib = siblingMap.get(athleteId);
                            nextMontant = Math.round(cotisationAdhesion * (1 - (sib.discountPercent || 0) / 100));
                          } else {
                            nextMontant = cotisationAdhesion || 3000;
                          }
                        }
                        return {
                          ...prev,
                          athlete_id: athleteId,
                          montant_paye: nextMontant
                        };
                      });
                    }}
                    required
                  >
                    <option value="">Sélectionner un athlète</option>
                    {athletes.map(a => {
                      const grp = a.groupes?.nom || a.groupe;
                      return (
                        <option key={a.id} value={a.id}>
                          {formatName(a.nom, a.prenom)}{grp ? ` — ${grp}` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {athletes.length === 0 && (
                    <button
                      type="button"
                      onClick={() => fetchAthletes()}
                      className="text-xs text-blue-400 underline mt-1 block"
                    >
                      Actualiser la liste des adhérents
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-xs mb-1">Montant encaissé (DA) *</label>
                  <input 
                    type="number" 
                    min="1" 
                    step="100" 
                    className="form-input w-full" 
                    value={formData.montant_paye} 
                    onChange={(e) => setFormData(prev => ({ ...prev, montant_paye: e.target.value }))}
                    required 
                  />
                  <div className="flex gap-1.5 mt-1">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, montant_paye: cotisationAdhesion || 3000 }))}
                      style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      {formatDA(cotisationAdhesion || 3000)} (Cotis.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, montant_paye: totalAdhesion || 3300 }))}
                      style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      {formatDA(totalAdhesion || 3300)} (Inscr. Totale)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                  <label className="form-label font-bold text-xs mb-1">Mode de paiement *</label>
                  <select 
                    className="form-select w-full" 
                    value={formData.mode_paiement} 
                    onChange={(e) => setFormData(prev => ({ ...prev, mode_paiement: e.target.value }))}
                    required
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Virement CCP">Virement CCP</option>
                    <option value="BaridiMob">BaridiMob</option>
                    <option value="Chèque">Chèque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-xs mb-1">Couvre jusqu'au (Fin de validité) *</label>
                  <input 
                    type="date" 
                    className="form-input w-full" 
                    value={formData.periode_couverte_fin} 
                    onChange={(e) => setFormData(prev => ({ ...prev, periode_couverte_fin: e.target.value }))}
                    required 
                  />
                  <div className="flex gap-1.5 mt-1">
                    <button 
                      type="button" 
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setFormData(prev => ({ ...prev, periode_couverte_fin: d.toISOString().split('T')[0] }));
                      }}
                      style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      +30 jours (1 mois)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 90);
                        setFormData(prev => ({ ...prev, periode_couverte_fin: d.toISOString().split('T')[0] }));
                      }}
                      style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      +90 jours (Trimestre)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => { setShowPaymentForm(false); setEditingPaymentId(null); setFormData(initialFormState); }}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary">
                  {editingPaymentId ? 'Mettre à jour' : 'Enregistrer le paiement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DÉPENSE / NOUVELLE DÉPENSE */}
      {showDepenseForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(6px)'
        }}>
          <div className="glass-panel" style={{
            width: '540px',
            maxWidth: '96vw',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-3">
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <TrendingDown size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {editingDepenseId ? 'Modifier une Dépense' : 'Enregistrer une Dépense'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Décaissement opérationnel du club
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowDepenseForm(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDepenseSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="form-label font-bold text-xs mb-1">Description *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Achat matériel, Location couloir..." 
                    className="form-input w-full" 
                    value={depenseData.description} 
                    onChange={(e) => setDepenseData(prev => ({ ...prev, description: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-xs mb-1">Montant (DA) *</label>
                  <input 
                    type="number" 
                    min="1" 
                    step="100" 
                    className="form-input w-full" 
                    value={depenseData.montant} 
                    onChange={(e) => setDepenseData(prev => ({ ...prev, montant: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                  <label className="form-label font-bold text-xs mb-1">Catégorie *</label>
                  <select 
                    className="form-select w-full" 
                    value={depenseData.categorie} 
                    onChange={(e) => setDepenseData(prev => ({ ...prev, categorie: e.target.value }))}
                    required
                  >
                    <option value="Location Couloirs">Location Couloirs</option>
                    <option value="Salaires Entraîneurs">Salaires Entraîneurs</option>
                    <option value="Achat de Matériel">Achat de Matériel</option>
                    <option value="Frais Compétition">Frais Compétition</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label font-bold text-xs mb-1">Date de la dépense *</label>
                  <input 
                    type="date" 
                    className="form-input w-full" 
                    value={depenseData.date_depense} 
                    onChange={(e) => setDepenseData(prev => ({ ...prev, date_depense: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowDepenseForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" style={{ backgroundColor: '#ef4444', color: 'white', borderColor: 'transparent' }}>
                  {editingDepenseId ? 'Mettre à jour' : 'Enregistrer la dépense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIGURATION DES TARIFS DU CLUB (ADMIN) */}
      {showPricingModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(6px)'
        }}>
          <div className="glass-panel" style={{
            width: '540px',
            maxWidth: '96vw',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-3">
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <Settings size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Paramètres des Tarifs du Club
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Définissez les frais d'inscription et cotisations appliqués
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowPricingModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="p-6">
              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="form-label font-bold text-sm mb-1.5 flex items-center justify-between">
                    <span>📄 Frais d'Inscription (Dossier & Badge QR)</span>
                    <span style={{ color: '#818cf8', fontWeight: 800 }}>{formatDA(pricingFormData.frais_inscription)}</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      min="0"
                      step="50"
                      value={pricingFormData.frais_inscription}
                      onChange={(e) => setPricingFormData(prev => ({ ...prev, frais_inscription: Number(e.target.value) || 0 }))}
                      className="form-input w-full"
                      style={{ fontSize: '1rem', fontWeight: 700, paddingRight: '3rem' }}
                      required
                    />
                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      DA
                    </span>
                  </div>
                  <span className="text-xs text-muted mt-1 block">
                    Frais administratifs dus lors de la première inscription de l'adhérent.
                  </span>
                </div>

                <div>
                  <label className="form-label font-bold text-sm mb-1.5 flex items-center justify-between">
                    <span>🏅 Droits d'Adhésion / Cotisation Club</span>
                    <span style={{ color: 'var(--accent-success)', fontWeight: 800 }}>{formatDA(pricingFormData.cotisation_adhesion)}</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      min="0"
                      step="100"
                      value={pricingFormData.cotisation_adhesion}
                      onChange={(e) => setPricingFormData(prev => ({ ...prev, cotisation_adhesion: Number(e.target.value) || 0 }))}
                      className="form-input w-full"
                      style={{ fontSize: '1rem', fontWeight: 700, paddingRight: '3rem' }}
                      required
                    />
                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      DA
                    </span>
                  </div>
                  <span className="text-xs text-muted mt-1 block">
                    Tarif standard de la cotisation d'entraînement ou d'adhésion sportive.
                  </span>
                </div>
              </div>

              {/* Aperçu du total pour nouvel adhérent */}
              <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid rgba(16, 185, 129, 0.3)' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Total exigible à la première inscription :</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--accent-success)' }}>
                      {formatDA(Number(pricingFormData.frais_inscription) + Number(pricingFormData.cotisation_adhesion))}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Frais : {formatDA(pricingFormData.frais_inscription)} + Adhésion : {formatDA(pricingFormData.cotisation_adhesion)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowPricingModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> Enregistrer & Appliquer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
