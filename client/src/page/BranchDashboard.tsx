import { Link } from "react-router-dom";
import MenuControl from "./MenuControl";
import {
  DashboardCard,
  DashboardHeader,
  DashboardPage,
  QuickActionCard,
} from "../component/dashboard";

export default function BranchDashboard() {
  return (
    <DashboardPage>
      <DashboardHeader
        title="Branch overview"
        description="Manage your branch menu, orders, inventory, and staff from one place."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <QuickActionCard
          title="View orders"
          description="Track and manage orders for your branch."
          to="/dashboard/orders"
          tone="blue"
        />
        <QuickActionCard
          title="Purchase approvals"
          description="Review and approve store manager purchase requests."
          to="/dashboard/purchase-approvals"
          tone="green"
        />
        <QuickActionCard
          title="Branch inventory"
          description="Monitor stock levels and low-stock alerts."
          to="/branch/inventory"
          tone="purple"
        />
        <QuickActionCard
          title="Reports"
          description="View daily, weekly, and monthly branch performance."
          to="/branch/reports"
          tone="amber"
        />
        <QuickActionCard
          title="Create menu item"
          description="Add new items to your branch menu."
          to="/dashboard/create-menu-item"
          tone="blue"
        />
        <QuickActionCard
          title="Create user"
          description="Add waiters, cashiers, and other branch staff."
          to="/dashboard/create-user"
          tone="green"
        />
      </div>

      <DashboardCard
        title="Menu control"
        description={
          <>
            Toggle availability and edit items. For full menu browsing, visit{" "}
            <Link to="/dashboard/view-menu" className="text-blue-600 font-semibold hover:underline">
              view menu
            </Link>
            .
          </>
        }
      >
        <MenuControl embedded />
      </DashboardCard>
    </DashboardPage>
  );
}
