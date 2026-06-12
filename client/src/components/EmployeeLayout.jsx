import { Outlet } from "react-router-dom";
import EmployeeSidebar from "./EmployeeSidebar";
import EmployeeTopNavbar from "./EmployeeTopNavbar";

const EmployeeLayout = () => (
  <div className="app-shell">
    <EmployeeSidebar />
    <div className="main-area">
      <EmployeeTopNavbar />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  </div>
);

export default EmployeeLayout;
