import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuthContext";
import api from "../api/axios";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function SuperAdminDashboard() {
  const { user } = useAuth()
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const getBranches = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches");
      if (!res.data.success) {
        throw new Error(res.data.message);
      }
      return res.data.data;
    }
  });

  const handleBranchSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value);
    const branchId = e.target.value;
    if (branchId) {
      navigate(`/branches/${branchId}/update`);
    }
  };

  return (
    <div>
      <h1>Super Admin Dashboard</h1>
          <p>Welcome to the Super Admin Dashboard! Here you can manage all aspects of the system.</p>
      <Link to="/create-user">Create User</Link>
      <Link to="/admin/create-branch">Create Branch</Link>
      <Link to={`/profile/${user?.id}`}>View Profile</Link>
      <Link to="/admin/create-main-category">Create Main Category</Link>
      <Link to="/admin/create-sub-category">Create Sub-Category</Link>
      <select value={value} onChange={handleBranchSelect}>
        <option value="">Update Branch</option>
        {
          getBranches.data?.map((branch: { id: string; name: string }) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))
        }
      </select>
    </div>
  );
}