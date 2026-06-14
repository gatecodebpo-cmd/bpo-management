import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

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

const initialState = {
  date: new Date().toISOString().split("T")[0],
  outgoingCalls: "",
  incomingCalls: "",
  connectedCalls: "",
  notConnectedCalls: "",
  interestedLeads: "",
  notInterestedLeads: "",
  followUpCalls: "",
  followUpLeads: "",
  conversionsDone: "",
  revenueGenerated: "",
};

const EmployeeCallingPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
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
      const res = await api.get("/employee/calling-records", { params });
      setRecords(res.data.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filter, startDate, endDate]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        date: form.date,
        outgoingCalls: Number(form.outgoingCalls) || 0,
        incomingCalls: Number(form.incomingCalls) || 0,
        connectedCalls: Number(form.connectedCalls) || 0,
        notConnectedCalls: Number(form.notConnectedCalls) || 0,
        interestedLeads: Number(form.interestedLeads) || 0,
        notInterestedLeads: Number(form.notInterestedLeads) || 0,
        followUpCalls: Number(form.followUpCalls) || 0,
        followUpLeads: Number(form.followUpLeads) || 0,
        conversionsDone: Number(form.conversionsDone) || 0,
        revenueGenerated: Number(form.revenueGenerated) || 0,
      };
      await api.post("/employee/calling-records", payload);
      setForm(initialState);
      fetchRecords();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      const payload = {
        date: form.date,
        outgoingCalls: Number(form.outgoingCalls) || 0,
        incomingCalls: Number(form.incomingCalls) || 0,
        connectedCalls: Number(form.connectedCalls) || 0,
        notConnectedCalls: Number(form.notConnectedCalls) || 0,
        interestedLeads: Number(form.interestedLeads) || 0,
        notInterestedLeads: Number(form.notInterestedLeads) || 0,
        followUpCalls: Number(form.followUpCalls) || 0,
        followUpLeads: Number(form.followUpLeads) || 0,
        conversionsDone: Number(form.conversionsDone) || 0,
        revenueGenerated: Number(form.revenueGenerated) || 0,
      };
      await api.put(`/employee/calling-records/${editingId}`, payload);
      setForm(initialState);
      setEditingId(null);
      fetchRecords();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialState);
    setEditingId(null);
  };

  const handleEdit = (record) => {
    setForm({
      date: record.date ? record.date.split("T")[0] : "",
      outgoingCalls: record.outgoingCalls || "",
      incomingCalls: record.incomingCalls || "",
      connectedCalls: record.connectedCalls || "",
      notConnectedCalls: record.notConnectedCalls || "",
      interestedLeads: record.interestedLeads || "",
      notInterestedLeads: record.notInterestedLeads || "",
      followUpCalls: record.followUpCalls || "",
      followUpLeads: record.followUpLeads || "",
      conversionsDone: record.conversionsDone || "",
      revenueGenerated: record.revenueGenerated || "",
    });
    setEditingId(record._id);
  };

  const totalCalls = (Number(form.outgoingCalls) || 0) + (Number(form.incomingCalls) || 0);

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Calling Report</h2>
          <p className="page-subtitle">Submit your daily calling performance</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>{editingId ? "Update Calling Record" : "New Calling Record"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          <label className="field-wrap">
            <span>Date</span>
            <input type="date" name="date" value={form.date} onChange={handleChange} />
          </label>
          <label className="field-wrap">
            <span>Executive Name</span>
            <input type="text" value={user?.name || "Employee"} readOnly disabled />
          </label>
          <label className="field-wrap">
            <span>Outgoing Calls</span>
            <input type="number" name="outgoingCalls" value={form.outgoingCalls} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Incoming Calls</span>
            <input type="number" name="incomingCalls" value={form.incomingCalls} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Connected Calls</span>
            <input type="number" name="connectedCalls" value={form.connectedCalls} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Not Connected Calls</span>
            <input type="number" name="notConnectedCalls" value={form.notConnectedCalls} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Interested Leads</span>
            <input type="number" name="interestedLeads" value={form.interestedLeads} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Not Interested Leads</span>
            <input type="number" name="notInterestedLeads" value={form.notInterestedLeads} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Follow-up Calls</span>
            <input type="number" name="followUpCalls" value={form.followUpCalls} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Follow-up Leads</span>
            <input type="number" name="followUpLeads" value={form.followUpLeads} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Total Calls Done</span>
            <input type="number" value={totalCalls} readOnly disabled style={{ fontWeight: 700, color: "var(--primary)" }} />
          </label>
          <label className="field-wrap">
            <span>Conversions Done</span>
            <input type="number" name="conversionsDone" value={form.conversionsDone} onChange={handleChange} min="0" />
          </label>
          <label className="field-wrap">
            <span>Revenue Generated (₹)</span>
            <input type="number" name="revenueGenerated" value={form.revenueGenerated} onChange={handleChange} min="0" />
          </label>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {editingId ? (
            <button className="primary-btn" onClick={handleUpdate} disabled={saving}>
              {saving ? "Updating..." : "Update"}
            </button>
          ) : (
            <button className="primary-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          )}
          <button className="primary-btn" onClick={handleReset} style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }}>
            Reset
          </button>
        </div>
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
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
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
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => handleEdit(r)}
                        className="primary-btn"
                        style={{ padding: "4px 12px", fontSize: 12 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete calling record from ${formatDate(r.date)}?`)) return;
                          await api.delete(`/employee/calling-records/${r._id}`);
                          fetchRecords();
                        }}
                        style={{ padding: "4px 10px", fontSize: 11, background: "none", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default EmployeeCallingPage;
