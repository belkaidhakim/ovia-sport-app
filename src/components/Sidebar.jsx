import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ScanLine, LogOut, X, Shield, CalendarDays, UserPlus, Timer, ExternalLink, Waves, UserCheck, ShieldCheck, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { role } = useAuth();
  const location = useLocation();
  const [pendingInscriptionsCount, setPendingInscriptionsCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: pCount, error: pErr } = await supabase
          .from('inscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'EN_ATTENTE');
        if (!pErr && pCount !== null) {
          setPendingInscriptionsCount(pCount);
        }

        const { count: aCount, error: aErr } = await supabase
          .from('athletes')
          .select('*', { count: 'exact', head: true })
          .eq('est_actif', false);
        if (!aErr && aCount !== null) {
          setArchivedCount(aCount);
        }
      } catch {
        // Silently ignore if table doesn't exist yet
      }
    };
    if (['admin', 'secretaire'].includes(role)) {
      fetchCounts();
      const interval = setInterval(fetchCounts, 25000);
      return () => clearInterval(interval);
    }
  }, [role]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-overlay"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      <aside className={`sidebar ${isOpen ? 'open' : ''} no-print`}>
        <button 
          className="sidebar-close-btn"
          onClick={() => setIsOpen(false)}
        >
          <X size={22} />
        </button>
        <div className="sidebar-logo">
          <div style={{ 
            position: 'relative',
            width: '38px',
            height: '38px',
            flexShrink: 0
          }}>
            <img 
              src="/logo.jpg" 
              alt="Logo Ovia Sport" 
              style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '2px solid rgba(99, 102, 241, 0.3)'
              }} 
            />
            <div style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, var(--accent-primary), var(--accent-secondary), var(--accent-primary))',
              opacity: 0.15,
              filter: 'blur(4px)',
              zIndex: -1
            }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '0.04em' }}>OVIA</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', fontWeight: 600, letterSpacing: '0.15em', fontFamily: 'Outfit' }}>SPORT</span>
          </div>
        </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setIsOpen(false)}>
          <LayoutDashboard size={18} />
          <span>Tableau de bord</span>
        </NavLink>
        
        {['admin', 'secretaire', 'entraineur'].includes(role) && (
          <NavLink 
            to="/athletes" 
            className={() => (location.pathname === '/athletes' && !location.search.includes('tab=inscriptions')) ? "nav-item active" : "nav-item"} 
            onClick={() => setIsOpen(false)}
          >
            <Users size={18} />
            <span>Membres & Athlètes</span>
          </NavLink>
        )}

        {['admin', 'secretaire'].includes(role) && (
          <NavLink 
            to="/athletes?tab=inscriptions" 
            className={() => (location.pathname === '/athletes' && location.search.includes('tab=inscriptions')) ? "nav-item active" : "nav-item"} 
            onClick={() => setIsOpen(false)}
          >
            <UserCheck size={18} />
            <span>Inscriptions en attente</span>
            {pendingInscriptionsCount > 0 && (
              <span 
                style={{ marginLeft: 'auto', backgroundColor: '#f59e0b', color: '#000', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '10px' }}
                title={`${pendingInscriptionsCount} inscription(s) en attente`}
              >
                {pendingInscriptionsCount}
              </span>
            )}
          </NavLink>
        )}

        {['admin', 'secretaire', 'entraineur'].includes(role) && (
          <NavLink to="/performances" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setIsOpen(false)}>
            <Timer size={18} />
            <span>Performances & Chronos</span>
          </NavLink>
        )}

        {['admin', 'secretaire'].includes(role) && (
          <NavLink to="/finances" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setIsOpen(false)}>
            <CreditCard size={18} />
            <span>Finances</span>
          </NavLink>
        )}
        {['admin', 'secretaire'].includes(role) && (
          <NavLink to="/groupes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setIsOpen(false)}>
            <Users size={18} />
            <span>Groupes (Niveaux)</span>
          </NavLink>
        )}
        {['admin', 'secretaire', 'entraineur'].includes(role) && (
          <NavLink to="/assurances" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setIsOpen(false)}>
            <ShieldCheck size={18} />
            <span>Assurances</span>
          </NavLink>
        )}
        {['admin', 'secretaire'].includes(role) && (
          <NavLink to="/archives" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setIsOpen(false)}>
            <Archive size={18} />
            <span>Archives Membres</span>
            {archivedCount > 0 && (
              <span 
                style={{ marginLeft: 'auto', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                title={`${archivedCount} membre(s) archivé(s)`}
              >
                {archivedCount}
              </span>
            )}
          </NavLink>
        )}
        {['admin', 'secretaire', 'entraineur'].includes(role) && (
          <NavLink to="/planning" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setIsOpen(false)}>
            <CalendarDays size={18} />
            <span>Planning & Bassins</span>
          </NavLink>
        )}
        {['admin'].includes(role) && (
          <NavLink to="/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setIsOpen(false)}>
            <Shield size={18} />
            <span>Équipe (Rôles)</span>
          </NavLink>
        )}

        <div style={{ margin: '1.5rem 1rem 0.5rem', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>
          Outils & Accès Publics
        </div>
        <NavLink to="/scanner" target="_blank" className="nav-item" onClick={() => setIsOpen(false)}>
          <ScanLine size={18} />
          <span>Scanner QR</span>
        </NavLink>
        <a href="/inscription" target="_blank" rel="noreferrer" className="nav-item" onClick={() => setIsOpen(false)}>
          <UserPlus size={18} />
          <span>Formulaire Inscription</span>
          <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
        </a>
        <a href="/espace-adherent" target="_blank" rel="noreferrer" className="nav-item" onClick={() => setIsOpen(false)}>
          <Waves size={18} />
          <span>Espace Adhérent</span>
          <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.6 }} />
        </a>

        <div style={{ flex: 1 }}></div>
        
        <motion.button 
          whileHover={{ x: 3, backgroundColor: 'rgba(244, 63, 94, 0.08)' }}
          whileTap={{ scale: 0.97 }}
          className="nav-item" 
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--accent-danger)', marginTop: 'auto', marginBottom: '0.5rem' }}
          onClick={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              toast.error('Erreur lors de la déconnexion');
            } else {
              toast.success('Déconnecté');
            }
          }}
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </motion.button>
      </nav>
    </aside>
    </>
  );
}
