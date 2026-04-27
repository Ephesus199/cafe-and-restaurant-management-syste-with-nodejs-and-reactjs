import { NavLink, Outlet, useLocation } from "react-router-dom";

export default function SuperAdminLayout() {
    const location = useLocation();
  return (
      <div className="grid grid-cols-[20%_80%] gap-4 p-4">
          {/* left side navigation */}
          <div className="border-r pr-4 min-h-screen ">
              <h2>Super Admin Navigation</h2>
              <div className="flex flex-col gap-2" >
                  <NavLink to="/admin/dashboard" end className={({ isActive }) => isActive ? "font-bold" : ""}>
                      Dashboard
                  </NavLink>
                  <NavLink to="/admin/dashboard/create-branch" className={({ isActive }) => isActive ? "font-bold" : ""}>
                      Create Branch
                  </NavLink>
                  <NavLink to="/admin/dashboard/create-main-category" className={({ isActive }) => isActive ? "font-bold" : ""}>        
                      Create Main Category
                  </NavLink>
                  <NavLink to="/admin/dashboard/create-sub-category" className={({ isActive }) => isActive ? "font-bold" : ""}>
                      Create Sub Category
                  </NavLink>
                  <NavLink to="/admin/dashboard/create-menu-item" state={{ from: location.pathname }} className={({ isActive }) => isActive ? "font-bold" : ""}>
                      Create Menu Item
                  </NavLink>
                  <NavLink to="/admin/dashboard/view-menu" className={({ isActive }) => isActive ? "font-bold" : ""}>
                      View Menu
                  </NavLink>
              </div>
          </div>
          {/* main content */}
          <div>
               
              <Outlet />
          </div>
    </div>
  );
}