import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const chartTooltipStyles = {
  position: 'absolute',
  background: '#1a2540',
  color: '#e2e8f0',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '13px',
  border: '1px solid #06b6d4',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  zIndex: 1000,
  pointerEvents: 'none',
  whiteSpace: 'nowrap'
};

const PackageIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
);

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const Sparkline = ({ data, color, height = 44, width = 100 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polyline
        fill={`url(#grad-${color.replace("#", "")})`}
        stroke="none"
        points={`0,${height} ${data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ")} ${width},${height}`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const ChartContainer = ({ title, children }) => (
  <div className="glass-card" style={{ padding: '20px' }}>
    <div className="section-header" style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{title}</h2>
    </div>
    <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px' }}>
      {children}
    </div>
  </div>
);

const OrdersOverviewChart = ({ data = [45, 52, 48, 65, 58, 72, 68, 85] }) => {
  const width = 700, height = 280, padding = 40;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const stepX = (width - padding - 20) / (data.length - 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const points = data.map((v, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((v - min) / range) * (height - padding * 1.5);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map(i => (
        <line key={`og-${i}`} x1={padding} y1={height - padding - (i * (height - padding * 1.5) / 4)} x2={width} y2={height - padding - (i * (height - padding * 1.5) / 4)} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={padding} y1={height - padding} x2={width} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
      <polyline fill="url(#orderGrad)" stroke="none" points={`${padding},${height - padding} ${points} ${width - 20},${height - padding}`} />
      <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {data.map((v, i) => {
        const x = padding + i * stepX, y = height - padding - ((v - min) / range) * (height - padding * 1.5);
        return <circle key={`od-${i}`} cx={x} cy={y} r="4" fill="white" stroke="#06b6d4" strokeWidth="2" />;
      })}
      {days.slice(0, data.length).map((day, i) => {
        const x = padding + i * stepX;
        return <text key={`ol-${i}`} x={x} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">{day}</text>;
      })}
      {[0, 1, 2, 3, 4].map(i => (
        <text key={`oy-${i}`} x={padding - 10} y={height - padding - (i * (height - padding * 1.5) / 4) + 4} textAnchor="end" fontSize="11" fill="#64748b">{Math.round(min + (i * range / 4))}</text>
      ))}
    </svg>
  );
};

const RevenueTrendChart = ({ data = [45000, 52000, 48000, 65000, 58000, 72000, 68000, 75000] }) => {
  const width = 700, height = 280, padding = 40;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const stepX = (width - padding - 20) / (data.length - 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const points = data.map((v, i) => {
    const x = padding + i * stepX, y = height - padding - ((v - min) / range) * (height - padding * 1.5);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map(i => (
        <line key={`rg-${i}`} x1={padding} y1={height - padding - (i * (height - padding * 1.5) / 4)} x2={width} y2={height - padding - (i * (height - padding * 1.5) / 4)} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={padding} y1={height - padding} x2={width} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
      <polyline fill="url(#revGrad)" stroke="none" points={`${padding},${height - padding} ${points} ${width - 20},${height - padding}`} />
      <polyline fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {data.map((v, i) => {
        const x = padding + i * stepX, y = height - padding - ((v - min) / range) * (height - padding * 1.5);
        return <circle key={`rd-${i}`} cx={x} cy={y} r="4" fill="#8b5cf6" stroke="white" strokeWidth="2" />;
      })}
      {days.slice(0, data.length).map((day, i) => {
        const x = padding + i * stepX;
        return <text key={`rl-${i}`} x={x} y={height - 10} textAnchor="middle" fontSize="11" fill="#64748b">{day}</text>;
      })}
      {[0, 1, 2, 3, 4].map(i => (
        <text key={`ry-${i}`} x={padding - 10} y={height - padding - (i * (height - padding * 1.5) / 4) + 4} textAnchor="end" fontSize="11" fill="#64748b">₹{(Math.round(min + (i * range / 4)) / 1000).toFixed(0)}k</text>
      ))}
    </svg>
  );
};

const BarChart = ({ data = [30, 45, 38, 52, 48, 60, 55, 70, 62, 75, 80, 90] }) => {
  const width = 700, height = 280, padding = 40;
  const max = Math.max(...data, 1);
  const barWidth = (width - padding - 20) / data.length - 4;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {[0, 1, 2, 3, 4].map(i => (
        <line key={`bg-${i}`} x1={padding} y1={height - padding - (i * (height - padding * 1.5) / 4)} x2={width} y2={height - padding - (i * (height - padding * 1.5) / 4)} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      <line x1={padding} y1={height - padding} x2={width} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
      <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#cbd5e1" strokeWidth="1" />
      {data.map((v, i) => {
        const x = padding + i * (barWidth + 4) + 2;
        const barH = (v / max) * (height - padding * 1.5);
        return (
          <g key={`b-${i}`}>
            <rect x={x} y={height - padding - barH} width={barWidth} height={barH} rx="3" fill="#10b981" opacity="0.85" />
            {i % 2 === 0 && months[i] && (
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{months[i]}</text>
            )}
          </g>
        );
      })}
      {[0, 1, 2, 3, 4].map(i => (
        <text key={`by-${i}`} x={padding - 10} y={height - padding - (i * (height - padding * 1.5) / 4) + 4} textAnchor="end" fontSize="11" fill="#64748b">{Math.round(max * i / 4)}</text>
      ))}
    </svg>
  );
};

const DoughnutChart = ({ pending = 120, processing = 200, delivered = 50, cancelled = 30 }) => {
  const total = pending + processing + delivered + cancelled;
  const pendingPercent = (pending / total) * 100;
  const processingPercent = (processing / total) * 100;
  const deliveredPercent = (delivered / total) * 100;

  return (
    <div className="doughnut-chart">
      <svg viewBox="0 0 120 120" width="200" height="200">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="8"
          strokeDasharray={`${(deliveredPercent / 100) * 314} 314`} />
        <circle cx="60" cy="60" r="50" fill="none" stroke="#06b6d4" strokeWidth="8"
          strokeDasharray={`${(processingPercent / 100) * 314} 314`} strokeDashoffset={-((deliveredPercent / 100) * 314)} />
        <circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" strokeWidth="8"
          strokeDasharray={`${(pendingPercent / 100) * 314} 314`} strokeDashoffset={-((deliveredPercent + processingPercent) / 100) * 314} />
        <circle cx="60" cy="60" r="50" fill="none" stroke="#ef4444" strokeWidth="8"
          strokeDasharray={`${((100 - deliveredPercent - processingPercent - pendingPercent) / 100) * 314} 314`}
          strokeDashoffset={-((deliveredPercent + processingPercent + pendingPercent) / 100) * 314} />
        <circle cx="60" cy="60" r="38" fill="white" />
        <text x="60" y="65" textAnchor="middle" className="doughnut-text">{total}</text>
      </svg>
    </div>
  );
};

const trendData = (seed, len = 8) => {
  const arr = [];
  let v = seed;
  for (let i = 0; i < len; i++) {
    v = Math.max(0, v + Math.round((Math.random() - 0.45) * seed * 0.3));
    arr.push(v);
  }
  return arr;
};

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState({ totalOrders: 0, pendingOrders: 0, deliveredOrders: 0, totalReturns: 0, processingOrders: 0, cancelledOrders: 0 });
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);

  const load = useCallback(async () => {
    try {
      const [summaryRes, ordersRes, returnsRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/orders"),
        api.get("/returns"),
      ]);

      const summaryData = summaryRes.data.data || {};
      const ordersList = ordersRes.data.data || [];
      const returnsList = returnsRes.data.data || [];

      setSummary({
        totalOrders: summaryData.totalOrders || 0,
        pendingOrders: summaryData.pendingOrders || 0,
        deliveredOrders: summaryData.deliveredOrders || 0,
        totalReturns: summaryData.totalReturns || 0,
        processingOrders: ordersList.filter(o => o.orderStatus === "Processing").length,
        cancelledOrders: ordersList.filter(o => o.orderStatus === "Cancelled").length,
      });
      setOrders(ordersList);
      setReturns(returnsList);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 30000);
    const onFocus = () => { load(); };
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, [load]);

  const sparkData = useMemo(() => ({
    totalOrders: trendData(summary.totalOrders || 50),
    pendingOrders: trendData(summary.pendingOrders || 10),
    delivered: trendData(summary.deliveredOrders || 30),
    returns: trendData(summary.totalReturns || 8),
    products: trendData(20),
  }), [summary]);

  const colorMap = { blue: "#06b6d4", orange: "#f59e0b", green: "#10b981", purple: "#8b5cf6", pink: "#ec4899" };

  const statCards = [
    { title: "Total Orders", value: summary.totalOrders, trend: "+1.5% this month", icon: PackageIcon, color: "blue", spark: sparkData.totalOrders },
    { title: "Pending Orders", value: summary.pendingOrders, trend: "+8.2% this month", icon: ClipboardIcon, color: "orange", spark: sparkData.pendingOrders },
    { title: "Delivered Orders", value: summary.deliveredOrders, trend: "+15.2% this month", icon: CheckCircleIcon, color: "green", spark: sparkData.delivered },
    { title: "Total Returns", value: summary.totalReturns, trend: "+4.8% this month", icon: RefreshIcon, color: "pink", spark: sparkData.returns },
    { title: "New Products", value: "0", trend: "+12.2% this month", icon: PackageIcon, color: "purple", spark: sparkData.products },
  ];



  const lowStockProducts = [
    { name: "Battery", stock: "1" },
    { name: "Bulb", stock: "4" },
    { name: "Filter", stock: "2" },
    { name: "Charger", stock: "1" },
    { name: "Cable", stock: "3" },
    { name: "Sensor", stock: "2" },
  ];

  const topProducts = [
    { name: "Welding Machine", sales: "1,234", orders: 45 },
    { name: "OPS Device", sales: "876", orders: 32 },
    { name: "Water Purifier", sales: "654", orders: 28 },
    { name: "Accessories", sales: "432", orders: 15 },
  ];

  const topCustomers = [
    { name: "Rahul Sharma", orders: "25 Orders", amount: "₹1,25,000" },
    { name: "Anil Kumar", orders: "18 Orders", amount: "₹95,000" },
    { name: "Nisha Singh", orders: "15 Orders", amount: "₹75,000" },
    { name: "Vikram Patel", orders: "12 Orders", amount: "₹60,000" },
  ];

  const totalStatusCount = summary.deliveredOrders + summary.processingOrders + summary.pendingOrders + summary.cancelledOrders;

  const chartOrdersDaily = useMemo(() => {
    const daily = [0, 0, 0, 0, 0, 0, 0];
    orders.forEach(o => {
      const date = new Date(o.createdAt);
      const day = date.getDay();
      daily[day]++;
    });
    return daily.map(d => Math.max(d, 10));
  }, [orders]);

  const chartRevenueDaily = useMemo(() => {
    const daily = [0, 0, 0, 0, 0, 0, 0];
    orders.forEach(o => {
      const date = new Date(o.createdAt);
      const day = date.getDay();
      daily[day] += o.totalAmount || 0;
    });
    return daily.map(d => Math.max(d, 20000));
  }, [orders]);

  const pendingCount = useMemo(() => orders.filter(o => o.orderStatus === "Pending").length, [orders]);
  const processingCount = useMemo(() => orders.filter(o => o.orderStatus === "Processing").length, [orders]);
  const deliveredCount = useMemo(() => orders.filter(o => o.orderStatus === "Delivered").length, [orders]);
  const cancelledCount = useMemo(() => orders.filter(o => o.orderStatus === "Cancelled").length, [orders]);

  const chartMonthlySales = useMemo(() => {
    const monthly = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    orders.forEach(o => {
      const date = new Date(o.createdAt);
      const month = date.getMonth();
      monthly[month]++;
    });
    return monthly.map(m => Math.max(m, 15));
  }, [orders]);

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="page-subtitle">Complete overview of your business</p>
        </div>
        <button className="logout-btn" onClick={load} title="Refresh data">Refresh</button>
      </div>

      <div className="stats-grid">
        {statCards.map(({ title, value, trend, icon: Icon, color, spark }) => (
          <article key={title} className={`stat-card glass-card ${color}`}>
            <div className={`stat-icon ${color}`}><Icon /></div>
            <div className="stat-info">
              <p>{title}</p>
              <h3>{typeof value === 'number' ? value.toLocaleString() : value}</h3>
              <small>{trend}</small>
            </div>
            <div className="stat-spark">
              <Sparkline data={spark} color={colorMap[color]} />
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-section-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <ChartContainer title="Orders Overview (Line Chart)">
          <OrdersOverviewChart data={chartOrdersDaily} />
        </ChartContainer>
        <ChartContainer title="Revenue Trend (Area Chart)">
          <RevenueTrendChart data={chartRevenueDaily} />
        </ChartContainer>
        <div className="order-status-card glass-card" style={{ padding: '20px' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Order Status Distribution (Donut Chart)</h2>
          </div>
          <div className="status-content">
            <DoughnutChart
              pending={pendingCount}
              processing={processingCount}
              delivered={deliveredCount}
              cancelled={cancelledCount}
            />
            <div className="status-legend">
              <div className="legend-item">
                <span className="legend-dot delivered"></span>
                <span>Delivered</span>
                <span className="legend-count">{summary.deliveredOrders} ({totalStatusCount > 0 ? ((summary.deliveredOrders / totalStatusCount) * 100).toFixed(1) : '0'}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot processing"></span>
                <span>Processing</span>
                <span className="legend-count">{summary.processingOrders} ({totalStatusCount > 0 ? ((summary.processingOrders / totalStatusCount) * 100).toFixed(1) : '0'}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot pending"></span>
                <span>Pending</span>
                <span className="legend-count">{summary.pendingOrders} ({totalStatusCount > 0 ? ((summary.pendingOrders / totalStatusCount) * 100).toFixed(1) : '0'}%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot cancelled"></span>
                <span>Cancelled</span>
                <span className="legend-count">{summary.cancelledOrders} ({totalStatusCount > 0 ? ((summary.cancelledOrders / totalStatusCount) * 100).toFixed(1) : '0'}%)</span>
              </div>
            </div>
          </div>
        </div>
        <ChartContainer title="Monthly Sales (Bar Chart)">
          <BarChart data={chartMonthlySales} />
        </ChartContainer>
      </div>

      <div className="bottom-grid">
        <div className="products-card glass-card">
          <div className="table-header">
            <h3>Top Products</h3>
            <a href="#" className="view-all-link">View All</a>
          </div>
          <div className="products-list">
            {topProducts.map((product, i) => (
              <div key={i} className="product-row">
                <div className="product-number">{i + 1}</div>
                <div className="product-details">
                  <p className="product-name">{product.name}</p>
                  <p className="sales-text">{product.sales}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="customers-card glass-card">
          <div className="table-header">
            <h3>Top Customers</h3>
            <a href="#" className="view-all-link">View All</a>
          </div>
          <div className="customers-list">
            {topCustomers.map((customer, i) => (
              <div key={i} className="customer-item">
                <div className="customer-avatar">{customer.name.charAt(0)}</div>
                <div className="customer-info">
                  <p className="customer-name">{customer.name}</p>
                  <p className="customer-orders">{customer.orders}</p>
                </div>
                <p className="customer-amount">{customer.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboardPage;
