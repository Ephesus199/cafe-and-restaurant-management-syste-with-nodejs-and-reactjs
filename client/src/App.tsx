import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Login } from "./page/Login";
import QueryProvider from "./providers/queryProvider";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./component/ProtectedRoute";
import CreateUser from "./page/CreateUser";
import SuperAdminDashboard from "./page/SuperAdminDashboard";
import ForgotPassword from "./page/ForgotPassword";
import ResetPassword from "./page/RestPassword";
import CreateBranch from "./page/CreateBranch";
import ChangePassword from "./page/ChangePassword";
import Profile from "./page/Profile";

function App() {
  return (
    <>
      <QueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                element={<ProtectedRoute allowedRoles={["super_admin"]} />}
              >
                <Route
                  path="/admin/dashboard"
                  element={<SuperAdminDashboard />}
                />
              </Route>
              <Route
                element={<ProtectedRoute allowedRoles={["super_admin"]} />}
              >
                <Route
                  path="/admin/create-branch"
                  element={<CreateBranch />} // Make sure to import CreateBranch component
                />
              </Route>

              

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["super_admin", "branch_admin"]}
                  />
                }
              >

                <Route path="/create-user" element={<CreateUser />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["super_admin", "branch_admin", "store_manager", "waiter", "cashier", "staff"]} />}>
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/profile/:id/change-password" element={<ChangePassword />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryProvider>
    </>
  );
}

export default App;
