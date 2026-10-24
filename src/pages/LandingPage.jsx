import React, { useState } from 'react';
import { 
  Trophy, Users, Activity, QrCode, ArrowRight, CheckCircle2, 
  Calendar, ShieldCheck, Timer, ChevronRight, Menu, X, Sun, Moon,
  MapPin, Phone, Clock, Mail, ChevronDown, Check, Sparkles, User,
  HelpCircle, Waves, Award, Shield, Lock, MessageCircle, ExternalLink
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0); // Premier accordéon ouvert par défaut
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const faqItems = [
    {
      question: "Quelles sont les pièces obligatoires à fournir pour le dossier ?",
      answer: "Pour finaliser votre adhésion, vous devez fournir : 1 photo d'identité récente (smartphone accepté), un certificat médical officiel d'aptitude à la natation (ou formulaire du club téléchargeable en ligne), un extrait de naissance ou pièce d'identité, et le règlement de la licence/cotisation."
    },
    {
      question: "Comment se déroule la séance de test de niveau préalable ?",
      answer: "Dès votre pré-inscription validée, une évaluation aquatique de 15 minutes est organisée avec notre staff qualifié. Cette séance permet d'évaluer l'aisance technique, la flottaison et la respiration afin d'orienter l'enfant dans le groupe le plus stimulant et sécurisé."
    },
    {
      question: "Comment fonctionne la carte d'accès digitale QR Pass ?",
      answer: "Dès validation de votre dossier, votre Espace Adhérent génère un badge numérique individuel sécurisé. Vous pouvez le présenter sur votre smartphone à l'entrée du bassin pour un pointage instantané sans contact et un suivi transparent des présences."
    }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 selection:bg-cyan-500 selection:text-slate-950 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* ==================== NAVBAR ==================== */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        isDark ? 'bg-slate-950/85 border-slate-800/80' : 'bg-white/90 border-slate-200/90 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo avec Image Officielle Ovia Sport */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img 
              src="/logo.jpg" 
              alt="Logo Ovia Sport" 
              className="w-11 h-11 rounded-xl object-cover border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/20 bg-white" 
            />
            <div>
              <span className={`text-xl font-black tracking-wider bg-clip-text text-transparent ${
                isDark 
                  ? 'bg-gradient-to-r from-white via-slate-100 to-cyan-400' 
                  : 'bg-gradient-to-r from-slate-950 via-slate-800 to-cyan-700'
              }`}>
                OVIA SPORT
              </span>
              <span className={`block text-[10px] uppercase tracking-widest font-bold ${
                isDark ? 'text-cyan-400' : 'text-cyan-700'
              }`}>
                Club Sportif Professionnel · Natation
              </span>
            </div>
          </div>

          {/* Liens Desktop */}
          <nav className={`hidden md:flex items-center gap-8 text-sm font-semibold transition-colors ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <a href="#excellence" className="hover:text-cyan-500 transition-colors">Le Club</a>
            <a href="#programmes" className="hover:text-cyan-500 transition-colors">Programmes</a>
            <a href="#digital" className="hover:text-cyan-500 transition-colors">Suivi Pro</a>
            <a href="#infos-pratiques" className="hover:text-cyan-500 transition-colors">Infos Pratiques</a>
          </nav>

          {/* Partie droite de la Navbar épurée */}
          <div className="hidden md:flex items-center gap-3">
            {/* Bouton Dark/Light Mode */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Changer le thème"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
            >
              {/* Icône Lune / Soleil */}
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Accès unifié (Adhérent & Staff redirigés selon leur rôle après connexion) */}
            <a
              href="/login"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
            >
              Espace Membre
            </a>

            {/* CTA Principal avec texte blanc */}
            <a
              href="/inscription"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:brightness-110"
            >
              S'inscrire →
            </a>
          </div>

          {/* Bouton Menu Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-300 text-amber-600'
              }`}
              title={isDark ? "Mode clair" : "Mode sombre"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-800" />}
            </button>
            <button 
              type="button"
              className={`p-2 transition-colors ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-b px-4 pt-3 pb-6 space-y-3 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <a 
              href="#excellence" 
              onClick={() => setMobileMenuOpen(false)} 
              className={`block py-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Le Club
            </a>
            <a 
              href="#programmes" 
              onClick={() => setMobileMenuOpen(false)} 
              className={`block py-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Programmes
            </a>
            <a 
              href="#digital" 
              onClick={() => setMobileMenuOpen(false)} 
              className={`block py-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Suivi Pro
            </a>
            <a 
              href="#infos-pratiques" 
              onClick={() => setMobileMenuOpen(false)} 
              className={`block py-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Infos Pratiques & FAQ
            </a>

            <div className={`pt-4 border-t flex flex-col gap-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <a 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)} 
                className={`w-full py-2.5 px-4 text-center rounded-full font-semibold transition flex items-center justify-center gap-2 border ${
                  isDark 
                    ? 'border-slate-700 bg-slate-800 text-slate-200' 
                    : 'border-slate-200 bg-white text-slate-800 shadow-sm'
                }`}
              >
                Espace Membre
              </a>

              <a 
                href="/inscription" 
                onClick={() => setMobileMenuOpen(false)} 
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:brightness-110"
              >
                S'inscrire →
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Image de fond avec dégradé pro */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className={`absolute inset-0 transition-colors duration-300 ${
          isDark 
            ? 'bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950' 
            : 'bg-gradient-to-b from-slate-950/75 via-slate-900/60 to-slate-50'
        }`} />
        
        {/* Halo lumineux décoratif */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/15 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge Saison (FOMO) */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md shadow-lg shadow-cyan-500/10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Inscriptions Saison 2026/2027 Ouvertes
          </div>

          {/* Titre Principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.08] max-w-5xl mx-auto text-white drop-shadow-md">
            Dépassez vos limites <br />
            avec <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent italic">Ovia Sport</span>
          </h1>

          {/* Sous-titre */}
          <p className="mt-6 text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal drop-shadow">
            L'académie et club professionnel de natation de référence. De l'apprentissage sécurisé à la haute compétition, évoluez dans une structure d'élite équipée d'un suivi biométrique et chronométrique.
          </p>

          {/* Boutons d'action (CTA Principal Hero) */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/inscription" 
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm sm:text-base font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 active:translate-y-0"
            >
              <span>Rejoindre le club</span>
              <svg className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a 
              href="#programmes" 
              className={`w-full sm:w-auto px-7 py-3.5 rounded-full border font-semibold text-sm sm:text-base transition flex items-center justify-center gap-2 ${
                isDark 
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-white' 
                  : 'bg-white/95 hover:bg-white border-slate-300 text-slate-900 shadow-lg'
              }`}
            >
              Découvrir nos groupes
            </a>
          </div>
        </div>
      </section>

      {/* ==================== BARRE DE STATS (IMPACT PRO) ==================== */}
      <section className="relative z-10 -mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl backdrop-blur-xl border transition-all ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 shadow-2xl' 
            : 'bg-white border-slate-200/90 shadow-xl'
        }`}>
          <div className={`text-center border-r last:border-none ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <p className="text-3xl sm:text-4xl font-black text-cyan-500">100%</p>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Suivi Chronométrique
            </p>
          </div>
          <div className={`text-center md:border-r ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <p className={`text-3xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>4 Nages</p>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Méthodologie Officielle
            </p>
          </div>
          <div className={`text-center border-r ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <p className="text-3xl sm:text-4xl font-black text-cyan-500">Élite</p>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Staff Qualifié
            </p>
          </div>
          <div className="text-center">
            <p className={`text-3xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>QR Pass</p>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Accès & Pointage Digital
            </p>
          </div>
        </div>
      </section>

      {/* ==================== POURQUOI NOUS CHOISIR ==================== */}
      <section id="excellence" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-500 font-bold text-xs uppercase tracking-widest">Standard Professionnel</span>
          <h2 className={`mt-2 text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Pourquoi choisir Ovia Sport ?
          </h2>
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Une méthodologie structurée autour des 5 qualités physiques fondamentales et d'outils technologiques de pointe pour garantir la progression de chaque nageur.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Pilier 1 */}
          <div className={`p-8 rounded-3xl border transition-all group ${
            isDark 
              ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/40' 
              : 'bg-white border-slate-200/90 hover:border-cyan-500/50 shadow-sm hover:shadow-xl'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-6 group-hover:scale-110 transition">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Compétition & Excellence</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Planification annuelle rigoureuse, préparation physique intégrée et participation aux championnats régionaux et nationaux pour nos nageurs qualifiés.
            </p>
          </div>

          {/* Pilier 2 */}
          <div className={`p-8 rounded-3xl border transition-all group ${
            isDark 
              ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/40' 
              : 'bg-white border-slate-200/90 hover:border-cyan-500/50 shadow-sm hover:shadow-xl'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition">
              <Users className="w-7 h-7" />
            </div>
            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Groupes par Niveaux</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Tests d'évaluation dès l'inscription pour intégrer un créneau homogène. Sécurité maximale et pédagogie adaptée à chaque tranche d'âge.
            </p>
          </div>

          {/* Pilier 3 */}
          <div className={`p-8 rounded-3xl border transition-all group ${
            isDark 
              ? 'bg-slate-900/50 border-slate-800 hover:border-cyan-500/40' 
              : 'bg-white border-slate-200/90 hover:border-cyan-500/50 shadow-sm hover:shadow-xl'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Suivi des Performances</h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Fiche bilan numérique accessible depuis l'Espace Adhérent : courbes de vitesse, endurance, assiduité et validation des paliers techniques.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== NOS PROGRAMMES AVEC MÉMORISATION DANS L'URL ==================== */}
      <section id="programmes" className={`py-24 border-y transition-colors ${
        isDark ? 'bg-slate-900/40 border-slate-900' : 'bg-slate-100/70 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <span className="text-cyan-500 font-bold text-xs uppercase tracking-widest">Filières de Formation</span>
              <h2 className={`mt-2 text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Nos Programmes d'Entraînement
              </h2>
            </div>
            <p className={`mt-4 md:mt-0 max-w-md text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Chaque groupe suit un programme technique précis établi par notre direction sportive pour assurer une évolution constante.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Carte 1 : Apprentissage */}
            <div className={`rounded-3xl border p-8 flex flex-col justify-between transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                : 'bg-white border-slate-200/90 shadow-md hover:shadow-xl'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                    ENFANTS 5 - 7 ANS
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>École de Natation</span>
                </div>
                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Apprentissage</h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Acquérir l'aisance aquatique en toute confiance, vaincre l'appréhension et maîtriser les bases techniques.
                </p>
                <ul className={`space-y-3.5 text-sm mb-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Familiarisation et sécurité aquatique complète
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Équilibre, flottaison ventrale et dorsale
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Respiration aquatique et immersion en douceur
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Initiation progressive aux mouvements de nage
                  </li>
                </ul>
              </div>
              <a 
                href="/inscription?programme=apprentissage" 
                className={`w-full py-3.5 rounded-xl text-center font-bold text-sm transition flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
                }`}
              >
                <span>Inscrire mon enfant</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Carte 2 : Perfectionnement (Mise en avant + texte blanc) */}
            <div className={`rounded-3xl border-2 p-8 flex flex-col justify-between relative shadow-2xl transition-all ${
              isDark 
                ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/30 border-cyan-500/50 shadow-cyan-500/10' 
                : 'bg-gradient-to-b from-white via-white to-cyan-50/70 border-cyan-500/60 shadow-xl shadow-cyan-500/15'
            }`}>
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                Le plus demandé
              </div>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-500 border border-blue-400/30">
                    ENFANTS 8 - 10 ANS
                  </span>
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">Technique 4 Nages</span>
                </div>
                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Perfectionnement</h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Maîtrise des 4 nages (crawl, dos, brasse, dauphin), perfectionnement des virages culbutes et endurance.
                </p>
                <ul className={`space-y-3.5 text-sm mb-8 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Correction biomécanique des 4 nages
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Maîtrise des départs plongés et virages culbutes
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Développement de l'endurance aquatique et régularité
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Validation des paliers techniques officiels
                  </li>
                </ul>
              </div>
              <a 
                href="/inscription?programme=perfectionnement" 
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-center font-extrabold text-sm transition shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
              >
                <span>Rejoindre ce groupe</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </a>
            </div>

            {/* Carte 3 : Compétition (Enfants 7 - 10 ans) */}
            <div className={`rounded-3xl border p-8 flex flex-col justify-between transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                : 'bg-white border-slate-200/90 shadow-md hover:shadow-xl'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    ENFANTS 7 - 10 ANS
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pôle Compétition</span>
                </div>
                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Compétition</h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Filière sportive pour les jeunes nageurs motivés visant le chronomètre, l'exigence technique et les compétitions officielles.
                </p>
                <ul className={`space-y-3.5 text-sm mb-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Entraînements dynamiques axés vitesse et explosivité
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Apprentissage des départs sur plots et chronométrage
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Préparation physique adaptée aux jeunes sportifs
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                    Engagement aux meetings et championnats Avenirs
                  </li>
                </ul>
              </div>
              <a 
                href="/inscription?programme=competition" 
                className={`w-full py-3.5 rounded-xl text-center font-bold text-sm transition flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
                }`}
              >
                <span>Intégrer le groupe Compétition</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION PLATEFORME DIGITALE AVEC SPARKLINE INTERACTIF ==================== */}
      <section id="digital" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`rounded-3xl border p-8 sm:p-12 lg:p-16 grid lg:grid-cols-2 gap-12 items-center transition-all ${
          isDark 
            ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border-slate-800 shadow-2xl' 
            : 'bg-gradient-to-r from-white via-white to-sky-50 border-slate-200/90 shadow-xl'
        }`}>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              INNOVATION OVIA SPORT
            </span>
            <h2 className={`mt-4 text-3xl sm:text-4xl font-black tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Un club connecté pour un suivi digne des pros.
            </h2>
            <p className={`mt-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Chaque nageur et parent dispose d'un accès personnel à notre plateforme de gestion sportive pour suivre son évolution en temps réel.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  isDark ? 'bg-slate-800 text-cyan-400' : 'bg-sky-100 text-cyan-700 border border-sky-200'
                }`}>
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Carte d'accès digitale QR Code</h4>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Pointage rapide à l'entrée du bassin et suivi transparent des présences.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  isDark ? 'bg-slate-800 text-cyan-400' : 'bg-sky-100 text-cyan-700 border border-sky-200'
                }`}>
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Historique des Chronos & Graphiques</h4>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Visualisez vos records personnels (50m, 100m, 200m...) et votre courbe de progression.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  isDark ? 'bg-slate-800 text-cyan-400' : 'bg-sky-100 text-cyan-700 border border-sky-200'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Planning & Cotisations en ligne</h4>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Consultez vos horaires d'entraînement, les convocations aux compétitions et l'état de votre dossier.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu visuel Enrichi : Mockup Fiche Athlète Digital avec Sparkline SVG Dynamique */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 group hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-cyan-500/20">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.jpg" 
                  alt="Avatar" 
                  className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400 shadow-sm" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Fiche Athlète #2026-089</p>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Licence Active · Perfectionnement
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-900 px-2.5 py-1 rounded-lg text-cyan-400 border border-slate-800 shadow-inner">
                Saison 26/27
              </span>
            </div>

            {/* 3 Cartes de Métriques Clés */}
            <div className="grid grid-cols-3 gap-3 my-5">
              
              {/* Métrique 1 : 50m NL avec Sparkline intégré */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 group-hover:border-cyan-500/30 transition-colors">
                <p className="text-[11px] text-slate-400 font-medium">50m Nage Libre</p>
                <p className="text-lg font-black text-white mt-0.5">28.45s</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    -1.20s
                  </span>
                  <span className="text-[9px] text-slate-400">ce mois</span>
                </div>
              </div>

              {/* Métrique 2 : Assiduité */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 group-hover:border-cyan-500/30 transition-colors">
                <p className="text-[11px] text-slate-400 font-medium">Assiduité</p>
                <p className="text-lg font-black text-cyan-400 mt-0.5">96%</p>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">24/25 séances</span>
              </div>

              {/* Métrique 3 : Indice Vitesse */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 group-hover:border-cyan-500/30 transition-colors">
                <p className="text-[11px] text-slate-400 font-medium">Indice Vitesse</p>
                <p className="text-lg font-black text-white mt-0.5">Niveau A</p>
                <span className="text-[10px] text-cyan-400 font-semibold block mt-0.5">Qualifié Régional</span>
              </div>
            </div>

            {/* MINI-GRAPHIQUE EN COURBE (SPARKLINE SVG) ENRICHI */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Courbe de Progression (50m NL)
                </span>
                <span className="font-mono text-[11px] text-emerald-400 font-bold">
                  Record Personnel (PB)
                </span>
              </div>

              <div className="relative pt-1">
                <svg viewBox="0 0 320 65" className="w-full h-16 overflow-visible">
                  <defs>
                    <linearGradient id="proSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="proSparklineStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="60%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>

                  {/* Lignes repères subtiles */}
                  <line x1="10" y1="12" x2="310" y2="12" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="10" y1="36" x2="310" y2="36" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="10" y1="58" x2="310" y2="58" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  {/* Surface dégradée */}
                  <path 
                    d="M 15,52 Q 95,46 160,34 T 245,22 T 305,10 L 305,62 L 15,62 Z" 
                    fill="url(#proSparklineGrad)" 
                  />

                  {/* Courbe principale */}
                  <path 
                    d="M 15,52 Q 95,46 160,34 T 245,22 T 305,10" 
                    fill="none" 
                    stroke="url(#proSparklineStroke)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                  />

                  {/* Points de données */}
                  <circle cx="15" cy="52" r="3.5" fill="#38bdf8" />
                  <circle cx="160" cy="34" r="3.5" fill="#06b6d4" />
                  <circle cx="245" cy="22" r="3.5" fill="#2dd4bf" />

                  {/* Point actif PB avec effet radar */}
                  <circle cx="305" cy="10" r="8" fill="#10b981" opacity="0.25" className="animate-ping" />
                  <circle cx="305" cy="10" r="4.5" fill="#10b981" />
                </svg>

                {/* Étiquettes de chronos au-dessus de la courbe */}
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5 px-1">
                  <span>Nov (29.65s)</span>
                  <span>Déc (29.10s)</span>
                  <span>Jan (28.75s)</span>
                  <span className="text-emerald-400 font-bold">Fév (28.45s ⚡)</span>
                </div>
              </div>
            </div>

            {/* Bouton d'accès direct au portail */}
            <a 
              href="/adherent" 
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-center text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 block transition shadow-lg group-hover:shadow-cyan-500/10"
            >
              Accéder à mon Espace Adhérent →
            </a>
          </div>
        </div>
      </section>

      {/* ==================== NOUVELLE SECTION : INFOS PRATIQUES / BASSIN & CRÉNEAUX & FAQ ==================== */}
      <section id="infos-pratiques" className={`py-24 border-t transition-colors ${
        isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100/60 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-cyan-500 font-bold text-xs uppercase tracking-widest">Organisation & Démarches</span>
            <h2 className={`mt-2 text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Bassin, Horaires & Modalités d'Inscription
            </h2>
            <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Toutes les informations logistiques pour aborder sereinement votre rentrée sportive au sein d'Ovia Sport.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Colonne Gauche : Bassin & Complexe Nautique (5 Colonnes) */}
            <div className={`lg:col-span-5 rounded-3xl border p-8 transition-all ${
              isDark 
                ? 'bg-slate-900/80 border-slate-800 shadow-xl' 
                : 'bg-white border-slate-200 shadow-lg'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                  <Waves className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Complexe Aquatique Olympique
                  </h3>
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
                    Bassin Couvert Chauffé 28°C
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Localisation du Complexe</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Cité Olympique, Avenue des Sports · Lignes d'eau réservées & Parking adhérents sécurisé.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Horaires d'Accueil Secrétariat</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Lundi au Samedi : 08h30 - 12h30 & 14h00 - 19h30. Fermé le Vendredi matin.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Hotline & Support WhatsApp</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Permanence téléphonique et WhatsApp directe au <strong>0770 71 98 68</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sécurité & Encadrement</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Surveillance continue assurée par des Maîtres-Nageurs Sauveteurs et un staff qualifié.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bouton Contact Secrétariat */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <a
                  href="https://wa.me/213770719868?text=Bonjour,%20je%20souhaite%20obtenir%20des%20renseignements%20pour%20une%20inscription%20au%20club%20Ovia%20Sport."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contacter le Secrétariat sur WhatsApp
                </a>
              </div>
            </div>

            {/* Colonne Droite : Accordéon Interactif FAQ (7 Colonnes) */}
            <div className="lg:col-span-7 space-y-3">
              {faqItems.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isDark 
                        ? 'bg-slate-900/60 border-slate-800' 
                        : 'bg-white border-slate-200 shadow-sm'
                    } ${isOpen ? 'ring-1 ring-cyan-500/40' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className={`text-sm sm:text-base font-bold transition-colors ${
                        isOpen ? 'text-cyan-500' : isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {item.question}
                      </span>
                      <ChevronDown className={`w-5 h-5 shrink-0 text-cyan-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`} />
                    </button>

                    {isOpen && (
                      <div className={`px-5 pb-5 text-sm leading-relaxed border-t pt-3 ${
                        isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-600'
                      }`}>
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Raccourci vers Inscription Directe */}
              <div className={`p-5 rounded-2xl border border-dashed flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 ${
                isDark ? 'border-cyan-500/30 bg-cyan-950/20' : 'border-cyan-500/40 bg-cyan-50/50'
              }`}>
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Prêt à démarrer l'aventure Ovia Sport ?
                  </p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Les places sont limitées par créneau pour garantir la sécurité et la qualité technique.
                  </p>
                </div>
                <a
                  href="/inscription"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40 active:translate-y-0 shrink-0"
                >
                  <span>Rejoindre le club</span>
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ==================== FOOTER PRESTIGIEUX & ENRICHI ==================== */}
      <footer className={`border-t pt-16 pb-12 transition-colors ${
        isDark ? 'bg-slate-950 border-slate-900 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-inner'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-200 dark:border-slate-800/80">
            
            {/* Colonne 1 : Club & Identité */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.jpg" 
                  alt="Logo Ovia Sport" 
                  className="w-10 h-10 rounded-xl object-cover border border-cyan-400/40" 
                />
                <div>
                  <span className={`font-black tracking-wider text-base block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    OVIA SPORT
                  </span>
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-bold">
                    Club Sportif · Natation
                  </span>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-4">
                Académie d'excellence et club de compétition aquatique de référence. Formation technique rigoureuse, encadrement certifié et plateforme digitale moderne.
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                  Staff Qualifié & Agréé
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  Saison 2026/2027
                </span>
              </div>
            </div>

            {/* Colonne 2 : Filières de Formation */}
            <div>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Filières Aquatiques
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="/inscription?programme=apprentissage" className="hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    Apprentissage Enfants (5 - 7 ans)
                  </a>
                </li>
                <li>
                  <a href="/inscription?programme=perfectionnement" className="hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    Perfectionnement (8 - 10 ans)
                  </a>
                </li>
                <li>
                  <a href="/inscription?programme=competition" className="hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    Pôle Compétition (7 - 10 ans)
                  </a>
                </li>
                <li>
                  <a href="#infos-pratiques" className="hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-cyan-500" />
                    Stages Intensifs Vacances
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : Bassin & Horaires */}
            <div>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bassin & Secrétariat
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Complexe Aquatique Olympique, Cité Olympique, Avenue des Sports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>Lun - Sam : 08h30 - 19h30 (Secrétariat ouvert aux familles)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <span>0770 71 98 68 (WhatsApp & Appels)</span>
                </li>
              </ul>
            </div>

            {/* Colonne 4 : Espaces & Connexion Sécurisée */}
            <div>
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Espaces & Accès
              </h4>
              <ul className="space-y-2.5 text-xs mb-5">
                <li>
                  <a href="/adherent" className="hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-500" />
                    Portail Adhérent & Familles
                  </a>
                </li>
                <li>
                  <a href="/inscription" className="hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-500" />
                    Pré-inscriptions 2026 / 2027
                  </a>
                </li>
                <li>
                  <a href="/scanner" className="hover:text-cyan-500 transition-colors flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-cyan-500" />
                    Scanner Terrain des Entraîneurs
                  </a>
                </li>
              </ul>

              {/* Accès Admin déplacé avec discrétion et sécurité dans le Footer */}
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <a 
                  href="/login" 
                  className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-cyan-400 transition"
                  title="Accès réservé à la direction et aux entraîneurs"
                >
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Espace Admin & Staff
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>

          {/* Barre inférieure des droits et mentions */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © 2026 Ovia Sport. Tous droits réservés. Excellence, Rigueur & Performance Aquatique.
            </p>
            <div className="flex items-center gap-6">
              <span>Protection des données (Loi 18-07)</span>
              <span>Règlement Intérieur</span>
              <span>Agrément Sportif Officiel</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

export { HomePage as LandingPage };
