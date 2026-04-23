import { Link } from "react-router-dom";

export default function SuperAdminDashboard() {
  return (
    <div>
      <h1>Super Admin Dashboard</h1>
          <p>Welcome to the Super Admin Dashboard! Here you can manage all aspects of the system.</p>
          <Link to="/create-user">Create User</Link>
    </div>
  );
}