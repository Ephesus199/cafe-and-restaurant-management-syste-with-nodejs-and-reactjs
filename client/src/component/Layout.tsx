import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuthContext";


export default function SuperAdminLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "super_admin";

  return (
    <div className="grid grid-cols-[20%_80%] gap-4 p-4">
      {/* ── Left side navigation ── */}
      <div className="border-r pr-4 min-h-screen">
        <h2 className="font-semibold mb-4">
          {isSuperAdmin ? "Super Admin" : "Branch Admin"} Navigation
        </h2>

        <div className="flex flex-col gap-2">
          {/* Dashboard — index route, always visible */}
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) => (isActive ? "font-bold" : "")}
          >
            Dashboard
          </NavLink>

          {/* ── Super-admin-only links ── */}
          {isSuperAdmin && (
            <>
              <NavLink
                to="/dashboard/create-branch"
                className={({ isActive }) => (isActive ? "font-bold" : "")}
              >
                Create Branch
              </NavLink>

              <NavLink
                to="/dashboard/create-main-category"
                className={({ isActive }) => (isActive ? "font-bold" : "")}
              >
                Create Main Category
              </NavLink>

              <NavLink
                to="/dashboard/create-sub-category"
                className={({ isActive }) => (isActive ? "font-bold" : "")}
              >
                Create Sub Category
              </NavLink>
            </>
          )}

          {/* ── Shared links (both roles) ── */}
          <NavLink
            to="/dashboard/create-menu-item"
            state={{ from: location.pathname }}
            className={({ isActive }) => (isActive ? "font-bold" : "")}
          >
            Create Menu Item
          </NavLink>

          <NavLink
            to="/dashboard/view-menu"
            className={({ isActive }) => (isActive ? "font-bold" : "")}
          >
            View Menu
          </NavLink>
        </div>
      </div>

      {/* ── Main content ── */}
      <div>
        <Outlet />
      </div>
    </div>
  );
}
