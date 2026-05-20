import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-blue-600 text-white shadow-sm"
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
  }`;

export default function SuperAdminLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "super_admin";
  const isBranchAdmin = user?.role === "branch_admin";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-5 py-6 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cafe Management</p>
          <h2 className="text-lg font-bold text-gray-900 mt-1">
            {isSuperAdmin ? "Super Admin" : isBranchAdmin ? "Branch Admin" : "Dashboard"}
          </h2>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLink to="/dashboard" end className={navLinkClass}>
            Overview
          </NavLink>

          {isSuperAdmin && (
            <>
              <NavLink to="/dashboard/create-branch" className={navLinkClass}>
                Create Branch
              </NavLink>
              <NavLink to="/dashboard/create-main-category" className={navLinkClass}>
                Create Main Category
              </NavLink>
              <NavLink to="/dashboard/create-sub-category" className={navLinkClass}>
                Create Sub Category
              </NavLink>
            </>
          )}

          <NavLink
            to="/dashboard/create-menu-item"
            state={{ from: location.pathname }}
            className={navLinkClass}
          >
            Create Menu Item
          </NavLink>

          <NavLink to="/dashboard/view-menu" className={navLinkClass}>
            View Menu
          </NavLink>
          <NavLink to="/dashboard/orders" className={navLinkClass}>
            View Orders
          </NavLink>

          {isBranchAdmin && (
            <NavLink to="/dashboard/purchase-approvals" className={navLinkClass}>
              Purchase Approvals
            </NavLink>
          )}
          {isBranchAdmin && (
            <NavLink to="/branch/inventory" className={navLinkClass}>
              Branch Inventory
            </NavLink>
          )}

          <NavLink
            to={isSuperAdmin ? "/dashboard/reports" : "/branch/reports"}
            className={navLinkClass}
          >
            Reports
          </NavLink>

          <NavLink
            to="/dashboard/create-user"
            state={{ from: location.pathname }}
            className={navLinkClass}
          >
            Create User
          </NavLink>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
