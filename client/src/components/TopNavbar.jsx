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

const TopNavbar = () => {
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
      <h1>{title}</h1>
      <div className="top-navbar-right">
        <span className="date-badge">{today}</span>
      </div>
    </div>
  );
};

export default TopNavbar;
