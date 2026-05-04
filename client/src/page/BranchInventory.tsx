import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../hooks/auth/useAuthContext";
import BranchStaffSubnav from "../component/BranchStaffSubnav";

type InventoryRow = {
  id: string;
  currentStock: string | number;
  minStockLevel: string | number;
  variant: {
    variantName: string;
    baseUnit: string;
    storeItem: { name: string };
  };
};

function formatQty(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "-");
  return n.toFixed(2);
}

export default function BranchInventory() {
  const { branchId } = useAuth();
  const [tab, setTab] = useState<"all" | "low">("all");

  const inventoryQuery = useQuery({
    queryKey: ["branchInventory", branchId],
    enabled: Boolean(branchId),
    queryFn: async () => {
      const res = await api.get(`/inventory/branches/${branchId}/inventory`);
      if (!res.data.success) throw new Error(res.data.message || "Failed to load inventory");
      return res.data.data as InventoryRow[];
    },
  });

  const lowStockQuery = useQuery({
    queryKey: ["branchLowStock", branchId],
    enabled: Boolean(branchId) && tab === "low",
    queryFn: async () => {
      const res = await api.get(`/inventory/branches/${branchId}/low-stock`);
      if (!res.data.success) throw new Error(res.data.message || "Failed to load low stock");
      return res.data.data as InventoryRow[];
    },
  });

  const sortedAll = useMemo(() => {
    const rows = inventoryQuery.data ?? [];
    return [...rows].sort((a, b) => {
      const an = `${a.variant.storeItem.name} ${a.variant.variantName}`;
      const bn = `${b.variant.storeItem.name} ${b.variant.variantName}`;
      return an.localeCompare(bn);
    });
  }, [inventoryQuery.data]);

  const activeRows = tab === "all" ? sortedAll : lowStockQuery.data ?? [];
  const activeLoading = tab === "all" ? inventoryQuery.isLoading : lowStockQuery.isLoading;
  const activeError = tab === "all" ? inventoryQuery.error : lowStockQuery.error;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BranchStaffSubnav />

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Branch inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          View stock levels and low-stock alerts for your branch.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            tab === "all"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
          }`}
        >
          All stock
        </button>
        <button
          type="button"
          onClick={() => setTab("low")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            tab === "low"
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-white text-gray-700 border-gray-200 hover:border-amber-300"
          }`}
        >
          Low stock
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        {activeLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : activeError ? (
          <p className="text-sm text-red-500">
            {activeError instanceof Error ? activeError.message : "Failed to load data"}
          </p>
        ) : activeRows.length === 0 ? (
          <p className="text-sm text-gray-500">
            {tab === "low" ? "No items are below minimum stock." : "No inventory records found."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Store item</th>
                  <th className="text-left px-3 py-2 border-b">Variant</th>
                  <th className="text-left px-3 py-2 border-b">Current stock</th>
                  <th className="text-left px-3 py-2 border-b">Min stock</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">{row.variant.storeItem.name}</td>
                    <td className="px-3 py-2">
                      {row.variant.variantName} ({row.variant.baseUnit})
                    </td>
                    <td className="px-3 py-2">{formatQty(row.currentStock)}</td>
                    <td className="px-3 py-2">{formatQty(row.minStockLevel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
