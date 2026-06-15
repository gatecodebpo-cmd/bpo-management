import { useSidebar } from "../context/SidebarContext";

const pageTitles = {
  "/admin/dashboard": "Dashboard",
  "/admin/register": "Register User",
  "/admin/orders": "New Order",
  "/admin/orders/manage": "Order Management",
  "/admin/orders/history": "Order History",
  "/admin/returns": "New Return",
  "/admin/returns/manage": "Return Management",
  "/admin/returns/history": "Return History",
  "/admin/customers": "Customers",
  "/admin/products": "Products",
  "/admin/performance": "Employee Performance",
};

const HamburgerIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: "currentColor", fill: "none", strokeWidth: 2, strokeLinecap: "round" }}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const TopNavbar = () => {
  const { toggleSidebar } = useSidebar();
  const path = window.location.pathname;
  const title = pageTitles[path] || "Dashboard";

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="top-navbar">
      <div className="top-navbar-left">
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle navigation">
          <HamburgerIcon />
        </button>
        <h1>{title}</h1>
      </div>
      <div className="top-navbar-right">
        <span className="date-badge">{today}</span>
      </div>
    </div>
  );
};

export default TopNavbar;
