import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const FILTERS = ["today", "yesterday", "week", "month", "custom"];

const AdminPerformancePage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "auto", padding: "8px 12px", fontSize: 13 }}
            />
            <span style={{ color: "var(--text-muted)" }}>to</span>
            <input
              type="date"
              value={endDate}
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
        <div className="table-header">
          <h3>Employee Activity ({employees.length})</h3>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE NAME</th>
                <th>EMAIL</th>
                <th>ORDERS TODAY</th>
                <th>RETURNS TODAY</th>
                <th>TOTAL ENTRIES</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && employees.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    No employees found
                  </td>
                </tr>
              )}
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{emp.name}</td>
                  <td>{emp.email}</td>
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
