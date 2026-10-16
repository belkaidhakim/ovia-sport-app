import React, { useState } from 'react';
import { Lock, Unlock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRegistrationSettings } from '../hooks/useRegistrationSettings';

export default function RegistrationStatusToggle({ compact = false }) {
  const { isOpen, toggleInscriptions, loading } = useRegistrationSettings();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await toggleInscriptions();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-2"
      style={{
        backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
        border: isOpen ? '1px solid rgba(16, 185, 129, 0.28)' : '1px solid rgba(239, 68, 68, 0.28)',
        borderRadius: '12px',
        padding: compact ? '4px 8px' : '6px 12px',
        transition: 'all 0.25s ease'
      }}
    >
      {/* Statut voyant */}
      <div className="flex items-center gap-1.5" style={{ marginRight: compact ? '2px' : '6px' }}>
        <span 
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: isOpen ? '#10b981' : '#ef4444',
            display: 'inline-block',
            boxShadow: isOpen ? '0 0 10px rgba(16, 185, 129, 0.7)' : '0 0 8px rgba(239, 68, 68, 0.7)',
            animation: isOpen ? 'pulse 2s infinite' : 'none'
          }}
        />
        <span style={{ 
          fontSize: compact ? '0.75rem' : '0.82rem', 
          fontWeight: 700, 
          color: isOpen ? '#10b981' : '#ef4444',
          letterSpacing: '0.01em'
        }}>
          {isOpen ? 'Inscriptions Ouvertes' : 'Inscriptions Fermées'}
        </span>
      </div>

      {/* Bouton d'action Rapide */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading || isUpdating}
        title={isOpen ? "Cliquer pour FERMER les inscriptions en ligne (verrouiller le formulaire public)" : "Cliquer pour OUVRIR les inscriptions en ligne (autoriser le formulaire public)"}
        style={{
          border: 'none',
          backgroundColor: isOpen ? '#ef4444' : '#10b981',
          color: '#ffffff',
          borderRadius: '8px',
          padding: compact ? '3px 8px' : '5px 10px',
          fontSize: compact ? '0.72rem' : '0.78rem',
          fontWeight: 800,
          cursor: loading || isUpdating ? 'wait' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          boxShadow: isOpen ? '0 2px 8px rgba(239, 68, 68, 0.25)' : '0 2px 8px rgba(16, 185, 129, 0.25)',
          transition: 'all 0.2s ease'
        }}
      >
        {isOpen ? (
          <>
            <Lock size={12} strokeWidth={2.5} />
            <span>Fermer</span>
          </>
        ) : (
          <>
            <Unlock size={12} strokeWidth={2.5} />
            <span>Ouvrir</span>
          </>
        )}
      </button>
    </motion.div>
  );
}
