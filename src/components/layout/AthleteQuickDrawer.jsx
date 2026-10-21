/**
 * =====================================================
 * OVIA SPORT — AthleteQuickDrawer
 * =====================================================
 * Tiroir latéral slide-over qui affiche la fiche rapide
 * d'un athlète. Extrait de ClubProAppShell.jsx pour
 * respecter le principe de responsabilité unique.
 *
 * Utilisation :
 *   window.dispatchEvent(new CustomEvent('open-athlete-drawer', { detail: athlete }))
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Phone, CheckCircle2, Printer } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { APP_EVENTS, DEFAULT_SESSION_QUOTA } from '../../config/constants';
import toast from 'react-hot-toast';

export default function AthleteQuickDrawer() {
  const navigate = useNavigate();
  const [athlete, setAthlete] = useState(null);

  // ── Écouter l'événement d'ouverture depuis n'importe où dans l'app ──
  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail) setAthlete(e.detail);
    };
    window.addEventListener(APP_EVENTS.OPEN_ATHLETE_DRAWER, handleOpen);
    return () => window.removeEventListener(APP_EVENTS.OPEN_ATHLETE_DRAWER, handleOpen);
  }, []);

  // ── Fermeture avec la touche Échap ─────────────────────────────────
  useEffect(() => {
    if (!athlete) return;
    const handleKey = (e) => { if (e.key === 'Escape') setAthlete(null); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [athlete]);

  // ── Pointage rapide ─────────────────────────────────────────────────
  const handleQuickPresence = async () => {
    if (!athlete?.id) return;
    try {
      const { error } = await supabase.from('presences').insert([{
        athlete_id: athlete.id,
        date_scan: new Date().toISOString(),
      }]);
      if (error) throw error;
      setAthlete(prev => ({ ...prev, seances: (prev.seances || 0) + 1 }));
      toast.success(`Pointage enregistré pour ${athlete.prenom} ! (+1 séance)`, { icon: '🏊‍♂️' });
    } catch (e) {
      toast.error('Erreur lors du pointage: ' + e.message);
    }
  };

  if (!athlete) return null;

  const presencesCount = athlete.seances ?? athlete.presences?.length ?? 0;
  const initials = ((athlete.nom?.[0] || 'O') + (athlete.prenom?.[0] || 'S')).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 z-40 lg:hidden"
        onClick={() => setAthlete(null)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label={`Fiche de ${athlete.prenom} ${athlete.nom}`}
        className="fixed inset-y-0 right-0 w-96 max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50"
        style={{ animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* ── En-tête ───────────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            {athlete.photo ? (
              <img
                src={athlete.photo}
                alt={athlete.prenom}
                className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-base shrink-0 shadow-sm">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-black text-slate-900 dark:text-white text-sm truncate">
                {athlete.nom?.toUpperCase()} {athlete.prenom}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {athlete.categorie || athlete.groupes?.nom || athlete.groupe || 'Section Natation'}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> Accès Bassin Autorisé
              </span>
            </div>
          </div>
          <button
            onClick={() => setAthlete(null)}
            aria-label="Fermer le tiroir"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Corps ────────────────────────────────────────────────── */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto text-xs">

          {/* Carte d'accès & Quota de séances */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Forfait Mensuel</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-black">
                {presencesCount} / {athlete.maxSeances || DEFAULT_SESSION_QUOTA} séances
              </span>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: DEFAULT_SESSION_QUOTA }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-sm transition-all ${i < presencesCount ? 'bg-cyan-400' : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleQuickPresence}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition cursor-pointer shadow-md shadow-blue-600/30 text-xs"
              >
                + Pointer 1 présence
              </button>
              <button
                onClick={() => navigate(`/athletes/edit/${athlete.id}`)}
                title="Voir Carte & Badge QR"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Situation financière */}
          <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Situation Financière
            </h3>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Statut Cotisation</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {athlete.cotisation || 'À jour'}
              </span>
            </div>
            <div className="flex justify-between py-1 items-center">
              <span className="text-slate-500">Tarification appliquée</span>
              <span className="font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-800">
                {athlete.remise || 'Standard'}
              </span>
            </div>
          </div>

          {/* Contact tuteur */}
          {athlete.telephone && (
            <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Contact Tuteur
              </h3>
              <a
                href={`tel:${athlete.telephone}`}
                className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold hover:text-blue-600 transition"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{athlete.telephone}</span>
              </a>
            </div>
          )}

          {/* Dernières performances */}
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
                {athlete.meilleurChrono50NL || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Pied — Actions rapides ────────────────────────────────── */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex gap-2">
          <button
            onClick={() => { navigate(`/athletes/edit/${athlete.id}`); setAthlete(null); }}
            className="flex-1 py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Modifier Dossier
          </button>
          <button
            onClick={() => { navigate('/finances'); setAthlete(null); }}
            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-sm"
          >
            Encaisser Mois
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
