import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import EditModal from "../components/EditModal";

const chartTheme = {
  cyan: { accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.08)', light: '#22d3ee' },
  purple: { accent: '#8b5cf6', accentBg: 'rgba(139,92,246,0.08)', light: '#a78bfa' },
  green: { accent: '#10b981', accentBg: 'rgba(16,185,129,0.08)', light: '#34d399' },
};

const ChartTooltip = ({ tooltip, color }) => {
  if (!tooltip) return null;
  const above = tooltip.y > 70;
  return (
    <div style={{
      position: 'absolute', left: tooltip.x,
      top: above ? tooltip.y : tooltip.y + 20,
      transform: above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      marginTop: above ? -14 : 0,
      background: '#1e293b', padding: '6px 12px', borderRadius: 8,
      border: `1px solid ${color}44`, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      zIndex: 100, pointerEvents: 'none', textAlign: 'center', minWidth: 60,
    }}>
      <div style={{
        position: 'absolute',
        [above ? 'bottom' : 'top']: -5,
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: 8, height: 8,
        background: '#1e293b',
        borderRight: `1px solid ${color}44`,
        borderBottom: `1px solid ${color}44`,
      }} />
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tooltip.label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 1 }}>{tooltip.val}</div>
    </div>
  );
};

const PackageIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
);

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

const statusBadge = (status, colors) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11,
    fontWeight: 600, background: `${colors[status] || "#666"}22`,
    color: colors[status] || "#666", border: `1px solid ${colors[status] || "#666"}44`,
    whiteSpace: "nowrap",
  }}>{status}</span>
);

const orderStatusColors = {
  "Pending": "var(--warning)", "Approved": "var(--primary)",
  "Processing": "var(--primary)", "Delivered": "var(--success)",
  "Cancelled": "var(--danger)",
};

const returnStatusColors = {
  "Return Requested": "var(--warning)", "Return Approved": "var(--primary)",
  "Pickup Scheduled": "#8b5cf6", "Returned Successfully": "var(--success)",
  "Return Rejected": "var(--danger)",
};

const FILTERS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Date Range" },
];

const OrdersOverviewChart = ({ data = [45, 52, 48, 65, 58, 72, 68, 85] }) => {
  const [tip, setTip] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const W = 700, H = 260, pad = { t: 32, r: 16, b: 34, l: 40 };
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const total = data.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / data.length);

  const y = (v) => pad.t + ch - ((v - min) / range) * ch;
  const x = (i) => pad.l + i * (cw / (data.length - 1));
  const pts = data.map((v, i) => ({ x: x(i), y: y(v) }));
  const toC = (pts) => pts.length < 2 ? '' : pts.map((p, i) => i === 0 ? `M ${p.x},${p.y}` : (() => { const prev = pts[i - 1]; const cp = (prev.x + p.x) / 2; return `C ${cp},${prev.y} ${cp},${p.y} ${p.x},${p.y}`; })()).join(' ');
  const areaPath = toC(pts) + ` L ${pts[pts.length - 1].x},${pad.t + ch} L ${pad.l},${pad.t + ch} Z`;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(6,182,212,0.25)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.3 }}>Orders Overview</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekly order distribution</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#06b6d4', letterSpacing: -0.5, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Total</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', letterSpacing: -0.5, lineHeight: 1 }}>{avg}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Avg</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {Array.from({ length: 5 }, (_, i) => {
            const v = Math.round(min + (i * range / 4));
            const yy = y(v);
            return <g key={`g-${i}`}>
              <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="var(--border)" strokeWidth="1" />
              <text x={pad.l - 8} y={yy + 3} textAnchor="end" style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}>{v}</text>
            </g>;
          })}
          <path d={areaPath} fill="url(#areaGrad)" />
          <path d={toC(pts)} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={toC(pts)} fill="none" stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          {data.map((v, i) => {
            const xx = x(i), yy = y(v);
            const hov = hoverIdx === i;
            return <g key={`p-${i}`}>
              {hov && <line x1={xx} y1={yy} x2={xx} y2={pad.t + ch} stroke="#06b6d4" strokeWidth="1" opacity="0.12" />}
              <circle cx={xx} cy={yy} r={hov ? 7 : 3} fill={hov ? '#06b6d4' : 'var(--bg-card)'} stroke="#06b6d4" strokeWidth={hov ? 2.5 : 2}
                style={{ cursor: 'pointer', transition: 'r .15s,fill .15s,stroke-width .15s' }}
                onMouseEnter={(e) => { const r = e.currentTarget.closest('[style*="position: relative"]').getBoundingClientRect(); setHoverIdx(i); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, val: `${v} Orders`, label: days[i] }); }}
                onMouseLeave={() => { setHoverIdx(null); setTip(null); }} />
              {hov && <circle cx={xx} cy={yy} r="2.5" fill="var(--bg-card)" style={{ pointerEvents: 'none' }} />}
            </g>;
          })}
          {data.map((v, i) => <text key={`lb-${i}`} x={x(i)} y={H - 10} textAnchor="middle" style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}>{days[i]}</text>)}
        </svg>
        <ChartTooltip tooltip={tip} color="#06b6d4" />
      </div>
    </div>
  );
};

const RevenueTrendChart = ({ data = [45000, 52000, 48000, 65000, 58000, 72000, 68000, 75000] }) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const W = 700, H = 260, pad = { t: 32, r: 16, b: 34, l: 48 };
  const max = Math.max(...data, 1);
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const total = data.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / data.length);
  const growth = data.length > 1 ? Math.round(((data[data.length - 1] - data[0]) / data[0]) * 100) : 0;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(139,92,246,0.25)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.3 }}>Revenue Trend</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekly revenue performance</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6', letterSpacing: -0.5, lineHeight: 1 }}>₹{(total / 1000).toFixed(0)}k</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Total</div>
          </div>
          <div style={{ textAlign: 'center', padding: '2px 8px', borderRadius: 6, background: growth >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: growth >= 0 ? '#10b981' : '#ef4444', lineHeight: 1 }}>{growth >= 0 ? '+' : ''}{growth}%</div>
            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500, marginTop: 1 }}>Growth</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          {Array.from({ length: 5 }, (_, i) => {
            const v = Math.round(max * i / 4);
            const yy = pad.t + ch - (v / max) * ch;
            return <g key={`g-${i}`}>
              <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="var(--border)" strokeWidth="1" />
              <text x={pad.l - 8} y={yy + 3} textAnchor="end" style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}>₹{(v / 1000).toFixed(0)}k</text>
            </g>;
          })}
          {data.map((v, i) => {
            const barW = cw / data.length - 6;
            const xx = pad.l + i * (cw / data.length) + 3;
            const barH = (v / max) * ch;
            const yy = pad.t + ch - barH;
            const hov = hoverIdx === i;
            return <g key={`b-${i}`}>
              <rect x={xx} y={yy} width={barW} height={barH} rx={4}
                fill={hov ? '#6d28d9' : 'url(#barGrad)'} opacity={hov ? 1 : 0.85}
                style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} />
              {hov && <rect x={xx - 2} y={yy - 2} width={barW + 4} height={barH + 2} rx={5} fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.4" />}
              {hov && <text x={xx + barW / 2} y={yy - 8} textAnchor="middle" style={{ fontSize: 11, fill: '#c4b5fd', fontWeight: 700 }}>₹{(v / 1000).toFixed(1)}k</text>}
              <text x={xx + barW / 2} y={H - 10} textAnchor="middle" style={{ fontSize: 10, fill: hoverIdx === i ? '#c4b5fd' : '#64748b', fontWeight: hoverIdx === i ? 600 : 500, transition: 'fill .15s' }}>{days[i]}</text>
            </g>;
          })}
        </svg>
      </div>
    </div>
  );
};

const BarChart = ({ data = [30, 45, 38, 52, 48, 60, 55, 70, 62, 75, 80, 90] }) => {
  const [tip, setTip] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const W = 700, H = 260, pad = { t: 32, r: 16, b: 34, l: 40 };
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const total = data.reduce((a, b) => a + b, 0);

  const y = (v) => pad.t + ch - ((v - min) / range) * ch;
  const x = (i) => pad.l + i * (cw / (data.length - 1));
  const pts = data.map((v, i) => ({ x: x(i), y: y(v) }));
  const toC = (pts) => pts.length < 2 ? '' : pts.map((p, i) => i === 0 ? `M ${p.x},${p.y}` : (() => { const prev = pts[i - 1]; const cp = (prev.x + p.x) / 2; return `C ${cp},${prev.y} ${cp},${p.y} ${p.x},${p.y}`; })()).join(' ');

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.3 }}>Monthly Sales</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sales trends across months</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', letterSpacing: -0.5, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Total</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', letterSpacing: -0.5, lineHeight: 1 }}>{Math.max(...data)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Peak</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {Array.from({ length: 5 }, (_, i) => {
            const v = Math.round(min + (i * range / 4));
            const yy = y(v);
            return <g key={`g-${i}`}>
              <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="var(--border)" strokeWidth="1" />
              <text x={pad.l - 8} y={yy + 3} textAnchor="end" style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}>{v}</text>
            </g>;
          })}
          <line x1={pad.l} y1={pad.t + ch} x2={W - pad.r} y2={pad.t + ch} stroke="var(--border)" strokeWidth="1" />
          <path d={toC(pts)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={toC(pts)} fill="none" stroke="#34d399" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          {data.map((v, i) => {
            const xx = x(i), yy = y(v);
            const hov = hoverIdx === i;
            return <g key={`p-${i}`}>
              {hov && <line x1={xx} y1={yy} x2={xx} y2={pad.t + ch} stroke="#10b981" strokeWidth="1" opacity="0.12" />}
              <circle cx={xx} cy={yy} r={hov ? 7 : 3.5} fill={hov ? '#10b981' : 'var(--bg-card)'} stroke="#10b981" strokeWidth={hov ? 2.5 : 2}
                style={{ cursor: 'pointer', transition: 'r .15s,fill .15s,stroke-width .15s' }}
                onMouseEnter={(e) => { const r = e.currentTarget.closest('[style*="position: relative"]').getBoundingClientRect(); setHoverIdx(i); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, val: `${v} Orders`, label: months[i] }); }}
                onMouseLeave={() => { setHoverIdx(null); setTip(null); }} />
              {hov && <circle cx={xx} cy={yy} r="2.5" fill="var(--bg-card)" style={{ pointerEvents: 'none' }} />}
              {i % 2 === 0 && <text x={xx} y={H - 10} textAnchor="middle" style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}>{months[i]}</text>}
            </g>;
          })}
        </svg>
        <ChartTooltip tooltip={tip} color="#10b981" />
      </div>
    </div>
  );
};

const EmployeeDashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orderCount: 0, returnCount: 0, recentOrders: [], recentReturns: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allOrders, setAllOrders] = useState([]);

  const load = useCallback(async (f, sd, ed) => {
    try {
      setLoading(true);
      const params = { filter: f };
      if (f === "custom") {
        if (sd) params.startDate = sd;
        if (ed) params.endDate = ed;
      }
      const [dashRes, ordersRes] = await Promise.all([
        api.get("/employee/dashboard", { params }),
        api.get("/employee/orders"),
      ]);
      setStats(dashRes.data.data);
      setAllOrders(ordersRes.data.data || []);
    } catch {
      setStats({ orderCount: 0, returnCount: 0, recentOrders: [], recentReturns: [] });
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter, startDate, endDate); }, [filter, startDate, endDate, load]);

  const chartOrdersDaily = useMemo(() => {
    const daily = [0, 0, 0, 0, 0, 0, 0];
    allOrders.forEach(o => {
      const date = new Date(o.createdAt);
      const day = date.getDay();
      daily[day === 0 ? 6 : day - 1]++;
    });
    return daily;
  }, [allOrders]);

  const chartRevenueDaily = useMemo(() => {
    const daily = [0, 0, 0, 0, 0, 0, 0];
    allOrders.forEach(o => {
      const date = new Date(o.createdAt);
      const day = date.getDay();
      daily[day === 0 ? 6 : day - 1] += o.totalAmount || 0;
    });
    return daily;
  }, [allOrders]);

  const chartMonthlySales = useMemo(() => {
    const monthly = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    allOrders.forEach(o => {
      const date = new Date(o.createdAt);
      monthly[date.getMonth()]++;
    });
    return monthly;
  }, [allOrders]);

  const handleFilterClick = (key) => {
    setFilter(key);
    if (key !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const [editOrder, setEditOrder] = useState(null);
  const [editReturn, setEditReturn] = useState(null);

  const orderEditFields = [
    { key: "customerName", label: "Customer Name" },
    { key: "mobileNumber", label: "Mobile Number" },
    { key: "fullAddress", label: "Full Address" },
    { key: "pincode", label: "Pincode" },
    { key: "productType", label: "Product Type", type: "select", options: ["GPS", "Vending Machine", "Disposal", "Other"] },
    { key: "customProductName", label: "Custom Product Name" },
    { key: "numberOfUnits", label: "Number of Units", type: "number" },
    { key: "amount", label: "Amount (per unit)", type: "number" },
    { key: "advanceAmount", label: "Advance Amount", type: "number" },
    { key: "orderStatus", label: "Status", type: "select", options: ["Pending", "Approved", "Processing", "Delivered", "Cancelled"] },
  ];

  const returnEditFields = [
    { key: "customerName", label: "Customer Name" },
    { key: "mobileNumber", label: "Mobile Number" },
    { key: "pincode", label: "Pincode" },
    { key: "productType", label: "Product Type", type: "select", options: ["GPS", "Vending Machine", "Disposal", "Other"] },
    { key: "numberOfUnitsReturning", label: "Units Returning", type: "number" },
    { key: "returnReason", label: "Return Reason", type: "select", options: ["Product Damaged", "Wrong Product", "Product Not Working", "Extra Order", "Other"] },
    { key: "customReason", label: "Custom Reason" },
    { key: "additionalDescription", label: "Additional Description", type: "textarea" },
    { key: "returnStatus", label: "Status", type: "select", options: ["Return Requested", "Return Approved", "Pickup Scheduled", "Returned Successfully", "Return Rejected"] },
  ];

  const handleEditOrder = (order) => setEditOrder({ ...order });
  const handleEditReturn = (r) => setEditReturn({ ...r });

  const handleDeleteOrder = async (order) => {
    if (!window.confirm(`Delete order for "${order.customerName}"? This cannot be undone.`)) return;
    await api.delete(`/employee/orders/${order._id}`);
    load(filter, startDate, endDate);
  };

  const handleDeleteReturn = async (r) => {
    if (!window.confirm(`Delete return request for "${r.customerName}"? This cannot be undone.`)) return;
    await api.delete(`/employee/returns/${r._id}`);
    load(filter, startDate, endDate);
  };

  const handleSaveOrderEdit = async (form) => {
    await api.put(`/employee/orders/${form._id}`, form);
    setEditOrder(null);
    load(filter, startDate, endDate);
  };

  const handleSaveReturnEdit = async (form) => {
    await api.put(`/employee/returns/${form._id}`, form);
    setEditReturn(null);
    load(filter, startDate, endDate);
  };

  const actionBtn = (onEdit, onDelete) => (
    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
      <button onClick={onEdit} title="Edit" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 14, padding: "2px 4px" }}>&#9998;</button>
      <button onClick={onDelete} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 14, padding: "2px 4px" }}>&#128465;</button>
    </div>
  );

  const statCards = [
    { title: "Orders", value: stats.orderCount, icon: PackageIcon, color: "blue" },
    { title: "Returns", value: stats.returnCount, icon: RefreshIcon, color: "orange" },
  ];

  return (
    <section className="admin-page">
      <div className="admin-head">
        <div>
          <h2>Welcome, {user?.name || "Employee"}!</h2>
          <p className="page-subtitle">Your activity summary</p>
        </div>
        <button className="logout-btn" onClick={() => load(filter, startDate, endDate)}>Refresh</button>
      </div>

      <div className="glass-card" style={{ padding: "10px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Filter:</span>
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleFilterClick(key)}
            style={{
              padding: "6px 16px", borderRadius: 8, border: `1px solid ${filter === key ? "var(--primary)" : "var(--border)"}`,
              background: filter === key ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)",
              color: filter === key ? "var(--primary)" : "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: filter === key ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
        {filter === "custom" && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={todayStr}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "6px 10px", fontSize: 13 }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={todayStr}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "6px 10px", fontSize: 13 }}
            />
          </>
        )}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      ) : (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: 600 }}>
            {statCards.map(({ title, value, icon: Icon, color }) => (
              <article key={title} className={`stat-card glass-card ${color}`}>
                <div className={`stat-icon ${color}`}><Icon /></div>
                <div className="stat-info">
                  <p>{title}</p>
                  <h3>{typeof value === "number" ? value.toLocaleString() : value}</h3>
                </div>
              </article>
            ))}
          </div>

          <div className="dashboard-section-grid" style={{ marginTop: 24 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <OrdersOverviewChart data={chartOrdersDaily} />
            </div>
            <div className="glass-card" style={{ padding: 20 }}>
              <RevenueTrendChart data={chartRevenueDaily} />
            </div>
            <div className="glass-card" style={{ padding: 20 }}>
              <BarChart data={chartMonthlySales} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginTop: 24 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Orders</h3>
              </div>
              {stats.recentOrders?.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>No orders found</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Customer</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Product</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Total</th>
                        <th style={{ textAlign: "center", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Status</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Date</th>
                        <th style={{ textAlign: "center", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((o) => (
                        <tr key={o._id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px", fontWeight: 500 }}>{o.customerName}</td>
                          <td style={{ padding: "8px" }}>{o.productType === "Other" ? o.customProductName : o.productType}</td>
                          <td style={{ padding: "8px", textAlign: "right" }}>{formatCurrency(o.totalAmount)}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{statusBadge(o.orderStatus, orderStatusColors)}</td>
                          <td style={{ padding: "8px", textAlign: "right", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDateTime(o.createdAt)}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{actionBtn(() => handleEditOrder(o), () => handleDeleteOrder(o))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div className="section-header" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Returns</h3>
              </div>
              {stats.recentReturns?.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>No returns found</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Customer</th>
                        <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Product</th>
                        <th style={{ textAlign: "center", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Status</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Date</th>
                        <th style={{ textAlign: "center", padding: "6px 8px", fontSize: 11, color: "var(--text-muted)" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentReturns.map((r) => (
                        <tr key={r._id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "8px", fontWeight: 500 }}>{r.customerName}</td>
                          <td style={{ padding: "8px" }}>{r.productType === "Other" ? r.customProductName || r.productType : r.productType}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{statusBadge(r.returnStatus, returnStatusColors)}</td>
                          <td style={{ padding: "8px", textAlign: "right", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDateTime(r.createdAt)}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{actionBtn(() => handleEditReturn(r), () => handleDeleteReturn(r))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {editOrder && (
        <EditModal title="Order" fields={orderEditFields} data={editOrder} onSave={handleSaveOrderEdit} onClose={() => setEditOrder(null)} />
      )}
      {editReturn && (
        <EditModal title="Return" fields={returnEditFields} data={editReturn} onSave={handleSaveReturnEdit} onClose={() => setEditReturn(null)} />
      )}
    </section>
  );
};

export default EmployeeDashboardPage;