import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuthContext";
type Props = {
  allowedRoles?: string[];
};

const ProtectedRoute = ({ allowedRoles }: Props) => {
    const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role || "")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
