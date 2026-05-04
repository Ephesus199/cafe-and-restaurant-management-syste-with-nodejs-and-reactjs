import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../hooks/auth/useAuthContext";

type Branch = { id: string; name: string };
type User = { id: string; fullName: string | null; role: string; branchId: string | null };

type Order = {
  id: string;
  orderNumber: string | null;
  tableNumber: string | null;
  totalAmount: number | null;
  createdAt: string;
  status: string;
  paymentStatus: string;
  waiter: { id: string; fullName: string | null };
  cashier: { fullName: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    menuItem: { id: string; name: string; price: number | null };
  }>;
};

function getLocalISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getISOWeekString(d: Date) {
  // ISO week date based on Thursday rule.
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);

  // Mon=0 ... Sun=6
  const dayNum = (date.getDay() + 6) % 7;
  // Move to Thursday
  date.setDate(date.getDate() - dayNum + 3);
  const isoYear = date.getFullYear();

  const firstThursday = new Date(isoYear, 0, 4);
  const firstDayNum = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNum + 3);

  const diffDays = Math.round((date.getTime() - firstThursday.getTime()) / (24 * 3600 * 1000));
  const isoWeek = 1 + Math.floor(diffDays / 7);

  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${isoYear}-W${pad2(isoWeek)}`;
}

function isoWeekToLocalISODate(weekValue: string) {
  // Expected format: YYYY-Www
  const match = weekValue.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return getLocalISODate(new Date());
  const isoYear = Number(match[1]);
  const isoWeek = Number(match[2]);

  // Week 1 contains Jan 4; use Monday of week 1 and add weeks.
  const fourthJan = new Date(isoYear, 0, 4);
  const dayOfWeek = (fourthJan.getDay() + 6) % 7; // Mon=0..Sun=6
  const mondayWeek1 = new Date(fourthJan);
  mondayWeek1.setDate(fourthJan.getDate() - dayOfWeek);
  mondayWeek1.setDate(mondayWeek1.getDate() + (isoWeek - 1) * 7);
  return getLocalISODate(mondayWeek1);
}

function monthValueToLocalISODate(monthValue: string) {
  // Expected format: YYYY-MM
  const match = monthValue.match(/^(\d{4})-(\d{2})$/);
  if (!match) return getLocalISODate(new Date());
  const year = match[1];
  const month = match[2];
  return `${year}-${month}-01`;
}

function formatMoney(value: unknown) {
  const n = typeof value === "string" ? Number(value) : Number(value);
  if (!Number.isFinite(n)) return value === null || value === undefined ? "-" : String(value);
  return n.toFixed(2);
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function ViewOrders() {
  const { user } = useAuth();
  const role = user?.role;
  const queryClient = useQueryClient();

  const today = useMemo(() => getLocalISODate(new Date()), []);
  const isWaiter = role === "waiter";
  const isChef = role === "chef";
  const isBranchRole = role === "branch_admin" || role === "cashier";
  const isSuperAdmin = role === "super_admin";
  const isTodayOnlyRole = isWaiter || isChef;

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>("");
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  const effectiveBranchId = isSuperAdmin ? selectedBranchId : user?.branchId ?? "";

  const [dayReferenceDate, setDayReferenceDate] = useState<string>(today);
  const [weekValue, setWeekValue] = useState<string>(() => getISOWeekString(new Date()));
  const [monthValue, setMonthValue] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });

  const { data: branchesData, isLoading: isBranchesLoading } = useQuery({
    queryKey: ["branches"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await api.get("/branches");
      if (!res.data.success) throw new Error(res.data.message || "Failed to load branches");
      return res.data.data as Branch[];
    },

    refetchInterval:3000,
  });

  console.log("Branches data:", branchesData);
  

  const { data: waitersData, isLoading: isWaitersLoading } = useQuery({
    queryKey: ["waiters", effectiveBranchId],
    enabled: isBranchRole || (isSuperAdmin && Boolean(selectedBranchId)),
    queryFn: async () => {
      const res = await api.get("/users/waiters", {
        params:
          isSuperAdmin && effectiveBranchId
            ? { branchId: effectiveBranchId }
            : undefined,
      });
      if (!res.data.success) throw new Error(res.data.message || "Failed to load waiters");
      return res.data.data as User[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await api.patch(`/orders/orders/${orderId}/status`, { status });
      if (!res.data.success) throw new Error(res.data.message || "Failed to update status");
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders_view"] });
    },
  });

  const ordersQuery = useQuery({
    queryKey: [
      "orders_view",
      role,
      effectiveBranchId,
      selectedWaiterId,
      period,
      isTodayOnlyRole ? today : period === "day" ? dayReferenceDate : period === "week" ? isoWeekToLocalISODate(weekValue) : monthValueToLocalISODate(monthValue),
    ],
    enabled: Boolean(user),
    queryFn: async () => {
      const dateParam = isTodayOnlyRole
        ? today
        : period === "day"
          ? dayReferenceDate
          : period === "week"
            ? isoWeekToLocalISODate(weekValue)
            : monthValueToLocalISODate(monthValue);

      const res = await api.get("/orders/view", {
        params: {
          period: isTodayOnlyRole ? "day" : period,
          date: dateParam,
          ...(isWaiter ? {} : selectedWaiterId ? { waiterId: selectedWaiterId } : {}),
          ...(isSuperAdmin && effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        },
      });
      if (!res.data.success) throw new Error(res.data.message || "Failed to fetch orders");
      return res.data.data as Order[];
    },
  });
  const totalAmount = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    return orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  }, [ordersQuery.data]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">View Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Role-based order table with filters and status updates.</p>
      </div>

      {!isTodayOnlyRole && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
              {isBranchesLoading ? (
                <p className="text-sm text-gray-500">Loading branches...</p>
              ) : (
                <select
                  value={selectedBranchId}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    setSelectedWaiterId("");
                  }}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                >
                  <option value="">All branches</option>
                  {(branchesData || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {(isSuperAdmin || isBranchRole) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Waiter</label>
              {isWaitersLoading ? (
                <p className="text-sm text-gray-500">Loading waiters...</p>
              ) : (
                <select
                  value={selectedWaiterId}
                  onChange={(e) => setSelectedWaiterId(e.target.value)}
                  disabled={isSuperAdmin && !selectedBranchId}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white disabled:bg-gray-100"
                >
                  <option value="">All waiters</option>
                  {(waitersData || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.fullName || w.id}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")}
              className="w-full border border-gray-300 rounded-lg p-3 bg-white"
            >
              <option value="day">Per Day</option>
              <option value="week">Per Week</option>
              <option value="month">Per Month</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reference</label>
            {period === "day" ? (
              <input
                type="date"
                value={dayReferenceDate}
                onChange={(e) => setDayReferenceDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white"
              />
            ) : period === "week" ? (
              <input
                type="week"
                value={weekValue}
                onChange={(e) => setWeekValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white"
              />
            ) : (
              <input
                type="month"
                value={monthValue}
                onChange={(e) => setMonthValue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white"
              />
            )}
          </div>
        </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Orders</h2>
          <span className="text-xs text-gray-500">{ordersQuery.data?.length || 0} order(s)</span>
        </div>
        {!isChef && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm text-blue-800 font-semibold">Total amount: {formatMoney(totalAmount)}</p>
          </div>
        )}

        {ordersQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading orders...</p>
        ) : ordersQuery.error ? (
          <p className="text-sm text-red-500">
            Failed to load orders: {ordersQuery.error instanceof Error ? ordersQuery.error.message : "Unknown error"}
          </p>
        ) : ordersQuery.data && ordersQuery.data.length === 0 ? (
          <p className="text-sm text-gray-500">No orders found for the selected criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Order</th>
                  <th className="text-left px-3 py-2 border-b">Order Items</th>
                  {!isChef && <th className="text-left px-3 py-2 border-b">Total Price</th>}
                  <th className="text-left px-3 py-2 border-b">Order Status</th>
                  <th className="text-left px-3 py-2 border-b">Waiter Name</th>
                  <th className="text-left px-3 py-2 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {ordersQuery.data?.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 align-top">
                      <div className="font-semibold">
                        {order.orderNumber ? `#${order.orderNumber}` : order.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {order.items.map((item) => `${item.quantity}x ${item.menuItem.name}`).join(", ")}
                    </td>
                    {!isChef && <td className="px-3 py-2 align-top">{formatMoney(order.totalAmount)}</td>}
                    <td className="px-3 py-2 align-top">{order.status}</td>
                    <td className="px-3 py-2 align-top">{order.waiter?.fullName || "-"}</td>
                    <td className="px-3 py-2 align-top">
                      {isChef && order.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "preparing" })}
                            className="px-2 py-1 text-xs rounded bg-yellow-600 text-white"
                          >
                            Preparing
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "ready" })}
                            className="px-2 py-1 text-xs rounded bg-blue-600 text-white"
                          >
                            Ready
                          </button>
                        </div>
                      )}
                      {isWaiter && order.status === "ready" && (
                        <button
                          type="button"
                          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: "served" })}
                          className="px-2 py-1 text-xs rounded bg-green-700 text-white"
                        >
                          Mark Served
                        </button>
                      )}
                      {!((isChef && order.status === "pending") || (isWaiter && order.status === "ready")) && (
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

