import { useEffect, useState } from "react";
import { api } from "../api/client";
import DataTable from "../components/DataTable";

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

const ReturnManagePage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchReturns().then((data) => { if (mounted) { setReturns(data); setLoading(false); } }).catch((e) => { if (mounted) { setLoading(false); console.error("Failed to load returns:", e); } });
    return () => { mounted = false; };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchReturns().then((data) => { setReturns(data); setLoading(false); }).catch((e) => { setLoading(false); console.error("Failed to refresh returns:", e); });
  };

  const updateReturnStatus = async (id, status) => {
    await api.patch(`/returns/${id}/status`, { returnStatus: status });
    handleRefresh();
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
        <button className="logout-btn" onClick={handleRefresh} title="Refresh data">Refresh</button>
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
        />
      )}
    </section>
  );
};

export default ReturnManagePage;
