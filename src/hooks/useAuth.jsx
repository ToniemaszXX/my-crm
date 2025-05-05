import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useAuth() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session_check.php');
        const data = await response.json();

        if (!data.success) {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  return loading;
}
