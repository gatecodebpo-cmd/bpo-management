import { useMemo, useState, useCallback, useEffect } from "react";
import { api } from "../api/client";
import Field from "../components/Field";
import Toast from "../components/Toast";
import { isValidMobile, isValidPincode } from "../utils/validators";

const initialState = {
  customerName: "",
  mobileNumber: "",
  pincode: "",
  productType: "GPS",
  numberOfUnitsReturning: "",
  returnReason: "Product Damaged",
  customReason: "",
  additionalDescription: "",
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status) => {
  const colors = {
    "Return Requested": "var(--warning)", "Return Approved": "var(--primary)",
    "Pickup Scheduled": "var(--primary)", "Returned Successfully": "var(--success)",
    "Return Rejected": "var(--danger)",
  };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11,
      fontWeight: 600, background: `${colors[status] || "#666"}22`,
      color: colors[status] || "#666", border: `1px solid ${colors[status] || "#666"}44`,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
};

const EmployeeReturnPage = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [recentReturns, setRecentReturns] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [returnSearch, setReturnSearch] = useState("");
  const [returnDateFrom, setReturnDateFrom] = useState("");
  const [returnDateTo, setReturnDateTo] = useState("");

  const filteredReturns = useMemo(() => {
    let list = recentReturns;
    if (returnSearch.trim()) {
      const q = returnSearch.trim().toLowerCase();
      list = list.filter((r) => r.customerName?.toLowerCase().includes(q) || r.mobileNumber?.includes(q));
    }
    if (returnDateFrom) {
      const from = new Date(returnDateFrom);
      list = list.filter((r) => new Date(r.createdAt) >= from);
    }
    if (returnDateTo) {
      const to = new Date(returnDateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((r) => new Date(r.createdAt) <= to);
    }
    return list;
  }, [recentReturns, returnSearch, returnDateFrom, returnDateTo]);

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);
  const sanitizeLetters = (value) => value.replace(/[^a-zA-Z\s]/g, "");
  const preventNonNumericKey = (e) => {
    if (e.ctrlKey || e.metaKey) return;
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const validate = () => {
    const next = {};
    if (!form.customerName.trim()) next.customerName = "Customer name is required";
    if (!isValidMobile(form.mobileNumber)) next.mobileNumber = "Enter valid 10-digit mobile number";
    if (!isValidPincode(form.pincode)) next.pincode = "Enter valid 6-digit pincode";
    if (!form.numberOfUnitsReturning || Number(form.numberOfUnitsReturning) <= 0) {
      next.numberOfUnitsReturning = "Units must be > 0";
    }
    if (form.returnReason === "Other" && !form.customReason.trim()) {
      next.customReason = "Custom return reason is required";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      setTimeout(() => document.querySelector(".field-invalid")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const clearToast = useCallback(() => setToast(null), []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await api.get("/employee/returns");
      setRecentReturns(res.data?.data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  const handleEditReturn = (r) => {
    setForm({
      customerName: r.customerName || "",
      mobileNumber: r.mobileNumber || "",
      pincode: r.pincode || "",
      productType: r.productType || "GPS",
      numberOfUnitsReturning: r.numberOfUnitsReturning || "",
      returnReason: r.returnReason || "Product Damaged",
      customReason: r.customReason || "",
      additionalDescription: r.additionalDescription || "",
    });
    setEditingId(r._id);
    setTimeout(() => document.querySelector(".form-card")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const handleDeleteReturn = async (r) => {
    if (!window.confirm(`Delete return request for "${r.customerName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/employee/returns/${r._id}`);
      setToast("Return deleted successfully!");
      fetchRecent();
    } catch {
      setToast("Failed to delete return");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/employee/returns/${editingId}`, {
          ...form,
          numberOfUnitsReturning: Number(form.numberOfUnitsReturning),
        });
        setToast("Return updated successfully!");
      } else {
        await api.post("/returns", { ...form, numberOfUnitsReturning: Number(form.numberOfUnitsReturning) });
        setToast("Return request submitted successfully!");
      }
      setForm(initialState);
      setEditingId(null);
      setErrors({});
      fetchRecent();
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to submit return request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-head">
        <div>
          <h2>{editingId ? "Edit Return" : "Create New Return"}</h2>
          <p className="form-subtitle">{editingId ? "Update the return details below" : "Submit a product return request below"}</p>
        </div>
        {editingId && (
          <button type="button" className="secondary-btn" onClick={() => { setForm(initialState); setEditingId(null); setErrors({}); }}>
            Cancel
          </button>
        )}
      </div>

      <div className="form-card glass-card">
        <form className="modern-form" onSubmit={onSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Customer Information</h3>
            <div className="form-section-content">
              <Field label="Customer Name" error={errors.customerName}>
                <input
                  placeholder="Enter customer name"
                  value={form.customerName}
                  onChange={(e) => onChange("customerName", sanitizeLetters(e.target.value))}
                />
              </Field>
              <Field label="Mobile Number" error={errors.mobileNumber}>
                <input
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobileNumber}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("mobileNumber", sanitizeDigits(e.target.value, 10))}
                />
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <input
                  placeholder="6-digit pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("pincode", sanitizeDigits(e.target.value, 6))}
                />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Return Details</h3>
            <div className="form-section-content">
              <Field label="Product Type">
                <select value={form.productType} onChange={(e) => onChange("productType", e.target.value)}>
                  <option>GPS</option>
                  <option>Vending Machine</option>
                  <option>Disposal</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Number of Units" error={errors.numberOfUnitsReturning}>
                <input
                  placeholder="How many units?"
                  value={form.numberOfUnitsReturning}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("numberOfUnitsReturning", sanitizeDigits(e.target.value, 6))}
                />
              </Field>
              <Field label="Return Reason">
                <select value={form.returnReason} onChange={(e) => onChange("returnReason", e.target.value)}>
                  <option>Product Damaged</option>
                  <option>Wrong Product</option>
                  <option>Product Not Working</option>
                  <option>Extra Order</option>
                  <option>Other</option>
                </select>
              </Field>
              {form.returnReason === "Other" && (
                <Field label="Custom Reason" error={errors.customReason}>
                  <input
                    placeholder="Describe the reason"
                    value={form.customReason}
                    onChange={(e) => onChange("customReason", e.target.value)}
                  />
                </Field>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Additional Information</h3>
            <div className="form-section-content">
              <Field label="Additional Description">
                <textarea
                  value={form.additionalDescription}
                  onChange={(e) => onChange("additionalDescription", e.target.value)}
                  placeholder="Enter any additional details or notes..."
                  rows={3}
                />
              </Field>
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-btn form-submit-btn" type="submit" disabled={loading}>
              {loading ? "Submitting..." : editingId ? "Update Return" : "Submit Return Request"}
            </button>
            {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}
          </div>
        </form>
      </div>

      {recentReturns.length > 0 && (
        <div className="glass-card" style={{ marginTop: 28, padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text-heading)" }}>Recent Returns</h3>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Search by Name / Mobile</label>
              <input
                placeholder="Type to filter..."
                value={returnSearch}
                onChange={(e) => setReturnSearch(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>From</label>
              <input
                type="date"
                value={returnDateFrom}
                onChange={(e) => setReturnDateFrom(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>To</label>
              <input
                type="date"
                value={returnDateTo}
                onChange={(e) => setReturnDateTo(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
              />
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No matching returns</td></tr>
                ) : (
                  filteredReturns.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                      <td>{r.mobileNumber}</td>
                      <td>{r.productType}</td>
                      <td>{r.numberOfUnitsReturning}</td>
                      <td style={{ fontSize: 12 }}>{r.returnReason}{r.returnReason === "Other" && r.customReason ? `: ${r.customReason}` : ""}</td>
                      <td>{statusBadge(r.returnStatus)}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDateTime(r.createdAt)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => handleEditReturn(r)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 14, padding: "2px 6px" }}>&#9998;</button>
                        <button onClick={() => handleDeleteReturn(r)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 14, padding: "2px 6px" }}>&#128465;</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default EmployeeReturnPage;
