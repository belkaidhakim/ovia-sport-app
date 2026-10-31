/**
 * =====================================================
 * OVIA SPORT — ClubProAppShell (Executive SaaS Layout)
 * =====================================================
 * Wrapper principal de l'interface admin :
 * - Sidebar rétractable (Mode étendu w-64 / Mode icônes w-20)
 * - Topbar avec Spotlight Universel (Ctrl + K) & Popover d'Alertes
 * - Bottom Tab Bar native sur mobile (Terrain / Bord de bassin)
 * - Tiroir latéral rapide AthleteQuickDrawer
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
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import ConfirmModal from "./ConfirmModal";
import AthleteQuickDrawer from "./layout/AthleteQuickDrawer";
import CommandPaletteModal from "./layout/CommandPaletteModal";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("ovia_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [counts, setCounts] = useState({ athletes: 0, inscriptions: 0, pendingCotis: 0 });
  const [pendingNotifications, setPendingNotifications] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const notifRef = useRef(null);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ovia_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  // ── Charger les compteurs sidebar ─────────────────────────────────
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const data = await fetchSidebarCounts();
        setCounts(data);
        setPendingNotifications(role === "entraineur" ? false : (data.inscriptions > 0 || data.pendingCotis > 0));
      } catch (e) {
        console.warn("[AppShell] Counts fetch warning:", e);
      }
    };
    loadCounts();
    const interval = setInterval(loadCounts, SIDEBAR_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [role]);

  // ── Raccourci Ctrl+K → ouverture Palette Spotlight ────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Fermer menus au changement de route ou clic extérieur ─────────
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifPopoverOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!notifPopoverOpen) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifPopoverOpen]);

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
    if (path === "/profil") return "profil";
    if (path === "/users") return "parametres";
    return "";
  };

  const activeMenu = getActiveMenuId();

  const isEntraineur = role === "entraineur";
  const isAdmin = role === "admin";

  // ── Définition du menu selon le rôle ──────────────────────────────
  const navigation = [
    {
      section: "PILOTAGE",
      items: [
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
        { id: "planning", label: "Planning & Bassin", icon: Calendar, path: "/planning", badge: null },
      ],
    },
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
  const totalAlertCount = (counts.inscriptions || 0) + (counts.pendingCotis || 0);

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
          SIDEBAR (Rétractable sur Desktop w-64 <-> w-20)
      ══════════════════════════════════════════════════════════ */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none transform transition-all duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo & Bouton Réduire */}
        <div className={`h-16 ${sidebarCollapsed ? "px-3 justify-center" : "px-5 justify-between"} flex items-center border-b border-slate-800`}>
          <Link
            to={isEntraineur ? "/scanner" : "/dashboard"}
            className="flex items-center gap-3 no-underline min-w-0"
            title={`${CLUB_NAME} · ${CLUB_SUBTITLE}`}
          >
            <img
              src="/logo.jpg"
              alt={`Logo ${CLUB_NAME}`}
              className="w-9 h-9 rounded-xl object-cover border-2 border-cyan-400/60 shadow-inner bg-white shrink-0"
            />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-black text-white text-sm tracking-wider block leading-none truncate">
                  {CLUB_NAME}
                </span>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider truncate block mt-0.5">
                  {CLUB_SUBTITLE}
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            title={sidebarCollapsed ? "Déployer le menu latéral" : "Réduire le menu en mode icônes"}
            aria-label="Basculer la largeur du menu"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          <button
            className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saison active */}
        {!sidebarCollapsed ? (
          <div className="p-3.5 border-b border-slate-800/80">
            <div className="bg-slate-800/70 rounded-lg p-2.5 flex items-center justify-between border border-slate-700/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0">Saison Active</p>
                  <p className="text-xs font-black text-white tracking-wide mb-0">{CURRENT_SEASON}</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Saison en cours" />
            </div>
          </div>
        ) : (
          <div className="py-3 border-b border-slate-800/80 flex justify-center" title={`Saison Active : ${CURRENT_SEASON}`}>
            <div className="w-10 h-10 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-center relative">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto" aria-label="Navigation principale">
          {navigation.map((group) => (
            <div key={group.section}>
              {!sidebarCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.section}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      title={sidebarCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ""}` : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2"
                      } rounded-lg text-xs font-bold transition no-underline relative ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && <Icon className="w-4 h-4 shrink-0" />}
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && item.badge && (
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
                      {sidebarCollapsed && item.badge && item.badge !== "Live" && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1.5 right-1.5" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profil admin */}
        <div className={`p-3 border-t border-slate-800 flex items-center ${sidebarCollapsed ? "flex-col gap-2" : "justify-between gap-2"} bg-slate-950/40`}>
          <Link
            to="/profil"
            className="flex items-center gap-2 min-w-0 hover:opacity-85 transition group no-underline"
            title={`Mon Profil (${displayName})`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-black text-cyan-300 shrink-0 group-hover:scale-105 transition-transform">
              {initials}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-none mb-0 group-hover:text-cyan-300 transition-colors">{displayName}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5 mb-0">{displayRole}</p>
              </div>
            )}
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
          ZONE CENTRALE (TOPBAR + CONTENU + BOTTOM BAR MOBILE)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        {/* Topbar Exécutive */}
        <header className="h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Burger mobile */}
            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Déclencheur Spotlight Universel (Ctrl + K) */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center justify-between w-48 sm:w-80 lg:w-96 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 rounded-xl text-xs text-slate-500 dark:text-slate-400 transition cursor-pointer group"
              title="Ouvrir la recherche et palette de commandes rapide (Ctrl+K)"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0" />
                <span className="truncate">Rechercher athlète ou action…</span>
              </span>
              <kbd className="hidden sm:inline-block text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                Ctrl K
              </kbd>
            </button>
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

            {/* Cloche de Notifications avec Popover Interactif */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifPopoverOpen((prev) => !prev)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
                title="Centre de notifications rapide"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingNotifications && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 animate-pulse" aria-hidden="true" />
                )}
              </button>

              {notifPopoverOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-950/50">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-0">
                        Notifications & Alertes
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0">
                        Suivi opérationnel en temps réel
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      totalAlertCount > 0
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {totalAlertCount > 0 ? `${totalAlertCount} à traiter` : "Tout est à jour"}
                    </span>
                  </div>

                  <div className="p-3 space-y-2">
                    {/* Demandes d'inscription en ligne */}
                    <button
                      type="button"
                      onClick={() => {
                        setNotifPopoverOpen(false);
                        navigate("/athletes?tab=inscriptions");
                      }}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-sky-500/10 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Pré-inscriptions en ligne
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {counts.inscriptions > 0
                              ? `${counts.inscriptions} dossier(s) en attente de validation`
                              : "Aucune demande en attente"}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {/* Cotisations à renouveler */}
                    <button
                      type="button"
                      onClick={() => {
                        setNotifPopoverOpen(false);
                        navigate("/alertes");
                      }}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-500/10 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          counts.pendingCotis > 0 ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500"
                        }`}>
                          {counts.pendingCotis > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Échéances de Cotisations
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {counts.pendingCotis > 0
                              ? `${counts.pendingCotis} cotisation(s) arrivée(s) à terme`
                              : "Toutes les cotisations sont à jour"}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      to="/alertes"
                      onClick={() => setNotifPopoverOpen(false)}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 no-underline transition"
                    >
                      <span>Ouvrir le Centre d'Alertes complet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenu de la page (pb-20 sur mobile pour dégager la Bottom Tab Bar) */}
        <main className="flex-1 pb-20 lg:pb-0" id="main-content">
          {children}
        </main>

        {/* ══════════════════════════════════════════════════════════
            BARRE DE NAVIGATION BASSE MOBILE (TERRAIN / BORD DE BASSIN)
        ══════════════════════════════════════════════════════════ */}
        <nav
          aria-label="Navigation mobile rapide"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 flex items-center justify-around shadow-lg"
        >
          <Link
            to={isEntraineur ? "/planning" : "/dashboard"}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl no-underline transition ${
              activeMenu === "dashboard" || (isEntraineur && activeMenu === "planning")
                ? "text-blue-600 dark:text-sky-400 font-bold"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {isEntraineur ? <Calendar className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
            <span className="text-[10px]">{isEntraineur ? "Planning" : "Pilotage"}</span>
          </Link>

          <Link
            to="/athletes"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl no-underline transition ${
              activeMenu === "membres"
                ? "text-blue-600 dark:text-sky-400 font-bold"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Membres</span>
          </Link>

          {/* Bouton Central Flottant Scanner QR */}
          <Link
            to="/scanner"
            className="flex flex-col items-center justify-center -mt-5 no-underline group"
            aria-label="Scanner Carte Accès"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/35 border-2 border-white dark:border-slate-900 group-active:scale-95 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-extrabold text-blue-600 dark:text-cyan-400 mt-0.5">
              Scan QR
            </span>
          </Link>

          <Link
            to="/performances"
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl no-underline transition ${
              activeMenu === "chronos"
                ? "text-blue-600 dark:text-sky-400 font-bold"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Timer className="w-5 h-5" />
            <span className="text-[10px]">Chronos</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 bg-transparent border-0 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </nav>
      </div>

      {/* ── Palette de commandes Spotlight (Ctrl + K) ───────────── */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

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
