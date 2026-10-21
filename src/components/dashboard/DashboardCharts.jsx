import React from 'react';
import { Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

export default function DashboardCharts({
  dailyPresenceTrend = [],
  groupCapacityStats = [],
  globalFillRate = 0
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Assiduité par type de groupe */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0 flex items-center gap-2">
              <Activity size={18} className="text-sky-500" />
              Assiduité par type de groupe
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Répartition des passages (Initiation, Apprentissage, Élite)
            </span>
          </div>
        </div>

        {dailyPresenceTrend && dailyPresenceTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyPresenceTrend} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAppr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorElite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={isDark ? '#94a3b8' : '#64748b'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke={isDark ? '#94a3b8' : '#64748b'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  color: isDark ? '#fff' : '#0f172a',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                name="Initiation"
                dataKey="Initiation"
                stackId="1"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorInit)"
              />
              <Area
                type="monotone"
                name="Apprentissage"
                dataKey="Apprentissage"
                stackId="1"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorAppr)"
              />
              <Area
                type="monotone"
                name="Élite / Perf"
                dataKey="ElitePerf"
                stackId="1"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#colorElite)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            Données en cours de synchronisation...
          </div>
        )}
      </div>

      {/* Jauge de Remplissage */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0">
              Remplissage Groupes
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Taux d'occupation global : {globalFillRate}%
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-2 overflow-y-auto pr-1" style={{ maxHeight: '250px' }}>
          {groupCapacityStats.map((g) => (
            <div
              key={g.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60"
            >
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-bold text-slate-900 dark:text-white">{g.nom}</span>
                <span
                  className="font-extrabold"
                  style={{
                    color: g.fillRate >= 90 ? '#ef4444' : g.fillRate >= 70 ? '#f59e0b' : '#10b981'
                  }}
                >
                  {g.count}/{g.max} ({g.fillRate}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, g.fillRate)}%`,
                    backgroundColor:
                      g.fillRate >= 90 ? '#ef4444' : g.fillRate >= 70 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
