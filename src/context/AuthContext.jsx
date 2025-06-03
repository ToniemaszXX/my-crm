import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/session_check.php`);
        const data = await res.json();

        if (isMounted) {
          if (data.success) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Session check failed:', e);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession(); // sprawdź przy starcie

    const interval = setInterval(checkSession, 5 * 60 * 1000); // co 5 minut

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
