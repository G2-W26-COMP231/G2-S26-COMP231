import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Route guard for admin-only pages. Waits for the auth check to finish
 * loading first, then kicks non-logged-in users to /login and kicks
 * logged-in-but-not-admin users back to the dashboard.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="content-area muted">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}