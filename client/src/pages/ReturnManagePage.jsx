import { useCallback, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api/client";
import DataTable from "../components/DataTable";
import EditModal from "../components/EditModal";

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status) => {
  const colors = {
    "Return Requested": "var(--warning)", "Return Approved": "var(--primary)",
    "Pickup Scheduled": "var(--primary)", "Returned Successfully": "var(--success)",
    "Return Rejected": "var(--danger)",
  };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11,
      fontWeight: 600, background: `${colors[status] || "#666"}22`,
      color: colors[status] || "#666", border: `1px solid ${colors[status] || "#666"}44`,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
};

const returnEditFields = [
  { key: "customerName", label: "Customer Name" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "pincode", label: "Pincode" },
  {
    key: "productType", label: "Product Type", type: "select",
    options: ["GPS", "Vending Machine", "Disposal", "Other"]
  },
  { key: "numberOfUnitsReturning", label: "Units Returning", type: "number" },
  {
    key: "returnReason", label: "Return Reason", type: "select",
    options: ["Product Damaged", "Wrong Product", "Product Not Working", "Extra Order", "Other"]
  },
  { key: "customReason", label: "Custom Reason" },
  { key: "additionalDescription", label: "Additional Description", type: "textarea" },
  {
    key: "returnStatus", label: "Status", type: "select",
    options: ["Return Requested", "Return Approved", "Pickup Scheduled", "Returned Successfully", "Return Rejected"]
  },
];

const columns = [
  { key: "customerName", label: "Customer" },
  { key: "mobileNumber", label: "Mobile" },
  { key: "productType", label: "Product" },
  { key: "numberOfUnitsReturning", label: "Units" },
  { key: "returnReason", label: "Reason" },
  {
    key: "additionalDescription", label: "Description",
    render: (row) => (
      <span style={{ maxWidth: 200, display: "inline-block", whiteSpace: "normal", fontSize: 12, lineHeight: 1.4 }}>
        {row.additionalDescription || "-"}
      </span>
    ),
  },
  { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
  { key: "returnStatus", label: "Status", render: (row) => statusBadge(row.returnStatus) },
];

const fetchReturns = async () => {
  const res = await api.get("/returns");
  if (!res.data?.data) return [];
  return res.data.data;
};

const downloadAllReturnsPDF = (returns) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("All Returns Report", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")} | Total Returns: ${returns.length}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  const rows = returns.map((r) => [
    (r._id || "").slice(-6).toUpperCase(),
    r.customerName || "-",
    r.mobileNumber || "-",
    r.productType || "-",
    r.numberOfUnitsReturning || 0,
    r.returnReason || "-",
    r.returnStatus || "-",
    formatDateTime(r.createdAt)
  ]);

  autoTable(doc, {
    startY: y,
    head: [["ID", "Customer", "Mobile", "Product", "Units", "Reason", "Status", "Date"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [245, 158, 11], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    styles: { cellPadding: 2 }
  });

  doc.save("All_Returns_Report.pdf");
};

const ReturnManagePage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchReturns().then((data) => { if (mounted) { setReturns(data); setLoading(false); } }).catch((e) => { if (mounted) { setLoading(false); console.error("Failed to load returns:", e); } });
    return () => { mounted = false; };
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetchReturns().then((data) => { setReturns(data); setLoading(false); }).catch((e) => { setLoading(false); console.error("Failed to refresh returns:", e); });
  }, []);

  const updateReturnStatus = async (id, status) => {
    await api.patch(`/returns/${id}/status`, { returnStatus: status });
    handleRefresh();
  };

  const handleEdit = (row) => {
    setEditRow(row);
  };

  const handleSaveEdit = async (form) => {
    await api.put(`/returns/${form._id}`, form);
    setEditRow(null);
    handleRefresh();
  };

  const handleDownloadPDF = () => {
    downloadAllReturnsPDF(returns);
  };

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Return Management</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Manage and update return requests
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="primary-btn" style={{ background: "#10b981" }} onClick={handleDownloadPDF}>
            Download PDF
          </button>
          <button className="logout-btn" onClick={handleRefresh}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading returns...</div>
      ) : (
        <DataTable
          title="Returns"
          columns={columns}
          data={returns}
          statusOptions={["Return Requested", "Return Approved", "Pickup Scheduled", "Returned Successfully", "Return Rejected"]}
          onStatusChange={updateReturnStatus}
          searchKeys={["customerName", "mobileNumber", "productType", "returnStatus"]}
          onEdit={handleEdit}
        />
      )}

      {editRow && (
        <EditModal
          title="Return"
          fields={returnEditFields}
          data={editRow}
          onSave={handleSaveEdit}
          onClose={() => setEditRow(null)}
        />
      )}
    </section>
  );
};

export default ReturnManagePage;
