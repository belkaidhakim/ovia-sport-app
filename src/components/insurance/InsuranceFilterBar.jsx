import React from 'react';
import { Search, X, Users, ShieldCheck, ShieldAlert, Download } from 'lucide-react';
import { Card, Button } from '../ui';

export default function InsuranceFilterBar({
  viewTab,
  setViewTab,
  stats,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  groupFilter,
  setGroupFilter,
  groupes = [],
  compagnieFilter,
  setCompagnieFilter,
  compagniesList = [],
  federalCategoryFilter,
  setFederalCategoryFilter,
  urgencyFilterOnly,
  setUrgencyFilterOnly,
  onExportCsv
}) {
  return (
    <>
      {/* ONGLETS DE VUE : LISTE D'ASSURANCE / NON ASSURÉS / TOUS */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setViewTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            viewTab === 'ALL'
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white border border-[var(--border-color)]'
          }`}
        >
          <Users size={14} />
          Tous les membres ({stats.total || 0})
        </button>

        <button
          onClick={() => setViewTab('INSURED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            viewTab === 'INSURED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-[var(--bg-tertiary)] text-emerald-400 hover:text-emerald-300 border border-[var(--border-color)]'
          }`}
          title="Afficher uniquement les athlètes présents sur la liste d'assurance"
        >
          <ShieldCheck size={14} />
          🛡️ Liste d'Assurance ({(stats.aJour || 0) + (stats.expireBientot || 0)})
        </button>

        <button
          onClick={() => setViewTab('NOT_INSURED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            viewTab === 'NOT_INSURED'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-[var(--bg-tertiary)] text-rose-400 hover:text-rose-300 border border-[var(--border-color)]'
          }`}
          title="Afficher les athlètes sans assurance à ajouter à la liste"
        >
          <ShieldAlert size={14} />
          ⚠️ Non Assurés / À Ajouter ({stats.nonAssure || 0})
        </button>
      </div>

      {/* BARRE D'OUTILS ET FILTRES */}
      <Card noPadding className="mb-6">
        <div className="p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text"
              placeholder="Rechercher par nom, prénom, numéro de police..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtres dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Statut Assurance */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Tous les statuts assurance</option>
              <option value="A_JOUR">🟢 À jour uniquement</option>
              <option value="EXPIRE_BIENTOT">🟠 Expire sous 30j</option>
              <option value="NON_ASSURE">🔴 Non assurés / Expirés</option>
            </select>

            {/* Groupe */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Tous les groupes</option>
              {groupes.map(g => (
                <option key={g.id} value={g.id}>{g.nom}</option>
              ))}
            </select>

            {/* Compagnie */}
            <select
              value={compagnieFilter}
              onChange={(e) => setCompagnieFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer max-w-[160px]"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Toutes compagnies</option>
              {compagniesList.map(c => (
                <option key={c} value={c}>{c.split('(')[0].trim()}</option>
              ))}
            </select>

            {/* Catégorie d'Âge Fédérale FAN */}
            <select
              value={federalCategoryFilter}
              onChange={(e) => setFederalCategoryFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="ALL">Toutes catégories d'âge</option>
              <option value="ECOLE">École (&lt;8 ans)</option>
              <option value="POUSSINS">Poussins (9-10 ans)</option>
              <option value="BENJAMINS">Benjamins (11-12 ans)</option>
              <option value="MINIMES">Minimes (13-14 ans)</option>
              <option value="CADETS">Cadets (15-16 ans)</option>
              <option value="JUNIORS">Juniors (17-18 ans)</option>
              <option value="SENIORS">Seniors (18+ ans)</option>
            </select>

            {/* Filtre Urgence Immédiate */}
            <button
              type="button"
              onClick={() => setUrgencyFilterOnly(!urgencyFilterOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                urgencyFilterOnly
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-[var(--bg-tertiary)] text-slate-600 dark:text-slate-300 border-[var(--border-color)] hover:border-rose-400'
              }`}
              title="Filtrer uniquement les athlètes non assurés ou avec expiration imminente (< 15 jours)"
            >
              <ShieldAlert size={14} className={urgencyFilterOnly ? 'text-white' : 'text-rose-500'} />
              🚨 Urgences ({stats.nonAssure || 0})
            </button>

            {/* Export CSV */}
            <Button 
              variant="secondary" 
              onClick={onExportCsv}
              title="Exporter le tableau sous forme de tableur Excel/CSV"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={14} /> CSV
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
