import React from 'react';
import { Card, Button } from './ui';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary a intercepté une erreur : ", error, errorInfo);

    const errorMessage = error?.message || String(error || '');
    const isChunkError = 
      errorMessage.includes("Failed to fetch dynamically imported module") ||
      errorMessage.includes("dynamically imported module") ||
      errorMessage.includes("Importing a module script failed") ||
      errorMessage.includes("Loading chunk");

    if (isChunkError && typeof window !== 'undefined') {
      const now = Date.now();
      const lastReload = parseInt(sessionStorage.getItem("error_boundary_chunk_reload") || "0", 10);
      
      // Auto-reload si première fois depuis 15 secondes
      if (now - lastReload > 15000) {
        sessionStorage.setItem("error_boundary_chunk_reload", String(now));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || String(this.state.error);
      const errorStack = this.state.error?.stack || '';

      const isChunkError = 
        errorMessage.includes("Failed to fetch dynamically imported module") ||
        errorMessage.includes("dynamically imported module") ||
        errorMessage.includes("Importing a module script failed") ||
        errorMessage.includes("Loading chunk");

      if (isChunkError) {
        return (
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-md w-full text-center p-8 border border-blue-500/30 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} />
              </div>
              <h2 className="mb-2 text-xl font-extrabold text-white">Mise à jour en ligne disponible !</h2>
              <p className="text-slate-400 mb-6 text-sm">
                Une nouvelle version de l'application vient d'être déployée sur le serveur. Cliquez ci-dessous pour charger la dernière version.
              </p>
              
              <Button 
                variant="primary" 
                className="w-full flex justify-center items-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
              >
                <RefreshCw size={18} />
                Mettre à jour l'application
              </Button>
            </Card>
          </div>
        );
      }

      return (
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <Card className="max-w-lg w-full text-center p-8">
            <div className="flex justify-center mb-4">
              <AlertTriangle size={48} className="text-warning" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Oups, un problème est survenu.</h2>
            <p className="text-slate-400 mb-4 text-sm">
              L'application a rencontré une erreur inattendue lors de l'affichage de cette page.
            </p>
            
            {errorMessage && (
              <details className="text-left mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                <summary className="cursor-pointer font-semibold text-red-400 mb-2 select-none">
                  🔍 Voir le détail technique de l'erreur
                </summary>
                <div className="font-mono text-red-300 break-all whitespace-pre-wrap max-h-48 overflow-y-auto">
                  <strong>Message:</strong> {errorMessage}
                  {errorStack && (
                    <>
                      <br /><br />
                      <strong>Pile d'appel:</strong><br />
                      {errorStack}
                    </>
                  )}
                </div>
              </details>
            )}

            <Button 
              variant="primary" 
              className="w-full flex justify-center items-center gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={18} />
              Rafraîchir la page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
