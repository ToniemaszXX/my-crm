import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        const logout = async () => {
            await fetch('api/auth/logout.php');
            navigate('/login');
        };

        logout();
    }, [navigate]);

    return <p>Logging out...</p>;
}

export default Logout;