import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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

type MainCategory = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  name: string;
  mainCategory: {
    id: string;
    name: string;
  };
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  subcategory: {
    id: string;
    name: string;
  };
  mainCategory: {
    id: string;
    name: string;
  };
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"branches" | "menu">("branches");
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
    refetchInterval: 3000,
  });

  const getMainCategories = useQuery({
    queryKey: ["menu-main-categories"],
    enabled: activeTab === "menu",
    queryFn: async () => {
      const res = await api.get("/menu/categories");
      return res.data.data as MainCategory[];
    },
  });

  const getSubcategories = useQuery({
    queryKey: ["menu-subcategories"],
    enabled: activeTab === "menu",
    queryFn: async () => {
      const res = await api.get("/menu/subcategories");
      return res.data.data as Subcategory[];
    },
  });

  const getMenuItems = useQuery({
    queryKey: ["menu-items-summary"],
    enabled: activeTab === "menu",
    queryFn: async () => {
      const res = await api.get("/menu/items");
      return res.data.data as MenuItem[];
    },
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

  const categorySummary = useMemo(() => {
    const categories = getMainCategories.data ?? [];
    const subcategories = getSubcategories.data ?? [];
    const menuItems = getMenuItems.data ?? [];

    return categories.map((category) => {
      const subcategoriesInCategory = subcategories.filter(
        (subcategory) => subcategory.mainCategory.id === category.id,
      );
      const subcategoryIds = new Set(subcategoriesInCategory.map((sub) => sub.id));
      const itemsInCategory = menuItems.filter((item) =>
        subcategoryIds.has(item.subcategory.id),
      );

      return {
        id: category.id,
        name: category.name,
        subcategoryCount: subcategoriesInCategory.length,
        itemCount: itemsInCategory.length,
      };
    });
  }, [getMainCategories.data, getSubcategories.data, getMenuItems.data]);

  const subcategorySummary = useMemo(() => {
    const subcategories = getSubcategories.data ?? [];
    const menuItems = getMenuItems.data ?? [];

    return subcategories.map((subcategory) => {
      const itemsInSubcategory = menuItems.filter(
        (item) => item.subcategory.id === subcategory.id,
      );

      return {
        id: subcategory.id,
        name: subcategory.name,
        mainCategoryName: subcategory.mainCategory.name,
        itemCount: itemsInSubcategory.length,
      };
    });
  }, [getSubcategories.data, getMenuItems.data]);

  const totalMainCategories = getMainCategories.data?.length ?? 0;
  const totalSubcategories = getSubcategories.data?.length ?? 0;
  const totalItems = getMenuItems.data?.length ?? 0;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Super Admin Dashboard</h1>

      <div className="flex gap-3 border-b mb-6 pb-3">
        <button
          type="button"
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === "branches"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("branches")}
        >
          Branch Info
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === "menu"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("menu")}
        >
          Menu Info
        </button>
      </div>

      {activeTab === "branches" ? (
        <>
          {getBranches.isLoading ? (
            <div>Loading branches...</div>
          ) : getBranches.isError ? (
            <div>Failed to load branches.</div>
          ) : (
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
                      <td className="border border-gray-300 px-4 py-2">
                        {branch.address || "-"}
                      </td>
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
          )}
        </>
      ) : (
        <>
          {getMainCategories.isLoading || getSubcategories.isLoading || getMenuItems.isLoading ? (
            <div>Loading menu information...</div>
          ) : getMainCategories.isError || getSubcategories.isError || getMenuItems.isError ? (
            <div>Failed to load menu information.</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-700">Total Categories</p>
                  <p className="text-2xl font-bold text-blue-900">{totalMainCategories}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <p className="text-sm text-purple-700">Total Subcategories</p>
                  <p className="text-2xl font-bold text-purple-900">{totalSubcategories}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <p className="text-sm text-green-700">Total Menu Items</p>
                  <p className="text-2xl font-bold text-green-900">{totalItems}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Category Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Subcategories Count
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Total Items in Category
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorySummary.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{category.name}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {category.subcategoryCount}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">{category.itemCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Subcategory Breakdown</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Subcategory</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Parent Category
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          Total Items
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategorySummary.map((subcategory) => (
                        <tr key={subcategory.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{subcategory.name}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            {subcategory.mainCategoryName}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {subcategory.itemCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}