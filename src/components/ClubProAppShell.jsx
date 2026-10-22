/**
 * =====================================================
 * OVIA SPORT — ClubProAppShell (refactorisé)
 * =====================================================
 * Wrapper principal de l'interface admin.
 * Responsabilités : Sidebar + Topbar + injection du contenu.
 * Le tiroir athlète a été extrait dans AthleteQuickDrawer.
 * Les constantes hardcodées ont été centralisées dans config/constants.js.
 */

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
  Calendar,
  LogOut,
  X,
  Menu,
  Archive,
  UserCheck
} from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import ConfirmModal from "./ConfirmModal";
import AthleteQuickDrawer from "./layout/AthleteQuickDrawer";
import {
  ROLE_LABELS,
  CURRENT_SEASON,
  CLUB_NAME,
  CLUB_SUBTITLE,
  SIDEBAR_REFRESH_INTERVAL,
} from "../config/constants";
import { fetchSidebarCounts } from "../services/athletes.service";

export default function ClubProAppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [counts, setCounts] = useState({ athletes: 0, inscriptions: 0, pendingCotis: 0 });
  const [pendingNotifications, setPendingNotifications] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const searchInputRef = useRef(null);

  // ── Charger les compteurs sidebar ─────────────────────────────────
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const data = await fetchSidebarCounts();
        setCounts(data);
        setPendingNotifications(role === 'entraineur' ? false : (data.inscriptions > 0 || data.pendingCotis > 0));
      } catch (e) {
        console.warn("[AppShell] Counts fetch warning:", e);
      }
    };
    loadCounts();
    const interval = setInterval(loadCounts, SIDEBAR_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // ── Raccourci Ctrl+K → focus recherche ────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Fermer le menu mobile au changement de route ──────────────────
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ── Recherche globale ─────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && globalSearch.trim()) {
      navigate(`/athletes?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch("");
    }
  };

  // ── Lien actif ────────────────────────────────────────────────────
  const getActiveMenuId = () => {
    const path = location.pathname;
    const search = location.search;
    if (path === "/dashboard") return "dashboard";
    if (path === "/scanner") return "smart-access";
    if (path.startsWith("/athletes")) {
      if (search.includes("tab=inscriptions")) return "inscriptions";
      return "membres";
    }
    if (path === "/assurances") return "assurances";
    if (path === "/groupes") return "groupes";
    if (path === "/performances" || path === "/suivi-sportif") return "chronos";
    if (path === "/finances") return "cotisations";
    if (path === "/planning") return "planning";
    if (path === "/archives") return "archives";
    if (path === "/users") return "parametres";
    return "";
  };

  const activeMenu = getActiveMenuId();

  const isEntraineur = role === 'entraineur';
  const isAdmin = role === 'admin';

  // ── Définition du menu selon le rôle ──────────────────────────────
  const navigation = [
    {
      section: "PILOTAGE",
      items: [
        // Masqué pour les entraîneurs
        ...(!isEntraineur ? [{ id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, path: "/dashboard", badge: null }] : []),
        { id: "smart-access", label: "Smart Access (Scan)", icon: QrCode, path: "/scanner", badge: "Live" },
      ],
    },
    {
      section: "ACADÉMIE & MEMBRES",
      items: [
        { id: "membres", label: "Annuaire Athlètes", icon: Users, path: "/athletes", badge: counts.athletes ? String(counts.athletes) : null },
        ...(!isEntraineur ? [{ id: "inscriptions", label: "Demandes en ligne", icon: UserPlus, path: "/athletes?tab=inscriptions", badge: counts.inscriptions ? String(counts.inscriptions) : null }] : []),
        ...(!isEntraineur ? [{ id: "assurances", label: "Médical & Assurances", icon: ShieldCheck, path: "/assurances", badge: null }] : []),
      ],
    },
    {
      section: "TECHNIQUE & BASSIN",
      items: [
        { id: "groupes", label: "Groupes & Couloirs", icon: Waves, path: "/groupes", badge: null },
        { id: "chronos", label: "Chronos & Perfs", icon: Timer, path: "/performances", badge: null },
        { id: "planning", label: "Planning", icon: Calendar, path: "/planning", badge: null },
      ],
    },
    // Section FINANCES totalement masquée pour les entraîneurs (Cotisations & Manque à gagner)
    ...(!isEntraineur ? [{
      section: "FINANCES",
      items: [
        { id: "cotisations", label: "Cotisations & Caisse", icon: CreditCard, path: "/finances", badge: counts.pendingCotis > 0 ? `${counts.pendingCotis} att.` : null },
      ],
    }] : []),
    {
      section: "ADMINISTRATION",
      items: [
        ...(!isEntraineur ? [{ id: "archives", label: "Archives", icon: Archive, path: "/archives", badge: null }] : []),
        { id: "profil", label: "Mon Profil", icon: UserCheck, path: "/profil", badge: null },
        ...(isAdmin ? [{ id: "parametres", label: "Configuration Club", icon: Settings, path: "/users", badge: null }] : []),
      ],
    },
  ];

  // ── Infos utilisateur ─────────────────────────────────────────────
  const displayName = user?.email?.split("@")[0] || "Direction Sportive";
  const displayRole = ROLE_LABELS[role] || "Direction Sportive";
  const initials = displayName.slice(0, 2).toUpperCase();

  // ── Déconnexion avec confirmation moderne ──────────────────────────
  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors">

      {/* ── Overlay mobile ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════ */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <Link to={isEntraineur ? "/scanner" : "/dashboard"} className="flex items-center gap-3 no-underline">
            <img
              src="/logo.jpg"
              alt={`Logo ${CLUB_NAME}`}
              className="w-9 h-9 rounded-xl object-cover border-2 border-cyan-400/60 shadow-inner bg-white shrink-0"
            />
            <div>
              <span className="font-black text-white text-sm tracking-wider block leading-none">
                {CLUB_NAME}
              </span>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                {CLUB_SUBTITLE}
              </span>
            </div>
          </Link>
          <button
            className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saison active */}
        <div className="p-3.5 border-b border-slate-800/80">
          <div className="bg-slate-800/70 rounded-lg p-2.5 flex items-center justify-between border border-slate-700/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Saison Active</p>
                <p className="text-xs font-black text-white tracking-wide">{CURRENT_SEASON}</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Saison en cours" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Navigation principale">
          {navigation.map((group) => (
            <div key={group.section}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition no-underline ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && <Icon className="w-4 h-4 shrink-0" />}
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

        {/* Profil admin */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 gap-2">
          <Link
            to="/profil"
            className="flex items-center gap-2 min-w-0 hover:opacity-85 transition group no-underline"
            title="Accéder à mon profil"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-black text-cyan-300 shrink-0 group-hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-none mb-0 group-hover:text-cyan-300 transition-colors">{displayName}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5 mb-0">{displayRole}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleSignOut}
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════
          ZONE CENTRALE (TOPBAR + CONTENU)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Burger mobile */}
            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Recherche globale */}
            <div className="relative w-80 lg:w-96 hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Recherche globale (Nom, Prénom, Tél…)"
                aria-label="Recherche globale"
                className="w-full pl-9 pr-14 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 outline-none text-slate-900 dark:text-white"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 pointer-events-none">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Actions rapides topbar */}
          <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
            <Link
              to="/scanner"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition shadow-sm cursor-pointer no-underline"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400 dark:text-white" />
              <span className="hidden sm:inline">Scanner Carte Accès</span>
              <span className="sm:hidden">Scan</span>
            </Link>

            <ThemeToggle />

            <Link
              to="/alertes"
              className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
              title="Centre d'alertes & notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {pendingNotifications && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" aria-hidden="true" />
              )}
            </Link>
          </div>
        </header>

        {/* Contenu de la page */}
        <main className="flex-1" id="main-content">
          {children}
        </main>
      </div>

      {/* ── Tiroir athlète (composant autonome) ─────────────────── */}
      <AthleteQuickDrawer />

      {/* ── Modale de confirmation déconnexion ──────────────────── */}
      <ConfirmModal
        isOpen={showSignOutModal}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir vous déconnecter de votre session OVIA SPORT ?"
        confirmText="Se déconnecter"
        cancelText="Annuler"
        confirmVariant="danger"
        icon={LogOut}
        onConfirm={() => {
          setShowSignOutModal(false);
          signOut();
        }}
        onCancel={() => setShowSignOutModal(false)}
      />
    </div>
  );
}
