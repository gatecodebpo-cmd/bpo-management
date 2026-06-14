import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const PackageIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status, colors) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11,
    fontWeight: 600, background: `${colors[status] || "#666"}22`,
    color: colors[status] || "#666", border: `1px solid ${colors[status] || "#666"}44`,
    whiteSpace: "nowrap",
  }}>{status}</span>
);

const orderStatusColors = {
  "Pending": "var(--warning)", "Approved": "var(--primary)",
  "Processing": "var(--primary)", "Delivered": "var(--success)",
  "Cancelled": "var(--danger)",
};

const returnStatusColors = {
  "Return Requested": "var(--warning)", "Return Approved": "var(--primary)",
  "Pickup Scheduled": "#8b5cf6", "Returned Successfully": "var(--success)",
  "Return Rejected": "var(--danger)",
};

const FILTERS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Date Range" },
];

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orderCount: 0, returnCount: 0, recentOrders: [], recentReturns: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async (f, sd, ed) => {
    try {
      setLoading(true);
      const params = { filter: f };
      if (f === "custom") {
        if (sd) params.startDate = sd;
        if (ed) params.endDate = ed;
      }
      const res = await api.get("/employee/dashboard", { params });
      setStats(res.data.data);
    } catch {
      setStats({ orderCount: 0, returnCount: 0, recentOrders: [], recentReturns: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter, startDate, endDate); }, [filter, startDate, endDate, load]);

  const handleFilterClick = (key) => {
    setFilter(key);
    if (key !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const statCards = [
    { title: "Orders", value: stats.orderCount, icon: PackageIcon, color: "blue" },
    { title: "Returns", value: stats.returnCount, icon: RefreshIcon, color: "orange" },
  ];

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Welcome, {user?.name || "Employee"}!</h2>
          <p className="page-subtitle">Your activity summary</p>
        </div>
        <button className="logout-btn" onClick={() => load(filter, startDate, endDate)}>Refresh</button>
      </div>

      <div className="glass-card" style={{ padding: "10px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Filter:</span>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilterClick(key)}
            style={{
              padding: "6px 16px", borderRadius: 8, border: `1px solid ${filter === key ? "var(--primary)" : "var(--border)"}`,
              background: filter === key ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)",
              color: filter === key ? "var(--primary)" : "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: filter === key ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
        {filter === "custom" && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={todayStr}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "6px 10px", fontSize: 13 }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={todayStr}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "6px 10px", fontSize: 13 }}
            />
          </>
        )}
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Orders</h3>
              </div>
              {stats.recentOrders?.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>No orders found</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Customer</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Product</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Total</th>
                        <th style={{ textAlign: "center", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Status</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((o) => (
                        <tr key={o._id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px", fontWeight: 500 }}>{o.customerName}</td>
                          <td style={{ padding: "8px" }}>{o.productType === "Other" ? o.customProductName : o.productType}</td>
                          <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(o.totalAmount)}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{statusBadge(o.orderStatus, orderStatusColors)}</td>
                          <td style={{ padding: "8px", textAlign: "right", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDateTime(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Returns</h3>
              </div>
              {stats.recentReturns?.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>No returns found</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Customer</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Product</th>
                        <th style={{ textAlign: "center", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Status</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentReturns.map((r) => (
                        <tr key={r._id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px", fontWeight: 500 }}>{r.customerName}</td>
                          <td style={{ padding: "8px" }}>{r.productType === "Other" ? r.customProductName || r.productType : r.productType}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{statusBadge(r.returnStatus, returnStatusColors)}</td>
                          <td style={{ padding: "8px", textAlign: "right", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDateTime(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default EmployeeDashboardPage;
