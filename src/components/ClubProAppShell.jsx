import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ShieldCheck,
  Waves,
  QrCode,
  Timer,
  CreditCard,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Calendar,
  LogOut,
  X,
  Phone,
  CheckCircle2,
  Printer,
  Menu
} from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getSwimmingCategory } from "../utils/swimmingCategories";
import toast from "react-hot-toast";

export default function ClubProAppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const searchInputRef = useRef(null);

  // Compteurs dynamiques
  const [counts, setCounts] = useState({
    athletes: 0,
    inscriptions: 0,
    pendingCotis: 0
  });

  // Charger les compteurs réels de la base Supabase
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: aCount } = await supabase
          .from('athletes')
          .select('*', { count: 'exact', head: true })
          .eq('est_actif', true);

        const { count: iCount } = await supabase
          .from('inscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'EN_ATTENTE');

        setCounts({
          athletes: aCount || 0,
          inscriptions: iCount || 0,
          pendingCotis: aCount || 0
        });
      } catch (e) {
        console.warn("Counts fetch warning:", e);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Écouter l'ouverture du tiroir latéral depuis n'importe où dans l'application
  useEffect(() => {
    const handleOpenDrawer = (e) => {
      if (e.detail) {
        setSelectedAthlete(e.detail);
      }
    };
    window.addEventListener('open-athlete-drawer', handleOpenDrawer);
    return () => window.removeEventListener('open-athlete-drawer', handleOpenDrawer);
  }, []);

  // Raccourci clavier Ctrl + K pour focus sur la recherche globale
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Soumission de la recherche globale
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/athletes?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch("");
    }
  };

  // Pointage rapide direct depuis le tiroir latéral
  const handleQuickPresence = async () => {
    if (!selectedAthlete?.id) return;
    try {
      const { error } = await supabase
        .from('presences')
        .insert([{
          athlete_id: selectedAthlete.id,
          date_scan: new Date().toISOString()
        }]);

      if (error) throw error;
      
      const newCount = (selectedAthlete.seances || 0) + 1;
      setSelectedAthlete(prev => ({
        ...prev,
        seances: newCount
      }));

      toast.success(`Pointage enregistré pour ${selectedAthlete.prenom} ! (+1 séance)`, {
        icon: '🏊‍♂️'
      });
    } catch (e) {
      toast.error("Erreur lors du pointage: " + e.message);
    }
  };

  // Déterminer l'élément actif selon l'URL
  const getActiveMenuId = () => {
    const path = location.pathname;
    const searchParams = location.search;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/scanner') return 'smart-access';
    if (path.startsWith('/athletes')) {
      if (searchParams.includes('tab=inscriptions')) return 'inscriptions';
      return 'membres';
    }
    if (path === '/assurances') return 'assurances';
    if (path === '/groupes') return 'groupes';
    if (path === '/performances' || path === '/suivi-sportif') return 'chronos';
    if (path === '/finances') return 'cotisations';
    if (path === '/users') return 'parametres';
    return '';
  };

  const activeMenu = getActiveMenuId();

  const navigation = [
    {
      section: "PILOTAGE",
      items: [
        { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, path: "/dashboard", badge: null },
        { id: "smart-access", label: "Smart Access (Scan)", icon: QrCode, path: "/scanner", badge: "Live" },
      ],
    },
    {
      section: "ACADÉMIE & MEMBRES",
      items: [
        { id: "membres", label: "Annuaire Athlètes", icon: Users, path: "/athletes", badge: counts.athletes ? String(counts.athletes) : null },
        { id: "inscriptions", label: "Demandes en ligne", icon: UserPlus, path: "/athletes?tab=inscriptions", badge: counts.inscriptions ? String(counts.inscriptions) : null },
        { id: "assurances", label: "Médical & Assurances", icon: ShieldCheck, path: "/assurances", badge: null },
      ],
    },
    {
      section: "TECHNIQUE & BASSIN",
      items: [
        { id: "groupes", label: "Groupes & Couloirs", icon: Waves, path: "/groupes", badge: null },
        { id: "chronos", label: "Chronos & Perfs", icon: Timer, path: "/performances", badge: null },
      ],
    },
    {
      section: "FINANCES",
      items: [
        { id: "cotisations", label: "Cotisations & Caisse", icon: CreditCard, path: "/finances", badge: counts.athletes ? `${counts.athletes} att.` : null },
        { id: "parametres", label: "Configuration Club", icon: Settings, path: "/users", badge: null },
      ],
    },
  ];

  const displayName = user?.email?.split('@')[0] || 'Direction Sportive';
  const roleLabels = { admin: 'Administrateur', secretaire: 'Secrétaire', entraineur: 'Entraîneur' };
  const displayRole = roleLabels[role] || 'Direction Sportive';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* =========================================================
          1. SIDEBAR LATÉRALE PRO (DARK EXECUTIVE)
      ========================================================= */}
      
      {/* Overlay Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none transform transition-transform duration-200 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Identité du Club avec Logo Officiel */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3 no-underline">
            <img 
              src="/logo.jpg" 
              alt="Logo Ovia Sport" 
              className="w-9 h-9 rounded-xl object-cover border-2 border-cyan-400/60 shadow-inner bg-white shrink-0" 
            />
            <div>
              <span className="font-black text-white text-sm tracking-wider block leading-none">
                OVIA SPORT
              </span>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                Aquatic Club ERP
              </span>
            </div>
          </Link>

          <button 
            className="lg:hidden p-1 text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sélecteur de Saison Sportive */}
        <div className="p-3.5 border-b border-slate-800/80">
          <div className="bg-slate-800/70 rounded-lg p-2.5 flex items-center justify-between border border-slate-700/60 shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Saison Active
                </p>
                <p className="text-xs font-black text-white tracking-wide">Saison 2026 / 2027</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Saison en cours" />
          </div>
        </div>

        {/* Menu de Navigation Structuré */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navigation.map((group) => (
            <div key={group.section}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.section}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition no-underline ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] rounded-full font-black ${
                            isActive
                              ? "bg-blue-800 text-white"
                              : item.badge === "Live"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profil Administrateur en bas */}
        <div className="p-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-black text-cyan-300 shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-none">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">{displayRole}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (window.confirm("Voulez-vous vous déconnecter ?")) {
                signOut();
              }
            }}
            title="Se déconnecter"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* =========================================================
          2. ZONE CENTRALE (TOPBAR + CONTENU DE LA PAGE)
      ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Topbar de Commande Globale */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          
          <div className="flex items-center gap-3">
            {/* Bouton Menu Burger Mobile */}
            <button 
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menu de navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Recherche Globale Rapide */}
            <div className="relative w-80 lg:w-96 hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Recherche globale (Nom, Prénom, Tél... Entrée pour valider)"
                className="w-full pl-9 pr-14 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none text-slate-900 dark:text-white"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 pointer-events-none">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Actions Rapides Terrain */}
          <div className="flex items-center gap-3 ml-auto">
            <Link 
              to="/scanner"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-xs cursor-pointer no-underline"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400 dark:text-white" />
              <span>Scanner Carte Accès</span>
            </Link>

            <Link 
              to="/dashboard"
              className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
              title="Centre d'alertes & notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
            </Link>
          </div>
        </header>

        {/* Contenu principal injecté */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* =========================================================
          3. TIROIR LATÉRAL ATHLÈTE (SLIDE-OVER DRAWER PRO)
          S'ouvre au clic sur un nageur sans recharger la page
      ========================================================= */}
      {selectedAthlete && (
        <aside className="fixed inset-y-0 right-0 w-96 max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col shrink-0 z-50 animate-in slide-in-from-right duration-200">
          
          {/* En-tête de la fiche rapide */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              {selectedAthlete.photo ? (
                <img 
                  src={selectedAthlete.photo} 
                  alt={selectedAthlete.prenom} 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shrink-0" 
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-base shrink-0 shadow-sm">
                  {((selectedAthlete.nom?.[0] || 'O') + (selectedAthlete.prenom?.[0] || 'S')).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="font-black text-slate-900 dark:text-white text-sm truncate">
                  {selectedAthlete.nom?.toUpperCase()} {selectedAthlete.prenom}
                </h2>
                <p className="text-xs text-slate-500 truncate">
                  {selectedAthlete.categorie || selectedAthlete.groupes?.nom || selectedAthlete.groupe || 'Section Natation'}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Accès Bassin Autorisé
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedAthlete(null)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps de la fiche rapide */}
          <div className="p-5 space-y-5 flex-1 overflow-y-auto text-xs">
            {/* Carte d'accès & Pointage rapide */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Forfait Mensuel</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-black">
                  {selectedAthlete.seances || selectedAthlete.presences?.length || 0} / {selectedAthlete.maxSeances || 8} séances
                </span>
              </div>
              
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 8 }).map((_, i) => {
                  const presencesCount = selectedAthlete.seances ?? selectedAthlete.presences?.length ?? 0;
                  return (
                    <div
                      key={i}
                      className={`h-2 rounded-xs transition-all ${
                        i < presencesCount ? "bg-cyan-400" : "bg-slate-700"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  onClick={handleQuickPresence}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition cursor-pointer shadow-md shadow-blue-600/30 text-xs"
                >
                  + Pointer 1 présence
                </button>
                <button
                  onClick={() => {
                    navigate('/athletes');
                  }}
                  title="Voir Carte & Badge QR"
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Résumé Financier & Fratrie */}
            <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Situation Financière
              </h3>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Statut Cotisation</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedAthlete.cotisation || 'À jour'}
                </span>
              </div>
              <div className="flex justify-between py-1 items-center">
                <span className="text-slate-500">Tarification appliquée</span>
                <span className="font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-800">
                  {selectedAthlete.remise || 'Standard'}
                </span>
              </div>
            </div>

            {/* Contact Téléphonique */}
            {selectedAthlete.telephone && (
              <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Contact Tuteur
                </h3>
                <a 
                  href={`tel:${selectedAthlete.telephone}`}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold hover:text-blue-600 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedAthlete.telephone}</span>
                </a>
              </div>
            )}

            {/* Résumé Sportif & Chronos */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Dernières Performances
              </h3>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">50m Nage Libre</p>
                  <p className="text-[11px] text-slate-500">Bassin 25m · Test interne</p>
                </div>
                <span className="text-sm font-black text-blue-600 dark:text-cyan-400 font-mono">
                  {selectedAthlete.meilleurChrono50NL || "34.82s"}
                </span>
              </div>
            </div>
          </div>

          {/* Pied de fiche (Actions rapides) */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex gap-2">
            <button 
              onClick={() => {
                navigate(`/athletes/edit/${selectedAthlete.id}`);
                setSelectedAthlete(null);
              }}
              className="flex-1 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Modifier Dossier
            </button>
            <button 
              onClick={() => {
                navigate('/finances');
                setSelectedAthlete(null);
              }}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-sm"
            >
              Encaisser Mois
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
