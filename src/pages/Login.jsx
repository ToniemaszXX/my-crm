import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../languages/i18n';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      const sessionRes = await fetch(`${import.meta.env.VITE_API_URL}/auth/session_check.php`, {
        credentials: 'include'
      });

      const sessionData = await sessionRes.json();

      if (sessionData.success) {
        setUser(sessionData.user);

        if (data.language) {
          i18n.changeLanguage(data.language);
          localStorage.setItem('lang', data.language);
        }

        navigate('/');
      } else {
        setError('Wystąpił błąd sesji. Spróbuj ponownie.');
      }
    } else {
      setError('Nieprawidłowy login lub hasło.');
    }
  } catch (err) {
    console.error('Login error:', err);
    setError('Błąd połączenia z serwerem.');
  }
};


  return (
    <div className='flex justify-center items-center h-screen w-screen box-border bg-neutral-900'>
      <form onSubmit={handleSubmit} className='p-5 border-solid border-[1px] border-neutral-500 rounded-lg text-neutral-400 flex flex-col items-center'>
        <h2 className='mb-5 text-lg font-bold'>CRM ENGO Controls</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder={t('login')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
        </div>
        <button type="submit" className='buttonGreen'>{t('signin')}</button>
      </form>
    </div>
  );
}

export default Login;
