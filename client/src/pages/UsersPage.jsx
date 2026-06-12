import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
                <th>ACTIONS</th>
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
                  <td>
                    <Link
                      to={`/admin/register/${u._id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
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
                    </Link>
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
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => navigate(`/admin/register/${u._id}?edit=true`)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 6,
                          border: "none",
                          background: "#3b82f6",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u._id, u.name)}
                        style={{
                          padding: "4px 12px",
                          borderRadius: 6,
                          border: "none",
                          background: "#ef4444",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
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

export default UsersPage;
