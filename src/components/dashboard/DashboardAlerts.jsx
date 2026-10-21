import React, { useState, useMemo } from 'react';
import { AlertOctagon, MessageCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatWhatsAppPhone } from '../../utils/formatters';

export default function DashboardAlerts({ stats }) {
  const [showBulkWA, setShowBulkWA] = useState(false);

  const athletesWithPhoneToExpire = useMemo(() => {
    return (stats.expiredList || []).filter(a =>
      a.telephone || a.contact_urgence || a.telephone_tuteur
    );
  }, [stats.expiredList]);

  const hasAlerts =
    (stats.expiredList && stats.expiredList.length > 0) ||
    (stats.expiringSoon && stats.expiringSoon.length > 0) ||
    (stats.incompleteFiles && stats.incompleteFiles.length > 0);

  if (!hasAlerts) return null;

  return (
    <div className="p-5 xl:col-span-2 bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/30 rounded-2xl shadow-xs">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertOctagon size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-0">
              Centre d'Alertes
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Actions requises pour le recouvrement
            </span>
          </div>
        </div>

        {athletesWithPhoneToExpire.length > 0 && (
          <button
            type="button"
            onClick={() => setShowBulkWA(!showBulkWA)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xs inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <MessageCircle size={14} />
            {showBulkWA ? "Fermer l'outil WhatsApp" : 'Outil Relances Groupées'}
          </button>
        )}
      </div>

      {/* Interface WhatsApp relance groupée */}
      <AnimatePresence>
        {showBulkWA && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
              <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                <MessageCircle size={15} /> Envoi en chaîne WhatsApp ({athletesWithPhoneToExpire.length} cibles)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Cliquez successivement sur chaque contact pour ouvrir la discussion WhatsApp pré-remplie.
              </p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                {athletesWithPhoneToExpire.map(athlete => {
                  const wpPhone = formatWhatsAppPhone(
                    athlete.telephone || athlete.contact_urgence || athlete.telephone_tuteur
                  );
                  if (!wpPhone) return null;
                  const msg = `Bonjour ${athlete.prenom || ''}, votre adhésion à Ovia Sport a expiré le ${athlete.endDateStr || ''}. Merci de bien vouloir régulariser votre cotisation à la réception du club. Cordialement.`;
                  return (
                    <a
                      key={`bulk-${athlete.id}`}
                      href={`https://wa.me/${wpPhone}?text=${encodeURIComponent(msg)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] text-white hover:opacity-90 transition no-underline"
                      onClick={(e) => {
                        e.currentTarget.style.opacity = '0.5';
                      }}
                    >
                      <span className="uppercase">{athlete.nom}</span>{' '}
                      <span className="capitalize">{athlete.prenom?.toLowerCase()}</span>
                      <ExternalLink size={12} />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ALERTE 1 : COTISATIONS EXPIRÉES */}
        <div className="p-4 rounded-xl flex flex-col justify-between bg-slate-50 dark:bg-slate-950/40 border border-rose-200 dark:border-rose-900/40">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                ❌ Expirées ({stats.expiredList?.length || 0})
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                BLOQUÉ
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
              {(stats.expiredList || []).slice(0, 6).map(athlete => {
                const wpPhone = formatWhatsAppPhone(
                  athlete.telephone || athlete.contact_urgence || athlete.telephone_tuteur
                );
                return (
                  <div
                    key={athlete.id}
                    className="flex justify-between items-center p-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <span className="font-semibold uppercase text-slate-900 dark:text-white">
                        {athlete.nom}
                      </span>{' '}
                      <span className="capitalize text-slate-700 dark:text-slate-300">
                        {athlete.prenom?.toLowerCase()}
                      </span>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Expiré ({athlete.endDateStr || 'Échu'})
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {wpPhone ? (
                        <a
                          href={`https://wa.me/${wpPhone}?text=${encodeURIComponent(
                            `Bonjour ${athlete.prenom || ''}, votre adhésion à Ovia Sport a expiré. Merci de vous rapprocher de l'accueil pour régularisation.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                          title="Relancer par WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ALERTE 2 : RENOUVELLEMENTS SOUS 7 JOURS */}
        <div className="p-4 rounded-xl flex flex-col justify-between bg-slate-50 dark:bg-slate-950/40 border border-amber-200 dark:border-amber-900/40">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                ⏳ Imminents ({stats.expiringSoon?.length || 0})
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
                &lt; 7 jours
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
              {(stats.expiringSoon || []).slice(0, 6).map(athlete => {
                return (
                  <div
                    key={athlete.id}
                    className="flex justify-between items-center p-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <span className="font-semibold uppercase text-slate-900 dark:text-white">
                        {athlete.nom}
                      </span>{' '}
                      <span className="capitalize text-slate-700 dark:text-slate-300">
                        {athlete.prenom?.toLowerCase()}
                      </span>
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Dans {athlete.daysLeft}j
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
