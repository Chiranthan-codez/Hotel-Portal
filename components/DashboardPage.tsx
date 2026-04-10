'use client';
import { useEffect, useState } from 'react';

interface Stats {
  rooms: { total_rooms: number; available_rooms: number; occupied_rooms: number };
  bookings: { total_bookings: number; active_bookings: number; completed_bookings: number; total_revenue: number };
  revenue_by_type: { room_type: string; revenue: number }[];
  recent_bookings: any[];
}

const ROOM_TYPE_INFO: Record<string, { range: string; icon: string; color: string }> = {
  SINGLE: { range: '₹1,500 – ₹1,800', icon: '🛏', color: 'var(--blue)' },
  DOUBLE: { range: '₹2,800 – ₹3,200', icon: '🛋', color: 'var(--green)' },
  DELUXE: { range: '₹5,500 – ₹7,000', icon: '✨', color: 'var(--gold)' },
};

export default function DashboardPage({ setTab }: { setTab: (t: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch('/api/dashboard').then(r => r.json()).then(d => { if (d && d.rooms) setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  // Silent background refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/dashboard').then(r => r.json()).then(d => { if (d && d.rooms) setStats(d); }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const occupancyPct = stats ? (stats.rooms.occupied_rooms / (stats.rooms.total_rooms || 1)) * 100 : 0;

  const STAT_CARDS = stats ? [
    { label: 'Total Rooms',    value: stats.rooms.total_rooms,              icon: '🏨', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',   tab: 'rooms' },
    { label: 'Available',      value: stats.rooms.available_rooms,           icon: '✅', color: '#2dd4a4', bg: 'rgba(45,212,164,0.08)',   tab: 'rooms' },
    { label: 'Occupied',       value: stats.rooms.occupied_rooms,            icon: '🔴', color: '#f87171', bg: 'rgba(248,113,113,0.08)', tab: 'bookings' },
    { label: 'Active Bookings',value: stats.bookings.active_bookings,        icon: '📋', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  tab: 'bookings' },
    { label: 'Total Revenue',  value: `₹${Number(stats.bookings.total_revenue).toLocaleString('en-IN')}`, icon: '💰', color: '#c9a96e', bg: 'rgba(201,169,110,0.08)', tab: 'reports' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            Hotel Overview
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Real-time snapshot of your property</p>
        </div>
        <button className="btn-ghost" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {STAT_CARDS.map(card => (
            <div
              key={card.label}
              className="stat-card"
              onClick={() => setTab(card.tab)}
              style={{ background: card.bg, border: `1px solid ${card.color}22` }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: card.color, marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>{card.label}</div>
              <div style={{ fontSize: 11, color: card.color, marginTop: 6, opacity: 0.7 }}>View →</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Occupancy */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Occupancy Rate</h3>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>
              {loading ? '—' : `${Math.round(occupancyPct)}%`}
            </span>
          </div>
          <div className="progress-track" style={{ marginBottom: 12 }}>
            <div className="progress-fill" style={{ width: `${occupancyPct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)' }}>
            <span>{stats?.rooms.occupied_rooms || 0} occupied</span>
            <span>{stats?.rooms.available_rooms || 0} available</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'New Booking', tab: 'bookings', color: 'var(--gold)', bg: 'rgba(201,169,110,0.12)' },
              { label: 'Manage Rooms', tab: 'rooms', color: 'var(--blue)', bg: 'rgba(96,165,250,0.1)' },
              { label: 'Guests', tab: 'customers', color: 'var(--green)', bg: 'rgba(45,212,164,0.1)' },
              { label: 'Reports', tab: 'reports', color: 'var(--purple)', bg: 'rgba(167,139,250,0.1)' },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => setTab(a.tab)}
                style={{
                  background: a.bg, border: `1px solid ${a.color}22`, borderRadius: 10,
                  padding: '10px 12px', cursor: 'pointer', color: a.color,
                  fontWeight: 600, fontSize: 13, textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Revenue by type */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Room Types</h3>
          {(['SINGLE', 'DOUBLE', 'DELUXE'] as const).map(type => {
            const info = ROOM_TYPE_INFO[type];
            const rev = stats?.revenue_by_type.find(r => r.room_type === type)?.revenue || 0;
            return (
              <div key={type} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 20 }}>{info.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{type}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{info.range}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: info.color }}>
                  ₹{Number(rev).toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Bookings */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Recent Bookings</h3>
            <button onClick={() => setTab('bookings')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: 13 }}>View all →</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : stats?.recent_bookings.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No bookings yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {stats?.recent_bookings.map((b: any) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(42,48,69,0.5)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{b.customer_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Room {b.room_number} · {b.room_type}</div>
                  </div>
                  <span className={`badge ${b.status === 'ACTIVE' ? 'badge-green' : 'badge-blue'}`}>
                    {b.status === 'ACTIVE' ? '● Active' : 'Done'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
