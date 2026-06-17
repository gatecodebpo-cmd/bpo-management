import { useCallback, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api/client";

const initialState = {
  customerName: "",
  mobile: "",
  email: "",
  remark: "",
  district: "",
  state: "",
  distCordinate: "",
  followUp: "Convert"
};

const downloadCustomerPDF = (customers) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("My Customer Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Customers: ${customers.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["#", "Name", "Mobile", "Email", "Remark", "District", "State", "Follow Up", "Date"]],
    body: customers.map((c, i) => [
      i + 1,
      c.customerName || "-",
      c.mobile || "-",
      c.email || "-",
      c.remark || "-",
      c.district || "-",
      c.state || "-",
      c.followUp || "-",
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"
    ]),
    headStyles: { fillColor: [139, 92, 246], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7 },
    styles: { cellPadding: 1.5 },
    margin: { left: 14 }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save("My_Customer_Report.pdf");
};

const EmployeeCustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialState);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState("All");

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/customers");
      setCustomers(res.data.data || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const onlyLetters = (val) => val.replace(/[^a-zA-Z\s]/g, "");
  const onlyDigits = (val) => val.replace(/\D/g, "").slice(0, 10);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "customerName" || name === "district" || name === "state") {
      setForm((prev) => ({ ...prev, [name]: onlyLetters(value) }));
    } else if (name === "mobile") {
      setForm((prev) => ({ ...prev, [name]: onlyDigits(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!form.customerName.trim() || !form.mobile.trim()) return;
    try {
      setSaving(true);
      await api.post("/customers", form);
      setForm(initialState);
      fetchCustomers();
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
      await api.put(`/customers/${editingId}`, form);
      setForm(initialState);
      setEditingId(null);
      fetchCustomers();
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

  const handleEdit = (customer) => {
    setForm({
      customerName: customer.customerName || "",
      mobile: customer.mobile || "",
      email: customer.email || "",
      remark: customer.remark || "",
      district: customer.district || "",
      state: customer.state || "",
      distCordinate: customer.distCordinate || "",
      followUp: customer.followUp || "Convert"
    });
    setEditingId(customer._id);
  };

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Customer Information</h2>
          <p className="page-subtitle">Add or manage customer details</p>
        </div>
        <button className="primary-btn" style={{ background: "#10b981" }} onClick={() => downloadCustomerPDF(customers)}>
          Download PDF
        </button>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>
          {editingId ? "Update Customer" : "New Customer"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          <label className="field-wrap">
            <span>Customer Name *</span>
            <input type="text" name="customerName" value={form.customerName} onChange={handleChange} placeholder="Enter name" />
          </label>
          <label className="field-wrap">
            <span>Mobile No. *</span>
            <input type="text" name="mobile" value={form.mobile} onChange={handleChange} placeholder="Enter mobile" />
          </label>
          <label className="field-wrap">
            <span>Email ID</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter email" />
          </label>
          <label className="field-wrap">
            <span>Remark</span>
            <input type="text" name="remark" value={form.remark} onChange={handleChange} placeholder="Any remark" />
          </label>
          <label className="field-wrap">
            <span>District</span>
            <input type="text" name="district" value={form.district} onChange={handleChange} placeholder="Enter district" />
          </label>
          <label className="field-wrap">
            <span>State</span>
            <input type="text" name="state" value={form.state} onChange={handleChange} placeholder="Enter state" />
          </label>
          <label className="field-wrap">
            <span>Dist Cordinate</span>
            <select name="distCordinate" value={form.distCordinate} onChange={handleChange}>
              <option value="">Select</option>
              <option value="CSP Incharge">CSP Incharge</option>
              <option value="DC">DC</option>
              <option value="SH">SH</option>
              <option value="NH">NH</option>
            </select>
          </label>
          <label className="field-wrap">
            <span>Follow Up</span>
            <select name="followUp" value={form.followUp} onChange={handleChange}>
              <option value="Convert">Convert</option>
              <option value="Converted">Converted</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {editingId ? (
            <button className="primary-btn" onClick={handleUpdate} disabled={saving}>
              {saving ? "Updating..." : "Update"}
            </button>
          ) : (
            <button className="primary-btn" onClick={handleSave} disabled={saving || !form.customerName.trim() || !form.mobile.trim()}>
              {saving ? "Saving..." : "Save"}
            </button>
          )}
          <button className="primary-btn" onClick={handleReset} style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }}>
            Reset
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Filter by Follow Up:</span>
        <select
          value={followUpFilter}
          onChange={(e) => setFollowUpFilter(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13 }}
        >
          <option value="All">All</option>
          <option value="Convert">Convert</option>
          <option value="Converted">Converted</option>
        </select>
      </div>

      {(() => {
        const filtered = followUpFilter === "All"
          ? customers
          : customers.filter((c) => c.followUp === followUpFilter);
        return (
      <div className="table-shell glass-card">
        <div className="table-header">
          <h3>Customer Records ({filtered.length}/{customers.length})</h3>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CUSTOMER NAME</th>
                <th>MOBILE</th>
                <th>EMAIL</th>
                <th>REMARK</th>
                <th>DISTRICT</th>
                <th>STATE</th>
                <th>DIST CORDINATE</th>
                <th>FOLLOW UP</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                    {customers.length === 0 ? "No customer records found" : "No records match the selected filter"}
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>{c.customerName}</td>
                  <td>{c.mobile}</td>
                  <td>{c.email || "-"}</td>
                  <td>{c.remark || "-"}</td>
                  <td>{c.district || "-"}</td>
                  <td>{c.state || "-"}</td>
                  <td>{c.distCordinate || "-"}</td>
                  <td>
                    <span style={{
                      padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: c.followUp === "Converted" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
                      color: c.followUp === "Converted" ? "#22c55e" : "#3b82f6"
                    }}>
                      {c.followUp}
                    </span>
                  </td>
                  <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleEdit(c)} className="primary-btn" style={{ padding: "4px 12px", fontSize: 12 }}>
                        Edit
                      </button>
                      <button onClick={async () => {
                        if (!window.confirm(`Delete customer ${c.customerName}?`)) return;
                        await api.delete(`/customers/${c._id}`);
                        fetchCustomers();
                      }} style={{ padding: "4px 10px", fontSize: 11, background: "none", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}>
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
        );
      })()}
    </section>
  );
};

export default EmployeeCustomerPage;
