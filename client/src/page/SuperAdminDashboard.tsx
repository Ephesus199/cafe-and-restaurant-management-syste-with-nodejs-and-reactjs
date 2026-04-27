import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
  const queryClient = useQueryClient();
  const [pendingToggleBranchId, setPendingToggleBranchId] = useState<string | null>(
    null,
  );
  const [pendingDeleteBranchId, setPendingDeleteBranchId] = useState<string | null>(
    null,
  );
  const getBranches = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches");
      if (!res.data.success) {
        throw new Error(res.data.message);
      }
      return res.data.data as Branch[];
    },
    refetchInterval:3000
  });

  const toggleBranchStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.put(`/branches/${id}`, { isActive });
    },
    onMutate: async ({ id, isActive }) => {
      setPendingToggleBranchId(id);
      await queryClient.cancelQueries({ queryKey: ["branches"] });

      const previousBranches = queryClient.getQueryData<Branch[]>(["branches"]);
      queryClient.setQueryData<Branch[]>(["branches"], (oldBranches = []) =>
        oldBranches.map((branch) =>
          branch.id === id ? { ...branch, isActive } : branch,
        ),
      );

      return { previousBranches };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(["branches"], context.previousBranches);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onSettled: () => {
      setPendingToggleBranchId(null);
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/branches/${id}`);
    },
    onMutate: async (id) => {
      setPendingDeleteBranchId(id);
      await queryClient.cancelQueries({ queryKey: ["branches"] });

      const previousBranches = queryClient.getQueryData<Branch[]>(["branches"]);
      queryClient.setQueryData<Branch[]>(["branches"], (oldBranches = []) =>
        oldBranches.filter((branch) => branch.id !== id),
      );

      return { previousBranches };
    },
    onError: (_error, _id, context) => {
      if (context?.previousBranches) {
        queryClient.setQueryData(["branches"], context.previousBranches);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
    onSettled: () => {
      setPendingDeleteBranchId(null);
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
              <th className="border border-gray-300 px-4 py-2 text-left">Delete</th>
            </tr>
          </thead>
          <tbody>
            {getBranches.data?.map((branch) => (
              <tr key={branch.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{branch.name}</td>
                <td className="border border-gray-300 px-4 py-2">{branch.address || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">{branch.phone || "-"}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {(() => {
                    const isCurrentTogglePending = pendingToggleBranchId === branch.id;

                    return (
                  <button
                    type="button"
                    disabled={isCurrentTogglePending}
                    className={`px-3 py-1 rounded text-white ${
                      branch.isActive
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-500 hover:bg-gray-600"
                    } disabled:opacity-60`}
                    onClick={() =>
                      toggleBranchStatusMutation.mutate({
                        id: branch.id,
                        isActive: !branch.isActive,
                      })
                    }
                  >
                    {isCurrentTogglePending
                      ? "Updating..."
                      : branch.isActive
                        ? "Active"
                        : "Inactive"}
                  </button>
                    );
                  })()}
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
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    type="button"
                    disabled={pendingDeleteBranchId === branch.id}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded disabled:opacity-60"
                    onClick={() => {
                      const shouldDelete = window.confirm(
                        `Are you sure you want to delete ${branch.name}?`,
                      );
                      if (!shouldDelete) return;
                      deleteBranchMutation.mutate(branch.id);
                    }}
                  >
                    {pendingDeleteBranchId === branch.id ? "Deleting..." : "Delete"}
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