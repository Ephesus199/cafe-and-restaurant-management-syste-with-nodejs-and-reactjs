import { Link } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuthContext";

export default function SuperAdminDashboard() {
  const {user} = useAuth()
  return (
    <div>
      <h1>Super Admin Dashboard</h1>
          <p>Welcome to the Super Admin Dashboard! Here you can manage all aspects of the system.</p>
      <Link to="/create-user">Create User</Link>
      <Link to="/admin/create-branch">Create Branch</Link>
      <Link to={`/profile/${user?.id}`}>View Profile</Link>
    </div>
  );
}