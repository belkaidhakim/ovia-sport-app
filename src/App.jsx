import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'react-hot-toast';
import ClubProAppShell from './components/ClubProAppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProtectedRoute from './guards/ProtectedRoute';
import { lazyRetry } from './utils/lazyRetry';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WRITE_ROLES, ALL_ADMIN_ROLES } from './config/constants';

// ─── Lazy loading des pages ────────────────────────────────────────────────
// lazyRetry évite les erreurs de hash périmé après un déploiement
const Dashboard            = lazyRetry(() => import('./pages/Dashboard'));
const AthletesList         = lazyRetry(() => import('./pages/AthletesList'));
const AthleteForm          = lazyRetry(() => import('./pages/AthleteForm'));
const FinancialDashboard   = lazyRetry(() => import('./pages/FinancialDashboard'));
const Scanner              = lazyRetry(() => import('./pages/Scanner'));
const Login                = lazyRetry(() => import('./pages/Login'));
const ResetPassword        = lazyRetry(() => import('./pages/ResetPassword'));
const UpdatePassword       = lazyRetry(() => import('./pages/UpdatePassword'));
const UsersManagement      = lazyRetry(() => import('./pages/UsersManagement'));
const GroupsManagement     = lazyRetry(() => import('./pages/GroupsManagement'));
const PublicRegistration   = lazyRetry(() => import('./pages/PublicRegistration'));
const LandingPage          = lazyRetry(() => import('./pages/LandingPage'));
const MemberPortal         = lazyRetry(() => import('./pages/MemberPortal'));
const Schedule             = lazyRetry(() => import('./pages/Schedule'));
const SportsTracking       = lazyRetry(() => import('./pages/SportsTracking'));
const InsuranceManagement  = lazyRetry(() => import('./pages/InsuranceManagement'));
const ArchivesManagement   = lazyRetry(() => import('./pages/ArchivesManagement'));
const AlertsCenter         = lazyRetry(() => import('./pages/AlertsCenter'));
const AdminProfile         = lazyRetry(() => import('./pages/AdminProfile'));
const NotFound             = lazyRetry(() => import('./pages/NotFound'));

// ─── Layout protégé ───────────────────────────────────────────────────────
function AdminLayout({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <ClubProAppShell>
        {children}
      </ClubProAppShell>
    </ProtectedRoute>
  );
}

// ─── Loader de Suspense ───────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      background: '#070d1e',
      color: 'rgba(255,255,255,0.6)',
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid rgba(37,99,235,0.3)',
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Routes de l'application ──────────────────────────────────────────────
function AppRoutes() {
  // Gestion des mises à jour PWA
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered: (r) => console.log('[PWA] Registered:', r),
    onRegisterError: (e) => console.warn('[PWA] Registration error:', e),
  });

  React.useEffect(() => {
    if (needRefresh) {
      toast(
        (t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span>🚀 Nouvelle version disponible !</span>
            <button
              className="btn btn-primary"
              onClick={() => { updateServiceWorker(true); toast.dismiss(t.id); }}
            >
              Mettre à jour
            </button>
          </div>
        ),
        { duration: Infinity, position: 'bottom-right' }
      );
    }
  }, [needRefresh, updateServiceWorker]);

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '14px 18px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
        }}
      />

      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Routes publiques sans layout ─────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/admin" element={<Navigate to="/login" replace />} />

            {/* Portail public athlète */}
            <Route path="/espace-membre"   element={<MemberPortal />} />
            <Route path="/espace-adherent" element={<MemberPortal />} />
            <Route path="/adherent"        element={<MemberPortal />} />

            {/* Inscription publique (multi-alias) */}
            <Route path="/inscription"    element={<PublicRegistration />} />
            <Route path="/inscriptions"   element={<PublicRegistration />} />
            <Route path="/preinscription" element={<PublicRegistration />} />
            <Route path="/pre-inscription" element={<PublicRegistration />} />
            <Route path="/adhesion"       element={<PublicRegistration />} />

            {/* Scanner terrain (accès libre pour les agents) */}
            <Route path="/scanner" element={<Scanner />} />

            {/* ── Routes admin protégées ───────────────────────────── */}
            <Route path="/dashboard" element={
              <AdminLayout allowedRoles={WRITE_ROLES}>
                <Dashboard />
              </AdminLayout>
            } />

            {/* Redirections vers onglet inscriptions */}
            <Route path="/inscriptions-en-attente" element={<Navigate to="/athletes?tab=inscriptions" replace />} />
            <Route path="/admin/inscriptions"      element={<Navigate to="/athletes?tab=inscriptions" replace />} />
            <Route path="/inscriptions-admin"      element={<Navigate to="/athletes?tab=inscriptions" replace />} />

            {/* Athlètes */}
            <Route path="/athletes" element={
              <AdminLayout allowedRoles={ALL_ADMIN_ROLES}>
                <AthletesList />
              </AdminLayout>
            } />
            <Route path="/athletes/new" element={
              <AdminLayout allowedRoles={WRITE_ROLES}>
                <AthleteForm />
              </AdminLayout>
            } />
            <Route path="/athletes/edit/:id" element={
              <AdminLayout allowedRoles={WRITE_ROLES}>
                <AthleteForm />
              </AdminLayout>
            } />
            <Route path="/athletes/:id" element={
              <AdminLayout allowedRoles={WRITE_ROLES}>
                <AthleteForm />
              </AdminLayout>
            } />

            {/* Suivi sportif */}
            <Route path="/performances" element={
              <AdminLayout allowedRoles={ALL_ADMIN_ROLES}>
                <SportsTracking />
              </AdminLayout>
            } />
            <Route path="/suivi-sportif" element={<Navigate to="/performances" replace />} />

            {/* Finances */}
            <Route path="/finances" element={
              <AdminLayout allowedRoles={WRITE_ROLES}>
                <FinancialDashboard />
              </AdminLayout>
            } />

            {/* Groupes */}
            <Route path="/groupes" element={
              <AdminLayout allowedRoles={WRITE_ROLES}>
                <GroupsManagement />
              </AdminLayout>
            } />

            {/* Assurances */}
            <Route path="/assurances" element={
              <AdminLayout allowedRoles={ALL_ADMIN_ROLES}>
                <InsuranceManagement />
              </AdminLayout>
            } />
            <Route path="/assurance" element={<Navigate to="/assurances" replace />} />

            {/* Archives */}
            <Route path="/archives" element={
              <AdminLayout allowedRoles={WRITE_ROLES}>
                <ArchivesManagement />
              </AdminLayout>
            } />
            <Route path="/archive" element={<Navigate to="/archives" replace />} />

            {/* Planning */}
            <Route path="/planning" element={
              <AdminLayout allowedRoles={ALL_ADMIN_ROLES}>
                <Schedule />
              </AdminLayout>
            } />

            {/* Utilisateurs (admin uniquement) */}
            <Route path="/users" element={
              <AdminLayout allowedRoles={['admin']}>
                <UsersManagement />
              </AdminLayout>
            } />

            {/* Centre d'alertes & notifications */}
            <Route path="/alertes" element={
              <AdminLayout allowedRoles={ALL_ADMIN_ROLES}>
                <AlertsCenter />
              </AdminLayout>
            } />

            {/* Profil & Sécurité administrateur */}
            <Route path="/profil" element={
              <AdminLayout allowedRoles={ALL_ADMIN_ROLES}>
                <AdminProfile />
              </AdminLayout>
            } />

            {/* Page 404 Personnalisée */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

// ─── Point d'entrée de l'application ─────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
