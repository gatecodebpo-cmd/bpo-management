import { Link } from "react-router-dom";

const quickActions = [
  {
    title: "New Order",
    desc: "Place a new order for GPS, Vending Machine, or other products",
    to: "/order",
    icon: "📦",
  },
  {
    title: "Return Request",
    desc: "Submit a return request for damaged or incorrect products",
    to: "/return",
    icon: "↩️",
  },
  {
    title: "Admin Dashboard",
    desc: "View all orders, returns, and manage statuses",
    to: "/admin/dashboard",
    icon: "⚙️",
  },
];

const CloneDashboardPage = () => (
  <section className="main-dashboard">
    <div className="hero glass-card">
      <h2>Welcome to Dashboard</h2>
      <p>Manage orders, returns, and administrative tasks from one place.</p>
    </div>
    <div className="quick-actions">
      {quickActions.map((action) => (
        <Link key={action.to} to={action.to} className="action-card glass-card">
          <span className="action-icon">{action.icon}</span>
          <h3>{action.title}</h3>
          <p>{action.desc}</p>
        </Link>
      ))}
    </div>
  </section>
);

export default CloneDashboardPage;
