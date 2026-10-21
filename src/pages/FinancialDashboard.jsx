import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { TrendingUp, Search, Download, TrendingDown, Settings, FileOutput } from 'lucide-react';
import { z } from 'zod';
import { useCotisations } from '../hooks/useCotisations';
import { useDepenses } from '../hooks/useDepenses';
import { useClubPricing } from '../hooks/useClubPricing';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/ui';
import { generateMonthlyReportPDF } from '../utils/pdfHelpers';
import { generatePDFReceipt } from '../utils/receiptGenerator';
import { detectSiblingGroups } from '../utils/swimmingCategories';
import { useTheme } from '../contexts/ThemeContext';

// Sous-composants modulaires finances
import FinancialKPIs from '../components/finances/FinancialKPIs';
import FinancialCharts from '../components/finances/FinancialCharts';
import CotisationsTable from '../components/finances/CotisationsTable';
import DepensesTable from '../components/finances/DepensesTable';
import ImpayesTable from '../components/finances/ImpayesTable';
import PaymentModal from '../components/finances/PaymentModal';
import DepenseModal from '../components/finances/DepenseModal';
import PricingModal from '../components/finances/PricingModal';
import DeleteConfirmModal from '../components/finances/DeleteConfirmModal';

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

export default function FinancialDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { cotisations, fetchCotisations, deleteCotisation, addCotisation } = useCotisations();
  const { depenses, fetchDepenses, deleteDepense, addDepense } = useDepenses();
  const { user } = useAuth();
  const { fraisInscription, cotisationAdhesion, totalAdhesion, updatePricing } = useClubPricing();
  
  const [athletes, setAthletes] = useState([]);
  const [_loading, setLoading] = useState(true);

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
  
  const [activeTab, setActiveTab] = useState('revenus'); // 'revenus' | 'depenses' | 'impayes'
  const [filterRevenueType, setFilterRevenueType] = useState('all'); // 'all' | 'inscriptions' | 'cotisations'

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
  
  // Filtres temporels & recherche
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
      result = result.filter(c => Number(c.montant_paye) > 3000 || Number(c.montant_paye) === totalAdhesion);
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
    const totalRev = filteredCotisations.reduce((sum, c) => sum + Number(c.montant_paye), 0);
    const totalDep = filteredDepenses.reduce((sum, d) => sum + Number(d.montant), 0);
    
    const inscriptionsList = filteredCotisations.filter(c => Number(c.montant_paye) > 3000 || Number(c.montant_paye) === totalAdhesion);
    const renouvellementsList = filteredCotisations.filter(c => Number(c.montant_paye) <= 3000);

    const totalFraisInscription = inscriptionsList.reduce((sum, c) => sum + Number(c.montant_paye), 0);
    const totalCotisationsSportives = renouvellementsList.reduce((sum, c) => sum + Number(c.montant_paye), 0);

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

  return (
    <div className="pb-20 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 1. EN-TÊTE FINANCIER & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-0">
            Gestion Financière
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">
            Revenus, Dépenses et Clôture Mensuelle · Club Ovia Sport
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowPricingModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Paramètres des tarifs">
            <Settings size={16} /> Tarifs
          </Button>
          <Button variant="secondary" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Exporter la liste actuelle en fichier CSV">
            <Download size={16} /> Exporter CSV
          </Button>
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

      {/* 2. FILTRES GLOBAUX */}
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
          {activeTab === 'revenus' && (
            <select className="form-select w-auto" value={filterRevenueType} onChange={(e) => setFilterRevenueType(e.target.value)}>
              <option value="all">Tous types d'encaissement</option>
              <option value="inscriptions">Inscriptions uniquement</option>
              <option value="cotisations">Cotisations uniquement</option>
            </select>
          )}
        </div>
      </Card>

      {/* 3. CARTES KPI VENTILÉES */}
      <FinancialKPIs stats={stats} />

      {/* 4. GRAPHIQUES BILAN & DÉPENSES */}
      <FinancialCharts 
        cotisations={cotisations}
        depenses={depenses}
        filterYear={filterYear}
        depensesByCategory={stats.depensesByCategory}
      />

      {/* 5. GESTION DES LISTES ET ONGLETS */}
      <Card className="p-0 overflow-hidden">
        <div className="flex border-b border-[var(--border-color)]">
          <button className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${activeTab === 'revenus' ? 'border-[#10b981] text-[#10b981]' : 'border-transparent text-muted hover:bg-[var(--bg-tertiary)]'}`} onClick={() => setActiveTab('revenus')}>
            Encaissements ({filteredCotisations.length})
          </button>
          <button className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${activeTab === 'depenses' ? 'border-[#ef4444] text-[#ef4444]' : 'border-transparent text-muted hover:bg-[var(--bg-tertiary)]'}`} onClick={() => setActiveTab('depenses')}>
            Dépenses ({filteredDepenses.length})
          </button>
          <button className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${activeTab === 'impayes' ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-transparent text-muted hover:bg-[var(--bg-tertiary)]'}`} onClick={() => setActiveTab('impayes')}>
            Impayés / Retards ({expiredList.length})
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'revenus' && (
            <CotisationsTable 
              cotisations={paginatedList}
              onEdit={(cotis) => {
                setEditingPaymentId(cotis.id);
                setFormData({
                  athlete_id: cotis.athlete_id || cotis.athletes?.id || '',
                  montant_paye: cotis.montant_paye || '',
                  mode_paiement: cotis.mode_paiement || 'Espèces',
                  periode_couverte_fin: cotis.periode_couverte_fin ? cotis.periode_couverte_fin.split('T')[0] : getDefaultFinDate()
                });
                setShowPaymentForm(true);
              }}
              onGenerateReceipt={generatePDFReceipt}
              onDeleteClick={(cotis) => handleDeleteClick('cotisation', cotis)}
            />
          )}

          {activeTab === 'depenses' && (
            <DepensesTable 
              depenses={paginatedList}
              onDeleteClick={(dep) => handleDeleteClick('depense', dep)}
            />
          )}

          {activeTab === 'impayes' && (
            <ImpayesTable 
              expiredList={paginatedList}
              cotisationAdhesion={cotisationAdhesion}
              isDark={isDark}
            />
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

      {/* 6. MODALES D'INTERACTION */}
      <DeleteConfirmModal 
        deleteModal={deleteModal}
        onClose={() => setDeleteModal({ isOpen: false, type: null, item: null, isSubmitting: false })}
        onConfirm={handleConfirmDelete}
      />

      <PaymentModal 
        isOpen={showPaymentForm}
        onClose={() => { setShowPaymentForm(false); setEditingPaymentId(null); setFormData(initialFormState); }}
        editingId={editingPaymentId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handlePaymentSubmit}
        athletes={athletes}
        siblingMap={siblingMap}
        fraisInscription={fraisInscription}
        cotisationAdhesion={cotisationAdhesion}
        totalAdhesion={totalAdhesion}
      />

      <DepenseModal 
        isOpen={showDepenseForm}
        onClose={() => setShowDepenseForm(false)}
        editingId={editingDepenseId}
        depenseData={depenseData}
        setDepenseData={setDepenseData}
        onSubmit={handleDepenseSubmit}
      />

      <PricingModal 
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        pricingFormData={pricingFormData}
        setPricingFormData={setPricingFormData}
        onSubmit={handleSavePricing}
      />
    </div>
  );
}
