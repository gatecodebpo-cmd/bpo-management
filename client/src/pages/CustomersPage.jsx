import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

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

const downloadCRMPDF = (records) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const grouped = {};
  records.forEach((c) => {
    const emp = c.employeeName || "Unknown";
    if (!grouped[emp]) grouped[emp] = [];
    grouped[emp].push(c);
  });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CRM Customer Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Customers: ${records.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  const empEntries = Object.entries(grouped);
  empEntries.forEach(([empName, customers], empIdx) => {
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setDrawColor(139, 92, 246);
    doc.setFillColor(139, 92, 246);
    doc.roundedRect(14, y, pageWidth - 28, 9, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${empName} (${customers.length})`, 18, y + 6.5);
    y += 14;
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: y,
      theme: "grid",
      head: [["Name", "Mobile", "Email", "Remark", "District", "State", "Follow Up", "Date"]],
      body: customers.map((c) => [
        c.customerName || "-",
        c.mobile || "-",
        c.email || "-",
        c.remark || "-",
        c.district || "-",
        c.state || "-",
        c.followUp || "-",
        c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"
      ]),
      headStyles: { fillColor: [139, 92, 246], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7 },
      styles: { cellPadding: 1.5 },
      margin: { left: 14 }
    });
    y = doc.lastAutoTable.finalY + 10;
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save("CRM_Customer_Report.pdf");
};

const CustomersPage = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
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
    api.get(isEmployee ? "/employee/orders" : "/orders").then((res) => {
      if (mounted) { setCustomers(buildCustomers(res.data?.data || [])); setLoading(false); }
    }).catch(() => {
      if (mounted) { setLoading(false); }
    });
    return () => { mounted = false; };
  }, [isEmployee]);

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
              style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#ffffff", fontSize: 13, cursor: "pointer" }}
            >
              <option value="All" style={{ background: "#1a2540", color: "#ffffff" }}>All</option>
              <option value="Convert" style={{ background: "#1a2540", color: "#ffffff" }}>Convert</option>
              <option value="Converted" style={{ background: "#1a2540", color: "#ffffff" }}>Converted</option>
            </select>
          </div>

          <div className="table-shell glass-card">
            <div className="table-header">
              <h3>CRM Records ({filteredCrm.length}/{crmRecords.length})</h3>
              <button className="primary-btn" style={{ background: "#10b981", padding: "8px 16px", fontSize: 13 }} onClick={() => downloadCRMPDF(crmRecords)}>
                Download PDF
              </button>
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
