import { lazy } from 'react';

/**
 * Charge un composant lazy de manière résiliente aux déploiements.
 * Si le bundle a changé suite à un nouveau déploiement sur Vercel,
 * recharge automatiquement la page pour récupérer les nouveaux assets.
 */
export function lazyRetry(componentImport) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn("Échec du chargement du module dynamique (mise à jour détectée):", error);
      
      const isChunkError = 
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("dynamically imported module") ||
        error?.message?.includes("Importing a module script failed") ||
        error?.message?.includes("Loading chunk");

      if (isChunkError && typeof window !== 'undefined') {
        const lastReload = parseInt(sessionStorage.getItem("chunk_retry_timestamp") || "0", 10);
        const now = Date.now();
        
        // Empêche les boucles infinies si déconnexion réseau (max 1 reload toutes les 10s)
        if (now - lastReload > 10000) {
          sessionStorage.setItem("chunk_retry_timestamp", String(now));
          window.location.reload();
          return new Promise(() => {}); // bloque la résolution jusqu'au reload
        }
      }
      
      throw error;
    }
  });
}
