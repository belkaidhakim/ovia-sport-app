import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

export function useDepenses() {
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDepenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('depenses')
        .select(`*`)
        .order('date_depense', { ascending: false });

      if (error) throw error;
      setDepenses(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des dépenses:', err);
      toast.error('Impossible de charger les dépenses.');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDepense = async (id) => {
    try {
      const { error } = await supabase
        .from('depenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDepenses(prev => prev.filter(d => d.id !== id));
      toast.success("Dépense supprimée avec succès");
      return true;
    } catch (err) {
      console.error('Erreur deleteDepense:', err);
      toast.error("Erreur lors de la suppression de la dépense");
      return false;
    }
  };

  const addDepense = async (depenseData) => {
    try {
      const { data, error } = await supabase
        .from('depenses')
        .insert([depenseData])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setDepenses(prev => [data[0], ...prev]);
      } else {
        await fetchDepenses();
      }
      toast.success("Dépense enregistrée avec succès");
      return true;
    } catch (err) {
      console.error('Erreur addDepense:', err);
      toast.error("Erreur lors de l'enregistrement de la dépense");
      return false;
    }
  };

  useEffect(() => {
    fetchDepenses();
  }, [fetchDepenses]);

  return { depenses, loading, fetchDepenses, deleteDepense, addDepense };
}
