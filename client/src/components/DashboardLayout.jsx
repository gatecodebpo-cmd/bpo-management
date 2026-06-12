import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import TopNavbar from "./TopNavbar.jsx";

const DashboardLayout = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-area">
      <TopNavbar />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;
