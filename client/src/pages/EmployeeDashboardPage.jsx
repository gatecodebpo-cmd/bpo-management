import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const PackageIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
);

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ ordersToday: 0, returnsToday: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/employee/dashboard");
      setStats(res.data.data);
    } catch {
      setStats({ ordersToday: 0, returnsToday: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = [
    {
      title: "Orders Today",
      value: stats.ordersToday,
      icon: PackageIcon,
      color: "blue",
    },
    {
      title: "Returns Today",
      value: stats.returnsToday,
      icon: RefreshIcon,
      color: "orange",
    },
  ];

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Welcome, {user?.name || "Employee"}!</h2>
          <p className="page-subtitle">Your activity summary for today</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: 600 }}>
            {statCards.map(({ title, value, icon: Icon, color }) => (
              <article key={title} className={`stat-card glass-card ${color}`}>
                <div className={`stat-icon ${color}`}><Icon /></div>
                <div className="stat-info">
                  <p>{title}</p>
                  <h3>{typeof value === "number" ? value.toLocaleString() : value}</h3>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default EmployeeDashboardPage;
