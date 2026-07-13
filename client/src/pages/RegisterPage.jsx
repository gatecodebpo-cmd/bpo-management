import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Field from "../components/Field";

const initialState = {
  name: "",
  phoneNumber: "",
  email: "",
  password: "",
  username: "",
  role: "employee",
};

const RegistrationForm = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const getFieldClass = (key) => {
    if (!form[key]) return "";
    return errors[key] ? "field-invalid" : "field-valid";
  };

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);

  const validate = (candidate = form) => {
    const next = {};
    if (!candidate.name.trim()) next.name = "Name is required";
    if (!candidate.phoneNumber.trim()) next.phoneNumber = "Mobile number is required";
    else if (candidate.phoneNumber.length < 10) next.phoneNumber = "Enter valid 10-digit mobile number";
    if (!candidate.email.trim()) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(candidate.email)) next.email = "Enter a valid email";
    if (!candidate.username.trim()) next.username = "Username is required";
    if (!candidate.password) next.password = "Password is required";
    else if (candidate.password.length < 6) next.password = "Password must be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (key, value) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    if (errors[key] !== undefined) validate(updated);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post("/auth/register", form);
      alert("User registered successfully!");
      navigate("/admin/users");
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card glass-card">
      <form className="modern-form" onSubmit={onSubmit}>
        <div className="form-section">
          <h3 className="form-section-title">Employee Login Credentials</h3>
          <div className="form-section-content">
            <Field label="Full Name" error={errors.name}>
              <input
                className={getFieldClass("name")}
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
              />
            </Field>
            <Field label="Mobile Number" error={errors.phoneNumber}>
              <input
                className={getFieldClass("phoneNumber")}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
                value={form.phoneNumber}
                onChange={(e) => onChange("phoneNumber", sanitizeDigits(e.target.value, 10))}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                className={getFieldClass("email")}
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </Field>
            <Field label="Username" error={errors.username}>
              <input
                className={getFieldClass("username")}
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => onChange("username", e.target.value)}
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <div className="password-wrap">
                <input
                  className={getFieldClass("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  autoComplete="new-password"
                  onChange={(e) => onChange("password", e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => onChange("role", e.target.value)}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="form-actions">
          <button className="primary-btn form-submit-btn" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register User"}
          </button>
          <button type="button" onClick={() => navigate("/admin/users")} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Close
          </button>
          {message && <p className={`form-message ${message.includes("successfully") ? "success" : "error"}`}>{message}</p>}
        </div>
      </form>
    </div>
  );
};

const UserEditForm = ({ userId, onCancel }) => {
  const [form, setForm] = useState({
    name: "", phoneNumber: "", email: "", username: "", role: "employee", password: ""
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/auth/users/${userId}`);
        const u = res.data.data;
        setForm({
          name: u.name || "",
          phoneNumber: u.phoneNumber || "",
          email: u.email || "",
          username: u.username || "",
          role: u.role || "employee"
        });
      } catch {
        setMessage("Failed to load user data");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const sanitizeDigits = (value, max) => value.replace(/\D/g, "").slice(0, max);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      await api.put(`/auth/users/${userId}`, form);
      alert("User updated successfully!");
      navigate("/admin/users");
    } catch (error) {
      setMessage(error.response?.data?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ color: "var(--text-muted)" }}>Loading...</p>;

  return (
    <div className="form-card glass-card">
      <form className="modern-form" onSubmit={onSubmit}>
        <div className="form-section">
          <h3 className="form-section-title">Edit User</h3>
          <div className="form-section-content">
            <Field label="Full Name">
              <input
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
              />
            </Field>
            <Field label="Mobile Number">
              <input
                placeholder="10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
                value={form.phoneNumber}
                onChange={(e) => onChange("phoneNumber", sanitizeDigits(e.target.value, 10))}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </Field>
            <Field label="Username">
              <input
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => onChange("username", e.target.value)}
              />
            </Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => onChange("role", e.target.value)}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Password (leave blank to keep current)">
              <div className="password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={form.password}
                  autoComplete="new-password"
                  onChange={(e) => onChange("password", e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </Field>
          </div>
        </div>

        <div className="form-actions">
          <button className="primary-btn form-submit-btn" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" className="primary-btn" style={{ background: "transparent", border: "1px solid var(--border)", cursor: "pointer" }} onClick={onCancel}>
            Cancel
          </button>
          {message && <p className={`form-message ${message.includes("successfully") ? "success" : "error"}`}>{message}</p>}
        </div>
      </form>
    </div>
  );
};

const RegisterPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const navigate = useNavigate();

  useEffect(() => {
    if (id && !isEdit) {
      navigate("/admin/users", { replace: true });
    }
  }, [id, isEdit, navigate]);

  return (
    <section className="form-page">
      <div className="form-head">
        <div>
          <h2>
            {id ? "Edit User" : "Register New User"}
          </h2>
          <p className="form-subtitle">
            {id ? "Update user information" : "Fill in the user details below"}
          </p>
        </div>
      </div>

      {id && isEdit ? (
        <UserEditForm userId={id} onCancel={() => navigate("/admin/users")} />
      ) : (
        <RegistrationForm />
      )}
    </section>
  );
};

export default RegisterPage;
