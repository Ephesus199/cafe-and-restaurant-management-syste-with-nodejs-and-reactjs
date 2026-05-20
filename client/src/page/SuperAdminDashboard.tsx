import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  DashboardCard,
  DashboardHeader,
  DashboardPage,
  DashboardTable,
  DashboardTableBody,
  DashboardTableHead,
  DashboardTabs,
  DashboardTd,
  DashboardTh,
  StatCard,
} from "../component/dashboard";

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
  const location = useLocation();
  console.log("SuperAdminDashboard - location:", location);
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

  const branches = getBranches.data ?? [];
  const activeBranchCount = branches.filter((b) => b.isActive).length;
  const inactiveBranchCount = branches.length - activeBranchCount;

  return (
    <DashboardPage>
      <DashboardHeader
        title="Company overview"
        description="Manage branches, monitor menu structure, and keep company-wide settings up to date."
        actions={
          <button
            type="button"
            onClick={() => navigate("/dashboard/create-branch")}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Create branch
          </button>
        }
      />

      <DashboardTabs
        tabs={[
          { id: "branches", label: "Branches" },
          { id: "menu", label: "Menu catalog" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "branches" ? (
        <>
          {getBranches.isLoading ? (
            <p className="text-sm text-gray-500">Loading branches...</p>
          ) : getBranches.isError ? (
            <p className="text-sm text-red-500">Failed to load branches.</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total branches" value={branches.length} tone="blue" />
                <StatCard label="Active branches" value={activeBranchCount} tone="green" />
                <StatCard label="Inactive branches" value={inactiveBranchCount} tone="amber" />
              </div>
              <DashboardCard title="Branch list" description="Toggle status, edit, or remove branches.">
                <DashboardTable>
                  <DashboardTableHead>
                    <tr>
                      <DashboardTh>Name</DashboardTh>
                      <DashboardTh>Address</DashboardTh>
                      <DashboardTh>Phone</DashboardTh>
                      <DashboardTh>Status</DashboardTh>
                      <DashboardTh>Privileges</DashboardTh>
                      <DashboardTh>Actions</DashboardTh>
                    </tr>
                  </DashboardTableHead>
                  <DashboardTableBody>
                  {branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50/80">
                      <DashboardTd className="font-semibold text-gray-900">{branch.name}</DashboardTd>
                      <DashboardTd>{branch.address || "-"}</DashboardTd>
                      <DashboardTd>{branch.phone || "-"}</DashboardTd>
                      <DashboardTd>
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
                      </DashboardTd>
                      <DashboardTd>{formatPrivileges(branch.bracnhPrivileges)}</DashboardTd>
                      <DashboardTd>
                        <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                          onClick={() =>
                            navigate(`/dashboard/branches/${branch.id}/update`, { state: { from: location.pathname } })
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pendingDeleteBranchId === branch.id}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
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
                        </div>
                      </DashboardTd>
                    </tr>
                  ))}
                  </DashboardTableBody>
                </DashboardTable>
              </DashboardCard>
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
                <StatCard label="Total categories" value={totalMainCategories} tone="blue" />
                <StatCard label="Total subcategories" value={totalSubcategories} tone="purple" />
                <StatCard label="Total menu items" value={totalItems} tone="green" />
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
    </DashboardPage>
  );
}