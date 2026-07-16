import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="content-area muted">Loading...</div>;

  // not logged in -> bounce to login, but save where we were headed
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return children;
}
