import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

export default function AthletesFilterBar({
  search,
  setSearch,
  groupFilter,
  setGroupFilter,
  cotisationFilter,
  setCotisationFilter,
  accessFilter,
  setAccessFilter,
  genderFilter,
  setGenderFilter,
  groupes = []
}) {
  const hasActiveFilters = Boolean(
    search || groupFilter || cotisationFilter || accessFilter || genderFilter
  );

  const handleReset = () => {
    setSearch('');
    setGroupFilter('');
    setCotisationFilter('');
    setAccessFilter('');
    setGenderFilter('');
  };

  return (
    <div className="p-3.5 flex flex-col lg:flex-row items-center gap-3 border-b border-slate-200 dark:border-slate-800">
      {/* Barre de Recherche */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un nageur par nom, prénom, téléphone, groupe..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {/* Filtres Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2 w-full lg:w-auto">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className={`px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-xs font-semibold outline-none cursor-pointer transition ${
            groupFilter ? 'border-blue-500 text-blue-600 dark:text-cyan-400 bg-blue-50/50 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <option value="">Tous les groupes</option>
          {groupes.map((g) => (
            <option key={g.id} value={g.nom}>
              {g.nom}
            </option>
          ))}
        </select>

        <select
          value={cotisationFilter}
          onChange={(e) => setCotisationFilter(e.target.value)}
          className={`px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-xs font-semibold outline-none cursor-pointer transition ${
            cotisationFilter ? 'border-blue-500 text-blue-600 dark:text-cyan-400 bg-blue-50/50 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <option value="">Toutes cotisations</option>
          <option value="paye">À jour (Payé)</option>
          <option value="attente">En attente</option>
          <option value="epuise">Quota épuisé (8/8)</option>
        </select>

        <select
          value={accessFilter}
          onChange={(e) => setAccessFilter(e.target.value)}
          className={`px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-xs font-semibold outline-none cursor-pointer transition ${
            accessFilter ? 'border-blue-500 text-blue-600 dark:text-cyan-400 bg-blue-50/50 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <option value="">Tous accès</option>
          <option value="autorise">Autorisé</option>
          <option value="essai">Tolérance / Essai</option>
          <option value="bloque">Bloqué</option>
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className={`px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-xs font-semibold outline-none cursor-pointer transition ${
            genderFilter ? 'border-blue-500 text-blue-600 dark:text-cyan-400 bg-blue-50/50 dark:bg-blue-950/30' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
          }`}
        >
          <option value="">Tous sexes</option>
          <option value="M">Masculin (M)</option>
          <option value="F">Féminin (F)</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={handleReset}
            title="Réinitialiser tous les filtres"
            className="col-span-2 sm:col-span-4 lg:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Effacer</span>
          </button>
        )}
      </div>
    </div>
  );
}
