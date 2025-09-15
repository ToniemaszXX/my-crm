export const checkSessionBeforeSubmit = async () => {
  const url = `${import.meta.env.VITE_API_URL}/auth/session_check.php`;
  console.log('[checkSessionBeforeSubmit] Checking session', { url });
  const res = await fetch(url, {
    credentials: 'include'
  });

  if (res.status === 401) {
    console.warn('[checkSessionBeforeSubmit] 401 Unauthorized');
    alert('Sesja wygasła. Zaloguj się ponownie. Twoje dane nie zostały wysłane.');
    window.location.href = '/engo/CRM/login';
    return false;
  }

  console.log('[checkSessionBeforeSubmit] Session OK');
  return true;
};
