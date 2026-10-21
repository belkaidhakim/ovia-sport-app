/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ROLES } from '../config/constants';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin', 'secretaire', 'entraineur'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setLoading(false);
        }
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        // Ne jamais accorder de rôle par défaut — rediriger vers login
        console.error('[AuthContext] Profil utilisateur introuvable:', error.message);
        setRole(null);
      } else {
        // Valider que le rôle est connu, sinon null
        const knownRoles = Object.values(ROLES);
        const userRole = data?.role;
        setRole(knownRoles.includes(userRole) ? userRole : null);
      }
    } catch (err) {
      console.error('[AuthContext] Erreur fetchUserRole:', err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    setRole(null);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    role,
    loading,
    signOut,
    /** Vérifie si l'utilisateur possède un des rôles donnés */
    hasRole: (roles) => Array.isArray(roles) ? roles.includes(role) : role === roles,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
