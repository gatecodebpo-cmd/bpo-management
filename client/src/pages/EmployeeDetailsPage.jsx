import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api/client";

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const statusBadge = (status) => {
  const s = (status || "").toLowerCase();
  const map = {
    pending: "#f59e0b", approved: "#3b82f6", processing: "#3b82f6",
    delivered: "#22c55e", cancelled: "#ef4444", "return requested": "#f59e0b",
    "return approved": "#3b82f6", "pickup scheduled": "#3b82f6",
    "returned successfully": "#22c55e", "return rejected": "#ef4444"
  };
  const c = map[s] || "#64748b";
  return <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: `${c}20`, color: c }}>{status}</span>;
};

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const downloadEmployeePDF = async (employee, startDate, endDate) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await api.get(`/admin/employee-details/${employee._id}`, { params });
    const { orders, returns, callingRecords } = res.data.data;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Employee Details Report", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const rangeText = startDate || endDate ? `Period: ${startDate || "..."} to ${endDate || "..."}` : "Period: All Time";
    const info = [
      ["Name", employee.name],
      ["Email", employee.email],
      ["Phone", employee.phoneNumber || "-"],
      ["Username", employee.username || "-"],
      [rangeText.split(":")[0], rangeText.split(":").slice(1).join(":").trim()],
      ["Generated", new Date().toLocaleDateString("en-IN")]
    ];
    info.forEach(([l, v]) => {
      doc.setFont("helvetica", "bold"); doc.text(`${l}:`, 14, y);
      const tw = doc.getTextWidth(`${l}: `);
      doc.setFont("helvetica", "normal"); doc.text(v, 14 + tw + 2, y);
      y += 7;
    });
    y += 8;

    if (orders.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(`Orders (${orders.length})`, 14, y); y += 8;
      autoTable(doc, {
        startY: y, theme: "grid",
        head: [["ID", "Customer", "Product", "Qty", "Amount", "Status", "Date"]],
        body: orders.map((o) => [
          (o._id || "").slice(-6).toUpperCase(), o.customerName || "-",
          o.productType || "-", o.numberOfUnits || 0,
          `Rs.${o.totalAmount || 0}`, o.orderStatus || "-", formatDate(o.createdAt)
        ]),
        headStyles: { fillColor: [6, 182, 212], fontSize: 9 },
        bodyStyles: { fontSize: 8 }, styles: { cellPadding: 2 }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    if (returns.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(`Returns (${returns.length})`, 14, y); y += 8;
      autoTable(doc, {
        startY: y, theme: "grid",
        head: [["ID", "Customer", "Product", "Qty", "Reason", "Status", "Date"]],
        body: returns.map((r) => [
          (r._id || "").slice(-6).toUpperCase(), r.customerName || "-",
          r.productType || "-", r.numberOfUnitsReturning || 0,
          r.returnReason || "-", r.returnStatus || "-", formatDate(r.createdAt)
        ]),
        headStyles: { fillColor: [245, 158, 11], fontSize: 9 },
        bodyStyles: { fontSize: 8 }, styles: { cellPadding: 2 }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    if (callingRecords.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text(`Calling Records (${callingRecords.length})`, 14, y); y += 8;
      autoTable(doc, {
        startY: y, theme: "grid",
        head: [["Date", "Outgoing", "Incoming", "Connected", "Interested", "Conversions", "Revenue"]],
        body: callingRecords.map((c) => [
          formatDate(c.date), c.outgoingCalls || 0, c.incomingCalls || 0,
          c.connectedCalls || 0, c.interestedLeads || 0,
          c.conversionsDone || 0, `Rs.${c.revenueGenerated || 0}`
        ]),
        headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
        bodyStyles: { fontSize: 8 }, styles: { cellPadding: 2 }
      });
    }

    doc.save(`${employee.name.replace(/\s+/g, "_")}_Report.pdf`);
  } catch (err) {
    alert("Failed to generate PDF: " + (err.response?.data?.message || err.message));
  }
};

const EmployeeDetailsPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get("/admin/employee-summary", { params });
      setEmployees(res.data.data || []);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter((e) =>
      (e.name || "").toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q) ||
      (e.phoneNumber || "").toLowerCase().includes(q) ||
      (e.username || "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  const handleSelect = async (emp) => {
    setSelected(emp);
    setDetailsLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get(`/admin/employee-details/${emp._id}`, { params });
      setDetails(res.data.data);
    } catch {
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownload = async (emp) => {
    setDownloading(emp._id);
    await downloadEmployeePDF(emp, startDate, endDate);
    setDownloading(null);
  };

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Employee Details</h2>
          <p className="page-subtitle">View all employee data with orders, returns & calling records</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "end" }}>
        <label className="field-wrap" style={{ minWidth: 160 }}>
          <span>From Date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="field-wrap" style={{ minWidth: 160 }}>
          <span>To Date</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        {(startDate || endDate) && (
          <button className="primary-btn" style={{ background: "#64748b" }} onClick={() => { setStartDate(""); setEndDate(""); }}>
            Clear Filter
          </button>
        )}
      </div>

      <div className="table-shell glass-card" style={{ marginBottom: 20 }}>
        <div className="table-header">
          <h3>All Employees ({filtered.length})</h3>
          <div className="table-controls">
            <div style={{ position: "relative" }}>
              <SearchIcon />
              <input
                placeholder="Search by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 32, minWidth: 0, width: "100%" }}
              />
            </div>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>USERNAME</th>
                <th>ORDERS</th>
                <th>RETURNS</th>
                <th>CALLING</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>Loading...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>No employees found</td></tr>}
              {filtered.map((emp) => (
                <tr key={emp._id} style={{ cursor: "pointer", background: selected?._id === emp._id ? "rgba(6,182,212,0.06)" : "transparent" }} onClick={() => handleSelect(emp)}>
                  <td style={{ fontWeight: 600 }}>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phoneNumber || "-"}</td>
                  <td>{emp.username || "-"}</td>
                  <td><span style={{ fontWeight: 700, color: "#3b82f6" }}>{emp.orderCount || 0}</span></td>
                  <td><span style={{ fontWeight: 700, color: "#f59e0b" }}>{emp.returnCount || 0}</span></td>
                  <td><span style={{ fontWeight: 700, color: "#10b981" }}>{emp.callingCount || 0}</span></td>
                  <td>
                    <button
                      className="primary-btn"
                      style={{ padding: "6px 14px", fontSize: 12, background: "#10b981" }}
                      onClick={(e) => { e.stopPropagation(); handleDownload(emp); }}
                      disabled={downloading === emp._id}
                    >
                      {downloading === emp._id ? "Generating..." : "PDF"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text-heading)" }}>
              {selected.name} — Full Details
              {(startDate || endDate) && <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 12 }}>({startDate || "..."} to {endDate || "..."})</span>}
            </h3>
            <button
              className="primary-btn"
              style={{ padding: "6px 14px", fontSize: 12, background: "#64748b" }}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          {detailsLoading && <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading details...</p>}

          {details && (
            <>
              <div className="table-shell glass-card" style={{ padding: 20, marginBottom: 20 }}>
                <div className="table-header"><h3>Orders ({details.orders.length})</h3></div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {details.orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No orders</td></tr>}
                      {details.orders.map((o) => (
                        <tr key={o._id}>
                          <td style={{ fontFamily: "monospace", fontSize: 12 }}>{(o._id || "").slice(-6).toUpperCase()}</td>
                          <td>{o.customerName || "-"}</td>
                          <td>{o.productType || "-"}</td>
                          <td>{o.numberOfUnits || 0}</td>
                          <td>Rs.{o.totalAmount || 0}</td>
                          <td>{statusBadge(o.orderStatus)}</td>
                          <td>{formatDateTime(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="table-shell glass-card" style={{ padding: 20, marginBottom: 20 }}>
                <div className="table-header"><h3>Returns ({details.returns.length})</h3></div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Reason</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {details.returns.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No returns</td></tr>}
                      {details.returns.map((r) => (
                        <tr key={r._id}>
                          <td style={{ fontFamily: "monospace", fontSize: 12 }}>{(r._id || "").slice(-6).toUpperCase()}</td>
                          <td>{r.customerName || "-"}</td>
                          <td>{r.productType || "-"}</td>
                          <td>{r.numberOfUnitsReturning || 0}</td>
                          <td>{r.returnReason || "-"}</td>
                          <td>{statusBadge(r.returnStatus)}</td>
                          <td>{formatDateTime(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="table-shell glass-card" style={{ padding: 20 }}>
                <div className="table-header"><h3>Calling Records ({details.callingRecords.length})</h3></div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Outgoing</th><th>Incoming</th><th>Connected</th><th>Interested</th><th>Conversions</th><th>Revenue</th></tr>
                    </thead>
                    <tbody>
                      {details.callingRecords.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No calling records</td></tr>}
                      {details.callingRecords.map((c) => (
                        <tr key={c._id}>
                          <td>{formatDate(c.date)}</td>
                          <td>{c.outgoingCalls || 0}</td>
                          <td>{c.incomingCalls || 0}</td>
                          <td>{c.connectedCalls || 0}</td>
                          <td>{c.interestedLeads || 0}</td>
                          <td>{c.conversionsDone || 0}</td>
                          <td>Rs.{c.revenueGenerated || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default EmployeeDetailsPage;
