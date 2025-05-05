import useAuth from '../hooks/useAuth';

function Dashboard() {

    const loading = useAuth();

    if (loading) {
        return <p>Loading...</p>;
    }

    return <h1>Welcome to your CRM Dashboard</h1>;
  }
  
  export default Dashboard;
  