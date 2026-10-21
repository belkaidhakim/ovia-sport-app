import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Gérer automatiquement les mises à jour de déploiement (évite les erreurs de chunks périmés)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    console.warn('Nouvelle version de l\'application détectée (vite:preloadError), rechargement automatique...');
    window.location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
