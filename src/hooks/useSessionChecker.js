import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useSessionChecker() {
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/session_check.php`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        alert('Sesja wygasła. Zaloguj się ponownie.');
        navigate('/login');
      }
    };

    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [navigate]);
}
