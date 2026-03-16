import React, { useState, useEffect, useRef } from "react";

const loadUsers = () => { try { return JSON.parse(localStorage.getItem('sl_users')) || []; } catch { return []; } };
const saveUsers = (u) => localStorage.setItem('sl_users', JSON.stringify(u));
const saveSession = (u) => localStorage.setItem('sl_session', JSON.stringify(u));

// ── ANIMATED STREETLIGHT CANVAS BG ──
function StreetCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Floating light orbs
    const orbs = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      r: 2 + Math.random() * 4,
      speed: 0.0002 + Math.random() * 0.0004,
      phase: Math.random() * Math.PI * 2,
      color: i % 3 === 0 ? '#f5a623' : i % 3 === 1 ? '#00d4ff' : '#06d6a0',
    }));

    const draw = () => {
      t += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(245,166,35,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Orbs
      orbs.forEach(o => {
        const x = (o.x + Math.sin(t * o.speed * 100 + o.phase) * 0.15) * canvas.width;
        const y = (o.y + Math.cos(t * o.speed * 80 + o.phase) * 0.1) * canvas.height;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, o.r * 20);
        grd.addColorStop(0, o.color + '30');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, o.r * 20, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = o.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = o.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Scan line
      const scanY = ((t * 60) % (canvas.height + 40)) - 20;
      const scanGrd = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanGrd.addColorStop(0, 'transparent');
      scanGrd.addColorStop(0.5, 'rgba(245,166,35,0.06)');
      scanGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrd;
      ctx.fillRect(0, scanY - 20, canvas.width, 40);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />;
}

// ── STREETLIGHT ILLUSTRATION ──
function LightIllustration() {
  return (
    <svg viewBox="0 0 320 400" style={{ width: '100%', maxWidth: 320, opacity: 0.9 }}>
      <defs>
        <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5a623" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd166" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="poleGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
      </defs>

      {/* Ground glow */}
      <ellipse cx="160" cy="390" rx="80" ry="12" fill="rgba(245,166,35,0.1)" />

      {/* Pole */}
      <rect x="154" y="160" width="12" height="230" rx="6" fill="url(#poleGrad)" />

      {/* Arm */}
      <path d="M160 160 Q160 120 210 115" stroke="rgba(255,255,255,0.12)" strokeWidth="8" fill="none" strokeLinecap="round" />

      {/* Light housing */}
      <rect x="188" y="100" width="60" height="28" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(245,166,35,0.3)" strokeWidth="1" />

      {/* LED array */}
      {[0,1,2,3,4].map(i => (
        <circle key={i} cx={196 + i * 11} cy="114" r="3.5" fill="#ffd166" style={{ filter: 'drop-shadow(0 0 4px #f5a623)' }} />
      ))}

      {/* Light cone */}
      <path d="M195 128 L150 240 L270 240 Z" fill="url(#glow1)" />
      <path d="M200 128 L165 200 L255 200 Z" fill="url(#glow2)" />

      {/* Ground illumination */}
      <ellipse cx="210" cy="240" rx="65" ry="12" fill="rgba(245,166,35,0.12)" />

      {/* Stars / data points */}
      {[[40,60],[280,80],[30,200],[290,180],[60,300],[270,320]].map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1.5" fill="rgba(245,166,35,0.5)" />
          <circle cx={x} cy={y} r="4" fill="rgba(245,166,35,0.08)" />
        </g>
      ))}

      {/* Sensor rings */}
      <circle cx="210" cy="108" r="18" stroke="rgba(0,212,255,0.15)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
      <circle cx="210" cy="108" r="28" stroke="rgba(0,212,255,0.08)" strokeWidth="1" fill="none" strokeDasharray="3 6" />

      {/* Signal waves */}
      <path d="M235 85 Q248 78 248 65" stroke="rgba(6,214,160,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M238 90 Q258 80 258 60" stroke="rgba(6,214,160,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M241 95 Q268 82 268 55" stroke="rgba(6,214,160,0.15)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Road markings */}
      <rect x="80" y="370" width="30" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="140" y="370" width="30" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="200" y="370" width="30" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
    </svg>
  );
}

// ── MAIN LOGIN PAGE ──
export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (mode === 'register' && !form.username.trim()) e.username = 'Username is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (mode === 'register' && form.password.length < 6) e.password = 'Min 6 characters';
    if (mode === 'register' && !form.phone.trim()) e.phone = 'Phone number is required';
    else if (mode === 'register' && !/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit number';
    if (mode === 'register' && form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); triggerShake(); return; }
    setLoading(true);
    setTimeout(() => {
      if (mode === 'login') {
        const users = loadUsers();
        const user = users.find(u => u.email === form.email && u.password === form.password);
        if (!user) {
          setErrors({ password: 'Invalid email or password' });
          triggerShake(); setLoading(false); return;
        }
        saveSession(user);
        onLogin(user);
      } else {
        const users = loadUsers();
        if (users.find(u => u.email === form.email)) {
          setErrors({ email: 'Email already registered' });
          triggerShake(); setLoading(false); return;
        }
        const newUser = { id: Math.random().toString(36).slice(2), username: form.username, email: form.email, password: form.password, phone: form.phone, role: 'operator', joined: new Date().toISOString() };
        saveUsers([...users, newUser]);
        saveSession(newUser);
        onLogin(newUser);
      }
      setLoading(false);
    }, 900);
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const inp = (key, placeholder, type = 'text', extra = {}) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={form[key]}
          onChange={e => f(key, e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '13px 16px', paddingRight: extra.hasToggle ? 44 : 16,
            background: errors[key] ? 'rgba(239,71,111,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${errors[key] ? 'rgba(239,71,111,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10, color: '#f0e6d0', fontSize: 14, fontFamily: 'Outfit, sans-serif',
            outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
          }}
          onFocus={e => { if (!errors[key]) e.target.style.borderColor = 'rgba(245,166,35,0.5)'; e.target.style.background = 'rgba(245,166,35,0.04)'; }}
          onBlur={e => { if (!errors[key]) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = errors[key] ? 'rgba(239,71,111,0.06)' : 'rgba(255,255,255,0.04)'; }}
        />
        {extra.hasToggle && (
          <button onClick={extra.toggleFn} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 16, padding: 4, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f5a623'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >{extra.showVal ? '🙈' : '👁'}</button>
        )}
      </div>
      {errors[key] && <div style={{ color: '#ef476f', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', marginTop: 5, paddingLeft: 4 }}>⚠ {errors[key]}</div>}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #07080d; overflow: hidden; }
        ::placeholder { color: rgba(255,255,255,0.2); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes pulseRing { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#07080d', fontFamily: 'Outfit, sans-serif', position: 'relative', overflow: 'hidden' }}>

        {/* CANVAS BG */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <StreetCanvas />
        </div>

        {/* RADIAL GLOW BG */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 60% at 25% 50%, rgba(245,166,35,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 75% 50%, rgba(0,212,255,0.04) 0%, transparent 60%)'
        }} />

        {/* LEFT PANEL */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '40px', position: 'relative', zIndex: 1,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
          transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 48, animation: 'fadeUp 0.8s ease both', animationDelay: '0.1s' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #f5a623, #ff9500)', boxShadow: '0 8px 32px rgba(245,166,35,0.4), inset 0 1px 0 rgba(255,255,255,0.25)', fontSize: 30, marginBottom: 18, animation: 'float 4s ease-in-out infinite' }}>💡</div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg, #ffd166, #f5a623, #ff9500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.01em', marginBottom: 8 }}>SmartLux</h1>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Chennai · Adaptive Streetlighting</p>
          </div>

          {/* Illustration */}
          <div style={{ animation: 'fadeUp 0.8s ease both', animationDelay: '0.25s' }}>
            <LightIllustration />
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 32, marginTop: 32, animation: 'fadeUp 0.8s ease both', animationDelay: '0.4s' }}>
            {[['2,847', 'Active Nodes'], ['94.2%', 'Uptime'], ['₹12L', 'Monthly Saved']].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#f5a623' }}>{v}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ width: 1, background: 'linear-gradient(180deg, transparent, rgba(245,166,35,0.2) 20%, rgba(245,166,35,0.3) 50%, rgba(245,166,35,0.2) 80%, transparent)', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💡</div>
        </div>

        {/* RIGHT PANEL — FORM */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px', position: 'relative', zIndex: 1,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(30px)',
          transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1) 0.1s',
        }}>
          <div style={{
            width: '100%', maxWidth: 420,
            animation: shake ? 'shake 0.5s ease' : 'fadeUp 0.7s ease both',
            animationDelay: shake ? '0s' : '0.2s',
          }}>
            {/* Card */}
            <div style={{
              background: 'rgba(13,15,24,0.9)', backdropFilter: 'blur(24px)',
              border: '1px solid rgba(245,166,35,0.18)', borderRadius: 22,
              padding: '36px 36px 32px', position: 'relative', overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            }}>
              {/* Top amber line */}
              <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 1, background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />
              {/* Rotating border accent */}
              <div style={{ position: 'absolute', top: -60, right: -60, width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(245,166,35,0.08)', animation: 'rotateSlow 20s linear infinite' }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', width: 4, height: 4, borderRadius: '50%', background: '#f5a623', transform: 'translateX(-50%)', boxShadow: '0 0 8px #f5a623' }} />
              </div>

              {/* TABS */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, marginBottom: 28, border: '1px solid rgba(255,255,255,0.06)' }}>
                {['login', 'register'].map(m => (
                  <button key={m} onClick={() => { setMode(m); setErrors({}); setForm({ username: '', email: '', password: '', phone: '', confirmPassword: '' }); }} style={{
                    flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em',
                    transition: 'all 0.25s',
                    background: mode === m ? 'linear-gradient(135deg, #f5a623, #ff9500)' : 'transparent',
                    color: mode === m ? '#07080d' : 'rgba(255,255,255,0.4)',
                    boxShadow: mode === m ? '0 4px 15px rgba(245,166,35,0.3)' : 'none',
                  }}>
                    {m === 'login' ? '🔐 Sign In' : '✨ Register'}
                  </button>
                ))}
              </div>

              {/* TITLE */}
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#f0e6d0', marginBottom: 5 }}>
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                  {mode === 'login' ? 'Sign in to access the control dashboard' : 'Register to join the SmartLux network'}
                </p>
              </div>

              {/* FIELDS */}
              {mode === 'register' && inp('username', 'Username')}
              {inp('email', 'Email address', 'email')}
              {inp('password', 'Password', showPass ? 'text' : 'password', { hasToggle: true, showVal: showPass, toggleFn: () => setShowPass(v => !v) })}
              {mode === 'register' && (
                <>
                  {inp('confirmPassword', 'Confirm password', showConfirm ? 'text' : 'password', { hasToggle: true, showVal: showConfirm, toggleFn: () => setShowConfirm(v => !v) })}
                  {inp('phone', 'Phone number (10 digits)', 'tel')}
                </>
              )}

              {/* SUBMIT BTN */}
              <button onClick={handleSubmit} disabled={loading} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: loading ? 'rgba(245,166,35,0.4)' : 'linear-gradient(135deg, #f5a623, #ff9500)',
                color: '#07080d', fontSize: 15, fontWeight: 700, fontFamily: 'Outfit, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.25s',
                boxShadow: '0 6px 20px rgba(245,166,35,0.35)', letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 6,
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 8px 30px rgba(245,166,35,0.55)'; }}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,166,35,0.35)'}
              >
                {loading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(7,8,13,0.3)', borderTopColor: '#07080d', borderRadius: '50%', animation: 'rotateSlow 0.7s linear infinite' }} />
                    {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  mode === 'login' ? '→ Sign In' : '→ Create Account'
                )}
              </button>

              {/* SWITCH MODE LINK */}
              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
                <span onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); setForm({ username: '', email: '', password: '', phone: '', confirmPassword: '' }); }} style={{ color: '#f5a623', cursor: 'pointer', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ffd166'}
                  onMouseLeave={e => e.currentTarget.style.color = '#f5a623'}
                >
                  {mode === 'login' ? 'Register here' : 'Sign in'}
                </span>
              </p>

              {/* Demo hint */}
              {mode === 'login' && (
                <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13 }}>💡</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                    Register first to create your account
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <p style={{ textAlign: 'center', marginTop: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>
              SMARTLUX v2.0 · GREATER CHENNAI CORPORATION
            </p>
          </div>
        </div>
      </div>
    </>
  );
}