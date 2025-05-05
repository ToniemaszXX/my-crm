import useAuth from "../hooks/useAuth";

function Visits() {

    const loading = useAuth();
    
        if (loading) {
            <p>Loading...</p>;
        }


    return <h1>Welcome to your CRM Visits</h1>;
  }
  
  export default Visits;
  