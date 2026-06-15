import { useEffect, useState } from "react";
import { api } from "../api/client";

const buildCustomers = (orders) => {
  const map = new Map();
  orders.forEach(order => {
    const key = order.customerName;
    if (!map.has(key)) {
      map.set(key, { name: order.customerName, phone: order.mobileNumber, address: order.fullAddress, orders: 0, totalAmount: 0, lastOrder: null });
    }
    const c = map.get(key);
    c.orders++;
    c.totalAmount += order.totalAmount || 0;
    const d = new Date(order.createdAt);
    if (!c.lastOrder || d > new Date(c.lastOrder)) c.lastOrder = order.createdAt;
  });
  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
};

const CustomersPage = () => {
  const [tab, setTab] = useState("orders");

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("amount");

  const [crmRecords, setCrmRecords] = useState([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState("All");
  const [crmSearch, setCrmSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/orders").then((res) => {
      if (mounted) { setCustomers(buildCustomers(res.data?.data || [])); setLoading(false); }
    }).catch(() => {
      if (mounted) { setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (tab !== "crm") return;
    let mounted = true;
    setCrmLoading(true);
    api.get("/customers").then((res) => {
      if (mounted) { setCrmRecords(res.data?.data || []); setCrmLoading(false); }
    }).catch(() => {
      if (mounted) { setCrmLoading(false); }
    });
    return () => { mounted = false; };
  }, [tab]);

  const filteredCustomers = customers
    .filter(c =>
      !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "amount") return b.totalAmount - a.totalAmount;
      if (sortBy === "orders") return b.orders - a.orders;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const filteredCrm = crmRecords
    .filter((c) => followUpFilter === "All" || c.followUp === followUpFilter)
    .filter((c) =>
      !crmSearch || c.customerName?.toLowerCase().includes(crmSearch.toLowerCase())
    );

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Customers</h2>
          <p className="page-subtitle">Manage your customer database</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={() => setTab("orders")}
          className="primary-btn"
          style={{
            background: tab === "orders" ? "var(--primary)" : "var(--bg-card)",
            border: "1px solid var(--border)", color: tab === "orders" ? "#fff" : "var(--text)",
            padding: "8px 20px", fontSize: 14, cursor: "pointer", borderRadius: 8
          }}
        >
          Order Customers
        </button>
        <button
          onClick={() => setTab("crm")}
          className="primary-btn"
          style={{
            background: tab === "crm" ? "var(--primary)" : "var(--bg-card)",
            border: "1px solid var(--border)", color: tab === "crm" ? "#fff" : "var(--text)",
            padding: "8px 20px", fontSize: 14, cursor: "pointer", borderRadius: 8
          }}
        >
          Customer Info (CRM)
        </button>
      </div>

      {tab === "orders" && (
        <>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", marginBottom: 24, padding: '10px 14px', background: '#e8eef7',
              border: '1px solid #2d3e54', borderRadius: '10px', color: '#0f172a', fontSize: '14px', boxSizing: "border-box"
            }}
          />

          <div className="table-shell glass-card">
            <div className="table-header">
              <h3>All Customers</h3>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>PHONE</th>
                    <th>ADDRESS</th>
                    <th>TOTAL ORDERS</th>
                    <th>TOTAL AMOUNT</th>
                    <th>LAST ORDER</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>Loading...</td></tr>}
                  {!loading && filteredCustomers.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>{searchQuery ? "No customers match your search" : "No customers found"}</td></tr>
                  )}
                  {filteredCustomers.map((customer, idx) => (
                    <tr key={idx}>
                      <td>{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.address}</td>
                      <td>{customer.orders}</td>
                      <td className="amount-cell">₹{customer.totalAmount?.toLocaleString()}</td>
                      <td>{customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
            </div>
          </div>
        </>
      )}

      {tab === "crm" && (
        <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search by name..."
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontSize: 13 }}
            />
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Follow Up:</span>
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

          <div className="table-shell glass-card">
            <div className="table-header">
              <h3>CRM Records ({filteredCrm.length}/{crmRecords.length})</h3>
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
                    <th>FOLLOW UP</th>
                    <th>EMPLOYEE</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {crmLoading && <tr><td colSpan={9} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>Loading...</td></tr>}
                  {!crmLoading && filteredCrm.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                      {crmRecords.length === 0 ? "No CRM records found" : "No records match the selected filter"}
                    </td></tr>
                  )}
                  {filteredCrm.map((c) => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.customerName}</td>
                      <td>{c.mobile}</td>
                      <td>{c.email || "-"}</td>
                      <td>{c.remark || "-"}</td>
                      <td>{c.district || "-"}</td>
                      <td>{c.state || "-"}</td>
                      <td>
                        <span style={{
                          padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                          background: c.followUp === "Converted" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
                          color: c.followUp === "Converted" ? "#22c55e" : "#3b82f6"
                        }}>
                          {c.followUp}
                        </span>
                      </td>
                      <td>{c.employeeName || "-"}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default CustomersPage;
