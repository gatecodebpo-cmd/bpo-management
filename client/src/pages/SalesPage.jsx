import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const BarChartIcon = () => (
  <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);

const PackageSmallIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><polyline points="15 18 9 12 15 6"/></svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}><polyline points="9 18 15 12 9 6"/></svg>
);

const formatINR = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SalesPage = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m, y) => {
    setLoading(true);
    try {
      const res = await api.get("/admin/sales-summary", { params: { month: m, year: y } });
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load sales", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(month, year); }, [month, year, load]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const periods = data
    ? [
        { label: isCurrentMonth ? "Today" : `${data.filter.label} (Daily Avg)`, key: "daily", d: data.daily, color: "#06b6d4" },
        { label: isCurrentMonth ? "This Week" : `${data.filter.label} (Weekly Avg)`, key: "weekly", d: data.weekly, color: "#8b5cf6" },
        { label: data.filter.label, key: "monthly", d: data.monthly, color: "#10b981" }
      ]
    : [];

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Sales Overview</h2>
          <p className="page-subtitle">Daily, weekly & monthly sales breakdown</p>
        </div>
        <button className="logout-btn" onClick={() => load(month, year)}>Refresh</button>
      </div>

      <div className="glass-card" style={{ padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Filter by Month:</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={prevMonth} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center", lineHeight: 0 }}>
            <ChevronLeft />
          </button>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "8px 12px", fontSize: 14, cursor: "pointer" }}>
            {MONTHS.map((name, i) => <option key={i} value={i} style={{ background: "#1a2540" }}>{name}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "8px 12px", fontSize: 14, cursor: "pointer" }}>
            {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
              <option key={y} value={y} style={{ background: "#1a2540" }}>{y}</option>
            ))}
          </select>
          <button onClick={nextMonth} disabled={isCurrentMonth} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: isCurrentMonth ? "var(--text-muted)" : "var(--text)", cursor: isCurrentMonth ? "not-allowed" : "pointer", padding: "6px 8px", display: "flex", alignItems: "center", lineHeight: 0, opacity: isCurrentMonth ? 0.5 : 1 }}>
            <ChevronRight />
          </button>
        </div>
        {!isCurrentMonth && (
          <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }} style={{ background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.3)", borderRadius: 8, color: "var(--primary)", padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500, marginLeft: "auto" }}>
            Back to Current Month
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40 }}>Loading sales data...</p>
      ) : !data ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40 }}>Could not load sales data.</p>
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {periods.map(({ label, d, color }) => (
              <article key={label} className="stat-card glass-card" style={{ borderTop: `3px solid ${color}`, flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                  <div className="stat-icon" style={{ background: `${color}20`, color, width: 42, height: 42 }}>
                    <BarChartIcon />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{label}</p>
                    <h3 style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800, color: "var(--text-heading)", letterSpacing: "-1px" }}>
                      {formatINR(d.total)}
                    </h3>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Orders</div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-heading)" }}>{d.count}</span>
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Units</div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-heading)" }}>{d.units}</span>
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Avg/Order</div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-heading)" }}>
                      {d.count > 0 ? formatINR(Math.round(d.total / d.count)) : "₹0"}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
            <div className="section-header" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Sales Breakdown — {data.filter.label}</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Period</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Orders</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Units Sold</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Sales</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg per Order</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map(({ label, d }) => (
                    <tr key={label} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 12px", fontWeight: 600 }}>{label}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>{d.count}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>{d.units}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>{formatINR(d.total)}</td>
                      <td style={{ padding: "12px 12px", textAlign: "right" }}>{d.count > 0 ? formatINR(Math.round(d.total / d.count)) : "₹0"}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "rgba(6, 182, 212, 0.05)" }}>
                    <td style={{ padding: "12px 12px", fontWeight: 700 }}>Total ({data.filter.label})</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>{data.monthly.count}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>{data.monthly.units}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 800, color: "var(--primary)", fontSize: 16 }}>{formatINR(data.monthly.total)}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>
                      {data.monthly.count > 0 ? formatINR(Math.round(data.monthly.total / data.monthly.count)) : "₹0"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default SalesPage;
