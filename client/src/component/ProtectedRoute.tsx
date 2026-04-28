import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuthContext";


interface ProtectedRouteProps {
  allowedRoles: string[];
  /** When true, renders an inline "no permission" message instead of redirecting */
  showUnauthorized?: boolean;
}

export default function ProtectedRoute({
  allowedRoles,
  showUnauthorized = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth(); // adjust to your auth context shape

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Not logged in at all → send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = allowedRoles.includes(user.role);

  if (!hasRole) {
    // Inside the dashboard layout → show inline message so the shell stays visible
    if (showUnauthorized) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
          <div className="text-5xl">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-gray-500 max-w-sm">
            You don&apos;t have permission to view this page. Please contact
            your administrator if you think this is a mistake.
          </p>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Your role: <strong>{user.role}</strong>
          </span>
        </div>
      );
    }

    // Outside the layout → redirect to their own dashboard root
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
