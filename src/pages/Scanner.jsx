import React, { useState, useEffect, useCallback } from 'react';
import { Scanner as QRScanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../supabaseClient';
import { 
  CheckCircle2, XCircle, Users, Wifi, WifiOff, Volume2, VolumeX, 
  RefreshCw, Sparkles, AlertTriangle, Maximize, Minimize,
  ShieldCheck, ShieldAlert
} from 'lucide-react';
import BadgeGenerator from '../components/BadgeGenerator';
import { soundController } from '../utils/audioFeedback';
import { calculateInsuranceStatus } from '../hooks/useAssurances';
import toast from 'react-hot-toast';

const OFFLINE_QUEUE_KEY = 'scb_offline_presences_queue';
const ATHLETES_CACHE_KEY = 'scb_cached_athletes_v1';

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [athleteData, setAthleteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [scanMode, setScanMode] = useState('pointage'); // 'pointage' ou 'verification'
  const [isKioskMode, setIsKioskMode] = useState(false);

  // État de connexion & file hors-ligne
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  
  // Préférences sonores et auto-reset
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoResetSeconds] = useState(4); // 0 = désactivé

  // Sauvegarder la file d'attente hors-ligne
  const saveOfflineQueue = (newQueue) => {
    setOfflineQueue(newQueue);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Mettre en cache les athlètes pour la validation hors-ligne
  const updateAthletesCache = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      const { data, error } = await supabase
        .from('athletes')
        .select(`
          id, nom, prenom, photo, token_qr, est_actif, groupe,
          certificat_medical_valide,
          cartes_acces (statut, date_dernier_paiement),
          cotisations (periode_couverte_fin),
          presences (id)
        `)
        .eq('est_actif', true);

      if (!error && data) {
        localStorage.setItem(ATHLETES_CACHE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Cache update failed:', e);
    }
  }, []);

  // Synchronisation des pointages hors-ligne vers Supabase
  const syncOfflinePresences = useCallback(async () => {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0 || !navigator.onLine) return;

    const toastId = toast.loading(`Synchronisation de ${queue.length} pointage(s) hors-ligne...`);
    let successCount = 0;
    const remainingQueue = [];

    for (const item of queue) {
      try {
        const { error } = await supabase
          .from('presences')
          .insert([{ athlete_id: item.athlete_id, created_at: item.date }]);

        if (!error || error.code === '23505') {
          successCount++;
        } else {
          remainingQueue.push(item);
        }
      } catch {
        remainingQueue.push(item);
      }
    }

    saveOfflineQueue(remainingQueue);
    if (successCount > 0) {
      toast.success(`${successCount} pointage(s) synchronisé(s) avec succès !`, { id: toastId });
    } else {
      toast.dismiss(toastId);
    }
  }, []);

  // Écoute des événements réseau
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie !');
      syncOfflinePresences();
      updateAthletesCache();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast('Mode Hors-Ligne activé. Les scans seront enregistrés localement.', {
        icon: '📶',
        duration: 4000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updateAthletesCache();
    syncOfflinePresences();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflinePresences, updateAthletesCache]);

  // Bascule Mode Kiosque (Plein Écran)
  const toggleKioskMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsKioskMode(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsKioskMode(false);
    }
  };

  // Détection du Scan QR
  const handleScan = async (detectedCodes) => {
    if (loading || scanResult || !detectedCodes || detectedCodes.length === 0) return;
    
    const decodedText = detectedCodes[0].rawValue;
    setScanResult(decodedText);
    setLoading(true);
    
    try {
      let athlete = null;

      // 1. Recherche en ligne si connecté
      if (navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from('athletes')
            .select(`
              *,
              cartes_acces (statut, date_dernier_paiement),
              cotisations (periode_couverte_fin),
              groupes (nom),
              presences (id, date_scan)
            `)
            .eq('token_qr', decodedText)
            .eq('est_actif', true)
            .single();

          if (!error && data) {
            athlete = data;
          }
        } catch (netErr) {
          console.warn('Network query failed, falling back to cache:', netErr);
        }
      }

      // 2. Fallback cache local si hors-ligne ou erreur réseau
      if (!athlete) {
        try {
          const cached = JSON.parse(localStorage.getItem(ATHLETES_CACHE_KEY) || '[]');
          athlete = cached.find(a => a.token_qr === decodedText) || null;
        } catch (cacheErr) {
          console.warn('Cache lookup failed:', cacheErr);
        }
      }
        
      if (!athlete) {
        if (soundEnabled) soundController.playError();
        setAthleteData({ error: 'Membre introuvable ou QR code invalide.' });
      } else {
        const presencesCount = Array.isArray(athlete.presences) ? athlete.presences.length : 0;
        const remainingSessions = Math.max(0, 8 - presencesCount);
        const cardStatut = athlete.cartes_acces?.statut || (Array.isArray(athlete.cartes_acces) && athlete.cartes_acces[0]?.statut) || 'ACTIVE';
        
        const validCotis = (athlete.cotisations || []).filter(c => c?.periode_couverte_fin && !isNaN(new Date(c.periode_couverte_fin).getTime()));
        const sortedCotis = [...validCotis].sort((a, b) => new Date(b.periode_couverte_fin) - new Date(a.periode_couverte_fin));
        const isCotisPaid = sortedCotis[0] && new Date(sortedCotis[0].periode_couverte_fin) >= new Date();

        let accessState = 'AUTORISE'; // 'AUTORISE' | 'TOLERANCE' | 'BLOQUE' | 'QUOTA_EXCEDE'
        let blockReason = '';
        let alreadyScanned = false;

        // ÉVALUATION DES RÈGLES MÉTIER STRICTES (PHASE 2)
        if (cardStatut === 'SUSPENDUE' || cardStatut === 'BLOQUE') {
          accessState = 'BLOQUE';
          blockReason = "Carte suspendue par l'administration";
        } else if (presencesCount >= 8) {
          accessState = 'QUOTA_EXCEDE';
          blockReason = 'Forfait épuisé (8/8 séances effectuées) - Renouvellement requis';
          
          // Mise à jour automatique de la carte en SUSPENDUE pour renouvellement
          if (navigator.onLine) {
            supabase
              .from('cartes_acces')
              .update({ statut: 'SUSPENDUE' })
              .eq('athlete_id', athlete.id)
              .catch(() => {});
          }
        } else if (!isCotisPaid) {
          if (presencesCount <= 2) {
            accessState = 'TOLERANCE';
          } else {
            accessState = 'BLOQUE';
            blockReason = 'Cotisation impayée (Délai de tolérance dépassé)';
          }
        }

        // ENREGISTREMENT DE LA PRÉSENCE SI AUTORISÉ OU TOLÉRÉ
        if (accessState === 'AUTORISE' || accessState === 'TOLERANCE') {
          if (scanMode === 'pointage') {
            if (navigator.onLine) {
              const { error: insertError } = await supabase
                .from('presences')
                .insert([{ athlete_id: athlete.id }]);
              
              if (insertError) {
                if (insertError.code === '23505') {
                  alreadyScanned = true;
                } else {
                  toast.error("Erreur d'enregistrement: " + insertError.message);
                }
              } else {
                setEntryCount(prev => prev + 1);
              }
            } else {
              const newQueueItem = {
                athlete_id: athlete.id,
                nom: athlete.nom,
                prenom: athlete.prenom,
                date: new Date().toISOString()
              };
              const updatedQueue = [...offlineQueue, newQueueItem];
              saveOfflineQueue(updatedQueue);
              setEntryCount(prev => prev + 1);
            }
          }

          // SIGNAL SONORE ADAPTÉ
          if (alreadyScanned) {
            if (soundEnabled) soundController.playWarning();
          } else if (accessState === 'TOLERANCE') {
            if (soundEnabled) soundController.playWarning();
          } else {
            if (soundEnabled) soundController.playSuccess();
          }
        } else if (accessState === 'QUOTA_EXCEDE') {
          if (soundEnabled) soundController.playQuotaExceeded();
        } else {
          if (soundEnabled) soundController.playError();
        }

        const storedAssurances = JSON.parse(localStorage.getItem('ovia_assurances_data') || '[]');
        const athleteAssurance = storedAssurances.find(a => a.athlete_id === athlete.id);
        const insuranceStatus = calculateInsuranceStatus(athleteAssurance);

        setAthleteData({ 
          ...athlete, 
          alreadyScanned, 
          accessState, 
          blockReason, 
          presencesCount,
          remainingSessions,
          athleteAssurance,
          insuranceStatus
        });
      }
    } catch {
      if (soundEnabled) soundController.playError();
      setAthleteData({ error: 'Erreur lors de la vérification du badge.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    setScanResult(null);
    setAthleteData(null);
  }, []);

  // Auto-reset après N secondes
  useEffect(() => {
    if (athleteData && autoResetSeconds > 0) {
      const timer = setTimeout(() => {
        handleReset();
      }, autoResetSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [athleteData, autoResetSeconds, handleReset]);

  // RENDU DU RETOUR VISUEL PLEIN ÉCRAN (SMART ACCESS 3 ÉTATS - PHASE 2)
  const getStatusDisplay = () => {
    if (!athleteData) return null;
    
    // CAS 1 : ERREUR SCAN
    if (athleteData.error) {
      return (
        <div style={{
          backgroundColor: 'rgba(220, 38, 38, 0.97)',
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '2rem',
          backdropFilter: 'blur(12px)',
          animation: 'pulse 1.5s infinite'
        }}>
          <XCircle size={90} className="mb-4 text-white" />
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '1px' }}>
            ACCÈS REFUSÉ
          </h2>
          <p style={{ fontSize: '1.25rem', textAlign: 'center', maxWidth: '500px', opacity: 0.95 }}>
            {athleteData.error}
          </p>
          <button 
            className="btn mt-8" 
            style={{ backgroundColor: 'white', color: '#dc2626', fontWeight: 800, padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '12px' }} 
            onClick={handleReset}
          >
            Scanner un autre badge
          </button>
        </div>
      );
    }

    const { accessState, blockReason, presencesCount, remainingSessions, alreadyScanned } = athleteData;

    // CAS 2 : 🔴 QUOTA ÉPUISÉ (8/8 SÉANCES TERMINÉES)
    if (accessState === 'QUOTA_EXCEDE') {
      return (
        <div style={{
          backgroundColor: 'rgba(225, 29, 72, 0.97)',
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '1.5rem',
          backdropFilter: 'blur(12px)'
        }}>
          <AlertTriangle size={85} className="mb-2 text-white animate-bounce" />
          <h2 style={{ fontSize: '2.3rem', fontWeight: 900, marginBottom: '0.4rem', letterSpacing: '1px', textAlign: 'center' }}>
            FORFAIT 8/8 ÉPUISÉ
          </h2>
          
          <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '0.5rem 1.5rem', borderRadius: '9999px', fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', color: '#fecdd3' }}>
            ⚠️ 8 séances sur 8 effectuées — Renouvellement requis
          </div>

          <div style={{ transform: 'scale(0.85)', margin: '-1rem 0' }}>
            <BadgeGenerator athlete={athleteData} showEndDate={true} />
          </div>

          <p style={{ maxWidth: '420px', textAlign: 'center', fontSize: '1rem', marginTop: '1rem', opacity: 0.95 }}>
            Le quota mensuel de ce membre est atteint. Merci de régulariser la nouvelle cotisation au secrétariat.
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center mt-5">
            <button 
              className="btn" 
              style={{ backgroundColor: 'white', color: '#e11d48', fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1.05rem', borderRadius: '12px' }} 
              onClick={handleReset}
            >
              Scanner Suivant ({autoResetSeconds > 0 ? `${autoResetSeconds}s` : 'Manuel'})
            </button>
            <button 
              className="btn" 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 800, padding: '0.85rem 1.5rem', fontSize: '1rem', borderRadius: '12px' }} 
              onClick={async () => {
                try {
                  toast.loading("Validation d'accès exceptionnelle...", { id: 'renew-scan' });
                  await supabase.from('cartes_acces').update({ statut: 'ACTIVE' }).eq('athlete_id', athleteData.id);
                  await supabase.from('presences').insert([{ athlete_id: athleteData.id }]);
                  if (soundEnabled) soundController.playSuccess();
                  toast.success("Séance exceptionnelle accordée !", { id: 'renew-scan' });
                  handleReset();
                } catch (e) {
                  toast.error("Erreur: " + e.message, { id: 'renew-scan' });
                }
              }}
            >
              ⚡ Accorder 1 séance exceptionnelle
            </button>
          </div>
        </div>
      );
    }

    // CAS 3 : 🟢 ACCÈS AUTORISÉ (COTISATION OK + SÉANCES RESTANTES)
    if (accessState === 'AUTORISE') {
      return (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.97)',
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '1.5rem',
          backdropFilter: 'blur(12px)'
        }}>
          <CheckCircle2 size={85} className="mb-2 text-white" />
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: alreadyScanned ? '0.4rem' : '0.75rem', letterSpacing: '1px' }}>
            ACCÈS AUTORISÉ
          </h2>
          
          {alreadyScanned ? (
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.95)', padding: '0.35rem 1.25rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>
              ⚠️ DÉJÀ POINTÉ AUJOURD'HUI
            </div>
          ) : (
            <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.35rem 1.25rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>
              🏊 Séances restantes : {Math.max(0, remainingSessions - 1)}/8
            </div>
          )}

          {!isOnline && (
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.9)', padding: '0.25rem 1rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: 'white' }}>
              📶 Enregistré hors-ligne (en attente de sync)
            </div>
          )}
          
          {/* Badge Statut Assurance */}
          {athleteData.insuranceStatus && (
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: athleteData.insuranceStatus.isCovered ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.35)', 
              border: `1px solid ${athleteData.insuranceStatus.isCovered ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.6)'}`,
              padding: '0.35rem 1rem', 
              borderRadius: '9999px', 
              fontSize: '0.82rem', 
              fontWeight: 800, 
              marginBottom: '0.75rem', 
              color: 'white' 
            }}>
              {athleteData.insuranceStatus.isCovered ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
              <span>
                {athleteData.insuranceStatus.isCovered 
                  ? `Assurance : ${athleteData.athleteAssurance?.compagnie?.split('(')[0].trim() || 'À jour'} (${athleteData.insuranceStatus.daysLeft}j)` 
                  : '⚠️ Assurance : Non couverte / Expirée'}
              </span>
            </div>
          )}
          
          <div style={{ transform: 'scale(0.85)', margin: '-1rem 0' }}>
            <BadgeGenerator athlete={athleteData} showEndDate={true} />
          </div>
          
          <button 
            className="btn mt-4" 
            style={{ backgroundColor: 'white', color: '#10b981', fontWeight: 800, padding: '0.85rem 2.5rem', fontSize: '1.1rem', borderRadius: '12px' }} 
            onClick={handleReset}
          >
            Scanner Suivant ({autoResetSeconds > 0 ? `${autoResetSeconds}s` : 'Manuel'})
          </button>
        </div>
      );
    }

    // CAS 4 : 🟠 TOLÉRANCE / ESSAI (COTISATION EN ATTENTE MAIS <= 2 SÉANCES)
    if (accessState === 'TOLERANCE') {
      return (
        <div style={{
          backgroundColor: 'rgba(217, 119, 6, 0.97)',
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '1.5rem',
          backdropFilter: 'blur(12px)'
        }}>
          <AlertTriangle size={85} className="mb-2 text-white" />
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.4rem', letterSpacing: '1px' }}>
            ACCÈS TOLÉRÉ (ESSAI)
          </h2>
          
          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.35rem 1.25rem', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>
            🟠 Séance d'essai {presencesCount + 1}/2 • Cotisation en attente
          </div>

          {/* Badge Statut Assurance */}
          {athleteData.insuranceStatus && (
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              backgroundColor: athleteData.insuranceStatus.isCovered ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.35)', 
              border: `1px solid ${athleteData.insuranceStatus.isCovered ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.6)'}`,
              padding: '0.35rem 1rem', 
              borderRadius: '9999px', 
              fontSize: '0.82rem', 
              fontWeight: 800, 
              marginBottom: '0.75rem', 
              color: 'white' 
            }}>
              {athleteData.insuranceStatus.isCovered ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
              <span>
                {athleteData.insuranceStatus.isCovered 
                  ? `Assurance : ${athleteData.athleteAssurance?.compagnie?.split('(')[0].trim() || 'À jour'} (${athleteData.insuranceStatus.daysLeft}j)` 
                  : '⚠️ Assurance : Non couverte / Expirée'}
              </span>
            </div>
          )}

          <div style={{ transform: 'scale(0.85)', margin: '-1rem 0' }}>
            <BadgeGenerator athlete={athleteData} showEndDate={true} />
          </div>
          
          <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '0.65rem 1.25rem', borderRadius: '12px', textAlign: 'center', maxWidth: '420px', marginTop: '0.75rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fef3c7' }}>
              Rappel : Merci d'inviter l'adhérent à régler sa cotisation à l'accueil avant la 3ème séance.
            </p>
          </div>
          
          <button 
            className="btn mt-4" 
            style={{ backgroundColor: 'white', color: '#d97706', fontWeight: 800, padding: '0.85rem 2.5rem', fontSize: '1.1rem', borderRadius: '12px' }} 
            onClick={handleReset}
          >
            Scanner Suivant ({autoResetSeconds > 0 ? `${autoResetSeconds}s` : 'Manuel'})
          </button>
        </div>
      );
    }

    // CAS 5 : 🔴 ACCÈS BLOQUÉ (SUSPENDU, IMPAYÉ DÉPASSÉ OU SANS CERTIFICAT)
    return (
      <div style={{
        backgroundColor: 'rgba(220, 38, 38, 0.97)',
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '1.5rem',
        backdropFilter: 'blur(12px)'
      }}>
        <XCircle size={85} className="mb-2 text-white" />
        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '1px' }}>
          ACCÈS BLOQUÉ
        </h2>
        
        <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '0.65rem 1.5rem', borderRadius: '12px', textAlign: 'center', width: '100%', maxWidth: '420px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fecaca' }}>
            MOTIF : {blockReason.toUpperCase()}
          </p>
        </div>

        <div style={{ transform: 'scale(0.85)', margin: '-1rem 0' }}>
          <BadgeGenerator athlete={athleteData} showEndDate={true} />
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center mt-5">
          <button 
            className="btn" 
            style={{ backgroundColor: 'white', color: '#dc2626', fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1.05rem', borderRadius: '12px' }} 
            onClick={handleReset}
          >
            Scanner Suivant
          </button>
          <button 
            className="btn" 
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 800, padding: '0.85rem 1.5rem', fontSize: '1rem', borderRadius: '12px' }} 
            onClick={async () => {
              try {
                toast.loading("Déblocage d'accès en cours...", { id: 'unblock-scan' });
                await supabase.from('cartes_acces').update({ statut: 'ACTIVE' }).eq('athlete_id', athleteData.id);
                await supabase.from('presences').insert([{ athlete_id: athleteData.id }]);
                if (soundEnabled) soundController.playSuccess();
                toast.success("Passage exceptionnel accordé !", { id: 'unblock-scan' });
                handleReset();
              } catch (e) {
                toast.error("Erreur déblocage: " + e.message, { id: 'unblock-scan' });
              }
            }}
          >
            ⚡ Forcer le passage exceptionnel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* HEADER DU SCANNER AVEC STATUT RÉSEAU & COMMANDES */}
      <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Scanner de Contrôle Bassin
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Pointage instantané & Smart Access (Quotas & Cotisations)
          </p>
        </div>
        
        {/* BARRE D'OUTILS ET BADGES */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Badge Réseau / Mode Hors-Ligne */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '0.35rem 0.75rem', 
              borderRadius: '9999px', 
              fontSize: '0.75rem', 
              fontWeight: 700,
              backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isOnline ? '#10b981' : '#ef4444',
              border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? 'En ligne' : 'Hors-Ligne'}</span>
          </div>

          {/* Pointages hors-ligne en attente */}
          {offlineQueue.length > 0 && (
            <button
              onClick={syncOfflinePresences}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                cursor: 'pointer'
              }}
              title="Cliquer pour forcer la synchronisation"
            >
              <RefreshCw size={13} />
              <span>{offlineQueue.length} en attente</span>
            </button>
          )}

          {/* Mode Toggle (Pointage / Vérification) */}
          <button
            onClick={() => setScanMode(prev => prev === 'pointage' ? 'verification' : 'pointage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              backgroundColor: scanMode === 'pointage' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              color: scanMode === 'pointage' ? '#a78bfa' : '#94a3b8',
              border: `1px solid ${scanMode === 'pointage' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(100, 116, 139, 0.4)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Changer le mode de scan"
          >
            <Sparkles size={14} />
            <span>Mode {scanMode === 'pointage' ? 'Pointage' : 'Vérification'}</span>
          </button>

          {/* Bouton Mode Kiosque Plein Écran */}
          <button
            onClick={toggleKioskMode}
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              backgroundColor: isKioskMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.08)',
              color: isKioskMode ? '#818cf8' : '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isKioskMode ? 'Quitter le mode Kiosque' : 'Activer le mode Kiosque (Tablette / Réception)'}
          >
            {isKioskMode ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          {/* Bouton Son On/Off */}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              backgroundColor: soundEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.08)',
              color: soundEnabled ? '#10b981' : '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Compteur d'entrées aujourd'hui */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(99, 102, 241, 0.18)', padding: '0.35rem 0.85rem', borderRadius: '9999px', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.35)' }}>
            <Users size={16} />
            <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{entryCount} scan(s)</span>
          </div>
        </div>
      </div>
      
      {/* ZONE DE SCANNER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', maxWidth: '520px', margin: '0 auto', width: '100%' }}>
        {!scanResult && (
          <div style={{ width: '100%', borderRadius: '18px', overflow: 'hidden', border: '2px solid rgba(99, 102, 241, 0.4)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', backgroundColor: '#000' }}>
            <QRScanner onScan={handleScan} />
          </div>
        )}
        <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
          💡 Présentez le badge QR devant la caméra. La vérification Smart Access et les alertes de quota sont automatiques.
        </p>
      </div>
      
      {getStatusDisplay()}
    </div>
  );
}
