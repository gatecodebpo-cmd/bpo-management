import { useCallback, useEffect, useState } from "react";
import { api, toAbsoluteAssetUrl } from "../api/client";
import DataTable from "../components/DataTable";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }).format(new Date(dateString));
};

const statusBadge = (status) => {
  const colors = {
    "Pending": "var(--warning)", "Approved": "var(--primary)",
    "Processing": "var(--primary)", "Delivered": "var(--success)",
    "Cancelled": "var(--danger)",
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

const parcelBadge = (status) => {
  const colors = {
    "Pending": "var(--warning)", "Process": "#8b5cf6",
    "Parcel": "var(--primary)", "Packed": "#f59e0b",
    "Dispatched": "#3b82f6", "Delivered": "var(--success)",
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
  { key: "employeeName", label: "Employee", render: (row) => row.employeeName || "-" },
  { key: "customerName", label: "Customer" },
  { key: "mobileNumber", label: "Mobile" },
  { key: "alternateMobileNumber", label: "Alt Mobile", render: (row) => row.alternateMobileNumber || "-" },
  { key: "productType", label: "Product" },
  { key: "numberOfUnits", label: "Units" },
  { key: "totalAmount", label: "Total", render: (row) => formatCurrency(row.totalAmount) },
  { key: "incentive", label: "Incentive", render: (row) => formatCurrency(row.incentive) },
  { key: "advanceAmount", label: "Advance", render: (row) => formatCurrency(row.advanceAmount) },
  {
    key: "paymentScreenshot", label: "Payment",
    render: (row) =>
      row.paymentScreenshot ? (
        <a href={toAbsoluteAssetUrl(row.paymentScreenshot)} target="_blank" rel="noreferrer">
          <img className="table-preview-image" src={toAbsoluteAssetUrl(row.paymentScreenshot)} alt="Payment" />
        </a>
      ) : "-",
  },
  { key: "createdAt", label: "Date", render: (row) => formatDateTime(row.createdAt) },
  { key: "orderStatus", label: "Status", render: (row) => statusBadge(row.orderStatus) },
  { key: "parcelStatus", label: "Parcel", render: (row) => parcelBadge(row.parcelStatus) },
  { key: "trackingId", label: "Tracking ID", render: (row) => row.trackingId || "-" },
  { key: "courierCompany", label: "Courier", render: (row) => row.courierCompany || "-" },
];

const fetchOrders = async () => {
  const res = await api.get("/orders");
  if (!res.data?.data) return [];
  return res.data.data;
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchOrders().then((data) => { if (mounted) { setOrders(data); setLoading(false); } }).catch((e) => { if (mounted) { setLoading(false); console.error("Failed to load order history:", e); } });
    return () => { mounted = false; };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchOrders().then((data) => { setOrders(data); setLoading(false); }).catch((e) => { setLoading(false); console.error("Failed to refresh order history:", e); });
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete order for "${row.customerName}"? This cannot be undone.`)) return;
    await api.delete(`/orders/${row._id}`);
    handleRefresh();
  };

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Order History</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            View completed and past orders
          </p>
        </div>
        <button className="logout-btn" onClick={handleRefresh} title="Refresh data">Refresh</button>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
      ) : (
        <DataTable
          title="Orders"
          columns={columns}
          data={orders}
          searchKeys={["employeeName", "customerName", "mobileNumber", "alternateMobileNumber", "productType", "orderStatus", "parcelStatus", "trackingId", "courierCompany"]}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
};

export default OrderHistoryPage;
