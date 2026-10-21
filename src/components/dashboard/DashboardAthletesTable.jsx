import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { calculateAge } from '../../utils/formatters';
import { getSwimmingCategory } from '../../utils/swimmingCategories';
import { APP_EVENTS } from '../../config/constants';

export default function DashboardAthletesTable({ athletes = [], groupStats = [] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterGroup, setFilterGroup] = useState('ALL');

  // Filtrage combiné (mémoïsé)
  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => {
      const q = search.toLowerCase().trim();
      const nom = (a.nom || '').toLowerCase();
      const prenom = (a.prenom || '').toLowerCase();
      const matchesSearch = !q || nom.includes(q) || prenom.includes(q);

      const card = Array.isArray(a.cartes_acces) ? a.cartes_acces[0] : a.cartes_acces;
      const statut = card?.statut || 'SUSPENDUE';

      // Calcul validité cotisation
      const validCotisDates = Array.isArray(a.cotisations)
        ? a.cotisations
            .map(c => (c?.periode_couverte_fin ? new Date(c.periode_couverte_fin).getTime() : NaN))
            .filter(t => !isNaN(t))
        : [];

      let isExpired = false;
      if (validCotisDates.length > 0) {
        if (Math.max(...validCotisDates) < Date.now()) isExpired = true;
      } else if (card?.date_dernier_paiement) {
        const payDate = new Date(card.date_dernier_paiement);
        const estEndDate = new Date(payDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (!isNaN(estEndDate.getTime()) && estEndDate < new Date()) isExpired = true;
      } else if (statut !== 'ACTIVE') {
        isExpired = true;
      }

      const isBlocked = statut !== 'ACTIVE' || isExpired;

      let matchesStatus = true;
      if (filterStatus === 'ACTIVE') matchesStatus = !isBlocked;
      if (filterStatus === 'SUSPENDED') matchesStatus = isBlocked;

      const grp = Array.isArray(a.groupes) ? a.groupes[0] : a.groupes;
      const grpNom = grp?.nom || a.groupe || '';
      let matchesGroup = true;
      if (filterGroup !== 'ALL') matchesGroup = grpNom === filterGroup;

      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [athletes, search, filterStatus, filterGroup]);

  const handleOpenDrawer = (athlete) => {
    window.dispatchEvent(
      new CustomEvent(APP_EVENTS.OPEN_ATHLETE_DRAWER, { detail: athlete })
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">
            Adhérents du Club ({filteredAthletes.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Listing officiel des adhérents, catégories fédérales et expiration
          </span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="🔍 Nom ou prénom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
            style={{ width: '180px' }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 transition cursor-pointer"
          >
            <option value="ALL">Tous statuts</option>
            <option value="ACTIVE">✅ À jour</option>
            <option value="SUSPENDED">❌ Suspendu / Bloqué</option>
          </select>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 transition cursor-pointer"
          >
            <option value="ALL">Tous les groupes</option>
            {groupStats.map((g) => (
              <option key={g.nom} value={g.nom}>
                {g.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              <th className="py-3 px-3">Adhérent</th>
              <th className="py-3 px-3">Catégorie</th>
              <th className="py-3 px-3">Groupe</th>
              <th className="py-3 px-3">Expiration</th>
              <th className="py-3 px-3">Statut</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filteredAthletes.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Aucun athlète ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              filteredAthletes.slice(0, 15).map((athlete) => {
                const card = Array.isArray(athlete.cartes_acces) ? athlete.cartes_acces[0] : athlete.cartes_acces;
                const statut = card?.statut || 'SUSPENDUE';
                const age = calculateAge(athlete.date_naissance);
                const grp = Array.isArray(athlete.groupes) ? athlete.groupes[0] : athlete.groupes;
                const swimmingCat = getSwimmingCategory(athlete);

                // Expiration réelle
                const validCotisDates = Array.isArray(athlete.cotisations)
                  ? athlete.cotisations
                      .map(c => (c?.periode_couverte_fin ? new Date(c.periode_couverte_fin).getTime() : NaN))
                      .filter(t => !isNaN(t))
                  : [];

                let expirationDisplay = '-';
                let isExpired = false;
                if (validCotisDates.length > 0) {
                  const maxDate = new Date(Math.max(...validCotisDates));
                  expirationDisplay = maxDate.toLocaleDateString('fr-FR');
                  if (maxDate < new Date()) isExpired = true;
                } else if (card?.date_dernier_paiement) {
                  const payDate = new Date(card.date_dernier_paiement);
                  const estEndDate = new Date(payDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                  if (!isNaN(estEndDate.getTime())) {
                    expirationDisplay = estEndDate.toLocaleDateString('fr-FR');
                    if (estEndDate < new Date()) isExpired = true;
                  }
                } else if (statut === 'ACTIVE') {
                  expirationDisplay = 'À jour (Saison)';
                } else {
                  expirationDisplay = 'Non réglé';
                  isExpired = true;
                }

                const isBlocked = statut !== 'ACTIVE' || isExpired;

                return (
                  <tr
                    key={athlete.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isBlocked ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-medium">
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(athlete)}
                        className="text-left bg-transparent border-0 p-0 cursor-pointer group"
                      >
                        <span className="uppercase font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition">
                          {athlete.nom}
                        </span>{' '}
                        <span className="capitalize text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition">
                          {athlete.prenom?.toLowerCase()}
                        </span>
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {swimmingCat.simpleName || 'ÉCOLE'}
                      </span>{' '}
                      <span className="text-slate-400 text-[11px]">
                        ({age ? `${age} ans` : '-'})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                      {grp?.nom || athlete.groupe || '-'}
                    </td>
                    <td
                      className={`py-3 px-3 font-semibold ${
                        isBlocked
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {expirationDisplay}
                    </td>
                    <td className="py-3 px-3">
                      {isBlocked ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                          BLOQUÉ
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          À JOUR
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/finances?search=${encodeURIComponent(athlete.nom)}`}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Consulter les cotisations"
                        >
                          <CreditCard size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(athlete)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                        >
                          Fiche
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
