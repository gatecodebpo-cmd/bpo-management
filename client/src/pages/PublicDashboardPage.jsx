import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Field from "../components/Field";
import { isValidMobile, isValidPincode } from "../utils/validators";

const orderInitialState = {
  customerName: "",
  mobileNumber: "",
  fullAddress: "",
  pincode: "",
  productType: "GPS",
  customProductName: "",
  numberOfUnits: "",
  amount: "",
  advanceAmount: "",
  description: "",
};

const returnInitialState = {
  customerName: "",
  mobileNumber: "",
  pincode: "",
  productType: "GPS",
  numberOfUnitsReturning: "",
  returnReason: "Product Damaged",
  customReason: "",
  additionalDescription: "",
};

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const maxFileSize = 2 * 1024 * 1024;

const PublicDashboardPage = () => {
  const navigate = useNavigate();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [orderForm, setOrderForm] = useState(orderInitialState);
  const [returnForm, setReturnForm] = useState(returnInitialState);
  const [orderErrors, setOrderErrors] = useState({});
  const [returnErrors, setReturnErrors] = useState({});
  const [orderLoading, setOrderLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [returnMessage, setReturnMessage] = useState("");
  const [paymentFile, setPaymentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadState, setUploadState] = useState("");

  const totalAmount = useMemo(() => {
    const units = Number(orderForm.numberOfUnits || 0);
    const amount = Number(orderForm.amount || 0);
    return units * amount;
  }, [orderForm.numberOfUnits, orderForm.amount]);

  const incentive = useMemo(() => {
    const units = Number(orderForm.numberOfUnits || 0);
    const amount = Number(orderForm.amount || 0);
    if (amount <= 3200) return amount * 0.0225 * units;
    return (amount - 3200) * units;
  }, [orderForm.numberOfUnits, orderForm.amount]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);
  const sanitizeLetters = (value) => value.replace(/[^a-zA-Z\s]/g, "");
  const sanitizePositiveNumber = (value) => {
    if (value === "") return "";
    return value.replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, "");
  };

  const preventNonNumericKey = (e) => {
    if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const getFieldClass = (key, isOrder = true) => {
    const form = isOrder ? orderForm : returnForm;
    const errors = isOrder ? orderErrors : returnErrors;
    if (!form[key]) return "";
    return errors[key] ? "field-invalid" : "field-valid";
  };

  const validateOrder = (candidate = orderForm) => {
    const next = {};
    if (!candidate.customerName.trim()) next.customerName = "Customer name is required";
    if (!isValidMobile(candidate.mobileNumber)) next.mobileNumber = "Enter valid 10-digit mobile number";
    if (!candidate.fullAddress.trim()) next.fullAddress = "Address is required";
    if (!isValidPincode(candidate.pincode)) next.pincode = "Enter valid 6-digit pincode";
    if (candidate.productType === "Other" && !candidate.customProductName.trim()) {
      next.customProductName = "Custom product name is required";
    }
    if (!candidate.numberOfUnits || Number(candidate.numberOfUnits) <= 0) next.numberOfUnits = "Units must be > 0";
    if (candidate.amount === "" || Number(candidate.amount) < 0) next.amount = "Amount must be positive";
    if (candidate.advanceAmount === "" || Number(candidate.advanceAmount) < 0) {
      next.advanceAmount = "Advance must be positive";
    } else if (Number(candidate.advanceAmount) > totalAmount) {
      next.advanceAmount = "Advance amount cannot exceed total amount";
    }
    if (!paymentFile) next.paymentScreenshot = "Payment screenshot is required";
    setOrderErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateReturn = (candidate = returnForm) => {
    const next = {};
    if (!candidate.customerName.trim()) next.customerName = "Customer name is required";
    if (!isValidMobile(candidate.mobileNumber)) next.mobileNumber = "Enter valid 10-digit mobile number";
    if (!isValidPincode(candidate.pincode)) next.pincode = "Enter valid 6-digit pincode";
    if (!candidate.numberOfUnitsReturning || Number(candidate.numberOfUnitsReturning) <= 0) {
      next.numberOfUnitsReturning = "Units must be > 0";
    }
    if (candidate.returnReason === "Other" && !candidate.customReason.trim()) {
      next.customReason = "Custom return reason is required";
    }
    setReturnErrors(next);
    return Object.keys(next).length === 0;
  };

  const onOrderChange = (key, value) => {
    const updated = { ...orderForm, [key]: value };
    setOrderForm(updated);
    validateOrder(updated);
  };

  const onReturnChange = (key, value) => setReturnForm((prev) => ({ ...prev, [key]: value }));

  const handleScreenshot = (file) => {
    setUploadState("");
    if (!file) return;
    if (!allowedImageTypes.includes(file.type)) {
      setOrderErrors((prev) => ({ ...prev, paymentScreenshot: "Only JPG, JPEG and PNG allowed" }));
      return;
    }
    if (file.size > maxFileSize) {
      setOrderErrors((prev) => ({ ...prev, paymentScreenshot: "File size must be <= 2MB" }));
      return;
    }
    setOrderErrors((prev) => ({ ...prev, paymentScreenshot: "" }));
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
    setOrderErrors((prev) => ({ ...prev, paymentScreenshot: "Payment screenshot is required" }));
  };

  const onOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderMessage("");
    if (!validateOrder()) return;
    try {
      setOrderLoading(true);
      const payload = new FormData();
      payload.append("customerName", orderForm.customerName);
      payload.append("mobileNumber", orderForm.mobileNumber);
      payload.append("fullAddress", orderForm.fullAddress);
      payload.append("pincode", orderForm.pincode);
      payload.append("productType", orderForm.productType);
      payload.append("customProductName", orderForm.customProductName);
      payload.append("numberOfUnits", String(Number(orderForm.numberOfUnits)));
      payload.append("amount", String(Number(orderForm.amount)));
      payload.append("totalAmount", String(totalAmount));
      payload.append("advanceAmount", String(Number(orderForm.advanceAmount)));
      payload.append("description", orderForm.description);
      if (paymentFile) payload.append("paymentScreenshot", paymentFile);
      await api.post("/orders", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setOrderMessage("Order submitted successfully.");
      setOrderForm(orderInitialState);
      setOrderErrors({});
      setPaymentFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setUploadState("");
    } catch (error) {
      setOrderMessage(error.response?.data?.message || "Failed to submit order");
    } finally {
      setOrderLoading(false);
    }
  };

  const onReturnSubmit = async (e) => {
    e.preventDefault();
    setReturnMessage("");
    if (!validateReturn()) return;
    try {
      setReturnLoading(true);
      await api.post("/returns", { ...returnForm, numberOfUnitsReturning: Number(returnForm.numberOfUnitsReturning) });
      setReturnMessage("Return request submitted successfully.");
      setReturnForm(returnInitialState);
      setReturnErrors({});
    } catch (error) {
      setReturnMessage(error.response?.data?.message || "Failed to submit return request");
    } finally {
      setReturnLoading(false);
    }
  };

  return (
    <div className="public-page">
      <section className="admin-page" style={{ padding: "40px 32px" }}>
        <div className="admin-head">
          <div>
            <h2>Dashboard</h2>
            <p className="page-subtitle">Create New Orders & Returns</p>
          </div>
        </div>

        {!showOrderForm && !showReturnForm && (
          <div className="stats-grid">
            <button
              onClick={() => setShowOrderForm(true)}
              className="stat-card glass-card blue"
              style={{ border: "none", cursor: "pointer", background: "inherit" }}
            >
              <div className="stat-icon blue">
                <svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 2h12l4 4v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6l4-4z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg>
              </div>
              <div className="stat-info">
                <p>Create New Order</p>
                <h3>→</h3>
                <small>Fill in order details</small>
              </div>
            </button>

            <button
              onClick={() => setShowReturnForm(true)}
              className="stat-card glass-card pink"
              style={{ border: "none", cursor: "pointer", background: "inherit" }}
            >
              <div className="stat-icon pink">
                <svg viewBox="0 0 24 24" width="24" height="24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
              </div>
              <div className="stat-info">
                <p>Create New Return</p>
                <h3>→</h3>
                <small>Submit return request</small>
              </div>
            </button>
          </div>
        )}

        {showOrderForm && (
          <div className="form-card glass-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ margin: "0 0 8px 0" }}>Create New Order</h2>
                <p className="form-subtitle" style={{ margin: 0 }}>Fill in the order details below</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  style={{
                    background: "var(--border)",
                    color: "var(--text)",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500
                  }}
                >
                  Back
                </button>
                <button onClick={() => setShowOrderForm(false)} style={{ cursor: "pointer", background: "none", border: "none", color: "var(--text-muted)", fontSize: "28px", padding: "0", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            </div>
            <form className="modern-form" onSubmit={onOrderSubmit}>
              <div className="form-section">
                <h3 className="form-section-title">Customer Information</h3>
                <div className="form-section-content">
                  <Field label="Customer Name" error={orderErrors.customerName}>
                    <input
                      className={getFieldClass("customerName", true)}
                      placeholder="Enter customer name"
                      value={orderForm.customerName}
                      onChange={(e) => onOrderChange("customerName", sanitizeLetters(e.target.value))}
                    />
                  </Field>
                  <Field label="Mobile Number" error={orderErrors.mobileNumber}>
                    <input
                      className={getFieldClass("mobileNumber", true)}
                      placeholder="10-digit number"
                      inputMode="numeric"
                      maxLength={10}
                      value={orderForm.mobileNumber}
                      onKeyDown={preventNonNumericKey}
                      onChange={(e) => onOrderChange("mobileNumber", sanitizeDigits(e.target.value, 10))}
                    />
                  </Field>
                  <Field label="Full Address" error={orderErrors.fullAddress}>
                    <textarea
                      className={getFieldClass("fullAddress", true)}
                      placeholder="Enter complete address"
                      value={orderForm.fullAddress}
                      onChange={(e) => onOrderChange("fullAddress", e.target.value)}
                    />
                  </Field>
                  <Field label="Pincode" error={orderErrors.pincode}>
                    <input
                      className={getFieldClass("pincode", true)}
                      placeholder="6-digit pincode"
                      inputMode="numeric"
                      maxLength={6}
                      value={orderForm.pincode}
                      onKeyDown={preventNonNumericKey}
                      onChange={(e) => onOrderChange("pincode", sanitizeDigits(e.target.value, 6))}
                    />
                  </Field>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Product Information</h3>
                <div className="form-section-content">
                  <Field label="Product Type">
                    <select value={orderForm.productType} onChange={(e) => onOrderChange("productType", e.target.value)}>
                      <option>GPS</option>
                      <option>Vending Machine</option>
                      <option>Disposal</option>
                      <option>Other</option>
                    </select>
                  </Field>
                  {orderForm.productType === "Other" && (
                    <Field label="Custom Product Name" error={orderErrors.customProductName}>
                      <input
                        className={getFieldClass("customProductName", true)}
                        placeholder="Enter product name"
                        value={orderForm.customProductName}
                        onChange={(e) => onOrderChange("customProductName", e.target.value)}
                      />
                    </Field>
                  )}
                  <Field label="Number of Units" error={orderErrors.numberOfUnits}>
                    <input
                      className={getFieldClass("numberOfUnits", true)}
                      placeholder="How many units?"
                      inputMode="numeric"
                      value={orderForm.numberOfUnits}
                      onKeyDown={preventNonNumericKey}
                      onChange={(e) => onOrderChange("numberOfUnits", sanitizeDigits(e.target.value, 6))}
                    />
                  </Field>
                  <Field label="Amount per Unit" error={orderErrors.amount}>
                    <input
                      className={getFieldClass("amount", true)}
                      placeholder="Enter amount"
                      inputMode="decimal"
                      value={orderForm.amount}
                      onChange={(e) => onOrderChange("amount", sanitizePositiveNumber(e.target.value))}
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
                  <Field label="Advance Amount" error={orderErrors.advanceAmount}>
                    <input
                      className={getFieldClass("advanceAmount", true)}
                      placeholder="Enter advance amount"
                      inputMode="decimal"
                      value={orderForm.advanceAmount}
                      onChange={(e) => onOrderChange("advanceAmount", sanitizePositiveNumber(e.target.value))}
                    />
                  </Field>
                  <Field label="Remaining Amount">
                    <input readOnly value={formatCurrency(Math.max(0, totalAmount - Number(orderForm.advanceAmount || 0)))} className="readonly-input summary-value" />
                  </Field>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Additional Details</h3>
                <div className="form-section-content">
                  <Field label="Description">
                    <textarea
                      value={orderForm.description}
                      onChange={(e) => onOrderChange("description", e.target.value)}
                      placeholder="Enter any additional order details or notes..."
                      rows={3}
                    />
                  </Field>
                  <Field label="Payment Screenshot" error={orderErrors.paymentScreenshot}>
                    <div className={`upload-box ${orderErrors.paymentScreenshot ? "upload-error" : paymentFile ? "upload-ok" : ""}`}>
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
                </div>
              </div>

              <div className="form-actions">
                <button className="primary-btn form-submit-btn" type="submit" disabled={orderLoading}>
                  {orderLoading ? "Submitting..." : "Submit Order"}
                </button>
                {orderMessage && <p className={`form-message ${orderMessage.includes("successfully") ? "success" : "error"}`}>{orderMessage}</p>}
              </div>
            </form>
          </div>
        )}

        {showReturnForm && (
          <div className="form-card glass-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ margin: "0 0 8px 0" }}>Create New Return</h2>
                <p className="form-subtitle" style={{ margin: 0 }}>Submit a product return request below</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowReturnForm(false)}
                  style={{
                    background: "var(--border)",
                    color: "var(--text)",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 500
                  }}
                >
                  Back
                </button>
                <button onClick={() => setShowReturnForm(false)} style={{ cursor: "pointer", background: "none", border: "none", color: "var(--text-muted)", fontSize: "28px", padding: "0", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            </div>
            <form className="modern-form" onSubmit={onReturnSubmit}>
              <div className="form-section">
                <h3 className="form-section-title">Customer Information</h3>
                <div className="form-section-content">
                  <Field label="Customer Name" error={returnErrors.customerName}>
                    <input
                      placeholder="Enter customer name"
                      value={returnForm.customerName}
                      onChange={(e) => onReturnChange("customerName", sanitizeLetters(e.target.value))}
                    />
                  </Field>
                  <Field label="Mobile Number" error={returnErrors.mobileNumber}>
                    <input
                      placeholder="10-digit number"
                      inputMode="numeric"
                      maxLength={10}
                      value={returnForm.mobileNumber}
                      onKeyDown={preventNonNumericKey}
                      onChange={(e) => onReturnChange("mobileNumber", sanitizeDigits(e.target.value, 10))}
                    />
                  </Field>
                  <Field label="Pincode" error={returnErrors.pincode}>
                    <input
                      placeholder="6-digit pincode"
                      inputMode="numeric"
                      maxLength={6}
                      value={returnForm.pincode}
                      onKeyDown={preventNonNumericKey}
                      onChange={(e) => onReturnChange("pincode", sanitizeDigits(e.target.value, 6))}
                    />
                  </Field>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Return Details</h3>
                <div className="form-section-content">
                  <Field label="Product Type">
                    <select value={returnForm.productType} onChange={(e) => onReturnChange("productType", e.target.value)}>
                      <option>GPS</option>
                      <option>Vending Machine</option>
                      <option>Disposal</option>
                      <option>Other</option>
                    </select>
                  </Field>
                  <Field label="Number of Units" error={returnErrors.numberOfUnitsReturning}>
                    <input
                      placeholder="How many units?"
                      value={returnForm.numberOfUnitsReturning}
                      onKeyDown={preventNonNumericKey}
                      onChange={(e) => onReturnChange("numberOfUnitsReturning", sanitizeDigits(e.target.value, 6))}
                    />
                  </Field>
                  <Field label="Return Reason">
                    <select value={returnForm.returnReason} onChange={(e) => onReturnChange("returnReason", e.target.value)}>
                      <option>Product Damaged</option>
                      <option>Wrong Product</option>
                      <option>Product Not Working</option>
                      <option>Extra Order</option>
                      <option>Other</option>
                    </select>
                  </Field>
                  {returnForm.returnReason === "Other" && (
                    <Field label="Custom Reason" error={returnErrors.customReason}>
                      <input
                        placeholder="Describe the reason"
                        value={returnForm.customReason}
                        onChange={(e) => onReturnChange("customReason", e.target.value)}
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
                      value={returnForm.additionalDescription}
                      onChange={(e) => onReturnChange("additionalDescription", e.target.value)}
                      placeholder="Enter any additional details or notes..."
                      rows={3}
                    />
                  </Field>
                </div>
              </div>

              <div className="form-actions">
                <button className="primary-btn form-submit-btn" type="submit" disabled={returnLoading}>
                  {returnLoading ? "Submitting..." : "Submit Return"}
                </button>
                {returnMessage && <p className={`form-message ${returnMessage.includes("successfully") ? "success" : "error"}`}>{returnMessage}</p>}
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
};

export default PublicDashboardPage;
