import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Card } from '../ui';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function FinancialCharts({
  cotisations = [],
  depenses = [],
  filterYear = '2026',
  depensesByCategory = []
}) {
  const annualData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const r = Array(12).fill(0);
    const d = Array(12).fill(0);

    cotisations
      .filter((c) => filterYear === 'all' || new Date(c.date_paiement).getFullYear() === parseInt(filterYear))
      .forEach((c) => {
        r[new Date(c.date_paiement).getMonth()] += Number(c.montant_paye);
      });

    depenses
      .filter((x) => filterYear === 'all' || new Date(x.date_depense).getFullYear() === parseInt(filterYear))
      .forEach((x) => {
        d[new Date(x.date_depense).getMonth()] += Number(x.montant);
      });

    return months.map((name, i) => ({ name, Revenus: r[i], Dépenses: d[i] }));
  }, [cotisations, depenses, filterYear]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Bilan Annuel (BarChart) */}
      <Card className="p-5 lg:col-span-2">
        <h3 className="text-base font-bold mb-4">Bilan Annuel</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={annualData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--bg-tertiary)' }}
              contentStyle={{
                backgroundColor: 'var(--bg-secondary)',
                border: 'none',
                borderRadius: '8px'
              }}
            />
            <Legend iconType="circle" />
            <Bar dataKey="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Camembert Dépenses (PieChart) */}
      <Card className="p-5 flex flex-col">
        <h3 className="text-base font-bold mb-2">Répartition des Dépenses</h3>
        <p className="text-xs text-muted mb-4">Catégorisation sur la période filtrée</p>
        <div className="flex-1 flex items-center justify-center">
          {depensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={depensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {depensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-muted">Aucune dépense.</div>
          )}
        </div>

        {/* Légende custom */}
        <div className="flex flex-wrap gap-2 mt-4">
          {depensesByCategory.map((entry, index) => (
            <div key={`leg-${index}`} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="text-muted">{entry.name}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
