import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const LOCAL_STORAGE_KEY = 'ovia_assurances_data';

export const COMPAGNIES_ASSURANCE = [
  'SAA (Société Nationale d\'Assurance)',
  'CAAT (Compagnie Algérienne des Assurances)',
  'CIAR (Compagnie Internationale d\'Assurance et de Réassurance)',
  'CASH Assurances',
  'Alliance Assurances',
  'Macir Vie',
  'AXA Assurances Algérie',
  'Trust Assurances',
  'GAM Assurances',
  'Assurance Fédérale (FAN)',
  'Autre'
];

export const TYPES_COUVERTURE = [
  'Responsabilité Civile (RC) + Individuelle Accident (IA)',
  'Compétition Nationale & Déplacements',
  'Loisir & Entraînement Standard',
  'Assurance Spécifique Encadrement / Entraîneur'
];

export const SQL_SETUP_SCRIPT = `-- Script SQL pour créer la table des assurances dans Supabase
CREATE TABLE IF NOT EXISTS public.assurances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  compagnie TEXT NOT NULL,
  numero_police TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  type_couverture TEXT DEFAULT 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
  montant NUMERIC(10, 2) DEFAULT 0,
  statut TEXT DEFAULT 'ACTIVE',
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour accélérer les recherches par athlète
CREATE INDEX IF NOT EXISTS idx_assurances_athlete_id ON public.assurances(athlete_id);

-- Activer la sécurité RLS
ALTER TABLE public.assurances ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès
DROP POLICY IF EXISTS "Lecture accessible aux utilisateurs authentifiés" ON public.assurances;
CREATE POLICY "Lecture accessible aux utilisateurs authentifiés" ON public.assurances 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modification par le staff et admin" ON public.assurances;
CREATE POLICY "Modification par le staff et admin" ON public.assurances 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

export function calculateInsuranceStatus(assurance) {
  if (!assurance || !assurance.date_fin) {
    return {
      code: 'NON_ASSURE',
      label: 'Non Assuré',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.35)',
      daysLeft: null,
      isCovered: false
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(assurance.date_fin);
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      code: 'EXPIREE',
      label: `Expirée (${Math.abs(daysLeft)}j)`,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      borderColor: 'rgba(239, 68, 68, 0.35)',
      daysLeft,
      isCovered: false
    };
  } else if (daysLeft <= 30) {
    return {
      code: 'EXPIRE_BIENTOT',
      label: `Expire dans ${daysLeft}j`,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.35)',
      daysLeft,
      isCovered: true
    };
  } else {
    return {
      code: 'A_JOUR',
      label: `À jour (${daysLeft}j)`,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.35)',
      daysLeft,
      isCovered: true
    };
  }
}

export function useAssurances() {
  const [assurances, setAssurances] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [isTableMissing, setIsTableMissing] = useState(false);

  // Charger les assurances
  const fetchAssurances = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assurances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          setIsTableMissing(true);
        }
        // Utiliser les données locales si Supabase table absente
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setAssurances(JSON.parse(stored));
        }
      } else if (data) {
        setIsTableMissing(false);
        setAssurances(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Fallback local assurances:', err);
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) setAssurances(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssurances();
  }, [fetchAssurances]);

  // Sauvegarder ou mettre à jour une police
  const saveAssurance = async (payload) => {
    const isNew = !payload.id;
    const recordId = payload.id || `ass-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const recordToSave = {
      ...payload,
      id: recordId,
      statut: payload.statut || 'ACTIVE',
      updated_at: new Date().toISOString(),
      created_at: payload.created_at || new Date().toISOString()
    };

    // 1. Sauvegarde locale immédiate
    const updatedList = isNew
      ? [recordToSave, ...assurances.filter(a => a.athlete_id !== recordToSave.athlete_id)]
      : assurances.map(a => a.id === recordId ? recordToSave : a);

    setAssurances(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    // 2. Synchronisation Supabase (si table présente)
    try {
      const { error } = await supabase
        .from('assurances')
        .upsert(recordToSave);

      if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
        setIsTableMissing(true);
      }
    } catch (err) {
      console.warn('Sync note (local saved):', err);
    }

    toast.success(isNew ? 'Police d\'assurance enregistrée avec succès !' : 'Police d\'assurance mise à jour !');
    return recordToSave;
  };

  // Souscription Groupée (plusieurs athlètes)
  const batchSouscrire = async (athleteIds = [], commonData) => {
    if (!athleteIds.length) {
      toast.error('Aucun athlète sélectionné pour la souscription groupée.');
      return false;
    }

    const toastId = toast.loading(`Souscription groupée pour ${athleteIds.length} athlètes en cours...`);

    const newRecords = athleteIds.map(athId => ({
      id: `ass-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      athlete_id: athId,
      compagnie: commonData.compagnie,
      numero_police: commonData.numero_police,
      date_debut: commonData.date_debut,
      date_fin: commonData.date_fin,
      type_couverture: commonData.type_couverture,
      montant: Number(commonData.montant) || 0,
      statut: 'ACTIVE',
      notes: commonData.notes || 'Souscription groupée de club',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Supprimer les anciennes assurances des athlètes concernés et injecter les nouvelles
    const athIdSet = new Set(athleteIds);
    const updatedList = [
      ...newRecords,
      ...assurances.filter(a => !athIdSet.has(a.athlete_id))
    ];

    setAssurances(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    try {
      await supabase
        .from('assurances')
        .upsert(newRecords);
    } catch {
      // Ignorer si la table distante n'est pas encore créée
    }

    toast.success(`Assurance enregistrée pour ${athleteIds.length} athlète(s) !`, { id: toastId });
    return true;
  };

  // Supprimer une police
  const deleteAssurance = async (id) => {
    const updatedList = assurances.filter(a => a.id !== id);
    setAssurances(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    try {
      await supabase
        .from('assurances')
        .delete()
        .eq('id', id);
    } catch {
      // Ignore
    }

    toast.success('Assurance supprimée');
    return true;
  };

  // Supprimer plusieurs polices (par ID d'athlète ou ID d'assurance)
  const batchDeleteAssurances = async (athleteOrAssuranceIds = []) => {
    if (!athleteOrAssuranceIds.length) {
      toast.error('Aucun athlète sélectionné pour le retrait de l\'assurance.');
      return false;
    }

    const toastId = toast.loading(`Retrait de l'assurance pour ${athleteOrAssuranceIds.length} athlète(s)...`);
    const idSet = new Set(athleteOrAssuranceIds);

    const toDelete = assurances.filter(a => idSet.has(a.athlete_id) || idSet.has(a.id));
    if (!toDelete.length) {
      toast.error('Aucune assurance active trouvée pour les éléments sélectionnés.', { id: toastId });
      return false;
    }

    const deleteIds = toDelete.map(a => a.id);
    const updatedList = assurances.filter(a => !idSet.has(a.athlete_id) && !idSet.has(a.id));
    setAssurances(updatedList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));

    try {
      await supabase
        .from('assurances')
        .delete()
        .in('id', deleteIds);
    } catch (err) {
      console.warn('Sync note (batch delete local saved):', err);
    }

    toast.success(`${toDelete.length} athlète(s) retiré(s) de la liste d'assurance !`, { id: toastId });
    return true;
  };

  // Retirer un athlète de la liste d'assurance
  const removeAthleteFromInsurance = async (athleteId) => {
    const existing = assurances.find(a => a.athlete_id === athleteId);
    if (!existing) {
      toast.error("Cet athlète n'a pas d'assurance active.");
      return false;
    }
    return await deleteAssurance(existing.id);
  };

  // Souscription express en 1 clic
  const quickInsureAthlete = async (athlete, defaults = {}) => {
    if (!athlete) return false;
    const ref = `POL-${(athlete.nom || 'ATH').substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const record = {
      athlete_id: athlete.id,
      compagnie: defaults.compagnie || 'SAA (Société Nationale d\'Assurance)',
      numero_police: defaults.numero_police || ref,
      date_debut: defaults.date_debut || new Date().toISOString().split('T')[0],
      date_fin: defaults.date_fin || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type_couverture: defaults.type_couverture || 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
      montant: defaults.montant !== undefined ? defaults.montant : 1500,
      notes: defaults.notes || 'Souscription rapide individuelle'
    };
    return await saveAssurance(record);
  };

  // Trouver la police active d'un athlète
  const getAthleteAssurance = useCallback((athleteId) => {
    if (!athleteId) return null;
    return assurances.find(a => a.athlete_id === athleteId) || null;
  }, [assurances]);

  return {
    assurances,
    loading,
    isTableMissing,
    fetchAssurances,
    saveAssurance,
    batchSouscrire,
    deleteAssurance,
    batchDeleteAssurances,
    removeAthleteFromInsurance,
    quickInsureAthlete,
    getAthleteAssurance,
    calculateInsuranceStatus,
    sqlSetupScript: SQL_SETUP_SCRIPT
  };
}
