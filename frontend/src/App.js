import React, { useEffect, useState, useCallback, useRef } from "react";
import LoginPage from "./LoginPage";

const API_URL = "https://backend-9e28.onrender.com";

// ── STORAGE HELPERS ──
const load = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10);

// ── SEED DATA ──
function seedIfEmpty() {
  if (!load('zones').length) {
    const zones = [
      { id: uid(), name: 'Anna Salai', type: 'Arterial', coverage: 12.4 },
      { id: uid(), name: 'T. Nagar', type: 'Commercial', coverage: 8.2 },
      { id: uid(), name: 'Adyar', type: 'Residential', coverage: 6.1 },
      { id: uid(), name: 'OMR Tech Corridor', type: 'Industrial', coverage: 22.8 },
      { id: uid(), name: 'Marina Beach Rd', type: 'Arterial', coverage: 5.5 },
    ];
    save('zones', zones);
    const nodes = [];
    const locs = [
      ['A-001', 'Anna Salai near DMS Signal', 'on', 100, '60W LED'],
      ['A-002', 'Gemini Flyover North', 'on', 80, '80W LED'],
      ['A-003', 'Spencers Plaza Front', 'dim', 30, '60W LED'],
      ['T-001', 'T. Nagar Bus Terminus', 'on', 100, '100W LED'],
      ['T-002', 'Pondy Bazaar Crossing', 'fault', 0, '60W LED'],
      ['T-003', 'Usman Road Main', 'on', 75, '80W LED'],
      ['D-001', 'Adyar Bridge South', 'on', 60, '60W LED'],
      ['D-002', 'Gandhi Nagar 3rd St', 'off', 0, '40W LED'],
      ['O-001', 'OMR Perungudi Toll', 'on', 100, '100W LED'],
      ['O-002', 'Sholinganallur Jct', 'dim', 45, '80W LED'],
      ['M-001', 'Marina Lighthouse Rd', 'on', 90, '60W LED'],
    ];
    locs.forEach(([nodeId, loc, status, bright, type]) => {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      nodes.push({ id: uid(), nodeId, loc, zone: zone.id, type, status, bright, sensor: 'PIR + LDR' });
    });
    save('nodes', nodes);
    save('faults', [
      { id: uid(), nodeId: 'T-002', zone: zones[1].id, type: 'Lamp Failure', priority: 'critical', logged: new Date(Date.now() - 3600000).toISOString(), status: 'open' },
      { id: uid(), nodeId: 'D-002', zone: zones[2].id, type: 'Comm Offline', priority: 'warning', logged: new Date(Date.now() - 7200000).toISOString(), status: 'open' },
    ]);
    save('maintenance', [
      { id: uid(), woNum: 'WO-001', desc: 'Replace faulty lamp T-002', nodeId: 'T-002', zone: zones[1].id, tech: 'Rajan K.', status: 'open', due: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
    ]);
  }
}

// ── ICONS ──
const Icon = ({ name, size = 16 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    nodes: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
    energy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    faults: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    maintenance: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    zones: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    location: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    save: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  };
  return icons[name] || null;
};

// ── STATUS BADGE ──
const StatusBadge = ({ status }) => {
  const cfg = {
    on: { label: 'Operational', color: '#06d6a0', bg: 'rgba(6,214,160,0.1)', border: 'rgba(6,214,160,0.3)' },
    dim: { label: 'Dimmed', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)' },
    fault: { label: 'Fault', color: '#ef476f', bg: 'rgba(239,71,111,0.1)', border: 'rgba(239,71,111,0.3)' },
    off: { label: 'Offline', color: '#4a4a5a', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
    open: { label: 'Open', color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' },
    done: { label: 'Done', color: '#06d6a0', bg: 'rgba(6,214,160,0.1)', border: 'rgba(6,214,160,0.3)' },
    progress: { label: 'In Progress', color: '#ffd166', bg: 'rgba(255,209,102,0.1)', border: 'rgba(255,209,102,0.3)' },
    critical: { label: 'Critical', color: '#ef476f', bg: 'rgba(239,71,111,0.1)', border: 'rgba(239,71,111,0.3)' },
    warning: { label: 'Warning', color: '#f5a623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.3)' },
    minor: { label: 'Minor', color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)' },
  };
  const c = cfg[status] || cfg.off;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
      borderRadius: 20, fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
      letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, boxShadow: `0 0 6px ${c.color}`, flexShrink: 0 }} />
      {c.label}
    </span>
  );
};

// ── KPI CARD ──
const KpiCard = ({ label, value, sub, color, barWidth, barColor, children, onClick, accentGlow }) => (
  <div onClick={onClick} style={{
    background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentGlow ? color + '40' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
    transition: 'all 0.25s', cursor: onClick ? 'pointer' : 'default',
    boxShadow: accentGlow ? `0 0 30px ${color}15` : 'none',
  }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: 0.12, pointerEvents: 'none' }} />
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    {children || <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 5 }}>{value}</div>}
    {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>{sub}</div>}
    {barWidth !== undefined && (
      <div style={{ marginTop: 12, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barWidth}%`, background: barColor || color, borderRadius: 1, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    )}
  </div>
);

// ── GLASS CARD ──
const Card = ({ children, style = {}, label, labelRight }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 20, backdropFilter: 'blur(10px)',
    position: 'relative', overflow: 'hidden', ...style,
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
    {label && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 2, height: 12, borderRadius: 1, background: '#f5a623' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
        </div>
        {labelRight && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{labelRight}</span>}
      </div>
    )}
    {children}
  </div>
);

// ── BTN ──
const Btn = ({ children, onClick, variant = 'ghost', size = 'md', style = {} }) => {
  const variants = {
    primary: { background: 'linear-gradient(135deg, #f5a623, #ff9500)', color: '#07080d', border: 'none', boxShadow: '0 4px 15px rgba(245,166,35,0.3)' },
    ghost: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' },
    danger: { background: 'rgba(239,71,111,0.1)', color: '#ef476f', border: '1px solid rgba(239,71,111,0.25)' },
    success: { background: 'rgba(6,214,160,0.1)', color: '#06d6a0', border: '1px solid rgba(6,214,160,0.25)' },
  };
  const sizes = { sm: { padding: '4px 10px', fontSize: 11 }, md: { padding: '8px 18px', fontSize: 12 } };
  return (
    <button onClick={onClick} style={{
      ...variants[variant], ...sizes[size], borderRadius: 8, fontWeight: 600,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', whiteSpace: 'nowrap', ...style,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; if (variant === 'primary') e.currentTarget.style.boxShadow = '0 8px 25px rgba(245,166,35,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (variant === 'primary') e.currentTarget.style.boxShadow = '0 4px 15px rgba(245,166,35,0.3)'; }}
    >
      {children}
    </button>
  );
};

// ── MODAL ──
const Modal = ({ id, title, open, onClose, children, footer, width = 520 }) => {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, rgba(22,25,38,0.99), rgba(13,15,24,0.99))',
        border: '1px solid rgba(245,166,35,0.2)', borderRadius: 18, padding: 28,
        width, maxWidth: '92vw', maxHeight: '86vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        animation: 'pageIn 0.25s cubic-bezier(0.4,0,0.2,1)', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f0e6d0' }}>{title}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,71,111,0.1)'; e.currentTarget.style.color = '#ef476f'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>{footer}</div>}
      </div>
    </div>
  );
};

// ── FORM FIELD ──
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</label>
    {children}
  </div>
);
const inputStyle = { width: '100%', padding: '9px 13px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: '#f0e6d0', fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', colorScheme: 'dark' };

// ── TOAST ──
const Toast = ({ msg, type, visible }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    padding: '12px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600,
    fontFamily: 'Outfit, sans-serif', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', pointerEvents: 'none',
    background: type === 'error' ? 'rgba(239,71,111,0.15)' : 'rgba(6,214,160,0.15)',
    border: `1px solid ${type === 'error' ? 'rgba(239,71,111,0.4)' : 'rgba(6,214,160,0.4)'}`,
    color: type === 'error' ? '#ef476f' : '#06d6a0',
    backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  }}>{msg}</div>
);

// ── MINI CHART (SVG spark) ──
const SparkLine = ({ data = [], color = '#f5a623', height = 40 }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 200, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── DONUT CHART ──
const DonutChart = ({ data }) => {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  let cum = 0;
  const r = 60, cx = 80, cy = 70;
  const segments = data.map(d => {
    const angle = (d.value / total) * 360;
    const start = cum;
    cum += angle;
    const toRad = a => (a - 90) * Math.PI / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + angle));
    const y2 = cy + r * Math.sin(toRad(start + angle));
    const large = angle > 180 ? 1 : 0;
    return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 160 140" style={{ width: 140, flexShrink: 0 }}>
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={38} fill="#0d0f18" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#f0e6d0" fontSize="18" fontFamily="Syne, sans-serif" fontWeight="800">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="JetBrains Mono, monospace">NODES</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>{d.label}</span>
            <span style={{ fontSize: 12, color: d.color, fontFamily: 'Syne, sans-serif', fontWeight: 700, marginLeft: 'auto', paddingLeft: 10 }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
//  PAGE: DASHBOARD
// ═══════════════════════════════════════════
const Dashboard = ({ toast, refresh }) => {
  const nodes = load('nodes'); const zones = load('zones'); const faults = load('faults');
  const on = nodes.filter(n => n.status === 'on').length;
  const dim = nodes.filter(n => n.status === 'dim').length;
  const fault = nodes.filter(n => n.status === 'fault').length;
  const off = nodes.filter(n => n.status === 'off').length;
  const openFaults = faults.filter(f => f.status === 'open').length;
  const avgBright = nodes.length ? Math.round(nodes.reduce((a, n) => a + n.bright, 0) / nodes.length) : 0;
  const totalW = nodes.reduce((a, n) => a + (parseInt(n.type) || 60) * (n.bright / 100), 0);
  const legacyW = nodes.reduce((a, n) => a + (parseInt(n.type) || 60), 0);
  const saved = legacyW ? Math.round(((legacyW - totalW) / legacyW) * 100) : 0;
  const monthlySave = Math.round((legacyW - totalW) * 10 * 30 * 7.60 / 1000);
  const sparkData = [40, 55, 48, 62, 71, 58, 65, 72, 60, 55, 68, 74, 70, 65, 78, 82, 75, 68, 72, 80, 85, 79, 74, totalW / 100].map(v => Math.round(v));

  const alerts = [
    { type: 'critical', icon: '⚡', title: `${fault} node${fault !== 1 ? 's' : ''} reporting faults`, meta: 'Requires immediate attention', time: 'Now' },
    { type: 'warning', icon: '🌙', title: 'Motion-adaptive dimming active', meta: `${dim} nodes at reduced brightness`, time: '2m ago' },
    { type: 'success', icon: '✅', title: `Energy saving at ${saved}% vs legacy`, meta: `₹${monthlySave.toLocaleString()} est. monthly savings`, time: '5m ago' },
    { type: 'info', icon: '🔧', title: `${zones.length} zones active across Chennai`, meta: `${nodes.length} total nodes registered`, time: '10m ago' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0e6d0', margin: 0 }}>System Overview</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.1em' }}>CHENNAI METRO · LIVE ADAPTIVE CONTROL</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={() => { const d = { nodes, zones, faults, exported: new Date().toISOString() }; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })); a.download = 'smartlux-export.json'; a.click(); toast('Data exported ✓'); }} variant="ghost"><Icon name="download" size={13} /> Export</Btn>
          <Btn onClick={refresh} variant="primary"><Icon name="refresh" size={13} /> Refresh</Btn>
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        <KpiCard label="Total Nodes" value={nodes.length} sub={`across ${zones.length} zones`} color="#f5a623" barWidth={Math.min(nodes.length / 2, 100)} accentGlow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 4px' }}>
            <button onClick={() => { if (!nodes.length) { toast('No nodes to remove', 'error'); return; } if (!window.confirm(`Remove last node?`)) return; const n = load('nodes'); n.pop(); save('nodes', n); refresh(); }} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(239,71,111,0.12)', border: '1px solid rgba(239,71,111,0.25)', color: '#ef476f', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800, color: '#f5a623', flex: 1, textAlign: 'center', lineHeight: 1 }}>{nodes.length}</div>
            <button onClick={() => { const ns = load('nodes'); const zs = load('zones'); const n = ns.length + 1; ns.push({ id: uid(), nodeId: `AUTO-${String(n).padStart(3, '0')}`, loc: `Auto Node #${n}`, zone: zs.length ? zs[0].id : '', type: '60W LED', status: 'on', bright: 100, sensor: 'PIR + LDR' }); save('nodes', ns); toast(`AUTO-${String(n).padStart(3, '0')} added ✓`); refresh(); }} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(6,214,160,0.12)', border: '1px solid rgba(6,214,160,0.25)', color: '#06d6a0', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </KpiCard>
        <KpiCard label="Operational" value={on} sub={`${nodes.length ? Math.round(on / nodes.length * 100) : 0}% uptime`} color="#06d6a0" barWidth={nodes.length ? (on / nodes.length) * 100 : 0} />
        <KpiCard label="Energy Saved" value={`${saved}%`} sub="vs fixed brightness" color="#00d4ff" barWidth={saved} />
        <KpiCard label="Active Faults" value={openFaults} sub={openFaults ? `${fault} node${fault !== 1 ? 's' : ''} affected` : 'all clear'} color="#ef476f" barWidth={nodes.length ? (openFaults / nodes.length) * 100 : 0} />
      </div>

      {/* CHARTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card label="24h Energy Profile" labelRight={`${Math.round(totalW / 100)} kWh`}>
          <SparkLine data={sparkData} color="#f5a623" height={120} />
        </Card>
        <Card label="Node Status Distribution">
          <DonutChart data={[
            { label: 'Operational', value: on, color: '#06d6a0' },
            { label: 'Dimmed', value: dim, color: '#00d4ff' },
            { label: 'Fault', value: fault, color: '#ef476f' },
            { label: 'Offline', value: off, color: '#3a3a4a' },
          ]} />
        </Card>
      </div>

      {/* ALERTS + STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card label="Live Alerts" labelRight={`${alerts.length} events`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((a, i) => {
              const colors = { critical: '#ef476f', warning: '#f5a623', success: '#06d6a0', info: '#00d4ff' };
              const c = colors[a.type];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 10, background: `${c}08`, border: `1px solid ${c}25`, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f0e6d0' }}>{a.title}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{a.meta}</div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{a.time}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card label="Health Stats">
            {[
              { k: 'Avg Brightness', v: `${avgBright}%`, c: '#f5a623' },
              { k: 'Network Load', v: `${Math.round(totalW / 10)} kW`, c: '#00d4ff' },
              { k: 'PIR Active', v: `${Math.round(nodes.length * 0.7)}`, c: '#06d6a0' },
              { k: 'Open WOs', v: `${load('maintenance').filter(m => m.status === 'open').length}`, c: '#b388ff' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{r.k}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: r.c }}>{r.v}</span>
              </div>
            ))}
          </Card>
          <Card style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.03))', borderColor: 'rgba(245,166,35,0.2)' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, color: 'rgba(245,166,35,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Monthly Savings</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800, color: '#f5a623', lineHeight: 1 }}>₹ {monthlySave.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>at ₹7.60 / kWh tariff</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
//  PAGE: NODES
// ═══════════════════════════════════════════
const Nodes = ({ toast, refresh }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editNode, setEditNode] = useState(null);
  const [form, setForm] = useState({ nodeId: '', zone: '', loc: '', type: '60W LED', status: 'on', bright: 100, sensor: 'PIR + LDR' });

const zones = load('zones');
const nodes = JSON.parse(localStorage.getItem("nodes")) || [];
  const filtered = nodes.filter(n =>
    (!search || n.nodeId.toLowerCase().includes(search.toLowerCase()) || n.loc.toLowerCase().includes(search.toLowerCase())) &&
    (!filter || n.status === filter)
  );

  const openAdd = () => { setEditNode(null); setForm({ nodeId: '', zone: zones[0]?.id || '', loc: '', type: '60W LED', status: 'on', bright: 100, sensor: 'PIR + LDR' }); setModal(true); };
  const openEdit = (n) => { setEditNode(n._id); setForm({ nodeId: n.nodeId, zone: n.zone, loc: n.loc, type: n.type, status: n.status, bright: n.bright, sensor: n.sensor }); setModal(true); };

  const saveNode = async () => {
  if (!form.nodeId || !form.zone || !form.loc) {
    toast('Fill required fields', 'error');
    return;
  }

  try {
    let res;

    if (editNode) {
      // ✏️ UPDATE NODE
      res = await fetch(`${API_URL}/streetlights/${editNode}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          location: form.loc,
          brightness: form.bright,
        }),
      });
    } else {
      // ➕ ADD NODE
      res = await fetch(`${API_URL}/streetlights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          location: form.loc,
          ambient_light: 50,
          traffic_density: 20,
          brightness: form.bright,
          energy_usage: 32,
          status: "Active"
        }),
      });
    }

    const data = await res.json();

    let ns = load("nodes");

    if (editNode) {
      ns = ns.map(n => n._id === editNode ? data : n);
      toast("Node updated ✓");
    } else {
      ns.push(data);
      toast("Node added ✓");
    }

    save("nodes", ns);

    setModal(false);
    setEditNode(null);
    refresh();
    setTick(t => t + 1);

  } catch (err) {
    console.error(err);
    toast("Backend error", "error");
  }
};

 const deleteNode = async (id) => {
  if (!window.confirm('Delete this node?')) return;

  try {
    await fetch(`${API_URL}/streetlights/${id}`, {
      method: "DELETE",
    });

    const ns = load("nodes").filter(n => n._id !== id);
    save("nodes", ns);

    toast("Node removed ✓");
    refresh();
    setTick(t => t + 1);

  } catch (err) {
    console.error(err);
    toast("Delete failed", "error");
  }
};
  const getZoneName = (id) => zones.find(z => z.id === id)?.name || '—';
  const wattage = (n) => Math.round((parseInt(n.type) || 60) * (n.bright / 100));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0e6d0', margin: 0 }}>Light Nodes</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.1em' }}>ADD · EDIT · DELETE · MONITOR</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}><Icon name="search" size={13} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search node / location…" style={{ ...inputStyle, width: 200, paddingLeft: 32 }} />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inputStyle, width: 130 }}>
            <option value="">All Status</option>
            <option value="on">Operational</option>
            <option value="dim">Dimmed</option>
            <option value="fault">Fault</option>
            <option value="off">Offline</option>
          </select>
          <Btn onClick={openAdd} variant="primary"><Icon name="plus" size={13} /> Add Node</Btn>
        </div>
      </div>

      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(245,166,35,0.04)', borderBottom: '1px solid rgba(245,166,35,0.12)' }}>
              {['Node ID', 'Location', 'Zone', 'Type', 'Status', 'Brightness', 'Wattage', 'Sensor', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((n, i) => (
              <tr key={n.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f0e6d0' }}>{n.nodeId}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 200 }}>{n.loc}</td>
                <td style={{ padding: '11px 14px', fontSize: 11, color: '#f5a623', fontFamily: 'JetBrains Mono, monospace' }}>{getZoneName(n.zone)}</td>
                <td style={{ padding: '11px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{n.type}</td>
                <td style={{ padding: '11px 14px' }}><StatusBadge status={n.status} /></td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 50, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${n.bright}%`, background: n.bright > 70 ? '#f5a623' : n.bright > 30 ? '#00d4ff' : '#3a3a4a', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{n.bright}%</span>
                  </div>
                </td>
                <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#00d4ff' }}>{wattage(n)}W</td>
                <td style={{ padding: '11px 14px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{n.sensor}</td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn onClick={() => openEdit(n)} variant="ghost" size="sm"><Icon name="edit" size={11} /></Btn>
                    <Btn onClick={() => deleteNode(n.id)} variant="danger" size="sm"><Icon name="trash" size={11} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💡</div>
            <p style={{ fontSize: 13 }}>No nodes found. Add your first light node above.</p>
          </div>
        )}
      </div>

      <Modal title={editNode ? 'Edit Light Node' : 'Add Light Node'} open={modal} onClose={() => setModal(false)}
        footer={<><Btn onClick={() => setModal(false)} variant="ghost">Cancel</Btn><Btn onClick={saveNode} variant="primary"><Icon name="save" size={13} />{editNode ? 'Update Node' : 'Add Node'}</Btn></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Node ID *"><input style={inputStyle} value={form.nodeId} onChange={e => setForm({ ...form, nodeId: e.target.value })} placeholder="e.g. A-012" /></Field>
          <Field label="Zone *">
            <select style={inputStyle} value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Location / Road Name *"><input style={inputStyle} value={form.loc} onChange={e => setForm({ ...form, loc: e.target.value })} placeholder="e.g. Anna Salai near DMS Signal" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Light Type">
            <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {['40W LED', '60W LED', '80W LED', '100W LED', '150W Legacy'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Sensor">
            <select style={inputStyle} value={form.sensor} onChange={e => setForm({ ...form, sensor: e.target.value })}>
              {['PIR + LDR', 'LDR Only', 'PIR Only', 'Camera + AI', 'None'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {['on', 'dim', 'fault', 'off'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label={`Brightness: ${form.bright}%`}>
            <input type="range" min={0} max={100} value={form.bright} onChange={e => setForm({ ...form, bright: parseInt(e.target.value) })}
              style={{ width: '100%', marginTop: 8, accentColor: '#f5a623' }} />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════
//  PAGE: ENERGY
// ═══════════════════════════════════════════
const Energy = () => {
  const nodes = load('nodes'); const zones = load('zones');
  const totalW = nodes.reduce((a, n) => a + (parseInt(n.type) || 60) * (n.bright / 100), 0);
  const legacyW = nodes.reduce((a, n) => a + (parseInt(n.type) || 60), 0);
  const todayKwh = (totalW * 10 / 1000).toFixed(1);
  const legacyKwh = (legacyW * 10 / 1000).toFixed(1);
  const savingKwh = (legacyKwh - todayKwh).toFixed(1);
  const pct = legacyKwh > 0 ? Math.round((savingKwh / legacyKwh) * 100) : 0;
  const annualSave = Math.round(savingKwh * 365 * 7.60);
  const co2 = (savingKwh * 0.82 * 30 / 1000).toFixed(2);
  const trees = Math.round(co2 / 0.021);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((m, i) => ({ smart: Math.round(parseFloat(todayKwh) * 30 * (0.85 + Math.sin(i) * 0.1)), legacy: Math.round(parseFloat(legacyKwh) * 30) }));
  const maxMonth = Math.max(...monthlyData.map(d => d.legacy), 1);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0e6d0', margin: 0 }}>Energy Analytics</h2>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.1em' }}>CONSUMPTION · SAVINGS · CARBON IMPACT</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        <KpiCard label="Today (Smart)" value={todayKwh} sub="kWh consumed" color="#f5a623" />
        <KpiCard label="Legacy Baseline" value={legacyKwh} sub="kWh if fixed brightness" color="rgba(255,255,255,0.3)" />
        <KpiCard label="Daily Saving" value={savingKwh} sub={`${pct}% reduction`} color="#06d6a0" />
        <KpiCard label="Annual Projection" value={`₹${(annualSave / 1000).toFixed(0)}K`} sub="saved per year" color="#00d4ff" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card label="Monthly Trend — Smart vs Legacy">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {monthlyData.slice(0, 6).map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', width: 28 }}>{months[i]}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.smart / maxMonth) * 100}%`, background: '#f5a623', borderRadius: 3 }} />
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.legacy / maxMonth) * 100}%`, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }} />
                  </div>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#06d6a0', width: 40, textAlign: 'right' }}>{d.smart}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 4, background: '#f5a623', borderRadius: 2 }} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Smart</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Legacy</span></div>
          </div>
        </Card>
        <Card label="Zone Energy Breakdown">
          {zones.map((z, i) => {
            const zNodes = load('nodes').filter(n => n.zone === z.id);
            const zW = zNodes.reduce((a, n) => a + (parseInt(n.type) || 60) * (n.bright / 100), 0);
            const zMax = legacyW || 1;
            return (
              <div key={z.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{z.name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#00d4ff' }}>{Math.round(zW)}W</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(zW / zMax) * 100}%`, background: `hsl(${i * 60}, 70%, 60%)`, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <Card label="CO₂ Impact">
          {[
            { label: 'CO₂ Avoided / Month', value: `${co2} T`, color: '#06d6a0' },
            { label: 'Equivalent Trees', value: trees, color: '#00d4ff' },
            { label: 'Efficiency Rating', value: 'A+', color: '#f5a623' },
          ].map((r, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: i < 2 ? 8 : 0 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.label}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: r.color, marginTop: 4 }}>{r.value}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
//  PAGE: FAULTS
// ═══════════════════════════════════════════
const Faults = ({ toast, refresh }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nodeId: '', zone: '', type: 'Lamp Failure', priority: 'critical' });

  const faults = load('faults'); const zones = load('zones'); const nodes = load('nodes');
  const open = faults.filter(f => f.status === 'open').length;
  const critical = faults.filter(f => f.priority === 'critical' && f.status === 'open').length;
  const resolved = faults.filter(f => f.status === 'resolved').length;

  const saveFault = () => {
    if (!form.nodeId || !form.zone) { toast('Fill required fields', 'error'); return; }
    const fs = load('faults');
    fs.push({ id: uid(), ...form, logged: new Date().toISOString(), status: 'open' });
    save('faults', fs); setModal(false); toast('Fault logged ✓'); refresh();
  };
  const resolve = (id) => {
    const fs = load('faults').map(f => f.id === id ? { ...f, status: 'resolved' } : f);
    save('faults', fs); toast('Fault resolved ✓'); refresh();
  };
  const deleteFault = (id) => {
    const fs = load('faults').filter(f => f.id !== id);
    save('faults', fs); toast('Fault deleted'); refresh();
  };
  const getZoneName = (id) => zones.find(z => z.id === id)?.name || '—';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0e6d0', margin: 0 }}>Fault Detection</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.1em' }}>LOG · ASSIGN · RESOLVE · AUTO-ALERT</p>
        </div>
        <Btn onClick={() => { setForm({ nodeId: '', zone: zones[0]?.id || '', type: 'Lamp Failure', priority: 'critical' }); setModal(true); }} variant="primary"><Icon name="plus" size={13} /> Log Fault</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        <KpiCard label="Open Faults" value={open} color="#ef476f" />
        <KpiCard label="Critical" value={critical} color="#ef476f" />
        <KpiCard label="Resolved Today" value={resolved} color="#06d6a0" />
        <KpiCard label="Avg Detect Time" value="4.2m" color="#00d4ff" />
      </div>
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(245,166,35,0.04)', borderBottom: '1px solid rgba(245,166,35,0.12)' }}>
              {['Fault ID', 'Node', 'Zone', 'Type', 'Priority', 'Logged', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {faults.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>#{f.id.slice(0, 6).toUpperCase()}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f0e6d0' }}>{f.nodeId}</td>
                <td style={{ padding: '11px 14px', fontSize: 11, color: '#f5a623', fontFamily: 'JetBrains Mono, monospace' }}>{getZoneName(f.zone)}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{f.type}</td>
                <td style={{ padding: '11px 14px' }}><StatusBadge status={f.priority} /></td>
                <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{new Date(f.logged).toLocaleString()}</td>
                <td style={{ padding: '11px 14px' }}><StatusBadge status={f.status} /></td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {f.status === 'open' && <Btn onClick={() => resolve(f.id)} variant="success" size="sm"><Icon name="check" size={11} /></Btn>}
                    <Btn onClick={() => deleteFault(f.id)} variant="danger" size="sm"><Icon name="trash" size={11} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!faults.length && (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <p style={{ fontSize: 13 }}>No active faults — all systems nominal.</p>
          </div>
        )}
      </div>

      <Modal title="Log Fault" open={modal} onClose={() => setModal(false)}
        footer={<><Btn onClick={() => setModal(false)} variant="ghost">Cancel</Btn><Btn onClick={saveFault} variant="primary">Log Fault</Btn></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Node ID *"><input style={inputStyle} value={form.nodeId} onChange={e => setForm({ ...form, nodeId: e.target.value })} placeholder="e.g. T-002" /></Field>
          <Field label="Zone *">
            <select style={inputStyle} value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Fault Type">
            <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {['Lamp Failure', 'Comm Offline', 'Power Surge', 'Sensor Fault', 'Physical Damage', 'Flickering', 'Dim Stuck'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select style={inputStyle} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {['critical', 'warning', 'minor'].map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════
//  PAGE: MAINTENANCE
// ═══════════════════════════════════════════
const Maintenance = ({ toast, refresh }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ desc: '', nodeId: '', zone: '', tech: '', status: 'open', due: '' });
  const [woCounter, setWoCounter] = useState(1);

  const maint = load('maintenance'); const zones = load('zones');
  const openOrders = maint.filter(m => m.status === 'open').length;
  const inProg = maint.filter(m => m.status === 'progress').length;
  const done = maint.filter(m => m.status === 'done').length;

  const saveWo = () => {
    if (!form.desc || !form.nodeId || !form.zone || !form.tech) { toast('Fill required fields', 'error'); return; }
    const ms = load('maintenance');
    ms.push({ id: uid(), woNum: `WO-${String(ms.length + 1).padStart(3, '0')}`, ...form });
    save('maintenance', ms); setModal(false); toast('Work order created ✓'); refresh();
  };
  const updateStatus = (id, s) => { const ms = load('maintenance').map(m => m.id === id ? { ...m, status: s } : m); save('maintenance', ms); toast('Updated ✓'); refresh(); };
  const deleteWo = (id) => { const ms = load('maintenance').filter(m => m.id !== id); save('maintenance', ms); toast('Work order deleted'); refresh(); };
  const getZoneName = (id) => zones.find(z => z.id === id)?.name || '—';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0e6d0', margin: 0 }}>Maintenance</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.1em' }}>WORK ORDERS · TECHNICIANS · STATUS</p>
        </div>
        <Btn onClick={() => { setForm({ desc: '', nodeId: '', zone: zones[0]?.id || '', tech: '', status: 'open', due: '' }); setModal(true); }} variant="primary"><Icon name="plus" size={13} /> New Work Order</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        <KpiCard label="Open Orders" value={openOrders} color="#f5a623" />
        <KpiCard label="In Progress" value={inProg} color="#ffd166" />
        <KpiCard label="Completed" value={done} color="#06d6a0" />
      </div>
      <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(245,166,35,0.04)', borderBottom: '1px solid rgba(245,166,35,0.12)' }}>
              {['WO#', 'Description', 'Node', 'Zone', 'Technician', 'Status', 'Due', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {maint.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: '#f5a623' }}>{m.woNum}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)', maxWidth: 180 }}>{m.desc}</td>
                <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f0e6d0' }}>{m.nodeId}</td>
                <td style={{ padding: '11px 14px', fontSize: 11, color: '#f5a623', fontFamily: 'JetBrains Mono, monospace' }}>{getZoneName(m.zone)}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{m.tech}</td>
                <td style={{ padding: '11px 14px' }}><StatusBadge status={m.status} /></td>
                <td style={{ padding: '11px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{m.due || '—'}</td>
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {m.status === 'open' && <Btn onClick={() => updateStatus(m.id, 'progress')} variant="ghost" size="sm">▶</Btn>}
                    {m.status === 'progress' && <Btn onClick={() => updateStatus(m.id, 'done')} variant="success" size="sm"><Icon name="check" size={11} /></Btn>}
                    <Btn onClick={() => deleteWo(m.id)} variant="danger" size="sm"><Icon name="trash" size={11} /></Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!maint.length && (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔧</div>
            <p style={{ fontSize: 13 }}>No work orders. Create one to get started.</p>
          </div>
        )}
      </div>

      <Modal title="New Work Order" open={modal} onClose={() => setModal(false)}
        footer={<><Btn onClick={() => setModal(false)} variant="ghost">Cancel</Btn><Btn onClick={saveWo} variant="primary">Create WO</Btn></>}
      >
        <Field label="Description *"><input style={inputStyle} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="e.g. Replace faulty ballast" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Node ID *"><input style={inputStyle} value={form.nodeId} onChange={e => setForm({ ...form, nodeId: e.target.value })} placeholder="e.g. T-002" /></Field>
          <Field label="Zone *">
            <select style={inputStyle} value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Technician *"><input style={inputStyle} value={form.tech} onChange={e => setForm({ ...form, tech: e.target.value })} placeholder="e.g. Rajan K." /></Field>
          <Field label="Due Date"><input type="date" style={inputStyle} value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════
//  PAGE: ZONES
// ═══════════════════════════════════════════
const Zones = ({ toast, refresh }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Arterial', coverage: '' });
  const zones = load('zones'); const nodes = load('nodes'); const faults = load('faults');

  const saveZone = () => {
    if (!form.name) { toast('Zone name required', 'error'); return; }
    const zs = load('zones');
    zs.push({ id: uid(), ...form, coverage: parseFloat(form.coverage) || 0 });
    save('zones', zs); setModal(false); toast('Zone added ✓'); refresh();
  };
  const deleteZone = (id) => { if (!window.confirm('Delete zone?')) return; const zs = load('zones').filter(z => z.id !== id); save('zones', zs); toast('Zone deleted'); refresh(); };
  const typeColors = { Arterial: '#f5a623', Commercial: '#00d4ff', Residential: '#06d6a0', Industrial: '#b388ff', 'Main Road': '#ffd166' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0e6d0', margin: 0 }}>Zones & Districts</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.1em' }}>ADD CHENNAI AREAS · MANAGE COVERAGE</p>
        </div>
        <Btn onClick={() => { setForm({ name: '', type: 'Arterial', coverage: '' }); setModal(true); }} variant="primary"><Icon name="plus" size={13} /> Add Zone</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {zones.map(z => {
          const zNodes = nodes.filter(n => n.zone === z.id);
          const zFaults = faults.filter(f => f.zone === z.id && f.status === 'open').length;
          const on = zNodes.filter(n => n.status === 'on').length;
          const c = typeColors[z.type] || '#f5a623';
          return (
            <div key={z.id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 18, position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${c}40`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: 0.5 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#f0e6d0' }}>{z.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{z.type}</div>
                </div>
                <Btn onClick={() => deleteZone(z.id)} variant="danger" size="sm"><Icon name="trash" size={11} /></Btn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { v: zNodes.length, l: 'Nodes', c: '#f0e6d0' },
                  { v: on, l: 'Online', c: '#06d6a0' },
                  { v: zFaults, l: 'Faults', c: '#ef476f' },
                  { v: `${z.coverage}km`, l: 'Area', c: '#00d4ff' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Coverage: {z.coverage} km²</span>
                <StatusBadge status={zFaults > 0 ? 'open' : 'on'} />
              </div>
            </div>
          );
        })}
      </div>
      {!zones.length && (
        <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>◈</div>
          <p>No zones added. Add Chennai districts to begin.</p>
        </div>
      )}

      <Modal title="Add Zone" open={modal} onClose={() => setModal(false)}
        footer={<><Btn onClick={() => setModal(false)} variant="ghost">Cancel</Btn><Btn onClick={saveZone} variant="primary">Add Zone</Btn></>}
      >
        <Field label="Zone Name *"><input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Velachery" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Zone Type">
            <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {['Arterial', 'Commercial', 'Residential', 'Industrial', 'Main Road'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Coverage (km²)"><input type="number" style={inputStyle} value={form.coverage} onChange={e => setForm({ ...form, coverage: e.target.value })} placeholder="e.g. 8.5" /></Field>
        </div>
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════
//  PAGE: SETTINGS
// ═══════════════════════════════════════════
const Settings = ({ toast, refresh }) => {
  const [cfg, setCfg] = useState({ city: 'Chennai', state: 'Tamil Nadu', tariff: 7.60, co2: 0.82, dim: 30 });
  const [toggles, setToggles] = useState({
    motion: true, daylight: true, traffic: true, alerts: true, predictive: true, weather: false,
  });

  const Toggle = ({ label, desc, k }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <div style={{ fontSize: 13, color: '#f0e6d0', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{desc}</div>
      </div>
      <div onClick={() => setToggles(t => ({ ...t, [k]: !t[k] }))} style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0,
        background: toggles[k] ? 'rgba(6,214,160,0.25)' : 'rgba(255,255,255,0.06)',
        border: toggles[k] ? '1px solid rgba(6,214,160,0.4)' : '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: toggles[k] ? 19 : 2, width: 16, height: 16, borderRadius: '50%', transition: 'all 0.25s',
          background: toggles[k] ? '#06d6a0' : 'rgba(255,255,255,0.3)',
          boxShadow: toggles[k] ? '0 0 8px rgba(6,214,160,0.6)' : 'none',
        }} />
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0e6d0', margin: 0 }}>Settings</h2>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.1em' }}>SYSTEM · AUTOMATION · CITY CONFIG</p>
        </div>
        <Btn onClick={() => toast('Settings saved ✓')} variant="primary"><Icon name="save" size={13} /> Save Changes</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card label="Automation Controls">
          <Toggle label="Motion-based Dimming" desc="Dim to 30% when no movement detected" k="motion" />
          <Toggle label="Daylight Auto Cutoff" desc="Turn off when ambient LUX > 400" k="daylight" />
          <Toggle label="Traffic Adaptive Brightness" desc="100% during peak traffic hours" k="traffic" />
          <Toggle label="Auto Fault Alerts (SMS / Email)" desc="Notify officers on fault detection" k="alerts" />
          <Toggle label="Predictive Maintenance AI" desc="Flag nodes likely to fail soon" k="predictive" />
          <Toggle label="Weather Brightness Override" desc="Boost to 110% during rain" k="weather" />
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card label="City Configuration">
            <Field label="City Name"><input style={inputStyle} value={cfg.city} onChange={e => setCfg({ ...cfg, city: e.target.value })} /></Field>
            <Field label="State"><input style={inputStyle} value={cfg.state} onChange={e => setCfg({ ...cfg, state: e.target.value })} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Tariff (₹/kWh)"><input type="number" style={inputStyle} value={cfg.tariff} onChange={e => setCfg({ ...cfg, tariff: e.target.value })} step="0.1" /></Field>
              <Field label="CO₂ Factor (kg/kWh)"><input type="number" style={inputStyle} value={cfg.co2} onChange={e => setCfg({ ...cfg, co2: e.target.value })} step="0.01" /></Field>
            </div>
            <Field label="Default Dim Level (%)"><input type="number" style={inputStyle} value={cfg.dim} onChange={e => setCfg({ ...cfg, dim: e.target.value })} min="10" max="80" /></Field>
          </Card>
          <Card label="System Info">
            {[
              { k: 'Total Nodes', v: load('nodes').length },
              { k: 'Zones', v: load('zones').length },
              { k: 'Open Faults', v: load('faults').filter(f => f.status === 'open').length },
              { k: 'Work Orders', v: load('maintenance').length },
              { k: 'Version', v: 'SmartLux v2.0' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{r.k}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#f0e6d0' }}>{r.v}</span>
              </div>
            ))}
            <button onClick={() => { if (!window.confirm('Delete ALL data?')) return; ['nodes', 'zones', 'faults', 'maintenance'].forEach(k => save(k, [])); toast('All data cleared', 'error'); refresh(); }}
              style={{ marginTop: 16, width: '100%', padding: '8px', background: 'rgba(239,71,111,0.1)', border: '1px solid rgba(239,71,111,0.25)', borderRadius: 8, color: '#ef476f', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,71,111,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,71,111,0.1)'}
            >🗑 Reset All Data</button>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [clock, setClock] = useState('');
  const [tick, setTick] = useState(0);
  const [toast, setToastState] = useState({ msg: '', type: 'success', visible: false });
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('sl_session')); } catch { return null; } });
  const toastTimer = useRef(null);
  const [nodes, setNodes] = useState([]);

  const handleLogin = useCallback((u) => { setUser(u); }, []);
  const handleLogout = useCallback(() => { localStorage.removeItem('sl_session'); setUser(null); setPage('dashboard'); }, []);

  useEffect(() => { seedIfEmpty(); }, []);

  useEffect(() => {
  const interval = setInterval(() => {
    fetch(`${API_URL}/streetlights`)
      .then(res => res.json())
      .then(data => {
        localStorage.setItem("nodes", JSON.stringify(data));
        setTick(t => t + 1);
      })
      .catch(() => {});
  }, 5000);

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
  fetch(`${API_URL}/streetlights`)
    .then(res => res.json())
    .then(data => {
      setNodes(data);
      localStorage.setItem("nodes", JSON.stringify(data));
    })
    .catch(err => {
      console.error("Backend error:", err);
      setNodes(load("nodes"));
    });
}, []);


  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-IN', { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToastState({ msg, type, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(s => ({ ...s, visible: false })), 2800);
  }, []);

  const refresh = useCallback(() => setTick(t => t + 1), []);
  const openFaults = load('faults').filter(f => f.status === 'open').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', section: 'OVERVIEW' },
    { id: 'nodes', label: 'Light Nodes', icon: 'nodes', section: 'MANAGEMENT' },
    { id: 'energy', label: 'Energy', icon: 'energy' },
    { id: 'faults', label: 'Fault Detection', icon: 'faults', badge: openFaults },
    { id: 'maintenance', label: 'Maintenance', icon: 'maintenance' },
    { id: 'zones', label: 'Zones & Districts', icon: 'zones', section: 'CONFIG' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const pages = { dashboard: Dashboard, nodes: Nodes, energy: Energy, faults: Faults, maintenance: Maintenance, zones: Zones, settings: Settings };
  const PageComponent = pages[page];

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { height: 100%; }
        body { background: #07080d; color: #f0e6d0; font-family: Outfit, sans-serif; overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,166,35,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(245,166,35,0.4); }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #f5a623; cursor: pointer; }
        @keyframes pageIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseDot { 0%,100% { box-shadow: 0 0 6px #06d6a0; } 50% { box-shadow: 0 0 14px #06d6a0, 0 0 20px rgba(6,214,160,0.4); } }
        select option { background: #1a1d2e; color: #f0e6d0; }
      `}</style>

      {/* BG EFFECTS */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 80% 10%, rgba(245,166,35,0.04) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(0,212,255,0.03) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(245,166,35,0.07) 1px, transparent 1px)', backgroundSize: '32px 32px', maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)' }} />
      </div>

      <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 1 }}>

        {/* SIDEBAR */}
        <nav style={{
          width: 234, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, rgba(245,166,35,0.06) 0%, rgba(7,8,13,0.98) 30%)',
          borderRight: '1px solid rgba(245,166,35,0.12)', backdropFilter: 'blur(20px)',
          position: 'relative', zIndex: 10,
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />

          {/* BRAND */}
          <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,180,0,0.08)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #f5a623 0%, #ff9500 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 10, boxShadow: '0 4px 20px rgba(245,166,35,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>💡</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, background: 'linear-gradient(135deg, #ffd166, #f5a623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.02em' }}>SmartLux</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginTop: 2, textTransform: 'uppercase' }}>Chennai · Adaptive Control</div>
          </div>

          {/* NAV */}
          <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map((item, i) => (
              <React.Fragment key={item.id}>
                {item.section && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', padding: '10px 10px 4px', textTransform: 'uppercase' }}>{item.section}</div>}
                <div onClick={() => setPage(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                  cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s', position: 'relative',
                  color: page === item.id ? '#ffd166' : 'rgba(255,255,255,0.45)',
                  background: page === item.id ? 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(245,166,35,0.06))' : 'transparent',
                  border: page === item.id ? '1px solid rgba(245,166,35,0.2)' : '1px solid transparent',
                  boxShadow: page === item.id ? '0 2px 12px rgba(245,166,35,0.1)' : 'none',
                  fontSize: 13, fontWeight: 500,
                }}
                  onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center', filter: page === item.id ? 'drop-shadow(0 0 6px #f5a623)' : 'none' }}><Icon name={item.icon} size={15} /></span>
                  {item.label}
                  {item.badge > 0 && <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(239,71,111,0.2)', color: '#ef476f', border: '1px solid rgba(239,71,111,0.3)', borderRadius: 20, padding: '0 6px', minWidth: 20, textAlign: 'center' }}>{item.badge}</span>}
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* FOOTER */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,180,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.15)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#06d6a0', boxShadow: '0 0 10px #06d6a0', animation: 'pulseDot 2s infinite', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#06d6a0', letterSpacing: '0.1em' }}>ALL SYSTEMS ONLINE</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Server Active</div>
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* TOPBAR */}
          <header style={{
            height: 56, flexShrink: 0, background: 'rgba(7,8,13,0.85)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(245,166,35,0.12)', display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: 12, position: 'relative',
          }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.3), transparent)' }} />
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#f0e6d0' }}>
              {navItems.find(n => n.id === page)?.label}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#ffd166', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', padding: '5px 12px', borderRadius: 6, letterSpacing: '0.05em' }}>{clock}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              <Icon name="location" size={11} /> Chennai, TN
            </div>
            <div onClick={() => setPage('faults')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s', background: openFaults > 0 ? 'rgba(239,71,111,0.08)' : 'rgba(255,255,255,0.04)', border: openFaults > 0 ? '1px solid rgba(239,71,111,0.25)' : '1px solid rgba(255,255,255,0.08)', color: openFaults > 0 ? '#ef476f' : 'rgba(255,255,255,0.5)' }}>
              ⚠ {openFaults} Alert{openFaults !== 1 ? 's' : ''}
            </div>
            {/* USER CHIP */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #f5a623, #ff9500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#07080d', fontFamily: 'Syne, sans-serif' }}>{user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#f0e6d0', lineHeight: 1 }}>{user?.username || user?.email?.split('@')[0]}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role || 'operator'}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{ padding: '6px 12px', borderRadius: 7, background: 'rgba(239,71,111,0.08)', border: '1px solid rgba(239,71,111,0.2)', color: '#ef476f', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.05em' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,71,111,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,71,111,0.08)'}
            >LOGOUT</button>
          </header>

          {/* CONTENT */}
          <div key={`${page}-${tick}`} style={{ flex: 1, overflowY: 'auto', padding: 24, animation: 'pageIn 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
            <PageComponent toast={showToast} refresh={refresh} />
          </div>
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </>
  );
}