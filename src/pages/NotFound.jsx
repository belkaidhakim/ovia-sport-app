import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Users, Calendar, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Badge & Logo */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6">
          <AlertCircle className="w-3.5 h-3.5" />
          Erreur 404
        </div>

        {/* 404 Big Title */}
        <h1 className="text-7xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 mb-2">
          404
        </h1>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Page Introuvable
        </h2>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
          La page que vous recherchez semble introuvable ou a été déplacée. Utilisez les raccourcis ci-dessous pour reprendre votre navigation.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </button>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/30 transition no-underline cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Tableau de Bord
          </Link>
        </div>

        {/* Quick Nav Links */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex items-center justify-center gap-6 text-xs text-slate-400">
          <Link to="/athletes" className="hover:text-cyan-300 transition flex items-center gap-1.5 no-underline text-inherit">
            <Users className="w-3.5 h-3.5" />
            Athlètes
          </Link>
          <span className="text-slate-700">•</span>
          <Link to="/planning" className="hover:text-cyan-300 transition flex items-center gap-1.5 no-underline text-inherit">
            <Calendar className="w-3.5 h-3.5" />
            Planning
          </Link>
          <span className="text-slate-700">•</span>
          <Link to="/finances" className="hover:text-cyan-300 transition no-underline text-inherit">
            Finances
          </Link>
        </div>

        <p className="mt-6 text-[11px] text-slate-600">
          OVIA SPORT • Plateforme de Gestion Haute Performance
        </p>
      </div>
    </div>
  );
}
