import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';

// ─── Icons ────────────────────────────────────────────────────────────────────
const SparkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L19 7L14.74 11.26L21 12L14.74 12.74L19 17L13.09 15.74L12 22L10.91 15.74L5 17L9.26 12.74L3 12L9.26 11.26L5 7L10.91 8.26L12 2Z"/>
  </svg>
);
const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const CalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const BellIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV = [
  { icon: <GridIcon />, label: 'Dashboard', path: '/dashboard' },
  { icon: <ChatIcon />, label: 'Lumina AI', path: '/chat', badge: true },
  { icon: <CalIcon />, label: 'Leave Hub', path: '/leave' },
  { icon: <UserIcon />, label: 'Profile', path: '/profile' },
];

export default function Layout() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const logout = async () => { await auth.signOut(); navigate('/'); };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: '#06050f' }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 220 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col overflow-hidden shrink-0"
        style={{
          background: 'linear-gradient(180deg, #0c0a1e 0%, #080612 100%)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 h-16">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4338ca)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}
          >
            <SparkIcon />
          </button>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="text-white font-semibold text-base tracking-tight whitespace-nowrap overflow-hidden"
              >
                Lumina HR
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 3 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative cursor-pointer"
                  style={{
                    background: isActive ? 'rgba(124,58,237,0.18)' : 'transparent',
                    color: isActive ? '#c4b5fd' : '#475569',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    if (!isActive) e.currentTarget.style.color = '#94a3b8';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                    if (!isActive) e.currentTarget.style.color = '#475569';
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full"
                      style={{ background: 'linear-gradient(to bottom, #a78bfa, #6d28d9)' }}
                    />
                  )}
                  <span className="shrink-0">{item.icon}</span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.badge && !collapsed && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(124,58,237,0.25)', color: '#a78bfa' }}
                    >
                      AI
                    </motion.span>
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {/* User row */}
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0 border border-white/10">
              {profile?.photoURL
                ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {profile?.displayName?.[0] || 'U'}
                  </div>
              }
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs font-semibold text-white leading-none truncate max-w-[120px]">{profile?.displayName}</p>
                  <p className="text-[10px] capitalize mt-0.5" style={{ color: '#4b5563' }}>{profile?.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all"
            style={{ color: '#374151' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151'; }}
          >
            <span className="shrink-0"><LogOutIcon /></span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                  Log out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="h-16 flex items-center justify-between px-6 shrink-0"
          style={{ background: '#07060f', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <button onClick={() => setCollapsed(!collapsed)} className="text-slate-600 hover:text-slate-400 transition-colors mr-1">
              <MenuIcon />
            </button>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Search policies, people..."
                className="w-full text-sm py-2 pl-9 pr-4 rounded-xl outline-none placeholder-slate-700"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-slate-600 hover:text-slate-400 transition-colors">
              <BellIcon />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-500 rounded-full border-2" style={{ borderColor: '#07060f' }} />
            </button>
            <div className="h-6 w-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl overflow-hidden border border-white/10">
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {profile?.displayName?.[0] || 'U'}
                    </div>
                }
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white leading-none">{profile?.displayName}</p>
                <p className="text-[10px] capitalize mt-0.5" style={{ color: '#374151' }}>{profile?.department || 'HR Portal'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: '#07060f' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
