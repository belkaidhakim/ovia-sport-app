import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Phone, ChevronDown, Timer, QrCode,
  MoreVertical, ShieldCheck, Edit, FileText, Trash2, Clock, RotateCcw
} from 'lucide-react';
import { getAgeAndCategory, getCotisationStatus, getSmartAccess } from '../../utils/athleteHelpers';
import { getSwimmingCategory } from '../../utils/swimmingCategories';
import { APP_EVENTS, DEFAULT_SESSION_QUOTA } from '../../config/constants';

export default function AthleteTableRow({
  athlete,
  isSelected,
  onToggleSelect,
  siblingInfo,
  onToggleMedicalCert,
  onOpenSmartAccess,
  onOpenChronos,
  onOpenBadge,
  activeMenuId,
  setActiveMenuId,
  onArchive,
  onDownloadPdfForm,
  onResetPresences
}) {
  const initiales = `${(athlete.nom?.[0] || '').toUpperCase()}${(athlete.prenom?.[0] || '').toUpperCase()}`;
  const seancesEffectuees = Array.isArray(athlete.presences) ? athlete.presences.length : 0;
  const seancesMax = DEFAULT_SESSION_QUOTA || 8;
  const pourcentageSeances = Math.min(100, Math.round((seancesEffectuees / seancesMax) * 100));

  const { age, dateStr } = getAgeAndCategory(athlete.date_naissance, athlete.sexe);
  const swimCat = getSwimmingCategory(athlete);
  const cotisInfo = getCotisationStatus(athlete.cotisations, athlete.cartes_acces?.statut);
  const smartAccess = getSmartAccess(athlete);
  const isMenuOpen = activeMenuId === athlete.id;

  const handleOpenDrawer = () => {
    window.dispatchEvent(
      new CustomEvent(APP_EVENTS.OPEN_ATHLETE_DRAWER, { detail: athlete })
    );
  };

  return (
    <tr
      className={`transition-colors group ${
        isSelected
          ? 'bg-blue-50/50 dark:bg-blue-950/20'
          : 'hover:bg-blue-50/30 dark:hover:bg-slate-800/40'
      }`}
    >
      {/* Checkbox */}
      <td className="py-3.5 pl-4 pr-2 align-middle">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(athlete.id)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>

      {/* 1. Membre & Dossier */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenDrawer}
            title="Ouvrir la fiche rapide latérale"
            className="cursor-pointer hover:scale-105 transition shrink-0 bg-transparent border-none p-0"
          >
            {athlete.photo ? (
              <img
                src={athlete.photo}
                alt={athlete.prenom}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-700"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 border ${
                  athlete.sexe === 'F'
                    ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                }`}
              >
                {initiales || 'OS'}
              </div>
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenDrawer}
                className="font-black text-slate-900 dark:text-white hover:text-blue-600 transition text-left cursor-pointer bg-transparent border-none p-0"
              >
                {athlete.nom?.toUpperCase()} {athlete.prenom}
              </button>

              {/* Certificat Médical Toggle rapide */}
              <button
                onClick={() => onToggleMedicalCert(athlete.id, athlete.certificat_medical_valide)}
                title={
                  athlete.certificat_medical_valide
                    ? 'Certificat Médical Conforme (Cliquer pour désactiver)'
                    : 'Certificat Médical Manquant (Cliquer pour valider)'
                }
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition ${
                  athlete.certificat_medical_valide
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:border-amber-400'
                }`}
              >
                <CheckCircle2
                  className={`w-3 h-3 ${
                    athlete.certificat_medical_valide
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                />
                {athlete.certificat_medical_valide ? 'Médical OK' : 'Sans Certif'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <a
                href={`tel:${athlete.telephone}`}
                className="inline-flex items-center gap-1 font-medium hover:text-blue-600 transition"
              >
                <Phone className="w-3 h-3 text-slate-400" />
                {athlete.telephone || 'Non renseigné'}
              </a>

              {siblingInfo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  Fratrie ({siblingInfo.siblingIndex}e enf.{' '}
                  <strong className="text-violet-900 dark:text-violet-200">
                    -{siblingInfo.discountPercent}%
                  </strong>
                  )
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* 2. Profil Sportif */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                athlete.groupes?.nom?.toLowerCase().includes('compétition') ||
                athlete.groupes?.nom?.toLowerCase().includes('entraînement')
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
              }`}
            >
              {athlete.groupes?.nom || athlete.groupe || 'Section Natation'}
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              • {swimCat.simpleName || 'CAT: -'}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {age !== null ? `${age} ans` : '-'} ({dateStr}
            {athlete.lieu_naissance ? ` à ${athlete.lieu_naissance}` : ''})
          </span>
        </div>
      </td>

      {/* 3. Cotisation */}
      <td className="py-3.5 px-4 align-middle">
        {cotisInfo.type === 'paid' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            À jour (Payé)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            En attente
          </span>
        )}
      </td>

      {/* 4. Assiduité (Jauge 8 séances) */}
      <td className="py-3.5 px-4 align-middle">
        <div className="w-36">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-800 dark:text-slate-200">
              {seancesEffectuees} / {seancesMax}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 dark:text-slate-400">{pourcentageSeances}%</span>
              {onResetPresences && seancesEffectuees > 0 && (
                <button
                  type="button"
                  onClick={() => onResetPresences(athlete)}
                  title="Réinitialiser l'assiduité (remettre à 0/8)"
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: seancesMax }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-xs transition-all ${
                  idx < seancesEffectuees
                    ? seancesEffectuees >= seancesMax
                      ? 'bg-amber-500'
                      : 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </td>

      {/* 5. Smart Access */}
      <td className="py-3.5 px-4 align-middle">
        <button
          type="button"
          onClick={() => onOpenSmartAccess(athlete)}
          className="group inline-flex items-center gap-1.5 p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-left"
          title="Cliquer pour changer le Smart Access de ce membre"
        >
          {smartAccess.code === 'AUTORISE' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 group-hover:border-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Accès Autorisé
              <ChevronDown size={11} className="opacity-50 group-hover:opacity-100 ml-0.5" />
            </span>
          ) : smartAccess.code === 'TOLERANCE' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 group-hover:border-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {smartAccess.label}
              <ChevronDown size={11} className="opacity-50 group-hover:opacity-100 ml-0.5" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 group-hover:border-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {smartAccess.label}
              <ChevronDown size={11} className="opacity-50 group-hover:opacity-100 ml-0.5" />
            </span>
          )}
        </button>
      </td>

      {/* 6. Actions */}
      <td className="py-3.5 pl-4 pr-6 align-middle text-right">
        <div className="inline-flex items-center justify-end gap-1.5 relative">
          <button
            onClick={() => onOpenChronos(athlete)}
            title="Performances & Chronos"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 transition shadow-xs cursor-pointer"
          >
            <Timer className="w-3.5 h-3.5" />
            Chronos
          </button>

          <button
            onClick={() => onOpenBadge(athlete)}
            title="Carte QR Code d'accès"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Menu 3 points */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : athlete.id);
              }}
              title="Plus d'actions"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 text-left"
              >
                <button
                  onClick={() => {
                    setActiveMenuId(null);
                    onOpenSmartAccess(athlete);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Changer Smart Access
                </button>

                {onResetPresences && (
                  <button
                    onClick={() => {
                      setActiveMenuId(null);
                      onResetPresences(athlete);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Remettre assiduité (0/8)
                  </button>
                )}

                <Link
                  to={`/athletes/edit/${athlete.id}`}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <Edit className="w-3.5 h-3.5" /> Modifier la fiche
                </Link>

                <button
                  onClick={() => {
                    setActiveMenuId(null);
                    onDownloadPdfForm(athlete);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Fiche officielle PDF
                </button>

                <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

                <button
                  onClick={() => {
                    setActiveMenuId(null);
                    onArchive(athlete);
                  }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Archiver le membre
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
