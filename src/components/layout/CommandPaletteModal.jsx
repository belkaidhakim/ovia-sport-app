import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Users,
  UserPlus,
  QrCode,
  CreditCard,
  ShieldCheck,
  Timer,
  Calendar,
  Waves,
  LayoutDashboard,
  Bell,
  Archive,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  Phone
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { APP_EVENTS } from '../../config/constants';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function CommandPaletteModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { role } = useAuth();
  const isEntraineur = role === 'entraineur';

  const [query, setQuery] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Charger les athlètes (cache instantané + rafraîchissement léger)
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 40);

    try {
      const cached = localStorage.getItem('ovia_athletes_cache_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.data) && parsed.data.length > 0) {
          setAthletes(parsed.data);
          return;
        }
      }
    } catch {}

    let active = true;
    const fetchLightAthletes = async () => {
      try {
        setLoadingAthletes(true);
        const { data } = await supabase
          .from('athletes')
          .select('id, nom, prenom, telephone, groupe, photo, date_naissance, groupes(nom), cartes_acces(statut)')
          .or('statut.is.null,statut.neq.ARCHIVE')
          .order('nom', { ascending: true })
          .limit(150);
        if (active && data) setAthletes(data);
      } catch {
        // silencieux
      } finally {
        if (active) setLoadingAthletes(false);
      }
    };
    fetchLightAthletes();
    return () => { active = false; };
  }, [isOpen]);

  const quickActions = useMemo(() => {
    const list = [
      ...(!isEntraineur ? [
        {
          id: 'act-new-athlete',
          label: 'Inscrire un nouvel athlète',
          subtitle: 'Créer un dossier adhérent et générer sa carte QR',
          icon: UserPlus,
          color: 'text-sky-500 bg-sky-500/10',
          badge: 'Action rapide',
          action: () => navigate('/athletes/new')
        },
        {
          id: 'act-finances',
          label: 'Encaisser une cotisation / Trésorerie',
          subtitle: 'Ouvrir la caisse, les reçus PDF et le suivi financier',
          icon: CreditCard,
          color: 'text-emerald-500 bg-emerald-500/10',
          badge: 'Finances',
          action: () => navigate('/finances')
        },
        {
          id: 'act-assurances',
          label: 'Assurances & Bordereau Fédéral FAN',
          subtitle: 'Gérer la couverture SAA/CAAT et exporter le bordereau PDF',
          icon: ShieldCheck,
          color: 'text-indigo-500 bg-indigo-500/10',
          badge: 'Conformité',
          action: () => navigate('/assurances')
        },
        {
          id: 'act-dashboard',
          label: 'Tableau de bord exécutif',
          subtitle: 'Vue globale des KPI, présences du jour et jauges',
          icon: LayoutDashboard,
          color: 'text-blue-500 bg-blue-500/10',
          badge: 'Pilotage',
          action: () => navigate('/dashboard')
        },
      ] : []),
      {
        id: 'act-scanner',
        label: 'Ouvrir le Scanner Smart Access',
        subtitle: 'Contrôle d’accès QR Code en temps réel au bord du bassin',
        icon: QrCode,
        color: 'text-cyan-500 bg-cyan-500/10',
        badge: 'Live',
        action: () => navigate('/scanner')
      },
      {
        id: 'act-athletes',
        label: 'Annuaire complet des membres',
        subtitle: 'Rechercher, filtrer et exporter les fiches athlètes',
        icon: Users,
        color: 'text-blue-500 bg-blue-500/10',
        badge: 'Académie',
        action: () => navigate('/athletes')
      },
      {
        id: 'act-chronos',
        label: 'Chronos & Feuille de Match',
        subtitle: 'Saisie collective des temps et records personnels (PB)',
        icon: Timer,
        color: 'text-amber-500 bg-amber-500/10',
        badge: 'Sportif',
        action: () => navigate('/performances')
      },
      {
        id: 'act-planning',
        label: 'Planning & Plan des Couloirs de Bassin',
        subtitle: 'Grille hebdomadaire et occupation des lignes d’eau 1 à 6',
        icon: Calendar,
        color: 'text-purple-500 bg-purple-500/10',
        badge: 'Bassin',
        action: () => navigate('/planning')
      },
      {
        id: 'act-groupes',
        label: 'Groupes & Sections de Nage',
        subtitle: 'Capacités d’accueil, entraîneurs et créneaux',
        icon: Waves,
        color: 'text-teal-500 bg-teal-500/10',
        badge: 'Pédagogie',
        action: () => navigate('/groupes')
      },
      ...(!isEntraineur ? [
        {
          id: 'act-alertes',
          label: 'Centre d’Alertes Opérationnelles',
          subtitle: 'Relances WhatsApp cotisations, certificats médicaux et pré-inscriptions',
          icon: Bell,
          color: 'text-rose-500 bg-rose-500/10',
          badge: 'Relances',
          action: () => navigate('/alertes')
        },
        {
          id: 'act-archives',
          label: 'Archives & Anciens Membres',
          subtitle: 'Consulter ou restaurer en 1 clic un athlète archivé',
          icon: Archive,
          color: 'text-amber-500 bg-amber-500/10',
          badge: 'Historique',
          action: () => navigate('/archives')
        }
      ] : []),
      {
        id: 'act-theme',
        label: theme === 'dark' ? 'Passer en Mode Clair (Light)' : 'Passer en Mode Sombre (Dark)',
        subtitle: 'Basculer immédiatement l’apparence visuelle de la plateforme',
        icon: theme === 'dark' ? Sun : Moon,
        color: 'text-amber-500 bg-amber-500/10',
        badge: 'Apparence',
        action: () => toggleTheme()
      }
    ];

    if (!query.trim()) return list.slice(0, 6);
    const q = query.toLowerCase().trim();
    return list.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
    );
  }, [query, isEntraineur, navigate, theme, toggleTheme]);

  const matchedAthletes = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return athletes.slice(0, 5);
    return athletes
      .filter(a => {
        const full1 = `${a.nom || ''} ${a.prenom || ''}`.toLowerCase();
        const full2 = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase();
        const tel = String(a.telephone || '').toLowerCase();
        const grp = String(a.groupes?.nom || a.groupe || '').toLowerCase();
        return full1.includes(q) || full2.includes(q) || tel.includes(q) || grp.includes(q);
      })
      .slice(0, 7);
  }, [athletes, query]);

  const combinedItems = useMemo(() => {
    const items = [];
    matchedAthletes.forEach(ath => {
      items.push({
        type: 'athlete',
        id: `ath-${ath.id}`,
        data: ath,
        onSelect: () => {
          window.dispatchEvent(new CustomEvent(APP_EVENTS.OPEN_ATHLETE_DRAWER, { detail: ath }));
          onClose();
        }
      });
    });
    quickActions.forEach(act => {
      items.push({
        type: 'action',
        id: act.id,
        data: act,
        onSelect: () => {
          act.action();
          onClose();
        }
      });
    });
    return items;
  }, [matchedAthletes, quickActions, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (combinedItems.length > 0 ? (prev + 1) % combinedItems.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (combinedItems.length > 0 ? (prev - 1 + combinedItems.length) % combinedItems.length : 0));
      } else if (e.key === 'Enter' && combinedItems[selectedIndex]) {
        e.preventDefault();
        combinedItems[selectedIndex].onSelect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, combinedItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes intelligente"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de saisie Spotlight */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 gap-3">
          <Search className="w-5 h-5 text-sky-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un athlète (nom, tél, groupe) ou lancer une action…"
            className="flex-1 bg-transparent border-0 outline-none text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Effacer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Liste des résultats */}
        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
          {/* Section Athlètes */}
          {matchedAthletes.length > 0 && (
            <div>
              <div className="px-2.5 pb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                  {query ? `Athlètes correspondants (${matchedAthletes.length})` : 'Accès rapide Fiches Athlètes'}
                </span>
                <span>Clic = Tiroir rapide</span>
              </div>
              <div className="space-y-1">
                {matchedAthletes.map((ath, idx) => {
                  const isSelected = selectedIndex === idx;
                  const initials = ((ath.nom?.[0] || 'O') + (ath.prenom?.[0] || 'S')).toUpperCase();
                  const grpName = ath.groupes?.nom || ath.groupe || 'Section Natation';
                  return (
                    <div
                      key={ath.id}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent(APP_EVENTS.OPEN_ATHLETE_DRAWER, { detail: ath }));
                        onClose();
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                        isSelected
                          ? 'bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {ath.photo ? (
                          <img
                            src={ath.photo}
                            alt={ath.prenom}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-blue-600/15 text-blue-600 dark:text-sky-400 font-black text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                            <span>{ath.nom?.toUpperCase()} {ath.prenom}</span>
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                              {grpName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                            {ath.telephone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {ath.telephone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/athletes/edit/${ath.id}`);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-sky-500 transition cursor-pointer"
                        >
                          Dossier
                        </button>
                        <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-sky-500 translate-x-0.5' : 'text-slate-400'} transition-transform`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Actions & Navigation */}
          {quickActions.length > 0 && (
            <div>
              <div className="px-2.5 pb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Actions Rapides & Navigation
                </span>
              </div>
              <div className="space-y-1">
                {quickActions.map((act, i) => {
                  const globalIdx = matchedAthletes.length + i;
                  const isSelected = selectedIndex === globalIdx;
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      onClick={() => {
                        act.action();
                        onClose();
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                        isSelected
                          ? 'bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${act.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {act.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {act.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                        {act.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchedAthletes.length === 0 && quickActions.length === 0 && !loadingAthletes && (
            <div className="py-10 text-center text-sm text-slate-500">
              Aucun résultat trouvé pour « <span className="font-bold text-slate-800 dark:text-slate-200">{query}</span> ».
            </div>
          )}
        </div>

        {/* Pied de modale (Raccourcis clavier) */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">↑↓</kbd> Naviguer</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">Entrée</kbd> Ouvrir</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold">Échap</kbd> Fermer</span>
          </div>
          <span className="font-semibold text-sky-600 dark:text-sky-400 hidden sm:inline">
            OVIA SPORT Spotlight
          </span>
        </div>
      </div>
    </div>
  );
}
