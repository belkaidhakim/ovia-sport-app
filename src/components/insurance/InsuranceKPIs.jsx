import React from 'react';
import { CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { StatCard } from '../ui';

export default function InsuranceKPIs({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard 
        icon={
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-8 h-8 transform -rotate-90">
              <circle
                cx="16"
                cy="16"
                r="12"
                stroke="currentColor"
                strokeWidth="3"
                className="text-slate-200 dark:text-slate-700"
                fill="transparent"
              />
              <circle
                cx="16"
                cy="16"
                r="12"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={75.4}
                strokeDashoffset={75.4 - (75.4 * stats.tauxConformite) / 100}
                strokeLinecap="round"
                className={
                  stats.tauxConformite >= 75
                    ? 'text-emerald-500'
                    : stats.tauxConformite >= 40
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }
                fill="transparent"
              />
            </svg>
          </div>
        }
        iconBg="rgba(16, 185, 129, 0.15)"
        iconColor="#10b981"
        label="Taux de Conformité"
        value={`${stats.tauxConformite}%`}
        subtitle={`${stats.aJour + stats.expireBientot} sur ${stats.total} membres couverts`}
        glowColor={
          stats.tauxConformite > 75
            ? 'rgba(16, 185, 129, 0.2)'
            : 'rgba(239, 68, 68, 0.2)'
        }
      />

      <StatCard 
        icon={<CheckCircle size={24} />}
        iconBg="rgba(16, 185, 129, 0.12)"
        iconColor="#10b981"
        label="Assurés à Jour"
        value={stats.aJour}
        subtitle="Couverture active (> 30 jours)"
      />

      <StatCard 
        icon={<AlertTriangle size={24} />}
        iconBg="rgba(245, 158, 11, 0.15)"
        iconColor="#f59e0b"
        label="Expirent Bientôt"
        value={stats.expireBientot}
        subtitle="À renouveler sous 30 jours"
      />

      <StatCard 
        icon={<ShieldAlert size={24} />}
        iconBg="rgba(239, 68, 68, 0.15)"
        iconColor="#ef4444"
        label="Non Couverts / Expirés"
        value={stats.nonAssure}
        subtitle="Urgent : régularisation requise"
      />
    </div>
  );
}
