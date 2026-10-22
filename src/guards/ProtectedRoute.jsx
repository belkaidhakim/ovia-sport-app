/**
 * =====================================================
 * OVIA SPORT — Guards de Routes
 * =====================================================
 * Composant ProtectedRoute extrait de App.jsx pour
 * centraliser la logique d'autorisation.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Loader minimaliste pendant la vérification auth
 */
function AuthLoader() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      background: '#070d1e',
      color: 'rgba(255,255,255,0.7)',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(37,99,235,0.3)',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
        OVIA SPORT
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * ProtectedRoute — Protège une route par authentification et rôles.
 *
 * @param {{ children: React.ReactNode, allowedRoles?: string[] }} props
 *
 * - Si `loading` → affiche un spinner
 * - Si pas de `session` → redirige vers /login (avec retour après connexion)
 * - Si `allowedRoles` et rôle non autorisé → redirige vers /dashboard
 * - Sinon → rend les enfants
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoader />;

  if (!session) {
    // Conserve l'URL courante pour rediriger après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallback = role === 'entraineur' ? '/scanner' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
