import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useQuery } from "@tanstack/react-query";

type BranchPrivileges = {
  canEditName: boolean;
  canEditPrice: boolean;
  canEditImage: boolean;
  canEditDescription: boolean;
  canEditCalories: boolean;
  canEditPreparationTime: boolean;
};

type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  bracnhPrivileges?: BranchPrivileges[];
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const getBranches = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches");
      if (!res.data.success) {
        throw new Error(res.data.message);
      }
      return res.data.data as Branch[];
    },
  });

  const formatPrivileges = (privileges?: BranchPrivileges[]) => {
    const branchPrivilege = privileges?.[0];
    if (!branchPrivilege) return "No privileges";
    const enabledPrivileges: string[] = [];

    if (branchPrivilege.canEditName) enabledPrivileges.push("Name");
    if (branchPrivilege.canEditPrice) enabledPrivileges.push("Price");
    if (branchPrivilege.canEditImage) enabledPrivileges.push("Image");
    if (branchPrivilege.canEditDescription) enabledPrivileges.push("Description");
    if (branchPrivilege.canEditCalories) enabledPrivileges.push("Calories");
    if (branchPrivilege.canEditPreparationTime) {
      enabledPrivileges.push("Preparation Time");
    }

    return enabledPrivileges.join(", ") || "No privileges";
  };

  if (getBranches.isLoading) {
    return <div>Loading branches...</div>;
  }

  if (getBranches.isError) {
    return <div>Failed to load branches.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Branches</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Address</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Active</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Privileges</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Edit</th>
            </tr>
          </thead>
          <tbody>
            {getBranches.data?.map((branch) => (
              <tr key={branch.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{branch.name}</td>
                <td className="border border-gray-300 px-4 py-2">{branch.address || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">{branch.phone || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {branch.isActive ? "Yes" : "No"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {formatPrivileges(branch.bracnhPrivileges)}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    type="button"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    onClick={() =>
                      navigate(`/admin/dashboard/branches/${branch.id}/update`)
                    }
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
   </div>
  );
}