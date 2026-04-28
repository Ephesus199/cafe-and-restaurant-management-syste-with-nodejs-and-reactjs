import { useAuth } from "../hooks/auth/useAuthContext";
import BranchDashboard from "../page/BranchDashboard";
import SuperAdminDashboard from "../page/SuperAdminDashboard";

export default function DashboardSwitcher() {
    const {role} = useAuth();
    if(role === "super_admin"){
        return <SuperAdminDashboard />
    } else if(role === "branch_admin"){
        return <BranchDashboard />
    }
}