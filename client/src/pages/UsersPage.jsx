import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewUser, setViewUser] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/users");
      setUsers(res.data.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (viewUser) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewUser]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.includes(q))
    );
  });

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert("Failed to delete user");
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric"
        })
      : "-";

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>User Details</h2>
          <p className="page-subtitle">All registered users</p>
        </div>
        <Link to="/admin/register" className="primary-btn" style={{ textDecoration: "none" }}>
          + Register New
        </Link>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by name, email, username or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "10px 14px",
            background: "#e8eef7",
            border: "1px solid #2d3e54",
            borderRadius: "10px",
            color: "#0f172a",
            fontSize: "14px",
          }}
        />
      </div>

      <div className="table-shell glass-card">
        <div className="table-header">
          <h3>All Users ({filtered.length})</h3>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>USERNAME</th>
                <th>PHONE</th>
                <th>ROLE</th>
                <th>REGISTERED</th>
                 <th style={{ textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                    {search ? "No users match your search" : "No users found"}
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {(u.name || "?").charAt(0).toUpperCase()}
                      </span>
                      {u.name}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.username || "-"}</td>
                  <td>{u.phoneNumber || "-"}</td>
                  <td>
                    <span
                      style={{
                        textTransform: "capitalize",
                        background: u.role === "admin" ? "#f59e0b20" : "#06b6d420",
                        color: u.role === "admin" ? "#f59e0b" : "#06b6d4",
                        padding: "2px 10px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", flexWrap: "nowrap" }}>
                      <button
                        title="View details"
                        onClick={() => setViewUser(u)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#06b6d4"
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        title="Edit user"
                        onClick={() => navigate(`/admin/register/${u._id}?edit=true`)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#3b82f6"
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        title="Delete user"
                        onClick={() => handleDelete(u._id, u.name)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ef4444"
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <h3 className="modal-title" style={{ marginBottom: 20 }}>User Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Full Name:</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{viewUser.name || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Email:</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{viewUser.email || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Username:</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{viewUser.username || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Phone Number:</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{viewUser.phoneNumber || "-"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Role:</span>
                <span
                  style={{
                    textTransform: "capitalize",
                    background: viewUser.role === "admin" ? "#f59e0b20" : "#06b6d420",
                    color: viewUser.role === "admin" ? "#f59e0b" : "#06b6d4",
                    padding: "2px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {viewUser.role}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Registered Date:</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{formatDate(viewUser.createdAt)}</span>
              </div>
            </div>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button className="primary-btn" onClick={() => setViewUser(null)} style={{ background: "#64748b" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UsersPage;
