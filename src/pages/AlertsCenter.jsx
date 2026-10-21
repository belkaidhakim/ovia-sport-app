import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  UserPlus, 
  CheckCircle2, 
  RefreshCw, 
  MessageCircle, 
  ChevronRight, 
  Filter,
  FileCheck,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { fetchActiveAthletes } from '../services/athletes.service';
import { toast } from 'react-hot-toast';

export default function AlertsCenter() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'cotisations' | 'medical' | 'inscriptions'
  const [athletes, setAthletes] = useState([]);
  const [inscriptions, setInscriptions] = useState([]);

  const loadAlertsData = async () => {
    setLoading(true);
    try {
      const [athletesRes, inscriptionsRes] = await Promise.all([
        fetchActiveAthletes(),
        supabase
          .from('inscriptions')
          .select('*')
          .eq('statut', 'EN_ATTENTE')
          .order('created_at', { ascending: false })
      ]);

      if (athletesRes.data) setAthletes(athletesRes.data);
      if (inscriptionsRes.data) setInscriptions(inscriptionsRes.data);
    } catch (err) {
      console.error('Erreur chargement alertes:', err);
      toast.error('Impossible de charger le centre d\'alertes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertsData();
  }, []);

  // Analyser et classifier les alertes
  const { cotisationsAlerts, medicalAlerts, inscriptionsAlerts } = useMemo(() => {
    const cotis = [];
    const medical = [];
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Athlètes : cotisations & certificats médicaux
    (athletes || []).forEach(athlete => {
      const rawCard = athlete.cartes_acces;
      const card = Array.isArray(rawCard) ? rawCard[0] : rawCard;
      const cardStatut = card?.statut || 'SUSPENDUE';
      const cotisArray = athlete.cotisations || [];
      const sortedCotis = [...cotisArray].filter(c => c && c.periode_couverte_fin)
        .sort((a, b) => new Date(b.periode_couverte_fin) - new Date(a.periode_couverte_fin));
      
      const lastEndDate = sortedCotis[0]?.periode_couverte_fin ? new Date(sortedCotis[0].periode_couverte_fin) : null;

      if (lastEndDate) {
        if (lastEndDate < now) {
          const daysExpired = Math.max(1, Math.ceil((now - lastEndDate) / (1000 * 60 * 60 * 24)));
          cotis.push({
            id: `cotis-exp-${athlete.id}`,
            athleteId: athlete.id,
            nom: athlete.nom,
            prenom: athlete.prenom,
            telephone: athlete.telephone,
            groupe: athlete.groupes?.nom || athlete.groupe || 'Sans groupe',
            type: 'cotisation_expired',
            priority: 'danger',
            title: `Cotisation expirée (${daysExpired} j.)`,
            details: `Échéance le ${lastEndDate.toLocaleDateString('fr-FR')}`,
            date: lastEndDate
          });
        } else if (lastEndDate <= in7Days) {
          const daysLeft = Math.max(0, Math.ceil((lastEndDate - now) / (1000 * 60 * 60 * 24)));
          cotis.push({
            id: `cotis-soon-${athlete.id}`,
            athleteId: athlete.id,
            nom: athlete.nom,
            prenom: athlete.prenom,
            telephone: athlete.telephone,
            groupe: athlete.groupes?.nom || athlete.groupe || 'Sans groupe',
            type: 'cotisation_expiring_soon',
            priority: 'warning',
            title: `Échéance cotisation dans ${daysLeft} j.`,
            details: `Expire le ${lastEndDate.toLocaleDateString('fr-FR')}`,
            date: lastEndDate
          });
        }
      } else if (cardStatut !== 'ACTIVE') {
        cotis.push({
          id: `cotis-none-${athlete.id}`,
          athleteId: athlete.id,
          nom: athlete.nom,
          prenom: athlete.prenom,
          telephone: athlete.telephone,
          groupe: athlete.groupes?.nom || athlete.groupe || 'Sans groupe',
          type: 'cotisation_missing',
          priority: 'danger',
          title: 'Cotisation non réglée',
          details: 'Aucune période couverte enregistrée',
          date: new Date()
        });
      }

      // 2. Alertes Médical & Dossier
      if (!athlete.certificat_medical_valide) {
        medical.push({
          id: `med-${athlete.id}`,
          athleteId: athlete.id,
          nom: athlete.nom,
          prenom: athlete.prenom,
          telephone: athlete.telephone,
          groupe: athlete.groupes?.nom || athlete.groupe || 'Sans groupe',
          type: 'medical_invalid',
          priority: 'warning',
          title: 'Certificat médical non validé',
          details: 'Document manquant ou examen médical à renouveler',
          date: new Date()
        });
      }
    });

    // 3. Inscriptions en attente
    const insc = (inscriptions || []).map(ins => ({
      id: `insc-${ins.id}`,
      inscriptionId: ins.id,
      nom: ins.nom,
      prenom: ins.prenom,
      telephone: ins.telephone,
      groupe: ins.groupe_souhaite || 'Non précisé',
      type: 'pending_inscription',
      priority: 'info',
      title: 'Demande d\'inscription en ligne',
      details: `Reçue le ${new Date(ins.created_at).toLocaleDateString('fr-FR')}`,
      date: new Date(ins.created_at)
    }));

    return {
      cotisationsAlerts: cotis,
      medicalAlerts: medical,
      inscriptionsAlerts: insc
    };
  }, [athletes, inscriptions]);

  // Alertes filtrées selon l'onglet
  const filteredAlerts = useMemo(() => {
    switch (activeTab) {
      case 'cotisations':
        return cotisationsAlerts;
      case 'medical':
        return medicalAlerts;
      case 'inscriptions':
        return inscriptionsAlerts;
      default:
        return [...cotisationsAlerts, ...medicalAlerts, ...inscriptionsAlerts].sort((a, b) => {
          const pOrder = { danger: 0, warning: 1, info: 2 };
          return pOrder[a.priority] - pOrder[b.priority];
        });
    }
  }, [activeTab, cotisationsAlerts, medicalAlerts, inscriptionsAlerts]);

  // Relance WhatsApp
  const handleWhatsApp = (item) => {
    if (!item.telephone) {
      toast.error('Aucun numéro de téléphone renseigné pour cet athlète.');
      return;
    }
    const cleanPhone = item.telephone.replace(/[^0-9+]/g, '');
    let msg = `Bonjour ${item.prenom}, le secrétariat du club vous informe que votre dossier nécessite une mise à jour.`;
    if (item.type.includes('cotisation')) {
      msg = `Bonjour ${item.prenom}, le secrétariat du club vous informe que votre cotisation est arrivée à échéance. Merci de régulariser la situation à l'accueil du club.`;
    } else if (item.type.includes('medical')) {
      msg = `Bonjour ${item.prenom}, merci de fournir un certificat médical d'aptitude sportive à jour au secrétariat du club.`;
    }
    const url = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const totalCount = cotisationsAlerts.length + medicalAlerts.length + inscriptionsAlerts.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5" />
            Centre de Pilotage & Alertes
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Alertes Opérationnelles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Surveillez en temps réel les échéances administratives, médicales et les inscriptions en attente.
          </p>
        </div>

        <button
          onClick={loadAlertsData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Alertes
            </span>
            <span className={`w-2.5 h-2.5 rounded-full ${totalCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Éléments nécessitant une action</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Cotisations
            </span>
            <CreditCard className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{cotisationsAlerts.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Expirées ou imminentes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Médical & Dossiers
            </span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{medicalAlerts.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Certificats à régulariser</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Inscriptions Web
            </span>
            <UserPlus className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-cyan-400">{inscriptionsAlerts.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Dossiers en attente</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          Toutes ({totalCount})
        </button>

        <button
          onClick={() => setActiveTab('cotisations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'cotisations'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          Cotisations ({cotisationsAlerts.length})
        </button>

        <button
          onClick={() => setActiveTab('medical')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'medical'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          Médical & Certificats ({medicalAlerts.length})
        </button>

        <button
          onClick={() => setActiveTab('inscriptions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'inscriptions'
              ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          Inscriptions Web ({inscriptionsAlerts.length})
        </button>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-500" />
            <p className="text-sm font-medium">Analyse et chargement des alertes du club...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Tout est sous contrôle !
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Aucune anomalie ou retard détecté dans cette catégorie. Le club fonctionne à plein régime.
            </p>
          </div>
        ) : (
          filteredAlerts.map(item => {
            const isDanger = item.priority === 'danger';
            const isWarning = item.priority === 'warning';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    isDanger 
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                      : isWarning
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-blue-500/10 text-cyan-400 border-blue-500/20'
                  }`}>
                    {isDanger ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isWarning ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {item.prenom} {item.nom}
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {item.groupe}
                      </span>
                    </div>

                    <p className={`text-xs font-semibold mt-1 ${
                      isDanger ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-cyan-400'
                    }`}>
                      {item.title}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.details}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {item.telephone && (
                    <button
                      onClick={() => handleWhatsApp(item)}
                      title="Envoyer un rappel WhatsApp"
                      className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rappel WhatsApp</span>
                    </button>
                  )}

                  {item.athleteId && (
                    <Link
                      to={`/athletes?search=${encodeURIComponent(item.nom)}`}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer no-underline"
                    >
                      <span>Voir fiche</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {item.inscriptionId && (
                    <Link
                      to="/athletes"
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer no-underline shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Traiter dossier</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
