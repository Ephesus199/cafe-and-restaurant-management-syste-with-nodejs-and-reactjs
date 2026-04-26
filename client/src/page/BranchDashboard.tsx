import { Link, useLocation } from "react-router-dom";

export default function BranchDashboard() {
    const location = useLocation();
    console.log("BranchDashboard location state:", location);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Branch Dashboard</h1>
          <p>Welcome to the Branch Dashboard! Here you can manage your branch's menu, view orders, and more.</p>
          <Link to="/admin/create-menu-item" state={{from:location.pathname}} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
            Create Menu Item
          </Link>
    </div>
  );
}