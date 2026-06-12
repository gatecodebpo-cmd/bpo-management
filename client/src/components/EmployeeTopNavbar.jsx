const pageTitles = {
  "/employee/dashboard": "Employee Dashboard",
  "/employee/orders": "New Order",
  "/employee/returns": "New Return",
};

const EmployeeTopNavbar = () => {
  const path = window.location.pathname;
  const title = pageTitles[path] || "Employee Dashboard";

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

export default EmployeeTopNavbar;
