import React, { useState } from 'react';
import { 
  Trophy, Users, Activity, QrCode, ArrowRight, CheckCircle2, 
  Calendar, ShieldCheck, Timer, ChevronRight, Menu, X, Waves 
} from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* ==================== NAVBAR ==================== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Waves className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                OVIA SPORT
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
                Aquatic Club Pro
              </span>
            </div>
          </div>

          {/* Liens Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#excellence" className="hover:text-cyan-400 transition">Le Club</a>
            <a href="#programmes" className="hover:text-cyan-400 transition">Programmes</a>
            <a href="#digital" className="hover:text-cyan-400 transition">Suivi Pro</a>
          </nav>

          {/* Actions & Espaces */}
          <div className="hidden md:flex items-center gap-3">
            <a 
              href="/admin" 
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Espace Admin
            </a>
            <a 
              href="/adherent" 
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-200 transition"
            >
              Espace Adhérent
            </a>
            <a 
              href="/inscription" 
              className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition flex items-center gap-2"
            >
              S'inscrire <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Bouton Menu Mobile */}
          <button 
            type="button"
            className="md:hidden p-2 text-slate-300 hover:text-white transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
            <a 
              href="#excellence" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-2 text-slate-300 font-medium"
            >
              Le Club
            </a>
            <a 
              href="#programmes" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-2 text-slate-300 font-medium"
            >
              Programmes
            </a>
            <a 
              href="#digital" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block py-2 text-slate-300 font-medium"
            >
              Suivi Pro
            </a>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <a 
                href="/adherent" 
                onClick={() => setMobileMenuOpen(false)} 
                className="w-full py-2.5 text-center rounded-xl bg-slate-800 font-semibold text-white"
              >
                Espace Adhérent
              </a>
              <a 
                href="/admin" 
                onClick={() => setMobileMenuOpen(false)} 
                className="w-full py-2 text-center text-sm text-slate-400 hover:text-white"
              >
                Espace Admin
              </a>
              <a 
                href="/inscription" 
                onClick={() => setMobileMenuOpen(false)} 
                className="w-full py-3 text-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold"
              >
                S'inscrire maintenant
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Image de fond avec dégradé pro */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950" />
        
        {/* Halo lumineux décoratif */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/15 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge Saison */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Inscriptions Saison 2026/2027 Ouvertes
          </div>

          {/* Titre Principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.08] max-w-5xl mx-auto">
            Dépassez vos limites <br />
            avec <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent italic">Ovia Sport</span>
          </h1>

          {/* Sous-titre */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            L'académie et club professionnel de natation de référence. De l'apprentissage sécurisé à la haute compétition, évoluez dans une structure d'élite équipée d'un suivi biométrique et chronométrique.
          </p>

          {/* Boutons d'action */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/inscription" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-base shadow-xl shadow-cyan-500/20 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              Rejoindre le club <ArrowRight className="w-5 h-5" />
            </a>
            <a 
              href="#programmes" 
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-base transition flex items-center justify-center gap-2"
            >
              Découvrir nos groupes
            </a>
          </div>
        </div>
      </section>

      {/* ==================== BARRE DE STATS (IMPACT PRO) ==================== */}
      <section className="relative z-10 -mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
          <div className="text-center border-r border-slate-800/80 last:border-none">
            <p className="text-3xl sm:text-4xl font-black text-cyan-400">100%</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Suivi Chronométrique</p>
          </div>
          <div className="text-center md:border-r border-slate-800/80">
            <p className="text-3xl sm:text-4xl font-black text-white">4 Nages</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Méthodologie Officielle</p>
          </div>
          <div className="text-center border-r border-slate-800/80">
            <p className="text-3xl sm:text-4xl font-black text-cyan-400">Élite</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Staff Certifié DJS / FAA</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-black text-white">QR Pass</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Accès & Pointage Digital</p>
          </div>
        </div>
      </section>

      {/* ==================== POURQUOI NOUS CHOISIR ==================== */}
      <section id="excellence" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest">Standard Professionnel</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
            Pourquoi choisir Ovia Sport ?
          </h2>
          <p className="mt-4 text-slate-400">
            Une méthodologie structurée autour des 5 qualités physiques fondamentales et d'outils technologiques de pointe pour garantir la progression de chaque nageur.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Pilier 1 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition group">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Compétition & Excellence</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Planification annuelle rigoureuse, préparation physique intégrée et participation aux championnats régionaux et nationaux pour nos nageurs qualifiés.
            </p>
          </div>

          {/* Pilier 2 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition group">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Groupes par Niveaux</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tests d'évaluation dès l'inscription pour intégrer un créneau homogène. Sécurité maximale et pédagogie adaptée à chaque tranche d'âge.
            </p>
          </div>

          {/* Pilier 3 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Suivi des Performances</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Fiche bilan numérique accessible depuis l'Espace Adhérent : courbes de vitesse, endurance, assiduité et validation des paliers techniques.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== NOS PROGRAMMES ==================== */}
      <section id="programmes" className="py-24 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest">Filières de Formation</span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
                Nos Programmes d'Entraînement
              </h2>
            </div>
            <p className="mt-4 md:mt-0 text-slate-400 max-w-md text-sm">
              Chaque groupe suit un programme technique précis établi par notre direction sportive pour assurer une évolution constante.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Carte 1 : Apprentissage */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    ENFANTS 6 - 10 ANS
                  </span>
                  <span className="text-xs text-slate-400 font-medium">École de Natation</span>
                </div>
                <h3 className="text-2xl font-black mb-2">Apprentissage</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Acquérir l'aisance aquatique en toute confiance et maîtriser les fondamentaux techniques.
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Familiarisation et sécurité aquatique
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Équilibre, flottaison et respiration aquatique
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Initiation technique aux 4 nages
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Passage des tests fédéraux (Poussins)
                  </li>
                </ul>
              </div>
              <a 
                href="/inscription" 
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center font-bold text-sm transition flex items-center justify-center gap-2"
              >
                Inscrire mon enfant <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Carte 2 : Perfectionnement (Mise en avant) */}
            <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-cyan-950/30 border-2 border-cyan-500/50 p-8 flex flex-col justify-between relative shadow-2xl shadow-cyan-500/10">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                Le plus demandé
              </div>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-400/30">
                    ADOS 11 - 15 ANS
                  </span>
                  <span className="text-xs text-cyan-400 font-medium">Pré-Compétition</span>
                </div>
                <h3 className="text-2xl font-black mb-2">Perfectionnement</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Affiner l'hydrodynamisme, développer l'endurance aérobie et découvrir l'exigence du chronomètre.
                </p>
                <ul className="space-y-3.5 text-sm text-slate-200 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Correction biomécanique des 4 nages
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Maîtrise des départs plongés et virages culbutes
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Développement de l'endurance et vitesse
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Initiation au chronométrage officiel
                  </li>
                </ul>
              </div>
              <a 
                href="/inscription" 
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-center font-extrabold text-sm transition flex items-center justify-center gap-2"
              >
                Rejoindre ce groupe <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Carte 3 : Élite & Compétition */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    16+ ANS & ÉLITE
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Haute Performance</span>
                </div>
                <h3 className="text-2xl font-black mb-2">Élite & Compétition</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Pour les nageurs ambitieux visant les qualifications régionales, nationales et les podiums.
                </p>
                <ul className="space-y-3.5 text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Entraînements intensifs et biquotidiens
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Préparation physique générale (PPG) à sec
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Analyse vidéo et suivi des temps de passage
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    Engagement aux meetings et championnats
                  </li>
                </ul>
              </div>
              <a 
                href="/inscription" 
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-center font-bold text-sm transition flex items-center justify-center gap-2"
              >
                Postuler au groupe Élite <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION PLATEFORME DIGITALE ==================== */}
      <section id="digital" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 p-8 sm:p-12 lg:p-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              INNOVATION OVIA SPORT
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Un club connecté pour un suivi digne des pros.
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Chaque nageur et parent dispose d'un accès personnel à notre plateforme de gestion sportive pour suivre son évolution en temps réel.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-800 text-cyan-400 shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Carte d'accès digitale QR Code</h4>
                  <p className="text-sm text-slate-400 mt-0.5">Pointage rapide à l'entrée du bassin et suivi transparent des présences.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-800 text-cyan-400 shrink-0">
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Historique des Chronos & Graphiques</h4>
                  <p className="text-sm text-slate-400 mt-0.5">Visualisez vos records personnels (50m, 100m, 200m...) et votre courbe de progression.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-800 text-cyan-400 shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Planning & Cotisations en ligne</h4>
                  <p className="text-sm text-slate-400 mt-0.5">Consultez vos horaires d'entraînement, les convocations aux compétitions et l'état de votre dossier.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu visuel (Mockup) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300">
                  OS
                </div>
                <div>
                  <p className="text-sm font-bold">Fiche Athlète #2026-089</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Licence Active • Groupe Perfectionnement
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-900 px-2.5 py-1 rounded text-slate-400">Saison 26/27</span>
            </div>

            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <p className="text-[11px] text-slate-400">50m Nage Libre</p>
                <p className="text-lg font-black text-white mt-0.5">28.45s</p>
                <span className="text-[10px] text-emerald-400 font-semibold">-1.20s ce mois</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <p className="text-[11px] text-slate-400">Assiduité</p>
                <p className="text-lg font-black text-cyan-400 mt-0.5">96%</p>
                <span className="text-[10px] text-slate-400">24/25 séances</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                <p className="text-[11px] text-slate-400">Indice Vitesse</p>
                <p className="text-lg font-black text-white mt-0.5">Niveau A</p>
                <span className="text-[10px] text-cyan-400">Qualifié Régional</span>
              </div>
            </div>

            <a 
              href="/adherent" 
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-center text-xs font-bold uppercase tracking-wider text-cyan-400 block transition"
            >
              Accéder à mon Espace Adhérent →
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="font-black tracking-wider text-sm">OVIA SPORT</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 Ovia Sport. Tous droits réservés. Excellence & Performance Aquatique.
          </p>
        </div>
      </footer>

    </div>
  );
}

export { HomePage as LandingPage };
