import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const FILTERS = ["today", "yesterday", "week", "month", "custom"];

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

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const EmployeeRecordPage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [history, setHistory] = useState({ orders: [], returns: [] });
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get("/auth/users");
      const emps = (res.data.data || []).filter((u) => u.role === "employee");
      setEmployees(emps);
      if (emps.length > 0 && !selectedEmployee) {
        setSelectedEmployee(emps[0]._id);
      }
    } catch {
      setEmployees([]);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!selectedEmployee) return;
    try {
      setLoading(true);
      const params = { employeeId: selectedEmployee };
      const now = new Date();
      if (filter === "today") {
        params.startDate = now.toISOString().split("T")[0];
        params.endDate = now.toISOString().split("T")[0];
      } else if (filter === "yesterday") {
        const y = new Date(now); y.setDate(y.getDate() - 1);
        params.startDate = y.toISOString().split("T")[0];
        params.endDate = y.toISOString().split("T")[0];
      } else if (filter === "week") {
        const start = new Date(now); start.setDate(start.getDate() - start.getDay());
        params.startDate = start.toISOString().split("T")[0];
        params.endDate = now.toISOString().split("T")[0];
      } else if (filter === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        params.startDate = start.toISOString().split("T")[0];
        params.endDate = now.toISOString().split("T")[0];
      } else if (filter === "custom") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      const res = await api.get("/admin/employee-history", { params });
      setHistory(res.data.data || { orders: [], returns: [] });
    } catch {
      setHistory({ orders: [], returns: [] });
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, filter, startDate, endDate]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const selectedEmp = employees.find((e) => e._id === selectedEmployee);

  const statusBadge = (status) => {
    const colors = {
      pending: { bg: "#f59e0b20", color: "#f59e0b" },
      processing: { bg: "#3b82f620", color: "#3b82f6" },
      completed: { bg: "#22c55e20", color: "#22c55e" },
      cancelled: { bg: "#ef444420", color: "#ef4444" },
    };
    const s = colors[status] || { bg: "#64748b20", color: "#64748b" };
    return (
      <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Employee Records</h2>
          <p className="page-subtitle">View each employee's orders and returns</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "end" }}>
        <label className="field-wrap" style={{ flex: 1, minWidth: 250 }}>
          <span>Select Employee</span>
          <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
            <option value="">-- Choose Employee --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="primary-btn"
            style={{
              background: filter === f ? "var(--primary)" : "var(--bg-card)",
              border: "1px solid var(--border)",
              color: filter === f ? "#fff" : "var(--text)",
              padding: "8px 16px", fontSize: 13, cursor: "pointer"
            }}
          >
            {formatLabel(f)}
          </button>
        ))}
        {filter === "custom" && (
          <>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "auto", padding: "8px 12px", fontSize: 13 }} />
            <span style={{ color: "var(--text-muted)", alignSelf: "center" }}>to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: "auto", padding: "8px 12px", fontSize: 13 }} />
          </>
        )}
      </div>

      {!selectedEmployee && (
        <div className="table-shell glass-card">
          <div className="table-header"><h3>All Employees</h3></div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>EMPLOYEE NAME</th>
                  <th>EMAIL</th>
                  <th>ORDERS TODAY</th>
                  <th>RETURNS TODAY</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Select an employee above to view their records</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <>
          {selectedEmp && (
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <div className="glass-card" style={{ flex: 1, minWidth: 200, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>{history.orders.length}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Orders</div>
              </div>
              <div className="glass-card" style={{ flex: 1, minWidth: 200, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>{history.returns.length}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Returns</div>
              </div>
              <div className="glass-card" style={{ flex: 1, minWidth: 200, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>{history.orders.length + history.returns.length}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Total Activity</div>
              </div>
            </div>
          )}

          <div className="table-shell glass-card" style={{ marginBottom: 20 }}>
            <div className="table-header">
              <h3>Orders ({history.orders.length})</h3>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>PRODUCT</th>
                    <th>QUANTITY</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Loading...</td></tr>}
                  {!loading && history.orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>No orders found</td></tr>}
                  {history.orders.map((o) => (
                    <tr key={o._id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{(o._id || "").slice(-6).toUpperCase()}</td>
                      <td>{o.customerName || "-"}</td>
                      <td>{o.productName || "-"}</td>
                      <td>{o.quantity || 0}</td>
                      <td>₹{o.totalAmount || 0}</td>
                      <td>{statusBadge(o.orderStatus || o.status)}</td>
                      <td>{formatDateTime(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-shell glass-card">
            <div className="table-header">
              <h3>Returns ({history.returns.length})</h3>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>RETURN ID</th>
                    <th>CUSTOMER</th>
                    <th>PRODUCT</th>
                    <th>REASON</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>Loading...</td></tr>}
                  {!loading && history.returns.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#64748b" }}>No returns found</td></tr>}
                  {history.returns.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{(r._id || "").slice(-6).toUpperCase()}</td>
                      <td>{r.customerName || "-"}</td>
                      <td>{r.productName || "-"}</td>
                      <td>{r.reason || r.description || "-"}</td>
                      <td>{statusBadge(r.status || r.returnStatus)}</td>
                      <td>{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default EmployeeRecordPage;