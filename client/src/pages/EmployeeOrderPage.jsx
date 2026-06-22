import { useMemo, useState, useCallback, useEffect } from "react";
import { api } from "../api/client";
import Field from "../components/Field";
import Toast from "../components/Toast";
import { isValidMobile, isValidPincode } from "../utils/validators";

const initialState = {
  customerName: "",
  mobileNumber: "",
  alternateMobileNumber: "",
  fullAddress: "",
  pincode: "",
  productType: "GPS",
  customProductName: "",
  numberOfUnits: "",
  amount: "",
  advanceAmount: "",
  description: "",
  parcelStatus: "Pending",
  trackingId: "",
  courierCompany: "",
  bankName: "",
};

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const maxFileSize = 2 * 1024 * 1024;

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const EmployeeOrderPage = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadState, setUploadState] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");

  const filteredOrders = useMemo(() => {
    let list = recentOrders;
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      list = list.filter((o) => o.customerName?.toLowerCase().includes(q) || o.mobileNumber?.includes(q));
    }
    if (orderDateFrom) {
      const from = new Date(orderDateFrom);
      list = list.filter((o) => new Date(o.createdAt) >= from);
    }
    if (orderDateTo) {
      const to = new Date(orderDateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((o) => new Date(o.createdAt) <= to);
    }
    return list;
  }, [recentOrders, orderSearch, orderDateFrom, orderDateTo]);

  const totalAmount = useMemo(() => {
    const units = Number(form.numberOfUnits || 0);
    const amount = Number(form.amount || 0);
    return units * amount;
  }, [form.numberOfUnits, form.amount]);

  const incentive = useMemo(() => {
    const units = Number(form.numberOfUnits || 0);
    const amount = Number(form.amount || 0);
    if (amount <= 3200) return amount * 0.0225 * units;
    return (amount - 3200) * units;
  }, [form.numberOfUnits, form.amount]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const getFieldClass = (key) => {
    if (!form[key]) return "";
    return errors[key] ? "field-invalid" : "field-valid";
  };

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);
  const sanitizeLetters = (value) => value.replace(/[^a-zA-Z\s]/g, "");
  const sanitizePositiveNumber = (value) => {
    if (value === "") return "";
    return value.replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, "");
  };

  const preventNonNumericKey = (e) => {
    if (e.ctrlKey || e.metaKey) return;
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const validate = (candidate = form) => {
    const next = {};
    if (!candidate.customerName.trim()) next.customerName = "Customer name is required";
    if (!isValidMobile(candidate.mobileNumber)) next.mobileNumber = "Enter valid 10-digit mobile number";
    if (candidate.alternateMobileNumber && !isValidMobile(candidate.alternateMobileNumber)) next.alternateMobileNumber = "Enter valid 10-digit number";
    if (!candidate.fullAddress.trim()) next.fullAddress = "Address is required";
    if (!isValidPincode(candidate.pincode)) next.pincode = "Enter valid 6-digit pincode";
    if (candidate.productType === "Other" && !candidate.customProductName.trim()) {
      next.customProductName = "Custom product name is required";
    }
    if (!candidate.bankName) next.bankName = "Bank name is required";
    if (!candidate.numberOfUnits || Number(candidate.numberOfUnits) <= 0) next.numberOfUnits = "Units must be > 0";
    if (candidate.amount === "" || Number(candidate.amount) < 0) next.amount = "Amount must be positive";
    if (candidate.advanceAmount === "" || Number(candidate.advanceAmount) < 0) {
      next.advanceAmount = "Advance must be positive";
    } else if (Number(candidate.advanceAmount) > totalAmount) {
      next.advanceAmount = "Advance amount cannot exceed total amount";
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

  const handleScreenshot = (file) => {
    setUploadState("");
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, paymentScreenshot: "Only JPG, JPEG and PNG allowed" }));
      return;
    }
    if (file.size > maxFileSize) {
      setErrors((prev) => ({ ...prev, paymentScreenshot: "File size must be <= 2MB" }));
      return;
    }
    setErrors((prev) => ({ ...prev, paymentScreenshot: "" }));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPaymentFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadState("Upload ready");
  };

  const removeScreenshot = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPaymentFile(null);
    setPreviewUrl("");
    setUploadState("");
  };

  const clearToast = useCallback(() => setToast(null), []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await api.get("/employee/orders");
      setRecentOrders(res.data?.data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchRecent(); }, [fetchRecent]);

  const handleEditOrder = (order) => {
    setForm({
      customerName: order.customerName || "",
      mobileNumber: order.mobileNumber || "",
      alternateMobileNumber: order.alternateMobileNumber || "",
      fullAddress: order.fullAddress || "",
      pincode: order.pincode || "",
      productType: order.productType || "GPS",
      customProductName: order.customProductName || "",
      numberOfUnits: order.numberOfUnits || "",
      amount: order.amount || "",
      advanceAmount: order.advanceAmount || "",
      description: order.description || "",
      parcelStatus: order.parcelStatus || "Pending",
      trackingId: order.trackingId || "",
      courierCompany: order.courierCompany || "",
      bankName: order.bankName || "",
      orderStatus: order.orderStatus || "Pending",
    });
    setEditingId(order._id);
    setTimeout(() => document.querySelector(".form-card")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Delete order for "${order.customerName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/employee/orders/${order._id}`);
      setToast("Order deleted successfully!");
      fetchRecent();
    } catch {
      setToast("Failed to delete order");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("customerName", form.customerName);
      payload.append("mobileNumber", form.mobileNumber);
      if (form.alternateMobileNumber) payload.append("alternateMobileNumber", form.alternateMobileNumber);
      payload.append("fullAddress", form.fullAddress);
      payload.append("pincode", form.pincode);
      payload.append("productType", form.productType);
      payload.append("customProductName", form.customProductName);
      payload.append("numberOfUnits", String(Number(form.numberOfUnits)));
      payload.append("amount", String(Number(form.amount)));
      payload.append("totalAmount", String(totalAmount));
      payload.append("advanceAmount", String(Number(form.advanceAmount)));
      payload.append("description", form.description);
      payload.append("parcelStatus", form.parcelStatus);
      payload.append("trackingId", form.trackingId);
      payload.append("courierCompany", form.courierCompany);
      payload.append("bankName", form.bankName);
      if (paymentFile) payload.append("paymentScreenshot", paymentFile);
      if (editingId) {
        await api.put(`/employee/orders/${editingId}`, {
          customerName: form.customerName,
          mobileNumber: form.mobileNumber,
          alternateMobileNumber: form.alternateMobileNumber,
          fullAddress: form.fullAddress,
          pincode: form.pincode,
          productType: form.productType,
          customProductName: form.customProductName,
          numberOfUnits: Number(form.numberOfUnits),
          amount: Number(form.amount),
          totalAmount,
          advanceAmount: Number(form.advanceAmount),
          description: form.description,
          parcelStatus: form.parcelStatus,
          trackingId: form.trackingId,
          courierCompany: form.courierCompany,
          bankName: form.bankName,
          orderStatus: form.orderStatus,
        });
        setToast("Order updated successfully!");
      } else {
        await api.post("/orders", payload);
        setToast("Order submitted successfully!");
      }
      setForm(initialState);
      setEditingId(null);
      setErrors({});
      setPaymentFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setUploadState("");
      fetchRecent();
    } catch (error) {
      setToast(error.response?.data?.message || "Failed to submit order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-head">
        <div>
          <h2>{editingId ? "Edit Order" : "Create New Order"}</h2>
          <p className="form-subtitle">{editingId ? "Update the order details below" : "Fill in the order details below"}</p>
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
                  className={getFieldClass("customerName")}
                  placeholder="Enter customer name"
                  value={form.customerName}
                  onChange={(e) => onChange("customerName", sanitizeLetters(e.target.value))}
                />
              </Field>
              <Field label="Mobile Number" error={errors.mobileNumber}>
                <input
                  className={getFieldClass("mobileNumber")}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobileNumber}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("mobileNumber", sanitizeDigits(e.target.value, 10))}
                />
              </Field>
              <Field label="Alternate Mobile (Optional)" error={errors.alternateMobileNumber}>
                <input
                  className={getFieldClass("alternateMobileNumber")}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.alternateMobileNumber}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("alternateMobileNumber", sanitizeDigits(e.target.value, 10))}
                />
              </Field>
              <Field label="Full Address" error={errors.fullAddress}>
                <textarea
                  className={getFieldClass("fullAddress")}
                  placeholder="Enter complete address"
                  value={form.fullAddress}
                  onChange={(e) => onChange("fullAddress", e.target.value)}
                />
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <input
                  className={getFieldClass("pincode")}
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
            <h3 className="form-section-title">Product Information</h3>
            <div className="form-section-content">
              <Field label="Product Type">
                <select value={form.productType} onChange={(e) => onChange("productType", e.target.value)}>
                  <option>GPS</option>
                  <option>Vending Machine</option>
                  <option>Disposal</option>
                  <option>Other</option>
                </select>
              </Field>
              {form.productType === "Other" && (
                <Field label="Custom Product Name" error={errors.customProductName}>
                  <input
                    className={getFieldClass("customProductName")}
                    placeholder="Enter product name"
                    value={form.customProductName}
                    onChange={(e) => onChange("customProductName", e.target.value)}
                  />
                </Field>
              )}
              <Field label="Number of Units" error={errors.numberOfUnits}>
                <input
                  className={getFieldClass("numberOfUnits")}
                  placeholder="How many units?"
                  inputMode="numeric"
                  value={form.numberOfUnits}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("numberOfUnits", sanitizeDigits(e.target.value, 6))}
                />
              </Field>
              <Field label="Amount per Unit" error={errors.amount}>
                <input
                  className={getFieldClass("amount")}
                  placeholder="Enter amount"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => onChange("amount", sanitizePositiveNumber(e.target.value))}
                />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Order Summary</h3>
            <div className="form-section-content">
              <Field label="Total Amount">
                <input readOnly value={formatCurrency(totalAmount)} className="readonly-input summary-value" />
              </Field>
              <Field label="Incentive">
                <input readOnly value={formatCurrency(incentive)} className="readonly-input summary-value" />
              </Field>
              <Field label="Advance Amount" error={errors.advanceAmount}>
                <input
                  className={getFieldClass("advanceAmount")}
                  placeholder="Enter advance amount"
                  inputMode="decimal"
                  value={form.advanceAmount}
                  onChange={(e) => onChange("advanceAmount", sanitizePositiveNumber(e.target.value))}
                />
              </Field>
              <Field label="Remaining Amount">
                <input readOnly value={formatCurrency(Math.max(0, totalAmount - Number(form.advanceAmount || 0)))} className="readonly-input summary-value" />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Additional Details</h3>
            <div className="form-section-content">
              <Field label="Bank Name" error={errors.bankName}>
                <select className={getFieldClass("bankName")} value={form.bankName} onChange={(e) => onChange("bankName", e.target.value)}>
                  <option value="">Select Bank</option>
                  <option value="SBI">SBI</option>
                  <option value="BOB">BOB</option>
                  <option value="BOM">BOM</option>
                  <option value="MGB">MGB</option>
                  <option value="UPGB">UPGB</option>
                  <option value="MPGB">MPGB</option>
                </select>
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  placeholder="Enter any additional order details or notes..."
                  rows={3}
                />
              </Field>
              <Field label="Parcel Status">
                <select value={form.parcelStatus} onChange={(e) => onChange("parcelStatus", e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Process">Process</option>
                  <option value="Parcel">Parcel</option>
                  <option value="Packed">Packed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </Field>
              <Field label="Tracking ID">
                <input
                  placeholder="Enter tracking ID"
                  value={form.trackingId}
                  onChange={(e) => onChange("trackingId", e.target.value)}
                />
              </Field>
              <Field label="Courier Company">
                <input
                  placeholder="Enter courier company name"
                  value={form.courierCompany}
                  onChange={(e) => onChange("courierCompany", e.target.value)}
                />
              </Field>
              <Field label="Payment Screenshot (Optional)" error={errors.paymentScreenshot}>
                <div className={`upload-box ${errors.paymentScreenshot ? "upload-error" : paymentFile ? "upload-ok" : ""}`}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(e) => handleScreenshot(e.target.files?.[0])}
                  />
                  <p>Upload JPG, JPEG, PNG (max 2MB)</p>
                  {uploadState && <small className="upload-state">{uploadState}</small>}
                </div>
                {previewUrl && (
                  <div className="upload-preview">
                    <img src={previewUrl} alt="Payment preview" />
                    <button type="button" onClick={removeScreenshot}>Remove</button>
                  </div>
                )}
              </Field>
              {editingId && (
                <Field label="Order Status">
                  <select value={form.orderStatus} onChange={(e) => onChange("orderStatus", e.target.value)}>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Processing</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </Field>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-btn form-submit-btn" type="submit" disabled={loading}>
              {loading ? "Submitting..." : editingId ? "Update Order" : "Submit Order"}
            </button>
            {toast && <Toast message={toast} type={toast.includes("successfully") ? "success" : "error"} onClose={clearToast} />}
          </div>
        </form>
      </div>

      {recentOrders.length > 0 && (
        <div className="glass-card" style={{ marginTop: 28, padding: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text-heading)" }}>Recent Orders</h3>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Search by Name / Mobile</label>
              <input
                placeholder="Type to filter..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>From</label>
              <input
                type="date"
                value={orderDateFrom}
                onChange={(e) => setOrderDateFrom(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>To</label>
              <input
                type="date"
                value={orderDateTo}
                onChange={(e) => setOrderDateTo(e.target.value)}
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
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>No matching orders</td></tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 600 }}>{o.customerName}</td>
                      <td>{o.mobileNumber}</td>
                      <td>{o.productType}</td>
                      <td>{o.numberOfUnits}</td>
                      <td style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(o.totalAmount || 0))}
                      </td>
                      <td><span className="status-badge" style={{ background: "rgba(6,182,212,0.12)", color: "var(--primary)" }}>{o.orderStatus}</span></td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDateTime(o.createdAt)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => handleEditOrder(o)} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 14, padding: "2px 6px" }}>&#9998;</button>
                        <button onClick={() => handleDeleteOrder(o)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 14, padding: "2px 6px" }}>&#128465;</button>
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

export default EmployeeOrderPage;
