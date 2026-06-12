import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.guest) {
    const loginPath = localStorage.getItem("dashboard_login_path") || "/login";
    return <Navigate to={loginPath} replace />;
  }

  if (role && user.role && user.role !== role) {
    return <Navigate to={user.role === "employee" ? "/employee/dashboard" : "/admin/dashboard"} replace />;
  }

  return children;
};

export default ProtectedRoute;
