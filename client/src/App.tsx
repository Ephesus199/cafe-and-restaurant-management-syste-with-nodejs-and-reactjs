import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login } from "./page/Login";
import QueryProvider from "./providers/queryProvider";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./component/ProtectedRoute";
import CreateUser from "./page/CreateUser";
import ForgotPassword from "./page/ForgotPassword";
import ResetPassword from "./page/RestPassword";
import CreateBranch from "./page/CreateBranch";
import ChangePassword from "./page/ChangePassword";
import Profile from "./page/Profile";
import UpdateBranch from "./page/UpdateBranch";
import CreateCategory from "./page/CreateCategory";
import CreateSubCategory from "./page/CreateSubCategory";
import CreateMenuItem from "./page/CreateMenuItem";
import EditMenu from "./page/EditMenu";
// import BranchDashboard from "./page/BranchDashboard";
import Menu from "./page/Menu";
import SuperAdminLayout from "./component/Layout";
// import ViewAllMenu from "./page/ViewAllMenu";
// import SuperAdminDashboard from "./page/SuperAdminDashboard";
import DashboardSwitcher from "./component/DashboardSwitcher";
import MenuSwitcher from "./component/MenuSwitcher";
import CreateOrder from "./page/CreateOrder";
import ViewOrders from "./page/ViewOrders";

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/menu/:branchId" element={<Menu />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ── Dashboard shell (super_admin + branch_admin) ── */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["super_admin", "branch_admin", "waiter"]}
                />
              }
            >
              <Route path="/dashboard" element={<SuperAdminLayout />}>
                <Route index element={<DashboardSwitcher />} />
                <Route path="orders" element={<ViewOrders />} />

                {/*
                 * Index route: render the correct dashboard per role.
                 * SuperAdminDashboard guards itself with showUnauthorized so
                 * branch_admin sees "Access Denied" inline rather than a blank page.
                 * BranchDashboard is reached only by branch_admin via the
                 * nested protected route below.
                 *
                 * HOW IT WORKS:
                 * - super_admin  → hits index → passes super_admin guard → SuperAdminDashboard
                 * - branch_admin → hits index → blocked by super_admin guard (showUnauthorized)
                 *                → "Access Denied" shown inline inside the layout shell
                 *
                 * If you'd prefer branch_admin to land on BranchDashboard automatically,
                 * use a <DashboardSwitcher> component as the index element that reads the
                 * role from context and renders the right component — no extra routes needed.
                 */}

                {/* ── Super-admin-only routes (showUnauthorized keeps layout shell) ── */}
                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["super_admin"]}
                      showUnauthorized
                    />
                  }
                >
                  <Route path="create-branch" element={<CreateBranch />} />
                  <Route
                    path="branches/:id/update"
                    element={<UpdateBranch />}
                  />
                  <Route
                    path="create-main-category"
                    element={<CreateCategory />}
                  />
                  <Route
                    path="create-sub-category"
                    element={<CreateSubCategory />}
                  />
                </Route>

                {/* ── Branch-admin-only route ── */}
                {/*
                 * branch_admin navigates to /dashboard and hits the index above which
                 * shows "Access Denied". To give branch_admin their own home page,
                 * link them to /dashboard/branch or use a DashboardSwitcher index.
                 *
                 * Alternatively, keep the route below and use a DashboardSwitcher at index.
                 */}
                {/* branch_admin is not allowed to create orders */}

                {/* ── Shared dashboard routes (both roles) ── */}
                <Route path="create-menu-item" element={<CreateMenuItem />} />
                <Route path="create-user" element={<CreateUser />} />
                <Route path="view-menu" element={<MenuSwitcher />}>
                  <Route path="edit-menu-item/:id" element={<EditMenu />} />
                </Route>
              </Route>
            </Route>

            {/* ── Other protected routes outside the dashboard layout ── */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["super_admin", "branch_admin"]}
                />
              }
            >
              <Route path="/create-user" element={<CreateUser />} />
              {/* <Route path="/admin/edit-menu-item/:id" element={<EditMenu />} /> */}
            </Route>

            {/* Order creation (waiter + cashier only) */}
            <Route
              element={<ProtectedRoute allowedRoles={["waiter", "cashier"]} />}
            >
              <Route path="/branch/create-order" element={<CreateOrder />} />
            </Route>

            {/* View orders (waiter, branch_admin, super_admin) */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "waiter",
                    "branch_admin",
                    "cashier",
                    "super_admin",
                  ]}
                />
              }
            ></Route>

            {/* ── Profile (all staff roles) ── */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "super_admin",
                    "branch_admin",
                    "store_manager",
                    "waiter",
                    "cashier",
                    "staff",
                  ]}
                />
              }
            >
              <Route path="/profile/:id" element={<Profile />} />
              <Route
                path="/profile/:id/change-password"
                element={<ChangePassword />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
