'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';

// ── Tab context ──────────────────────────────────────────────────────────────
const TabCtx = createContext<{ tab: string; setTab: (t: string) => void }>({ tab: 'dashboard', setTab: () => {} });
export const useTab = () => useContext(TabCtx);

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',     label: 'Dashboard',     icon: IconDash },
  { id: 'bookings',      label: 'Bookings',       icon: IconBook },
  { id: 'rooms',         label: 'Rooms',          icon: IconRoom },
  { id: 'customers',     label: 'Guests',         icon: IconUser },
  { id: 'housekeeping',  label: 'Housekeeping',   icon: IconBroom },
  { id: 'reports',       label: 'Reports',        icon: IconChart },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState('dashboard');
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) router.push('/');
      else r.json().then(d => setUser(d.user));
    });
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <TabCtx.Provider value={{ tab, setTab }}>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
          width: 240, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', position: 'sticky', top: 0,
          height: '100vh', flexShrink: 0,
        }}>
          {/* Brand */}
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(201,169,110,0.25), rgba(201,169,110,0.08))',
                border: '1px solid rgba(201,169,110,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>🏨</div>
              <div>
                <div className="font-display" style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold2)' }}>LuxStay</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Hotel Management</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 12px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase', padding: '8px 6px 4px', marginBottom: 4 }}>
              Navigation
            </div>
            {NAV.map(item => (
              <button
                key={item.id}
                className={`nav-item ${tab === item.id ? 'active' : ''}`}
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              >
                <item.icon />
                {item.label}
              </button>
            ))}
          </nav>

          {/* User */}
          <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--gold3), var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#0a0c0f', fontWeight: 700,
                }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user.role}</div>
                </div>
              </div>
            )}
            <button className="btn-ghost" style={{ width: '100%', fontSize: 13, padding: '8px 12px' }} onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Mobile topbar */}
          <div style={{
            display: 'none', padding: '12px 16px',
            background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
            alignItems: 'center', gap: 12,
          }} className="mobile-topbar">
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 20 }}>☰</button>
            <span className="font-display" style={{ fontSize: 18, color: 'var(--gold2)' }}>LuxStay</span>
          </div>

          {/* Page content */}
          <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            <TabRouter tab={tab} setTab={setTab} />
          </main>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { position: fixed !important; z-index: 50; height: 100vh; transform: translateX(-100%); transition: transform 0.3s; }
          .sidebar.open { transform: translateX(0) !important; }
          .mobile-topbar { display: flex !important; }
          main { padding: 16px !important; }
        }
      `}</style>
    </TabCtx.Provider>
  );
}

// ── Tab router ────────────────────────────────────────────────────────────────
import DashboardPage from '@/components/DashboardPage';
import RoomsPage from '@/components/RoomsPage';
import BookingsPage from '@/components/BookingsPage';
import CustomersPage from '@/components/CustomersPage';
import HousekeepingPage from '@/components/HousekeepingPage';
import ReportsPage from '@/components/ReportsPage';

function TabRouter({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  switch (tab) {
    case 'dashboard':    return <DashboardPage setTab={setTab} />;
    case 'rooms':        return <RoomsPage />;
    case 'bookings':     return <BookingsPage />;
    case 'customers':    return <CustomersPage />;
    case 'housekeeping': return <HousekeepingPage />;
    case 'reports':      return <ReportsPage />;
    default:             return <DashboardPage setTab={setTab} />;
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconDash()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function IconBook()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function IconRoom()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconUser()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconBroom() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l9-9"/><path d="M12.22 6.22L16 2.44a1 1 0 0 1 1.41 0l4.14 4.14a1 1 0 0 1 0 1.41L17.78 11.8a4 4 0 0 1-5.66 0L12 11.66a4 4 0 0 1-.01-5.44z"/></svg>; }
function IconChart() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
