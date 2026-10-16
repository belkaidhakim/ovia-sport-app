import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export function useAthletes() {
  const [athletes, setAthletes] = useState([]);
  const [archivedAthletes, setArchivedAthletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [error, setError] = useState(null);

  const fetchAthletes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('athletes')
        .select(`
          *,
          cartes_acces (statut, date_dernier_paiement),
          cotisations (periode_couverte_fin),
          groupes(id, nom),
          presences (id)
        `)
        .eq('est_actif', true)
        .order('date_inscription', { ascending: false });

      if (error) throw error;
      setAthletes(data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur fetchAthletes:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des athlètes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArchivedAthletes = useCallback(async () => {
    try {
      setLoadingArchived(true);
      const { data, error } = await supabase
        .from('athletes')
        .select(`
          *,
          cartes_acces (statut, date_dernier_paiement),
          cotisations (periode_couverte_fin),
          groupes(id, nom)
        `)
        .eq('est_actif', false)
        .order('date_inscription', { ascending: false });

      if (error) throw error;
      setArchivedAthletes(data || []);
    } catch (err) {
      console.error('Erreur fetchArchivedAthletes:', err);
      toast.error('Erreur lors du chargement des archives');
    } finally {
      setLoadingArchived(false);
    }
  }, []);

  const archiveAthlete = async (id) => {
    try {
      const { error } = await supabase
        .from('athletes')
        .update({ est_actif: false })
        .eq('id', id);

      if (error) throw error;
      setAthletes(prev => prev.filter(a => a.id !== id));
      toast.success("Membre archivé avec succès");
      return true;
    } catch (err) {
      console.error('Erreur archiveAthlete:', err);
      toast.error("Erreur lors de l'archivage");
      return false;
    }
  };

  const restoreAthlete = async (id) => {
    try {
      const { error } = await supabase
        .from('athletes')
        .update({ est_actif: true })
        .eq('id', id);

      if (error) throw error;
      setArchivedAthletes(prev => prev.filter(a => a.id !== id));
      fetchAthletes();
      toast.success("Membre réactivé avec succès");
      return true;
    } catch (err) {
      console.error('Erreur restoreAthlete:', err);
      toast.error("Erreur lors de la réactivation");
      return false;
    }
  };

  const toggleAccessStatus = async (athleteId, currentStatusObj) => {
    const currentStatus = Array.isArray(currentStatusObj) ? currentStatusObj[0]?.statut : currentStatusObj?.statut;
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDUE' : 'ACTIVE';
    
    try {
      const { error } = await supabase
        .from('cartes_acces')
        .update({ statut: newStatus })
        .eq('athlete_id', athleteId);
        
      if (error) throw error;
      
      setAthletes(prev => prev.map(a => {
        if (a.id === athleteId) {
          return {
            ...a,
            cartes_acces: Array.isArray(a.cartes_acces)
              ? [{ ...a.cartes_acces[0], statut: newStatus }]
              : { ...a.cartes_acces, statut: newStatus }
          };
        }
        return a;
      }));
      toast.success(`Statut mis à jour : ${newStatus === 'ACTIVE' ? 'Activé' : 'Suspendu'}`);
      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  const bulkUpdateGroup = async (athleteIds, newGroupId, newGroupName) => {
    if (!athleteIds || athleteIds.length === 0) return false;
    try {
      const { error } = await supabase
        .from('athletes')
        .update({ groupe_id: newGroupId, groupe: newGroupName })
        .in('id', athleteIds);
      if (error) throw error;
      toast.success(`${athleteIds.length} membre(s) réaffecté(s) au groupe « ${newGroupName} »`);
      fetchAthletes();
      return true;
    } catch (err) {
      console.error('Erreur bulkUpdateGroup:', err);
      toast.error('Erreur lors de la réaffectation en masse');
      return false;
    }
  };

  const bulkToggleAccess = async (athleteIds, newStatus = 'SUSPENDUE') => {
    if (!athleteIds || athleteIds.length === 0) return false;
    try {
      const { error } = await supabase
        .from('cartes_acces')
        .update({ statut: newStatus })
        .in('athlete_id', athleteIds);
      if (error) throw error;
      toast.success(`Accès ${newStatus === 'ACTIVE' ? 'activé' : 'suspendu'} pour ${athleteIds.length} membre(s)`);
      fetchAthletes();
      return true;
    } catch (err) {
      console.error('Erreur bulkToggleAccess:', err);
      toast.error("Erreur lors du changement d'accès en masse");
      return false;
    }
  };

  const bulkValidateCotisation = async (athleteIds, montant = 3000, modePaiement = 'Espèces') => {
    if (!athleteIds || athleteIds.length === 0) return false;
    try {
      const now = new Date();
      const fin = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const datePaiement = now.toISOString().split('T')[0];

      const cotisRows = athleteIds.map(id => ({
        athlete_id: id,
        montant_paye: montant,
        mode_paiement: modePaiement,
        date_paiement: datePaiement,
        periode_couverte_fin: fin
      }));

      const { error } = await supabase
        .from('cotisations')
        .insert(cotisRows);

      if (error) throw error;

      // Réactivation de la carte d'accès
      await supabase
        .from('cartes_acces')
        .update({ statut: 'ACTIVE', date_dernier_paiement: datePaiement })
        .in('athlete_id', athleteIds);

      toast.success(`Cotisation validée pour ${athleteIds.length} membre(s) (valable 30j)`);
      fetchAthletes();
      return true;
    } catch (err) {
      console.error('Erreur bulkValidateCotisation:', err);
      toast.error('Erreur lors de la validation des cotisations en masse');
      return false;
    }
  };

  return {
    athletes,
    archivedAthletes,
    loading,
    loadingArchived,
    error,
    fetchAthletes,
    fetchArchivedAthletes,
    archiveAthlete,
    restoreAthlete,
    toggleAccessStatus,
    bulkUpdateGroup,
    bulkToggleAccess,
    bulkValidateCotisation
  };
}
