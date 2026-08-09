import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Route guard for any page that requires being logged in. Waits for the
 * initial auth check to finish before deciding, so it doesn't flash a
 * redirect to /login for a split second while the session is still being
 * verified.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="content-area muted">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}