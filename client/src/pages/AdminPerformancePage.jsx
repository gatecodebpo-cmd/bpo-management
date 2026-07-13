import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const FILTERS = ["today", "yesterday", "week", "month", "custom"];

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const AdminPerformancePage = () => {
  const today = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPerformance = useCallback(async () => {
    try {
      setLoading(true);
      const params = { filter };
      if (filter === "custom") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await api.get("/admin/employee-performance", { params });
      setEmployees(res.data.data || []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => { fetchPerformance(); }, [fetchPerformance]);

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameStr = (emp.username || emp.name || "").toLowerCase().trim();
    return nameStr.startsWith(q);
  });

  const formatLabel = (f) => {
    switch (f) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "week": return "This Week";
      case "month": return "This Month";
      case "custom": return "Custom Range";
      default: return f;
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Employee Performance</h2>
          <p className="page-subtitle">Track employee activity and productivity</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="primary-btn"
            style={{
              background: filter === f ? "var(--primary)" : "var(--bg-card)",
              border: "1px solid var(--border)",
              color: filter === f ? "#fff" : "var(--text)",
              opacity: 1,
              padding: "8px 16px",
              fontSize: 13,
            }}
          >
            {formatLabel(f)}
          </button>
        ))}
        {filter === "custom" && (
          <>
            <input
              type="date"
              value={startDate}
              max={today}
              onChange={(e) => {
                const val = e.target.value;
                setStartDate(val);
                if (endDate && val > endDate) {
                  setEndDate("");
                }
              }}
              style={{ width: "auto", padding: "8px 12px", fontSize: 13 }}
            />
            <span style={{ color: "var(--text-muted)" }}>to</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: "auto", padding: "8px 12px", fontSize: 13 }}
            />
          </>
        )}
        <button onClick={fetchPerformance} className="primary-btn" style={{ padding: "8px 16px", fontSize: 13 }}>
          Refresh
        </button>
      </div>

      <div className="table-shell glass-card">
        <div className="table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3>Employee Activity ({filteredEmployees.length})</h3>
          <div className="table-search-wrap">
            <SearchIcon />
            <input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>USERNAME OF EMPLOYEE</th>
                <th>ORDERS TODAY</th>
                <th>RETURNS TODAY</th>
                <th>TOTAL ENTRIES</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    No employees found
                  </td>
                </tr>
              )}
              {filteredEmployees.map((emp) => (
                <tr key={emp._id}>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{emp.username || emp.name}</td>
                  <td>
                    <span className="status-badge status-processing">{emp.ordersToday}</span>
                  </td>
                  <td>
                    <span className="status-badge status-pending">{emp.returnsToday}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{emp.totalEntries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AdminPerformancePage;
