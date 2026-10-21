/**
 * =====================================================
 * OVIA SPORT — Hook : useAthletes (refactorisé)
 * =====================================================
 * Gère l'état local des athlètes et délègue toutes les
 * opérations Supabase au service layer (athletes.service.js).
 */

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { STORAGE_KEYS, DEFAULT_COTISATION_MONTANT, COTISATION_VALIDITY_DAYS } from '../config/constants';
import {
  fetchActiveAthletes,
  fetchArchivedAthletes as fetchArchivedService,
  fetchAllAthletes as fetchAllService,
  archiveAthlete as archiveService,
  restoreAthlete as restoreService,
  bulkRestoreAthletes as bulkRestoreService,
  deleteAthletePermanently as deleteService,
  bulkDeleteAthletes as bulkDeleteService,
  updateAccessStatus,
  bulkUpdateAccessStatus,
  grantAccess,
  bulkUpdateGroup as bulkUpdateGroupService,
} from '../services/athletes.service';
import { createCotisation, bulkCreateCotisations, resetPresences, bulkResetPresences } from '../services/finances.service';
import { supabase } from '../supabaseClient';

export function useAthletes() {
  const [athletes, setAthletes] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_ATHLETES);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [archivedAthletes, setArchivedAthletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [error, setError] = useState(null);

  // ── Helpers ─────────────────────────────────────────────────────────
  const cacheAthletes = (data) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_ATHLETES, JSON.stringify(data || []));
    } catch {
      // Ignorer les erreurs de quota storage
    }
  };

  // ── Fetch athlètes actifs ──────────────────────────────────────────
  const fetchAthletes = useCallback(async (includeArchived = false) => {
    try {
      setLoading(true);
      const { data, error: err } = includeArchived
        ? await fetchAllService()
        : await fetchActiveAthletes();

      if (err) throw err;
      setAthletes(data || []);
      cacheAthletes(data);
      setError(null);
    } catch (err) {
      console.error('[useAthletes] fetchAthletes:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des athlètes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllAthletes = useCallback(() => fetchAthletes(true), [fetchAthletes]);

  // ── Fetch archives ────────────────────────────────────────────────
  const fetchArchivedAthletes = useCallback(async () => {
    try {
      setLoadingArchived(true);
      const { data, error: err } = await fetchArchivedService();
      if (err) throw err;
      setArchivedAthletes(data || []);
      return data || [];
    } catch (err) {
      console.error('[useAthletes] fetchArchivedAthletes:', err);
      toast.error('Erreur lors du chargement des archives');
      return [];
    } finally {
      setLoadingArchived(false);
    }
  }, []);

  // ── Archive / Restauration ────────────────────────────────────────
  const archiveAthlete = async (id) => {
    try {
      const { error: err } = await archiveService(id);
      if (err) throw err;
      setAthletes(prev => prev.filter(a => a.id !== id));
      toast.success('Membre archivé avec succès');
      return true;
    } catch (err) {
      console.error('[useAthletes] archiveAthlete:', err);
      toast.error("Erreur lors de l'archivage");
      return false;
    }
  };

  const restoreAthlete = async (id) => {
    try {
      const { error: err } = await restoreService(id);
      if (err) throw err;
      setArchivedAthletes(prev => prev.filter(a => a.id !== id));
      fetchAthletes();
      toast.success('Membre réactivé avec succès');
      return true;
    } catch (err) {
      console.error('[useAthletes] restoreAthlete:', err);
      toast.error('Erreur lors de la réactivation');
      return false;
    }
  };

  const bulkRestoreAthletes = async (athleteIds) => {
    if (!athleteIds?.length) return false;
    try {
      const { error: err } = await bulkRestoreService(athleteIds);
      if (err) throw err;
      setArchivedAthletes(prev => prev.filter(a => !athleteIds.includes(a.id)));
      fetchAthletes();
      toast.success(`${athleteIds.length} membre(s) réactivé(s) avec succès`);
      return true;
    } catch (err) {
      console.error('[useAthletes] bulkRestoreAthletes:', err);
      toast.error('Erreur lors de la réactivation en masse');
      return false;
    }
  };

  // ── Suppression permanente ─────────────────────────────────────────
  const deleteAthletePermanently = async (id) => {
    try {
      const { error: err } = await deleteService(id);
      if (err) throw err;
      setArchivedAthletes(prev => prev.filter(a => a.id !== id));
      setAthletes(prev => prev.filter(a => a.id !== id));
      toast.success('Membre supprimé définitivement');
      return true;
    } catch (err) {
      console.error('[useAthletes] deleteAthletePermanently:', err);
      toast.error('Erreur lors de la suppression définitive');
      return false;
    }
  };

  const bulkDeleteAthletesPermanently = async (athleteIds) => {
    if (!athleteIds?.length) return false;
    try {
      const { error: err } = await bulkDeleteService(athleteIds);
      if (err) throw err;
      setArchivedAthletes(prev => prev.filter(a => !athleteIds.includes(a.id)));
      setAthletes(prev => prev.filter(a => !athleteIds.includes(a.id)));
      toast.success(`${athleteIds.length} membre(s) supprimé(s) définitivement`);
      return true;
    } catch (err) {
      console.error('[useAthletes] bulkDeleteAthletesPermanently:', err);
      toast.error('Erreur lors de la suppression définitive en masse');
      return false;
    }
  };

  // ── Statut d'accès ────────────────────────────────────────────────
  /** Met à jour le statut carte d'accès d'un athlète dans l'état local */
  const patchAthleteAccess = (athleteId, newStatus) => {
    setAthletes(prev => prev.map(a => {
      if (a.id !== athleteId) return a;
      return {
        ...a,
        cartes_acces: Array.isArray(a.cartes_acces)
          ? [{ ...a.cartes_acces[0], statut: newStatus }]
          : { ...a.cartes_acces, statut: newStatus },
      };
    }));
  };

  const toggleAccessStatus = async (athleteId, currentStatusObj) => {
    const currentStatus = Array.isArray(currentStatusObj)
      ? currentStatusObj[0]?.statut
      : currentStatusObj?.statut;
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDUE' : 'ACTIVE';

    try {
      const { error: err } = await updateAccessStatus(athleteId, newStatus);
      if (err) throw err;
      patchAthleteAccess(athleteId, newStatus);
      toast.success(`Statut mis à jour : ${newStatus === 'ACTIVE' ? 'Activé ✓' : 'Suspendu ✗'}`);
      return true;
    } catch (err) {
      console.error('[useAthletes] toggleAccessStatus:', err);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  const bulkUpdateGroup = async (athleteIds, newGroupId, newGroupName) => {
    if (!athleteIds?.length) return false;
    try {
      const { error: err } = await bulkUpdateGroupService(athleteIds, newGroupId, newGroupName);
      if (err) throw err;
      toast.success(`${athleteIds.length} membre(s) réaffecté(s) au groupe « ${newGroupName} »`);
      fetchAthletes();
      return true;
    } catch (err) {
      console.error('[useAthletes] bulkUpdateGroup:', err);
      toast.error('Erreur lors de la réaffectation en masse');
      return false;
    }
  };

  const bulkToggleAccess = async (athleteIds, newStatus = 'SUSPENDUE') => {
    if (!athleteIds?.length) return false;
    try {
      const { error: err } = await bulkUpdateAccessStatus(athleteIds, newStatus);
      if (err) throw err;
      toast.success(`Accès ${newStatus === 'ACTIVE' ? 'activé' : 'suspendu'} pour ${athleteIds.length} membre(s)`);
      fetchAthletes();
      return true;
    } catch (err) {
      console.error('[useAthletes] bulkToggleAccess:', err);
      toast.error("Erreur lors du changement d'accès en masse");
      return false;
    }
  };

  const bulkValidateCotisation = async (athleteIds, montant = DEFAULT_COTISATION_MONTANT, modePaiement = 'Espèces') => {
    if (!athleteIds?.length) return false;
    try {
      const { error: err } = await bulkCreateCotisations(athleteIds, montant, modePaiement);
      if (err) throw err;

      // Réactivation des cartes
      await bulkUpdateAccessStatus(athleteIds, 'ACTIVE');

      toast.success(`Cotisation validée pour ${athleteIds.length} membre(s) (valable ${COTISATION_VALIDITY_DAYS}j)`);
      fetchAthletes();
      return true;
    } catch (err) {
      console.error('[useAthletes] bulkValidateCotisation:', err);
      toast.error('Erreur lors de la validation des cotisations en masse');
      return false;
    }
  };

  // ── Réinitialisation de l'assiduité (Présences & Quota) ───────────
  const resetAthletePresences = async (athleteId) => {
    const toastId = toast.loading("Réinitialisation de l'assiduité…");
    try {
      await resetPresences(athleteId);
      await updateAccessStatus(athleteId, 'ACTIVE');

      setAthletes(prev => {
        const updated = prev.map(a => {
          if (a.id !== athleteId) return a;
          return {
            ...a,
            presences: [],
            cartes_acces: Array.isArray(a.cartes_acces)
              ? [{ ...a.cartes_acces[0], statut: 'ACTIVE' }]
              : { ...a.cartes_acces, statut: 'ACTIVE' },
          };
        });
        cacheAthletes(updated);
        return updated;
      });

      toast.dismiss(toastId);
      toast.success("Assiduité remise à 0/8 séances avec succès ! 🔄");
      return true;
    } catch (err) {
      toast.dismiss(toastId);
      console.error('[useAthletes] resetAthletePresences:', err);
      toast.error("Erreur lors de la réinitialisation : " + err.message);
      return false;
    }
  };

  const bulkResetAthletesPresences = async (athleteIds) => {
    if (!athleteIds?.length) return false;
    const toastId = toast.loading(`Réinitialisation de ${athleteIds.length} membre(s)…`);
    try {
      await bulkResetPresences(athleteIds);
      await bulkUpdateAccessStatus(athleteIds, 'ACTIVE');

      setAthletes(prev => {
        const updated = prev.map(a => {
          if (!athleteIds.includes(a.id)) return a;
          return {
            ...a,
            presences: [],
            cartes_acces: Array.isArray(a.cartes_acces)
              ? [{ ...a.cartes_acces[0], statut: 'ACTIVE' }]
              : { ...a.cartes_acces, statut: 'ACTIVE' },
          };
        });
        cacheAthletes(updated);
        return updated;
      });

      toast.dismiss(toastId);
      toast.success(`Assiduité remise à 0/8 pour ${athleteIds.length} membres !`);
      return true;
    } catch (err) {
      toast.dismiss(toastId);
      console.error('[useAthletes] bulkResetAthletesPresences:', err);
      toast.error('Erreur réinitialisation en masse : ' + err.message);
      return false;
    }
  };

  // ── Smart Access (multi-actions) ──────────────────────────────────
  const updateSmartAccess = async (athleteId, action, options = {}) => {
    const toastId = toast.loading('Mise à jour du Smart Access…');
    try {
      if (action === 'BLOQUE') {
        await updateAccessStatus(athleteId, 'SUSPENDUE');
        patchAthleteAccess(athleteId, 'SUSPENDUE');
        toast.dismiss(toastId);
        toast.success('Smart Access : Accès bloqué');
        return true;
      }

      if (action === 'AUTORISE') {
        await grantAccess(athleteId);

        let newCotis = null;
        if (options.addCotisation) {
          const { data } = await createCotisation({
            athleteId,
            montant: options.montant,
            modePaiement: options.modePaiement || 'Espèces',
            periodeFin: options.periodeFin,
          });
          newCotis = data;
        }

        if (options.resetPresences) {
          await resetPresences(athleteId);
        }

        setAthletes(prev => {
          const updated = prev.map(a => {
            if (a.id !== athleteId) return a;
            return {
              ...a,
              cartes_acces: Array.isArray(a.cartes_acces)
                ? [{ ...a.cartes_acces[0], statut: 'ACTIVE' }]
                : { ...a.cartes_acces, statut: 'ACTIVE' },
              cotisations: newCotis ? [newCotis, ...(a.cotisations || [])] : (a.cotisations || []),
              presences: options.resetPresences ? [] : (a.presences || []),
            };
          });
          cacheAthletes(updated);
          return updated;
        });

        toast.dismiss(toastId);
        toast.success('Smart Access : Accès autorisé ✓');
        return true;
      }

      if (action === 'RESET_QUOTA') {
        await resetPresences(athleteId);
        await updateAccessStatus(athleteId, 'ACTIVE');

        setAthletes(prev => {
          const updated = prev.map(a => {
            if (a.id !== athleteId) return a;
            return {
              ...a,
              presences: [],
              cartes_acces: Array.isArray(a.cartes_acces)
                ? [{ ...a.cartes_acces[0], statut: 'ACTIVE' }]
                : { ...a.cartes_acces, statut: 'ACTIVE' },
            };
          });
          cacheAthletes(updated);
          return updated;
        });

        toast.dismiss(toastId);
        toast.success('Quota réinitialisé : 0/8 séances consommées (8/8 disponibles) !');
        return true;
      }

      if (action === 'TOLERANCE') {
        await updateAccessStatus(athleteId, 'ACTIVE');

        if (options.adjustPresences) {
          await resetPresences(athleteId);
          await supabase.from('presences').insert([{ athlete_id: athleteId }]);
        }

        await fetchAthletes();
        toast.dismiss(toastId);
        toast.success("Smart Access : Tolérance d'essai accordée");
        return true;
      }

      toast.dismiss(toastId);
      return false;
    } catch (err) {
      toast.dismiss(toastId);
      console.error('[useAthletes] updateSmartAccess:', err);
      toast.error('Erreur Smart Access : ' + err.message);
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
    fetchAllAthletes,
    fetchArchivedAthletes,
    archiveAthlete,
    restoreAthlete,
    bulkRestoreAthletes,
    deleteAthletePermanently,
    bulkDeleteAthletesPermanently,
    toggleAccessStatus,
    updateSmartAccess,
    resetAthletePresences,
    bulkResetAthletesPresences,
    bulkUpdateGroup,
    bulkToggleAccess,
    bulkValidateCotisation,
  };
}
