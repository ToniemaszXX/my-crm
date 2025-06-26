export const checkSessionBeforeSubmit = async () => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/session_check.php`, {
    credentials: 'include'
  });

  if (res.status === 401) {
    alert('Sesja wygasła. Zaloguj się ponownie. Twoje dane nie zostały wysłane.');
    window.location.href = '/engo/CRM/login';
    return false;
  }

  return true;
};
