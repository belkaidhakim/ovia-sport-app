import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export function useRegistrationSettings() {
  const [isOpen, setIsOpen] = useState(() => {
    const localVal = localStorage.getItem('scb_inscriptions_ouvertes');
    return localVal === null ? true : localVal === 'true';
  });
  const [loading, setLoading] = useState(false);

  // Charger le statut
  const fetchSettings = useCallback(async () => {
    try {
      // 1. Lire depuis le stockage local (valeur instantanée)
      const localVal = localStorage.getItem('scb_inscriptions_ouvertes');
      if (localVal !== null) {
        setIsOpen(localVal === 'true');
      }

      // 2. Tenter de lire depuis Supabase (table club_settings)
      const { data, error } = await supabase
        .from('club_settings')
        .select('*')
        .eq('key', 'inscriptions_ouvertes')
        .maybeSingle();

      if (!error && data && data.value) {
        const remoteOpen = data.value.is_open !== false;
        setIsOpen(remoteOpen);
        localStorage.setItem('scb_inscriptions_ouvertes', remoteOpen ? 'true' : 'false');
      }
    } catch {
      // Ignorer si la table n'existe pas encore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Synchronisation en direct entre composants et fenêtres
    const handleLocalChange = (e) => {
      if (e.detail !== undefined) {
        setIsOpen(e.detail);
      } else {
        const val = localStorage.getItem('scb_inscriptions_ouvertes');
        if (val !== null) setIsOpen(val === 'true');
      }
    };

    window.addEventListener('scb_registration_settings_changed', handleLocalChange);
    window.addEventListener('storage', handleLocalChange);

    return () => {
      window.removeEventListener('scb_registration_settings_changed', handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    };
  }, [fetchSettings]);

  // Activer / Désactiver
  const toggleInscriptions = async (newState) => {
    const targetState = typeof newState === 'boolean' ? newState : !isOpen;
    setIsOpen(targetState);
    localStorage.setItem('scb_inscriptions_ouvertes', targetState ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('scb_registration_settings_changed', { detail: targetState }));

    try {
      const { error } = await supabase
        .from('club_settings')
        .upsert({
          key: 'inscriptions_ouvertes',
          value: { is_open: targetState, updated_at: new Date().toISOString() }
        });

      if (error && error.code !== '42P01') {
        console.warn('Erreur sauvegarde Supabase settings:', error);
      }
    } catch (e) {
      console.warn('Warning sync settings:', e);
    }

    if (targetState) {
      toast.success('Inscriptions en ligne OUVERTES ! Le formulaire public est désormais accessible.', {
        icon: '🟢',
        duration: 4000
      });
    } else {
      toast('Inscriptions en ligne FERMÉES. Le formulaire public est verrouillé.', {
        icon: '🔒',
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: '#1e293b',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        },
      });
    }
    return targetState;
  };

  return {
    isOpen,
    loading,
    toggleInscriptions,
    fetchSettings
  };
}
