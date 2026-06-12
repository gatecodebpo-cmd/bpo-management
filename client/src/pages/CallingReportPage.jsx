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

const CallingReportPage = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get("/auth/users");
      const emps = (res.data.data || []).filter((u) => u.role === "employee");
      setEmployees(emps);
    } catch {
      setEmployees([]);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedEmployee) params.employeeId = selectedEmployee;

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

      const res = await api.get("/calling-records", { params });
      setRecords(res.data.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, filter, startDate, endDate]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const totals = records.reduce(
    (acc, r) => {
      acc.outgoingCalls += r.outgoingCalls || 0;
      acc.incomingCalls += r.incomingCalls || 0;
      acc.connectedCalls += r.connectedCalls || 0;
      acc.notConnectedCalls += r.notConnectedCalls || 0;
      acc.interestedLeads += r.interestedLeads || 0;
      acc.notInterestedLeads += r.notInterestedLeads || 0;
      acc.followUpCalls += r.followUpCalls || 0;
      acc.followUpLeads += r.followUpLeads || 0;
      acc.conversionsDone += r.conversionsDone || 0;
      acc.revenueGenerated += r.revenueGenerated || 0;
      return acc;
    },
    {
      outgoingCalls: 0, incomingCalls: 0, connectedCalls: 0,
      notConnectedCalls: 0, interestedLeads: 0, notInterestedLeads: 0,
      followUpCalls: 0, followUpLeads: 0, conversionsDone: 0, revenueGenerated: 0
    }
  );

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Calling Report</h2>
          <p className="page-subtitle">Track daily calling performance and lead generation</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "end" }}>
        <label className="field-wrap" style={{ flex: 1, minWidth: 250 }}>
          <span>Select Executive</span>
          <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
            <option value="">-- All Executives --</option>
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
        <button onClick={fetchRecords} className="primary-btn" style={{ padding: "8px 16px", fontSize: 13 }}>
          Refresh
        </button>
      </div>

      {records.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <SummaryCard label="Total Outgoing" value={totals.outgoingCalls} color="#3b82f6" />
          <SummaryCard label="Total Incoming" value={totals.incomingCalls} color="#8b5cf6" />
          <SummaryCard label="Connected" value={totals.connectedCalls} color="#22c55e" />
          <SummaryCard label="Not Connected" value={totals.notConnectedCalls} color="#ef4444" />
          <SummaryCard label="Interested" value={totals.interestedLeads} color="#f59e0b" />
          <SummaryCard label="Conversions" value={totals.conversionsDone} color="#06b6d4" />
          <SummaryCard label="Revenue" value={`₹${totals.revenueGenerated}`} color="#10b981" />
        </div>
      )}

      <div className="table-shell glass-card">
        <div className="table-header">
          <h3>Calling Records ({records.length})</h3>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>EXECUTIVE</th>
                <th>OUTGOING</th>
                <th>INCOMING</th>
                <th>CONNECTED</th>
                <th>NOT CONNECTED</th>
                <th>INTERESTED</th>
                <th>NOT INTERESTED</th>
                <th>FOLLOW-UP CALLS</th>
                <th>FOLLOW-UP LEADS</th>
                <th>TOTAL CALLS</th>
                <th>CONVERSIONS</th>
                <th>REVENUE</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    No calling records found
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{formatDate(r.date)}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{r.employeeName}</td>
                  <td>{r.outgoingCalls || 0}</td>
                  <td>{r.incomingCalls || 0}</td>
                  <td>{r.connectedCalls || 0}</td>
                  <td>{r.notConnectedCalls || 0}</td>
                  <td>{r.interestedLeads || 0}</td>
                  <td>{r.notInterestedLeads || 0}</td>
                  <td>{r.followUpCalls || 0}</td>
                  <td>{r.followUpLeads || 0}</td>
                  <td style={{ fontWeight: 600 }}>{(r.outgoingCalls || 0) + (r.incomingCalls || 0)}</td>
                  <td>{r.conversionsDone || 0}</td>
                  <td style={{ fontWeight: 600 }}>₹{r.revenueGenerated || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div className="glass-card" style={{ flex: 1, minWidth: 130, padding: "16px 20px", textAlign: "center" }}>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
  </div>
);

export default CallingReportPage;
