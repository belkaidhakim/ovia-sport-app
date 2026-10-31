import React from 'react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

export function Card({ children, className = '', noPadding = false, ...props }) {
  return (
    <motion.div 
      className={`glass-card ${noPadding ? 'p-0' : ''} ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({ icon, iconBg, iconColor, label, value, subtitle, glowColor }) {
  return (
    <Card className="flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-muted mb-0">{label}</h3>
        <div 
          className="stat-icon" 
          style={{ 
            backgroundColor: iconBg, 
            color: iconColor,
            boxShadow: glowColor ? `0 0 16px ${glowColor}` : 'none'
          }}
        >
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
    </Card>
  );
}

export function Skeleton({ width = '100%', height = '20px', className = '', style = {} }) {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ width, height, ...style }}
    />
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <motion.button 
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Badge({ children, status = 'default', className = '', ...props }) {
  const normalized = String(status).toUpperCase();
  let statusClass = 'badge-active';
  if (normalized === 'SUSPENDUE' || normalized === 'SUSPENDED' || normalized === 'DANGER') {
    statusClass = 'badge-suspended';
  } else if (normalized === 'EXPIREE' || normalized === 'EXPIRED' || normalized === 'WARNING') {
    statusClass = 'badge-expired';
  } else if (normalized === 'INACTIVE' || normalized === 'NEUTRAL') {
    statusClass = 'badge-inactive';
  } else if (normalized === 'INFO') {
    statusClass = 'badge-info';
  }

  return (
    <span className={`badge ${statusClass} ${className}`} {...props}>
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, eyebrowIcon: EyebrowIcon, title, subtitle, actions, className = '' }) {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/80 ${className}`}>
      <div>
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-[11px] font-bold tracking-wider uppercase mb-2">
            {EyebrowIcon ? <EyebrowIcon className="w-3.5 h-3.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-0">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
