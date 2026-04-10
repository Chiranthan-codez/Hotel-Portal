'use client';
import { useEffect, useState } from 'react';

export default function GuestHome({ setTab, user }: { setTab: (t: any) => void; user: any }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/bookings').then(r => r.json()).then(d => {
      setBookings(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  // Silent background refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/customer/bookings').then(r => r.json()).then(d => { if(Array.isArray(d)) setBookings(d); }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const active = bookings.filter(b => b.status === 'ACTIVE');
  const unpaid = bookings.filter(b => b.payment_status === 'UNPAID' && b.status === 'CHECKED_OUT');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Welcome */}
      <div style={{
        borderRadius: 20, padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(45,212,164,0.12), rgba(45,212,164,0.03))',
        border: '1px solid rgba(45,212,164,0.2)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', fontSize: 72, opacity: 0.1 }}>🏨</div>
        <p style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Welcome back</p>
        <h1 className="font-display" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
          {user?.name || 'Guest'}
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>
          {active.length > 0
            ? `You have ${active.length} active booking${active.length > 1 ? 's' : ''}. Enjoy your stay!`
            : 'Ready to book your next stay? Browse our available rooms.'}
        </p>
        {active.length === 0 && (
          <button className="btn-gold" style={{ marginTop: 16 }} onClick={() => setTab('browse')}>Browse Rooms →</button>
        )}
      </div>

      {/* Alert: unpaid bills */}
      {unpaid.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--amber)', fontSize: 14 }}>⚠ Pending Payment</p>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>
              You have {unpaid.length} booking{unpaid.length > 1 ? 's' : ''} awaiting payment.
            </p>
          </div>
          <button className="btn-gold" style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }} onClick={() => setTab('payments')}>Pay Now</button>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14 }}>
        {[
          { label: 'Active Stays', value: active.length, icon: '🛏', color: 'var(--green)', bg: 'rgba(45,212,164,0.08)', tab: 'mybookings' },
          { label: 'Total Bookings', value: bookings.length, icon: '📋', color: 'var(--blue)', bg: 'rgba(96,165,250,0.08)', tab: 'mybookings' },
          { label: 'Pending Bills', value: unpaid.length, icon: '💳', color: 'var(--amber)', bg: 'rgba(251,191,36,0.08)', tab: 'payments' },
          { label: 'Completed', value: bookings.filter(b => b.status === 'CHECKED_OUT').length, icon: '✅', color: 'var(--purple)', bg: 'rgba(167,139,250,0.08)', tab: 'mybookings' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ background: c.bg, border: `1px solid ${c.color}22`, cursor: 'pointer' }} onClick={() => setTab(c.tab)}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{loading ? '—' : c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Active booking detail */}
      {active.length > 0 && (
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Your Current Stay</h3>
          {active.map(b => (
            <div key={b.id} style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(45,212,164,0.06)', border: '1px solid rgba(45,212,164,0.15)',
              marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Room {b.room_number}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>{b.room_type} · ₹{Number(b.price_per_day).toLocaleString('en-IN')}/day</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-green">● Active</span>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                    Since {b.check_in_date ? String(b.check_in_date).slice(0, 10) : '—'}
                  </div>
                </div>
              </div>
              <button className="btn-ghost" style={{ marginTop: 12, fontSize: 12, padding: '6px 14px' }} onClick={() => setTab('mybookings')}>
                View Details →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
          {[
            { label: '🛏 Book a Room', tab: 'browse', color: 'var(--gold)', bg: 'rgba(201,169,110,.1)' },
            { label: '📋 My Bookings', tab: 'mybookings', color: 'var(--blue)', bg: 'rgba(96,165,250,.1)' },
            { label: '💳 Make Payment', tab: 'payments', color: 'var(--green)', bg: 'rgba(45,212,164,.1)' },
            { label: '👤 My Profile', tab: 'profile', color: 'var(--purple)', bg: 'rgba(167,139,250,.1)' },
          ].map(a => (
            <button key={a.label} onClick={() => setTab(a.tab)} style={{
              background: a.bg, border: `1px solid ${a.color}22`, borderRadius: 10,
              padding: '12px', cursor: 'pointer', color: a.color,
              fontWeight: 600, fontSize: 13, textAlign: 'left',
              fontFamily: "'DM Sans',sans-serif", transition: 'all .15s',
            }}>{a.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
