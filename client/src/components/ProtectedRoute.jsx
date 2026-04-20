import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="container flex-center" style={{ minHeight: '100vh' }}><h1>Loading...</h1></div>;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
