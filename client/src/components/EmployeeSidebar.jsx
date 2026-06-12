import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const OrderIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M6 2h12l4 4v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6l4-4z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg>
);

const ReturnIcon = () => (
  <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const EmployeeSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const loginPath = localStorage.getItem("dashboard_login_path") || "/login";
    logout();
    navigate(loginPath, { replace: true });
  };

  const userName = user?.name || user?.email || "Employee";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">DB</div>
        <div className="sidebar-header-info">
          <h3>Employee</h3>
          <span>Dashboard</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/employee/dashboard" className="sidebar-link" end>
          <span className="sidebar-icon"><HomeIcon /></span>
          Dashboard
        </NavLink>
        <NavLink to="/employee/orders" className="sidebar-link">
          <span className="sidebar-icon"><OrderIcon /></span>
          New Order
        </NavLink>
        <NavLink to="/employee/returns" className="sidebar-link">
          <span className="sidebar-icon"><ReturnIcon /></span>
          New Return
        </NavLink>
        <NavLink to="/employee/calling-report" className="sidebar-link">
          <span className="sidebar-icon"><PhoneIcon /></span>
          Calling
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitial}</div>
          <div className="sidebar-user-info">
            <p>{userName}</p>
            <span>Employee</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
};

export default EmployeeSidebar;
