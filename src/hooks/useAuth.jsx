import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useAuth() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/session_check.php`);
        const data = await response.json();

        if (isMounted && !data.success) {
          navigate('/login');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Session validation failed:', error);
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession(); // initial check

    const interval = setInterval(checkSession, 5 * 60 * 1000); // co 5 minut
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate]);

  return loading;
}
