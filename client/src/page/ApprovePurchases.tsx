import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../hooks/auth/useAuthContext";

type Purchase = {
  id: string;
  status: string;
  purchaseDate: string;
  quantityPurchased: string | number;
  unitPrice: string | number;
  totalCost: string | number;
  invoiceNumber: string | null;
  supplier: { supplierName: string } | null;
  variant: {
    variantName: string;
    baseUnit: string;
    storeItem: { name: string };
  };
  purchasedByUser: { fullName: string | null; username: string };
};

function formatMoney(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(2);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function ApprovePurchases() {
  const { branchId } = useAuth();
  const queryClient = useQueryClient();
  const [approvingPurchaseId, setApprovingPurchaseId] = useState<string | null>(null);

  const purchasesQuery = useQuery({
    queryKey: ["branchPurchaseApprovals", branchId],
    enabled: Boolean(branchId),
    queryFn: async () => {
      const res = await api.get(`/inventory/branches/${branchId}/purchases`);
      if (!res.data.success) throw new Error(res.data.message || "Failed to load purchases");
      return res.data.data as Purchase[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      const res = await api.patch(`/inventory/purchases/${purchaseId}/approve`);
      if (!res.data.success) throw new Error(res.data.message || "Failed to approve purchase");
      return res.data.data as { id: string; status?: string };
    },
    onMutate: (purchaseId) => {
      setApprovingPurchaseId(purchaseId);
    },
    onSuccess: (updatedPurchase, purchaseId) => {
      if (!branchId) return;

      const nextStatus =
        typeof updatedPurchase?.status === "string" ? updatedPurchase.status : "approved";

      queryClient.setQueryData<Purchase[]>(["branchPurchaseApprovals", branchId], (old) =>
        old?.map((p) =>
          p.id === purchaseId ? { ...p, status: nextStatus } : p,
        ),
      );

      void queryClient.invalidateQueries({
        queryKey: ["branchPurchaseApprovals", branchId],
      });
    },
    onSettled: () => {
      setApprovingPurchaseId(null);
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Purchase Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and approve pending purchases for your branch.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        {purchasesQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading purchases...</p>
        ) : purchasesQuery.error ? (
          <p className="text-sm text-red-500">
            Failed to load purchases:{" "}
            {purchasesQuery.error instanceof Error ? purchasesQuery.error.message : "Unknown error"}
          </p>
        ) : !purchasesQuery.data || purchasesQuery.data.length === 0 ? (
          <p className="text-sm text-gray-500">No purchases found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Store Item</th>
                  <th className="text-left px-3 py-2 border-b">Variant</th>
                  <th className="text-left px-3 py-2 border-b">Quantity</th>
                  <th className="text-left px-3 py-2 border-b">Unit Price</th>
                  <th className="text-left px-3 py-2 border-b">Total Cost</th>
                  <th className="text-left px-3 py-2 border-b">Supplier</th>
                  <th className="text-left px-3 py-2 border-b">Requested By</th>
                  <th className="text-left px-3 py-2 border-b">Date</th>
                  <th className="text-left px-3 py-2 border-b">Status</th>
                  <th className="text-left px-3 py-2 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {purchasesQuery.data.map((purchase) => (
                  <tr key={purchase.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">{purchase.variant.storeItem.name}</td>
                    <td className="px-3 py-2">
                      {purchase.variant.variantName} ({purchase.variant.baseUnit})
                    </td>
                    <td className="px-3 py-2">{Number(purchase.quantityPurchased)}</td>
                    <td className="px-3 py-2">{formatMoney(purchase.unitPrice)}</td>
                    <td className="px-3 py-2">{formatMoney(purchase.totalCost)}</td>
                    <td className="px-3 py-2">{purchase.supplier?.supplierName || "-"}</td>
                    <td className="px-3 py-2">
                      {purchase.purchasedByUser.fullName || purchase.purchasedByUser.username}
                    </td>
                    <td className="px-3 py-2">{formatDate(purchase.purchaseDate)}</td>
                    <td className="px-3 py-2">{purchase.status}</td>
                    <td className="px-3 py-2">
                      {purchase.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => approveMutation.mutate(purchase.id)}
                          disabled={approvingPurchaseId === purchase.id}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {approvingPurchaseId === purchase.id ? (
                            <>
                              <span
                                className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"
                                aria-hidden
                              />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <span>Approve</span>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
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
