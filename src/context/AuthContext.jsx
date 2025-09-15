import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/session_check.php`, {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-store' }
        });
        const data = await res.json();
        if (!isMounted) return;
        setUser(data.success ? data.user : null);
      } catch (e) {
        console.error('Session check failed:', e);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkSession();
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // publiczna funkcja do ręcznego odświeżenia (po reauth w modalu)
  async function refreshSession() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/session_check.php`, {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-store' }
      });
      const data = await res.json();
      setUser(data.success ? data.user : null);
    } catch (e) {
      console.error('refreshSession failed:', e);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
