import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../lib/firebase';

const SparkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L19 7L14.74 11.26L21 12L14.74 12.74L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.74L3 12L9.26 11.26L5 7L10.91 8.26L12 2Z"/>
  </svg>
);
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const BoltIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const FEATURES = [
  { icon: <BoltIcon />, title: "Instant answers", desc: "Policy questions resolved in seconds, not days." },
  { icon: <HeartIcon />, title: "Empathetic support", desc: "Understands sentiment and responds with genuine care." },
  { icon: <ShieldIcon />, title: "Fully confidential", desc: "Grievances are 100% secure. Anonymous filing available." },
];

export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139,92,246,0.35)';
        ctx.fill();
      });
      // Lines between nearby dots
      dots.forEach((a, i) => dots.slice(i + 1).forEach(b => {
        const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }));
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, []);

  const login = async () => {
    try { await signInWithGoogle(); } catch (e) { console.error(e); }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden selection:bg-violet-800/40"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: '#080613' }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }} />

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4338ca, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4338ca)', boxShadow: '0 4px 18px rgba(124,58,237,0.45)' }}
          >
            <SparkIcon />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Lumina HR</span>
        </div>
        <button
          onClick={login}
          className="px-5 py-2 text-sm font-medium rounded-xl transition-all"
          style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-violet-300"
              style={{ fontFamily: 'DM Mono, monospace' }}>
              HR Intelligence Platform
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-light leading-[1.08] tracking-tight mb-6"
            style={{ color: '#f8fafc' }}
          >
            Your HR, <br />
            <span className="italic font-medium" style={{
              background: 'linear-gradient(135deg, #a78bfa, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>reimagined.</span>
          </h1>

          <p className="text-lg max-w-md mx-auto leading-relaxed mb-12" style={{ color: '#64748b' }}>
            Meet Lumina — an intelligent HR companion that answers policy questions, manages leaves, and supports your wellbeing. Instantly.
          </p>

          {/* CTA */}
          <motion.button
            onClick={login}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl text-sm font-semibold text-white transition-all mb-4"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4338ca)',
              boxShadow: '0 8px 30px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          <p className="text-xs" style={{ color: '#374151', fontFamily: 'DM Mono, monospace' }}>
            Secure SSO · No password required
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid md:grid-cols-3 gap-4 mt-20 max-w-3xl w-full"
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl text-left"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 text-violet-400"
                style={{ background: 'rgba(124,58,237,0.12)' }}>
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer
        className="relative z-10 text-center py-6 text-xs tracking-widest"
        style={{ color: '#1f2937', borderTop: '1px solid rgba(255,255,255,0.04)', fontFamily: 'DM Mono, monospace' }}
      >
        © 2026 LUMINA TECHNOLOGIES · HR DIVISION
      </footer>
    </div>
  );
}
