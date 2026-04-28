import { useAuth } from "../hooks/auth/useAuthContext";
import MenuControl from "../page/MenuControl";
import ViewAllMenu from "../page/ViewAllMenu";
import { Outlet, useMatch } from "react-router-dom";

export default function MenuSwitcher() {
    const { role } = useAuth();
    const isEditingMenuItem = useMatch("/dashboard/view-menu/edit-menu-item/:id");

    if (isEditingMenuItem) {
        return <Outlet />;
    }

    if (role === "super_admin") {
        return <ViewAllMenu />
    } else if (role === "branch_admin") {
        return <MenuControl />
    }

    return null;
}