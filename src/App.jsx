import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useRegisterSW } from 'virtual:pwa-register/react';
import ClubProAppShell from './components/ClubProAppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { lazyRetry } from './utils/lazyRetry';

// Lazy load pages avec reprise automatique lors des déploiements (évite les erreurs de hash périmé)
const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const AthletesList = lazyRetry(() => import('./pages/AthletesList'));
const AthleteForm = lazyRetry(() => import('./pages/AthleteForm'));
const FinancialDashboard = lazyRetry(() => import('./pages/FinancialDashboard'));
const Scanner = lazyRetry(() => import('./pages/Scanner'));
const Login = lazyRetry(() => import('./pages/Login'));
const ResetPassword = lazyRetry(() => import('./pages/ResetPassword'));
const UpdatePassword = lazyRetry(() => import('./pages/UpdatePassword'));
const UsersManagement = lazyRetry(() => import('./pages/UsersManagement'));
const GroupsManagement = lazyRetry(() => import('./pages/GroupsManagement'));
const PublicRegistration = lazyRetry(() => import('./pages/PublicRegistration'));
const LandingPage = lazyRetry(() => import('./pages/LandingPage'));
const MemberPortal = lazyRetry(() => import('./pages/MemberPortal'));
const Schedule = lazyRetry(() => import('./pages/Schedule'));
const SportsTracking = lazyRetry(() => import('./pages/SportsTracking'));
const InsuranceManagement = lazyRetry(() => import('./pages/InsuranceManagement'));
const ArchivesManagement = lazyRetry(() => import('./pages/ArchivesManagement'));
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { session, role, loading } = useAuth();
  
  if (loading) return null; // Avoid flicker

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />; // Redirect if not authorized
  }

  return children;
}

function AppLayout({ children }) {
  return (
    <ClubProAppShell>
      {children}
    </ClubProAppShell>
  );
}

function AppRoutes() {
  const { session, loading } = useAuth();
  
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  });

  // Gérer l'alerte de mise à jour
  React.useEffect(() => {
    if (needRefresh) {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <span>Nouvelle version disponible !</span>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                updateServiceWorker(true);
                toast.dismiss(t.id);
              }}
            >
              Mettre à jour
            </button>
          </div>
        ),
        { duration: Infinity, position: 'bottom-right' }
      );
    }
  }, [needRefresh, updateServiceWorker]);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Chargement...</div>;
  }

  return (
    <Router>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { 
            background: 'rgba(30, 41, 59, 0.8)', 
            backdropFilter: 'blur(12px)',
            color: '#fff', 
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '16px'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#fff' } }
        }} 
      />
      <ErrorBoundary>
        <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Chargement de la page...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/admin" element={<Navigate to="/login" replace />} />
            <Route path="/reset-password" element={session ? <Navigate to="/dashboard" replace /> : <ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            
            {/* Public routes without sidebar */}
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/espace-membre" element={<MemberPortal />} />
            <Route path="/espace-adherent" element={<MemberPortal />} />
            <Route path="/adherent" element={<MemberPortal />} />
            <Route path="/inscription" element={<PublicRegistration />} />
            <Route path="/inscriptions" element={<PublicRegistration />} />
            <Route path="/preinscription" element={<PublicRegistration />} />
            <Route path="/pre-inscription" element={<PublicRegistration />} />
            <Route path="/adhesion" element={<PublicRegistration />} />
            
            {/* Admin routes with layout */}
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            
            <Route path="/inscriptions-en-attente" element={<Navigate to="/athletes?tab=inscriptions" replace />} />
            <Route path="/admin/inscriptions" element={<Navigate to="/athletes?tab=inscriptions" replace />} />
            <Route path="/inscriptions-admin" element={<Navigate to="/athletes?tab=inscriptions" replace />} />

            <Route path="/athletes" element={<ProtectedRoute allowedRoles={['admin', 'secretaire', 'entraineur']}><AppLayout><AthletesList /></AppLayout></ProtectedRoute>} />
            <Route path="/athletes/new" element={<ProtectedRoute allowedRoles={['admin', 'secretaire']}><AppLayout><AthleteForm /></AppLayout></ProtectedRoute>} />
            <Route path="/athletes/edit/:id" element={<ProtectedRoute allowedRoles={['admin', 'secretaire']}><AppLayout><AthleteForm /></AppLayout></ProtectedRoute>} />
            <Route path="/athletes/:id" element={<ProtectedRoute allowedRoles={['admin', 'secretaire']}><AppLayout><AthleteForm /></AppLayout></ProtectedRoute>} />
            
            <Route path="/performances" element={<ProtectedRoute allowedRoles={['admin', 'secretaire', 'entraineur']}><AppLayout><SportsTracking /></AppLayout></ProtectedRoute>} />
            <Route path="/suivi-sportif" element={<ProtectedRoute allowedRoles={['admin', 'secretaire', 'entraineur']}><AppLayout><SportsTracking /></AppLayout></ProtectedRoute>} />
            
            <Route path="/finances" element={<ProtectedRoute allowedRoles={['admin', 'secretaire']}><AppLayout><FinancialDashboard /></AppLayout></ProtectedRoute>} />
            
            <Route path="/groupes" element={<ProtectedRoute allowedRoles={['admin', 'secretaire']}><AppLayout><GroupsManagement /></AppLayout></ProtectedRoute>} />
            
            <Route path="/assurances" element={<ProtectedRoute allowedRoles={['admin', 'secretaire', 'entraineur']}><AppLayout><InsuranceManagement /></AppLayout></ProtectedRoute>} />
            <Route path="/assurance" element={<Navigate to="/assurances" replace />} />
            
            <Route path="/archives" element={<ProtectedRoute allowedRoles={['admin', 'secretaire']}><AppLayout><ArchivesManagement /></AppLayout></ProtectedRoute>} />
            <Route path="/archive" element={<Navigate to="/archives" replace />} />
            
            <Route path="/planning" element={<ProtectedRoute allowedRoles={['admin', 'secretaire', 'entraineur']}><AppLayout><Schedule /></AppLayout></ProtectedRoute>} />
            
            <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><UsersManagement /></AppLayout></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
