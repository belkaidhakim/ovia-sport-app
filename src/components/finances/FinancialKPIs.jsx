import React from 'react';
import { TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { Card } from '../ui';
import { formatDA } from '../../utils/formatters';

export default function FinancialKPIs({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* REVENUS (VENTILÉS) */}
      <Card className="p-5 flex flex-col justify-between" style={{ borderLeft: '4px solid #10b981' }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">
              Encaissements Globaux
            </p>
            <h2 className="text-2xl font-bold" style={{ color: '#10b981' }}>
              + {formatDA(stats.totalRevenue)}
            </h2>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="pt-3 border-t border-[var(--border-color)]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">
              Nouvelles Inscriptions ({stats.countFraisInscription}) :
            </span>
            <span className="font-semibold">{formatDA(stats.totalFraisInscription)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">
              Renouvellements ({stats.countCotisations}) :
            </span>
            <span className="font-semibold">{formatDA(stats.totalCotisationsSportives)}</span>
          </div>
        </div>
      </Card>

      {/* DÉPENSES */}
      <Card className="p-5 flex flex-col justify-between" style={{ borderLeft: '4px solid #ef4444' }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">
              Décaissements Globaux
            </p>
            <h2 className="text-2xl font-bold" style={{ color: '#ef4444' }}>
              - {formatDA(stats.totalDepenses)}
            </h2>
          </div>
          <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
            <TrendingDown size={24} />
          </div>
        </div>
        <div className="pt-3 border-t border-[var(--border-color)]">
          <p className="text-xs text-muted mb-2">Répartition des dépenses :</p>
          {stats.depensesByCategory.length === 0 ? (
            <span className="text-xs italic text-muted">Aucune dépense</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.depensesByCategory.slice(0, 3).map((cat, i) => (
                <span key={i} className="text-[10px] bg-slate-500/10 px-2 py-0.5 rounded">
                  {cat.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* SOLDE */}
      <Card
        className="p-5 flex flex-col justify-between"
        style={{ borderLeft: `4px solid ${stats.beneficeNet >= 0 ? '#3b82f6' : '#f59e0b'}` }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-bold text-muted uppercase tracking-wider mb-1">
              Solde Net Période
            </p>
            <h2
              className="text-2xl font-bold"
              style={{ color: stats.beneficeNet >= 0 ? '#3b82f6' : '#f59e0b' }}
            >
              {stats.beneficeNet > 0 ? '+' : ''} {formatDA(stats.beneficeNet)}
            </h2>
          </div>
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <Coins size={24} />
          </div>
        </div>
        <div className="pt-3 border-t border-[var(--border-color)]">
          <p className="text-xs text-muted">
            Bénéfice opérationnel du club sur la période sélectionnée.
          </p>
        </div>
      </Card>
    </div>
  );
}
