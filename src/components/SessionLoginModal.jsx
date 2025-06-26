import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '../languages/i18n';

function SessionLoginModal({ onSuccess }) {
  const { t } = useTranslation();
  const { setUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginRes.json();

      if (!loginData.success) {
        setError(t('login.failed'));
        setLoading(false);
        return;
      }

      const sessionRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/session_check.php`, {
        credentials: 'include',
      });
      const sessionData = await sessionRes.json();

      if (sessionData.success) {
        setUser(sessionData.user);

        if (sessionData.user.language) {
          i18n.changeLanguage(sessionData.user.language);
          localStorage.setItem('lang', sessionData.user.language);
        }

        onSuccess(); // zamknij modal
      } else {
        setError(t('login.sessionFailed'));
      }
    } catch (err) {
      console.error('Session login error:', err);
      setError(t('login.serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-black p-6 rounded-lg shadow-lg w-[400px] max-w-full">
      <h2 className="text-lg font-bold mb-4 text-center">{t('session.expired')}</h2>

      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder={t('login')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full border p-2 rounded"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full buttonGreen"
        >
          {loading ? t('loading') : t('signin')}
        </button>
      </form>
    </div>
  );
}

export default SessionLoginModal;
