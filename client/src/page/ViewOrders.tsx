import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../hooks/auth/useAuthContext";

type Branch = { id: string; name: string };
type User = { id: string; fullName: string | null; role: string; branchId: string | null };

type Order = {
  id: string;
  orderNumber: string | null;
  tableNumber: string | null;
  totalAmount: any;
  createdAt: string;
  status: string;
  paymentStatus: string;
  waiter: { fullName: string | null };
  cashier: { fullName: string | null } | null;
  items: Array<{
    id: string;
    quantity: number;
    menuItem: { id: string; name: string; price: any };
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

  const today = useMemo(() => getLocalISODate(new Date()), []);
  const isWaiter = role === "waiter";
  const isBranchAdmin = role === "branch_admin" || role === "cashier";
  const isSuperAdmin = role === "super_admin";

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>("");
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  const effectiveBranchId = isSuperAdmin ? selectedBranchId : user?.branchId ?? "";
  const effectiveWaiterId = isWaiter ? user?.id ?? "" : selectedWaiterId;

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
  });

  const { data: waitersData, isLoading: isWaitersLoading } = useQuery({
    queryKey: ["waiters", effectiveBranchId],
    enabled: isBranchAdmin || (isSuperAdmin && Boolean(selectedBranchId)),
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

  // Auto-select the first waiter for a smoother UX.
  // This keeps cashier/branch_admin behavior aligned: once waiters load, orders can load immediately.
  useEffect(() => {
    if (isWaitersLoading) return;
    if (!waitersData || waitersData.length === 0) return;
    if (selectedWaiterId) return;
    if (isBranchAdmin) {
      setSelectedWaiterId(waitersData[0].id);
    }
    if (isSuperAdmin && selectedBranchId) {
      setSelectedWaiterId(waitersData[0].id);
    }
  }, [
    isWaitersLoading,
    waitersData,
    selectedWaiterId,
    isBranchAdmin,
    isSuperAdmin,
    selectedBranchId,
  ]);

  const ordersQuery = useQuery({
    queryKey: [
      "orders_view",
      role,
      effectiveBranchId,
      effectiveWaiterId,
      period,
      isWaiter ? today : period === "day" ? dayReferenceDate : period === "week" ? isoWeekToLocalISODate(weekValue) : monthValueToLocalISODate(monthValue),
    ],
    enabled:
      Boolean(user) &&
      Boolean(effectiveBranchId) &&
      Boolean(effectiveWaiterId) &&
      (!isWaiter ? Boolean(selectedWaiterId) : true),
    queryFn: async () => {
      const dateParam = isWaiter
        ? today
        : period === "day"
          ? dayReferenceDate
          : period === "week"
            ? isoWeekToLocalISODate(weekValue)
            : monthValueToLocalISODate(monthValue);

      const res = await api.get("/orders/view", {
        params: {
          period: isWaiter ? "day" : period,
          date: dateParam,
          waiterId: effectiveWaiterId,
          ...(isSuperAdmin ? { branchId: effectiveBranchId } : {}),
        },
      });
      if (!res.data.success) throw new Error(res.data.message || "Failed to fetch orders");
      return res.data.data as Order[];
    },
  });

  const step =
    isWaiter ? 2 : isSuperAdmin ? (selectedBranchId ? (selectedWaiterId ? 3 : 2) : 1) : selectedWaiterId ? 2 : 1;

  const canChooseFilters =
    isWaiter ||
    (isBranchAdmin && Boolean(selectedWaiterId)) ||
    (isSuperAdmin && Boolean(selectedBranchId) && Boolean(selectedWaiterId));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">View Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Role-based filtering by waiter and time period.</p>
      </div>

      <div className="mb-6 flex items-center gap-3 text-sm">
        <span className={`px-3 py-1 rounded-full border ${step >= 1 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>Step 1</span>
        <span className={`px-3 py-1 rounded-full border ${step >= 2 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>Step 2</span>
        <span className={`px-3 py-1 rounded-full border ${step >= 3 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>Step 3</span>
      </div>

      {/* Super admin: branch -> waiter -> filters */}
      {isSuperAdmin && (
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">1) Select Branch</h2>
            {isBranchesLoading ? (
              <p className="text-sm text-gray-500">Loading branches...</p>
            ) : (
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setSelectedWaiterId("");
                }}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a branch</option>
                {(branchesData || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Branch admin/cashier: waiter -> filters */}
      {(isBranchAdmin || isSuperAdmin) && (
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">{isSuperAdmin ? "2) Select Waiter" : "1) Select Waiter"}</h2>
            {isWaitersLoading ? (
              <p className="text-sm text-gray-500">Loading waiters...</p>
            ) : (
              <select
                value={selectedWaiterId}
                onChange={(e) => setSelectedWaiterId(e.target.value)}
                disabled={!isSuperAdmin ? false : !selectedBranchId}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select a waiter</option>
                {(waitersData || []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.fullName || w.id}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {(isBranchAdmin || isSuperAdmin || isWaiter) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">{isWaiter ? "Viewing: Today" : isSuperAdmin ? "3) Choose Period" : "2) Choose Period"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                disabled={isWaiter || !canChooseFilters}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="day">Per Day</option>
                <option value="week">Per Week</option>
                <option value="month">Per Month</option>
              </select>
            </div>

            <div className={period ? "" : ""}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reference date</label>
              {period === "day" ? (
                <input
                  type="date"
                  value={isWaiter ? today : dayReferenceDate}
                  onChange={(e) => setDayReferenceDate(e.target.value)}
                  disabled={isWaiter || !canChooseFilters}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              ) : period === "week" ? (
                <input
                  type="week"
                  value={weekValue}
                  onChange={(e) => setWeekValue(e.target.value)}
                  disabled={isWaiter || !canChooseFilters}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              ) : (
                <input
                  type="month"
                  value={monthValue}
                  onChange={(e) => setMonthValue(e.target.value)}
                  disabled={isWaiter || !canChooseFilters}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              )}
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {isWaiter ? (
                  <p>
                    You can only view today&apos;s orders that you created.
                  </p>
                ) : (
                  <p>
                    Showing orders for the selected waiter.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Orders</h2>
          {!ordersQuery.isLoading && ordersQuery.data && ordersQuery.data.length > 0 && (
            <span className="text-xs text-gray-500">
              Total: {ordersQuery.data.length}
            </span>
          )}
        </div>

        {!canChooseFilters ? (
          <p className="text-sm text-gray-500">Select the required step(s) to load orders.</p>
        ) : ordersQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading orders...</p>
        ) : ordersQuery.error ? (
          <p className="text-sm text-red-500">
            Failed to load orders: {ordersQuery.error instanceof Error ? ordersQuery.error.message : "Unknown error"}
          </p>
        ) : ordersQuery.data && ordersQuery.data.length === 0 ? (
          <p className="text-sm text-gray-500">No orders found for the selected criteria.</p>
        ) : (
          <div className="space-y-4">
            {ordersQuery.data?.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-900">
                      {order.orderNumber ? `Order #${order.orderNumber}` : `Order ${order.id.slice(0, 8)}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      Table: {order.tableNumber || "-"} | Time: {formatDateTime(order.createdAt)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Waiter: {order.waiter?.fullName || "-"}
                    </div>
                    {order.cashier?.fullName ? (
                      <div className="text-sm text-gray-600">
                        Created by cashier: {order.cashier.fullName}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${
                        order.status === "completed"
                          ? "text-green-700"
                          : order.status === "ready"
                            ? "text-blue-700"
                            : order.status === "preparing"
                              ? "text-yellow-700"
                              : "text-gray-700"
                      }`}
                    >
                      Status: {order.status}
                    </div>
                    <div className="text-xs text-gray-500">
                      Payment: {order.paymentStatus}
                    </div>
                    <div className="font-bold text-gray-900 mt-1">
                      Total: {formatMoney(order.totalAmount)}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Items</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex gap-2">
                        <span className="font-semibold">{it.quantity}x</span>
                        <span className="flex-1">{it.menuItem.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

