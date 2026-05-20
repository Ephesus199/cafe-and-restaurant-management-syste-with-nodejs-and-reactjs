import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useAuth } from "../hooks/auth/useAuthContext";
import BranchStaffSubnav from "../component/BranchStaffSubnav";
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

type Period = "daily" | "weekly" | "monthly" | "company";

export default function ReportsDashboard() {
  const { user } = useAuth();
  const role = user?.role;
  const isSuperAdmin = role === "super_admin";
  const isBranchAdmin = role === "branch_admin";
  const isStoreManager = role === "store_manager";

  const defaultTab = "daily";
  const [activeTab, setActiveTab] = useState<Period>(defaultTab);

  // For super_admin to optionally select a branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const effectiveBranchId = isSuperAdmin ? selectedBranchId : user?.branchId;

  // Date selection states
  const todayStr = new Date().toISOString().split("T")[0];
  const [dailyDate, setDailyDate] = useState<string>(todayStr);
  const [weeklyStart, setWeeklyStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [weeklyEnd, setWeeklyEnd] = useState<string>(todayStr);
  const [monthlyMonth, setMonthlyMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Fetch branches for super admin
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const res = await api.get("/branches");
      return res.data.data;
    },
  });

  // Fetch report data
  const { data: reportData, isLoading, isError, error } = useQuery({
    queryKey: [
      "report",
      activeTab,
      effectiveBranchId,
      activeTab === "daily" ? dailyDate : activeTab === "weekly" ? `${weeklyStart}_${weeklyEnd}` : activeTab === "monthly" ? monthlyMonth : "none",
    ],
    enabled: !!(
      (activeTab === "company" && isSuperAdmin) ||
      (effectiveBranchId && activeTab !== "company")
    ),
    queryFn: async () => {
      if (activeTab === "company") {
        const res = await api.get("/reports/company");
        return res.data.data;
      } else {
        const params: any = { branchId: effectiveBranchId };
        if (activeTab === "daily") params.date = dailyDate;
        if (activeTab === "weekly") {
          params.startDate = weeklyStart;
          params.endDate = weeklyEnd;
        }
        if (activeTab === "monthly") params.month = monthlyMonth;
        
        const res = await api.get(`/reports/${activeTab}`, { params });
        return res.data.data;
      }
    },
  });

  const formatMoney = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const tabs = [
    ...(isSuperAdmin || isBranchAdmin || isStoreManager
      ? [{ id: "daily" as const, label: "Daily report" }]
      : []),
    ...(isSuperAdmin || isBranchAdmin || isStoreManager
      ? [{ id: "weekly" as const, label: "Weekly report" }]
      : []),
    ...(isSuperAdmin || isBranchAdmin ? [{ id: "monthly" as const, label: "Monthly report" }] : []),
    ...(isSuperAdmin ? [{ id: "company" as const, label: "Company overview" }] : []),
  ];

  return (
    <DashboardPage>
      {isStoreManager && <BranchStaffSubnav />}
      <DashboardHeader
        title="Reports"
        description="View key performance metrics and operational summaries for your scope."
      />

      <DashboardTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab !== "company" && (
        <DashboardCard title="Filters" className="mb-6">
          <div className="flex flex-wrap gap-4 items-end">
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Branch</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="border border-gray-300 rounded-lg p-2.5 bg-white text-sm min-w-[200px]"
              >
                <option value="">Select a branch</option>
                {branchesData?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "daily" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 bg-white text-sm"
              />
            </div>
          )}

          {activeTab === "weekly" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={weeklyStart}
                  onChange={(e) => setWeeklyStart(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 bg-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={weeklyEnd}
                  onChange={(e) => setWeeklyEnd(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 bg-white text-sm"
                />
              </div>
            </>
          )}

          {activeTab === "monthly" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Month</label>
              <input
                type="month"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 bg-white text-sm"
              />
            </div>
          )}
          </div>
        </DashboardCard>
      )}

      <DashboardCard>
        {isLoading ? (
          <p className="text-gray-500">Loading report data...</p>
        ) : isError ? (
          <p className="text-red-500">Failed to load report: {(error as Error).message}</p>
        ) : !reportData ? (
          <p className="text-gray-500">No data available. Please select filters.</p>
        ) : (
          <div>
            {activeTab === "company" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4">Company Inventory Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                      label="Total inventory value"
                      value={`$${formatMoney(reportData.companyInventory.total_inventory_value)}`}
                      tone="purple"
                    />
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-700 font-medium">Total Branches</p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">
                        {reportData.companyInventory.total_branches || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-sm text-red-700 font-medium">Out of Stock Items</p>
                      <p className="text-3xl font-bold text-red-900 mt-1">
                        {reportData.companyInventory.out_of_stock_count || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                      <p className="text-sm text-yellow-700 font-medium">Low Stock Items</p>
                      <p className="text-3xl font-bold text-yellow-900 mt-1">
                        {reportData.companyInventory.low_stock_count || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">Branch Performance Breakdown</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-left border-y border-gray-200">
                          <th className="p-3 font-semibold text-sm text-gray-700">Branch Name</th>
                          <th className="p-3 font-semibold text-sm text-gray-700">Staff Count</th>
                          <th className="p-3 font-semibold text-sm text-gray-700">Total Purchases Cost</th>
                          <th className="p-3 font-semibold text-sm text-gray-700">Total Usage Cost</th>
                          <th className="p-3 font-semibold text-sm text-gray-700">Stock Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.branchPerformance?.map((b: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 text-sm font-medium text-gray-900">{b.branch_name}</td>
                            <td className="p-3 text-sm text-gray-600">{b.total_staff}</td>
                            <td className="p-3 text-sm text-gray-600">${formatMoney(b.total_purchase_cost)}</td>
                            <td className="p-3 text-sm text-gray-600">${formatMoney(b.total_usage_cost)}</td>
                            <td className="p-3 text-sm text-gray-600">{b.total_stock_units}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-sm">
                  <div className="flex flex-col h-full justify-between">
                    <span className="text-sm font-semibold text-green-800 uppercase tracking-wider">Total Sales</span>
                    <span className="text-4xl font-extrabold text-green-900 mt-2">
                      ${formatMoney(reportData.totalSales)}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm">
                  <div className="flex flex-col h-full justify-between">
                    <span className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Total Orders</span>
                    <span className="text-4xl font-extrabold text-blue-900 mt-2">
                      {reportData.totalOrders || 0}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 shadow-sm">
                  <div className="flex flex-col h-full justify-between">
                    <span className="text-sm font-semibold text-orange-800 uppercase tracking-wider">Total Purchases</span>
                    <span className="text-4xl font-extrabold text-orange-900 mt-2">
                      ${formatMoney(reportData.totalPurchases)}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 shadow-sm">
                  <div className="flex flex-col h-full justify-between">
                    <span className="text-sm font-semibold text-red-800 uppercase tracking-wider">Usage Cost</span>
                    <span className="text-4xl font-extrabold text-red-900 mt-2">
                      ${formatMoney(reportData.totalUsageCost)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DashboardCard>
    </DashboardPage>
  );
}
