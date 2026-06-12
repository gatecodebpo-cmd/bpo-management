import { useState } from "react";
import { api } from "../api/client";
import Field from "../components/Field";

const initialState = {
  name: "",
  sku: "",
  category: "GPS",
  price: "",
  stock: "",
  description: "",
};

const ProductsPage = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const getFieldClass = (key) => {
    if (!form[key]) return "";
    return errors[key] ? "field-invalid" : "field-valid";
  };

  const validate = (candidate = form) => {
    const next = {};
    if (!candidate.name.trim()) next.name = "Product name is required";
    if (!candidate.sku.trim()) next.sku = "SKU is required";
    if (candidate.price === "" || Number(candidate.price) <= 0) next.price = "Price must be positive";
    if (candidate.stock === "" || Number(candidate.stock) < 0) next.stock = "Stock must be valid";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    validate(updated);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post("/products", {
        name: form.name,
        sku: form.sku,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        description: form.description,
      });
      setMessage("Product added successfully.");
      setForm(initialState);
      setErrors({});
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-head">
        <div>
          <h2>Add New Product</h2>
          <p className="form-subtitle">Fill in the product details below</p>
        </div>
      </div>

      <div className="form-card glass-card">
        <form className="modern-form" onSubmit={onSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Product Information</h3>
            <div className="form-section-content">
              <Field label="Product Name" error={errors.name}>
                <input
                  className={getFieldClass("name")}
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                />
              </Field>
              <Field label="SKU" error={errors.sku}>
                <input
                  className={getFieldClass("sku")}
                  placeholder="Enter SKU code"
                  value={form.sku}
                  onChange={(e) => onChange("sku", e.target.value.toUpperCase())}
                />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={(e) => onChange("category", e.target.value)}>
                  <option>GPS</option>
                  <option>Vending Machine</option>
                  <option>Disposal</option>
                  <option>Accessories</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Price" error={errors.price}>
                <input
                  className={getFieldClass("price")}
                  placeholder="Enter price"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => onChange("price", sanitizePositiveNumber(e.target.value))}
                />
              </Field>
              <Field label="Stock" error={errors.stock}>
                <input
                  className={getFieldClass("stock")}
                  placeholder="Enter stock quantity"
                  inputMode="numeric"
                  value={form.stock}
                  onKeyDown={preventNonNumericKey}
                  onChange={(e) => onChange("stock", sanitizeDigits(e.target.value, 6))}
                />
              </Field>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Additional Details</h3>
            <div className="form-section-content">
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => onChange("description", e.target.value)}
                  placeholder="Enter product description..."
                  rows={3}
                />
              </Field>
            </div>
          </div>

          <div className="form-actions">
            <button className="primary-btn form-submit-btn" type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Product"}
            </button>
            {message && <p className={`form-message ${message.includes("successfully") ? "success" : "error"}`}>{message}</p>}
          </div>
        </form>
      </div>
    </section>
  );
};

export default ProductsPage;
