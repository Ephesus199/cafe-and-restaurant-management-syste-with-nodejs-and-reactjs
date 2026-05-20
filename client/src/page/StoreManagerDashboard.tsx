import {
  DashboardHeader,
  DashboardPage,
  QuickActionCard,
} from "../component/dashboard";
import BranchStaffSubnav from "../component/BranchStaffSubnav";

export default function StoreManagerDashboard() {
  return (
    <DashboardPage>
      <BranchStaffSubnav />
      <DashboardHeader
        title="Store manager overview"
        description="Record purchases, log daily usage, and monitor branch inventory and reports."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <QuickActionCard
          title="Create purchase"
          description="Submit multiple inventory items in one purchase request."
          to="/branch/purchases/create"
          tone="blue"
        />
        <QuickActionCard
          title="Record daily usage"
          description="Log variant usage for a specific day."
          to="/branch/usage/record"
          tone="green"
        />
        <QuickActionCard
          title="Branch inventory"
          description="View stock levels and low-stock items."
          to="/branch/inventory"
          tone="purple"
        />
        <QuickActionCard
          title="Reports"
          description="View daily and weekly branch reports."
          to="/branch/reports"
          tone="amber"
        />
      </div>
    </DashboardPage>
  );
}
