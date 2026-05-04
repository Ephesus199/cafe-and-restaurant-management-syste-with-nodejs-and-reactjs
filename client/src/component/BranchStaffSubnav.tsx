import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
    isActive
      ? "bg-blue-600 text-white border-blue-600"
      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-700"
  }`;

export default function BranchStaffSubnav() {
  const { role } = useAuth();
  if (role !== "store_manager") return null;

  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Store manager shortcuts">
      <NavLink to="/branch/purchases/create" className={linkClass}>
        Purchases
      </NavLink>
      <NavLink to="/branch/usage/record" className={linkClass}>
        Daily usage
      </NavLink>
      <NavLink to="/branch/inventory" className={linkClass}>
        Inventory
      </NavLink>
    </nav>
  );
}
