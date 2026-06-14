import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const OrderIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M6 2h12l4 4v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6l4-4z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg>
);

const ReturnIcon = () => (
  <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
);

const BarChartIcon = () => (
  <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);

const UserPlusIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
);

const PackageIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, marginLeft: "auto" }}><polyline points="6 9 12 15 18 9"/></svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const DollarIcon = () => (
  <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: ShieldIcon },
  { to: "/admin/revenue", label: "Total Revenue", icon: DollarIcon },
  { to: "/admin/sales", label: "Sales", icon: BarChartIcon },
];

const bottomLinks = [
  { to: "/admin/customers", label: "Customers", icon: UsersIcon },
  { to: "/admin/products", label: "Products", icon: PackageIcon },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [returnsOpen, setReturnsOpen] = useState(true);
  const [usersOpen, setUsersOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data.data || []);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLogout = () => {
    const loginPath = localStorage.getItem("dashboard_login_path") || "/login";
    logout();
    navigate(loginPath, { replace: true });
  };

  const userName = user?.name || user?.email || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">DB</div>
        <div className="sidebar-header-info">
          <h3>Dashboard</h3>
          <span>Management Portal</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="sidebar-link">
            <span className="sidebar-icon"><Icon /></span>
            {label}
          </NavLink>
        ))}
        <div className="sidebar-dropdown">
          <button className="sidebar-link sidebar-dropdown-btn" onClick={() => setOrdersOpen(!ordersOpen)}>
            <span className="sidebar-icon"><OrderIcon /></span>
            Orders
            <ChevronDown />
          </button>
          {ordersOpen && (
            <div className="sidebar-submenu">
              <NavLink to="/admin/orders" className="sidebar-sublink">New Order</NavLink>
              <NavLink to="/admin/orders/manage" className="sidebar-sublink">Order Management</NavLink>
              <NavLink to="/admin/orders/history" className="sidebar-sublink">Order History</NavLink>
            </div>
          )}
        </div>
        <div className="sidebar-dropdown">
          <button className="sidebar-link sidebar-dropdown-btn" onClick={() => setReturnsOpen(!returnsOpen)}>
            <span className="sidebar-icon"><ReturnIcon /></span>
            Returns
            <ChevronDown />
          </button>
          {returnsOpen && (
            <div className="sidebar-submenu">
              <NavLink to="/admin/returns" className="sidebar-sublink">New Return</NavLink>
              <NavLink to="/admin/returns/manage" className="sidebar-sublink">Return Management</NavLink>
              <NavLink to="/admin/returns/history" className="sidebar-sublink">Return History</NavLink>
            </div>
          )}
        </div>
        <div className="sidebar-dropdown">
          <div className="sidebar-link sidebar-dropdown-btn">
            <NavLink to="/admin/users" className="sidebar-dropdown-label" onClick={() => setUsersOpen(false)}>
              <span className="sidebar-icon"><UserPlusIcon /></span>
              User Details
            </NavLink>
            <button className="sidebar-dropdown-chevron" onClick={() => setUsersOpen(!usersOpen)}>
              <ChevronDown />
            </button>
          </div>
          {usersOpen && (
            <div className="sidebar-submenu">
              <NavLink to="/admin/register" className="sidebar-sublink" onClick={() => setUsersOpen(false)}>+ Register New</NavLink>
              {users.map((u) => (
                <NavLink key={u._id} to={`/admin/register/${u._id}`} className="sidebar-sublink" onClick={() => setUsersOpen(false)}>
                  <span className="sidebar-sub-user">
                    <span className="sidebar-sub-user-avatar">{(u.name || "?").charAt(0).toUpperCase()}</span>
                    <span className="sidebar-sub-user-info">
                      <span className="sidebar-sub-user-name">{u.name}</span>
                      <span className="sidebar-sub-user-email">{u.email}</span>
                      <span className="sidebar-sub-user-detail">{u.username && `@${u.username}`} {u.phoneNumber && `| ${u.phoneNumber}`}</span>
                    </span>
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
        <NavLink to="/admin/performance" className="sidebar-link">
          <span className="sidebar-icon"><BarChartIcon /></span>
          Employee Performance
        </NavLink>
        <NavLink to="/admin/calling-report" className="sidebar-link">
          <span className="sidebar-icon"><PhoneIcon /></span>
          Calling Report
        </NavLink>
        <NavLink to="/admin/employee-details" className="sidebar-link">
          <span className="sidebar-icon"><ClockIcon /></span>
          Employee Details
        </NavLink>
        {bottomLinks.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="sidebar-link">
            <span className="sidebar-icon"><Icon /></span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitial}</div>
          <div className="sidebar-user-info">
            <p>{userName}</p>
            <span>{user?.role || "Administrator"}</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
