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

const chartTheme = {
  cyan: { accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.08)', light: '#22d3ee', label: '#0891b2' },
  purple: { accent: '#8b5cf6', accentBg: 'rgba(139,92,246,0.08)', light: '#a78bfa', label: '#7c3aed' },
  green: { accent: '#10b981', accentBg: 'rgba(16,185,129,0.08)', light: '#34d399', label: '#059669' },
};

const ChartContainer = ({ children, theme = 'cyan' }) => {
  const t = chartTheme[theme];
  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${t.accent}, ${t.light}, ${t.accent})` }} />
      <div style={{ padding: '16px 20px 18px' }}>
        {children}
      </div>
    </div>
  );
};

const ChartTooltip = ({ tooltip, color, parentClass }) => {
  if (!tooltip) return null;
  const above = tooltip.y > 70;
  return (
    <div style={{
      position: 'absolute', left: tooltip.x,
      top: above ? tooltip.y : tooltip.y + 20,
      transform: above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      marginTop: above ? -14 : 0,
      background: '#1a2540', padding: '6px 12px', borderRadius: 8,
      border: `1px solid #2d3e54`, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      zIndex: 100, pointerEvents: 'none', textAlign: 'center', minWidth: 60,
    }}>
      <div style={{
        position: 'absolute',
        [above ? 'bottom' : 'top']: -5,
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: 8, height: 8,
        background: '#1a2540',
        borderRight: '1px solid #2d3e54',
        borderBottom: '1px solid #2d3e54',
      }} />
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4 }}>{tooltip.label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 1 }}>{tooltip.val}</div>
    </div>
  );
};

const ChartStat = ({ label, value, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: color, padding: '4px 10px', borderRadius: 6 }}>
    <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{value}</span>
  </div>
);

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
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>Orders Overview</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>Weekly order distribution</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#06b6d4', letterSpacing: -0.5, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Total</div>
          </div>
          <div style={{ width: 1, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', letterSpacing: -0.5, lineHeight: 1 }}>{avg}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Avg</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', borderRadius: 12, background: '#1a2540', border: '1px solid #2d3e54', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
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
              <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="#f1f5f9" strokeWidth="1" />
              <text x={pad.l - 8} y={yy + 3} textAnchor="end" style={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}>{v}</text>
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
              <circle cx={xx} cy={yy} r={hov ? 7 : 3} fill={hov ? '#06b6d4' : '#fff'} stroke="#06b6d4" strokeWidth={hov ? 2.5 : 2}
                style={{ cursor: 'pointer', transition: 'r .15s,fill .15s,stroke-width .15s' }}
                onMouseEnter={(e) => { const r = e.currentTarget.closest('[style*="position: relative"]').getBoundingClientRect(); setHoverIdx(i); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, val: `${v} Orders`, label: days[i] }); }}
                onMouseLeave={() => { setHoverIdx(null); setTip(null); }} />
              {hov && <circle cx={xx} cy={yy} r="2.5" fill="#fff" style={{ pointerEvents: 'none' }} />}
            </g>;
          })}
          {data.map((v, i) => <text key={`lb-${i}`} x={x(i)} y={H - 10} textAnchor="middle" style={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}>{days[i]}</text>)}
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
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>Revenue Trend</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>Weekly revenue performance</span>
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
      <div style={{ position: 'relative', borderRadius: 12, background: '#1a2540', border: '1px solid #2d3e54', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
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
              <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="#f1f5f9" strokeWidth="1" />
              <text x={pad.l - 8} y={yy + 3} textAnchor="end" style={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}>₹{(v / 1000).toFixed(0)}k</text>
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
              {hov && <text x={xx + barW / 2} y={yy - 8} textAnchor="middle" style={{ fontSize: 11, fill: '#4c1d95', fontWeight: 700 }}>₹{(v / 1000).toFixed(1)}k</text>}
              <text x={xx + barW / 2} y={H - 10} textAnchor="middle" style={{ fontSize: 10, fill: hoverIdx === i ? '#4c1d95' : '#94a3b8', fontWeight: hoverIdx === i ? 600 : 500, transition: 'fill .15s' }}>{days[i]}</text>
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
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>Monthly Sales</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>Sales trends across months</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', letterSpacing: -0.5, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Total</div>
          </div>
          <div style={{ width: 1, background: '#e2e8f0' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', letterSpacing: -0.5, lineHeight: 1 }}>{Math.max(...data)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>Peak</div>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', borderRadius: 12, background: '#1a2540', border: '1px solid #2d3e54', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
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
              <line x1={pad.l} y1={yy} x2={W - pad.r} y2={yy} stroke="#f1f5f9" strokeWidth="1" />
              <text x={pad.l - 8} y={yy + 3} textAnchor="end" style={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}>{v}</text>
            </g>;
          })}
          <line x1={pad.l} y1={pad.t + ch} x2={W - pad.r} y2={pad.t + ch} stroke="#e2e8f0" strokeWidth="1" />
          <path d={toC(pts)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={toC(pts)} fill="none" stroke="#34d399" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          {data.map((v, i) => {
            const xx = x(i), yy = y(v);
            const hov = hoverIdx === i;
            return <g key={`p-${i}`}>
              {hov && <line x1={xx} y1={yy} x2={xx} y2={pad.t + ch} stroke="#10b981" strokeWidth="1" opacity="0.12" />}
              <circle cx={xx} cy={yy} r={hov ? 7 : 3.5} fill={hov ? '#10b981' : '#fff'} stroke="#10b981" strokeWidth={hov ? 2.5 : 2}
                style={{ cursor: 'pointer', transition: 'r .15s,fill .15s,stroke-width .15s' }}
                onMouseEnter={(e) => { const r = e.currentTarget.closest('[style*="position: relative"]').getBoundingClientRect(); setHoverIdx(i); setTip({ x: e.clientX - r.left, y: e.clientY - r.top, val: `${v} Orders`, label: months[i] }); }}
                onMouseLeave={() => { setHoverIdx(null); setTip(null); }} />
              {hov && <circle cx={xx} cy={yy} r="2.5" fill="#fff" style={{ pointerEvents: 'none' }} />}
              {i % 2 === 0 && <text x={xx} y={H - 10} textAnchor="middle" style={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }}>{months[i]}</text>}
            </g>;
          })}
        </svg>
        <ChartTooltip tooltip={tip} color="#10b981" />
      </div>
    </div>
  );
};

const DoughnutChart = ({ pending = 120, processing = 200, delivered = 50, cancelled = 30 }) => {
  const total = pending + processing + delivered + cancelled;
  const t = chartTheme.green;
  const items = [
    { label: 'Delivered', value: delivered, color: '#10b981' },
    { label: 'Processing', value: processing, color: '#06b6d4' },
    { label: 'Pending', value: pending, color: '#f59e0b' },
    { label: 'Cancelled', value: cancelled, color: '#ef4444' },
  ];

  let offset = 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: '#f59e0b', display: 'inline-block' }}></span>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>Order Status</h4>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, padding: '2px 8px', borderRadius: 20, background: t.accentBg, color: t.accent, border: `1px solid ${t.accent}30` }}>Donut Chart</span>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
          <span>{total} total</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 120 120" width="160" height="160" style={{ display: 'block' }}>
            <circle cx="60" cy="60" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            {items.map((item) => {
              const dash = (item.value / total) * circumference;
              const dashOffset = -offset;
              offset += dash;
              if (item.value === 0) return null;
              return (
                <circle key={item.label} cx="60" cy="60" r="42" fill="none" stroke={item.color} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              );
            })}
            <circle cx="60" cy="60" r="30" fill="#ffffff" />
            <text x="60" y="56" textAnchor="middle" style={{ fontSize: 18, fontWeight: 800, fill: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>{total}</text>
            <text x="60" y="70" textAnchor="middle" style={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</text>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {items.map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text)', padding: '4px 0' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: item.color, display: 'inline-block' }}></span>
              <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-heading)' }}>{item.label}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-heading)', minWidth: 24, textAlign: 'right' }}>{item.value}</span>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, minWidth: 40, textAlign: 'right' }}>{total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%</span>
            </div>
          ))}
        </div>
      </div>
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
    return () => clearInterval(interval);
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

  const topProducts = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      const name = o.productType === "Other" ? (o.customProductName || "Other Device") : o.productType;
      if (!counts[name]) {
        counts[name] = { name, salesCount: 0, ordersCount: 0 };
      }
      counts[name].salesCount += o.numberOfUnits || 0;
      counts[name].ordersCount += 1;
    });

    return Object.values(counts)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 4)
      .map(item => ({
        name: item.name,
        sales: `${item.salesCount.toLocaleString()} units`,
        orders: item.ordersCount
      }));
  }, [orders]);

  const topCustomers = useMemo(() => {
    const counts = {};
    orders.forEach(o => {
      const name = o.customerName || "Unknown Customer";
      if (!counts[name]) {
        counts[name] = { name, ordersCount: 0, amountSum: 0 };
      }
      counts[name].ordersCount += 1;
      counts[name].amountSum += o.totalAmount || 0;
    });

    return Object.values(counts)
      .sort((a, b) => b.amountSum - a.amountSum)
      .slice(0, 4)
      .map(item => ({
        name: item.name,
        orders: `${item.ordersCount} Order${item.ordersCount !== 1 ? "s" : ""}`,
        amount: `₹${item.amountSum.toLocaleString()}`
      }));
  }, [orders]);

  const totalStatusCount = summary.deliveredOrders + summary.processingOrders + summary.pendingOrders + summary.cancelledOrders;

  const chartOrdersDaily = useMemo(() => {
    const daily = [0, 0, 0, 0, 0, 0, 0];
    orders.forEach(o => {
      const date = new Date(o.createdAt);
      const day = date.getDay();
      daily[day === 0 ? 6 : day - 1]++;
    });
    return daily;
  }, [orders]);

  const chartRevenueDaily = useMemo(() => {
    const daily = [0, 0, 0, 0, 0, 0, 0];
    orders.forEach(o => {
      const date = new Date(o.createdAt);
      const day = date.getDay();
      daily[day === 0 ? 6 : day - 1] += o.totalAmount || 0;
    });
    return daily;
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
    return monthly;
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

      <div className="dashboard-section-grid">
        <ChartContainer theme="cyan">
          <OrdersOverviewChart data={chartOrdersDaily} />
        </ChartContainer>
        <ChartContainer theme="purple">
          <RevenueTrendChart data={chartRevenueDaily} />
        </ChartContainer>
        <ChartContainer theme="green">
          <DoughnutChart
            pending={pendingCount}
            processing={processingCount}
            delivered={deliveredCount}
            cancelled={cancelledCount}
          />
        </ChartContainer>
        <ChartContainer theme="purple">
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
            {topProducts.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "16px 0 0" }}>No products sold yet</p>
            ) : (
              topProducts.map((product, i) => (
                <div key={i} className="product-row">
                  <div className="product-number">{i + 1}</div>
                  <div className="product-details">
                    <p className="product-name">{product.name}</p>
                    <p className="sales-text">{product.sales}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="customers-card glass-card">
          <div className="table-header">
            <h3>Top Customers</h3>
            <a href="#" className="view-all-link">View All</a>
          </div>
          <div className="customers-list">
            {topCustomers.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "16px 0 0" }}>No customers registered yet</p>
            ) : (
              topCustomers.map((customer, i) => (
                <div key={i} className="customer-item">
                  <div className="customer-avatar">{customer.name.charAt(0)}</div>
                  <div className="customer-info">
                    <p className="customer-name">{customer.name}</p>
                    <p className="customer-orders">{customer.orders}</p>
                  </div>
                  <p className="customer-amount">{customer.amount}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboardPage;
