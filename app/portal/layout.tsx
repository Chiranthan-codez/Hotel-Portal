'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type PortalTab = 'home' | 'browse' | 'mybookings' | 'payments' | 'profile';

const NAV: { id: PortalTab; label: string; icon: string }[] = [
  { id: 'home',       label: 'Home',         icon: '🏠' },
  { id: 'browse',     label: 'Browse Rooms',  icon: '🛏' },
  { id: 'mybookings', label: 'My Bookings',   icon: '📋' },
  { id: 'payments',   label: 'Payments',      icon: '💳' },
  { id: 'profile',    label: 'My Profile',    icon: '👤' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<PortalTab>('home');
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/customer-me').then(r => {
      if (!r.ok) router.push('/');
      else r.json().then(d => setUser(d.user));
    });
  }, []);

  async function logout() {
    await fetch('/api/auth/customer-logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
        width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, fontSize: 18,
              background: 'linear-gradient(135deg,rgba(45,212,164,.2),rgba(45,212,164,.05))',
              border: '1px solid rgba(45,212,164,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🌟</div>
            <div>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)' }}>Guest Portal</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>LuxStay Hotel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase', padding: '8px 6px 4px', marginBottom: 4 }}>Menu</div>
          {NAV.map(item => (
            <button key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              style={{ color: tab === item.id ? 'var(--green)' : undefined }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--green),#16a085)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#0a0c0f', fontWeight: 700,
              }}>{user.name?.[0]?.toUpperCase() || '?'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--green)' }}>Guest</div>
              </div>
            </div>
          )}
          <button className="btn-ghost" onClick={logout} style={{ width: '100%', fontSize: 13, padding: '8px 12px' }}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          display: 'none', padding: '12px 16px',
          background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
          alignItems: 'center', gap: 12,
        }} className="mobile-topbar">
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 20 }}>☰</button>
          <span className="font-display" style={{ fontSize: 18, color: 'var(--green)' }}>Guest Portal</span>
        </div>

        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <PortalTabRouter tab={tab} setTab={setTab} user={user} />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { position: fixed !important; z-index: 50; height: 100vh; transform: translateX(-100%); transition: transform .3s; }
          .sidebar.open { transform: translateX(0) !important; }
          .mobile-topbar { display: flex !important; }
          main { padding: 16px !important; }
        }
        .nav-item.active { background: rgba(45,212,164,0.12) !important; color: var(--green) !important; }
      `}</style>
    </div>
  );
}

/* ── Tab Router ─────────────────────────────────────────────────────────────── */
import GuestHome from '@/components/portal/GuestHome';
import BrowseRooms from '@/components/portal/BrowseRooms';
import MyBookings from '@/components/portal/MyBookings';
import GuestPayments from '@/components/portal/GuestPayments';
import GuestProfile from '@/components/portal/GuestProfile';

function PortalTabRouter({ tab, setTab, user }: { tab: PortalTab; setTab: (t: PortalTab) => void; user: any }) {
  switch (tab) {
    case 'home':       return <GuestHome setTab={setTab} user={user} />;
    case 'browse':     return <BrowseRooms setTab={setTab} />;
    case 'mybookings': return <MyBookings setTab={setTab} />;
    case 'payments':   return <GuestPayments />;
    case 'profile':    return <GuestProfile />;
    default:           return <GuestHome setTab={setTab} user={user} />;
  }
}
