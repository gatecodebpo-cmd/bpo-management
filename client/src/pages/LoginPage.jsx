import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const isAdminLogin = location.pathname === "/login/admin" || location.pathname === "/admin/login";
  const loginRole = isAdminLogin ? "admin" : "employee";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const decoded = await login(email, password, loginRole);
      navigate(
        decoded.role === "employee" ? "/employee/dashboard" : "/admin/dashboard",
        { replace: true }
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "32px",
          background: "#1e293b",
          borderRadius: "16px",
          border: "1px solid #334155",
        }}
      >
        <h2
          style={{
            color: "#f1f5f9",
            textAlign: "center",
            marginBottom: "24px",
            fontSize: "24px",
          }}
        >
          {isAdminLogin ? "Admin Sign In" : "Employee Sign In"}
        </h2>

        {error && (
          <div
            style={{
              padding: "12px",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              borderRadius: "8px",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "16px",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
