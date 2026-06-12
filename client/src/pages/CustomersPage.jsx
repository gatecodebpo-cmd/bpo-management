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
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("amount");

  useEffect(() => {
    let mounted = true;
    api.get("/orders").then((res) => {
      if (mounted) { setCustomers(buildCustomers(res.data?.data || [])); setLoading(false); }
    }).catch((e) => {
      if (mounted) { setLoading(false); console.error("Error loading customers:", e); }
    });
    return () => { mounted = false; };
  }, []);

  const filteredCustomers = customers
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === "amount") return b.totalAmount - a.totalAmount;
      if (sortBy === "orders") return b.orders - a.orders;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Customers</h2>
          <p className="page-subtitle">Manage your customer database</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: '#e8eef7',
            border: '1px solid #2d3e54',
            borderRadius: '10px',
            color: '#0f172a',
            fontSize: '14px'
          }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px 14px',
            background: '#e8eef7',
            border: '1px solid #2d3e54',
            borderRadius: '10px',
            color: '#0f172a',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="amount">Sort by Amount</option>
          <option value="orders">Sort by Orders</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

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
    </section>
  );
};

export default CustomersPage;
