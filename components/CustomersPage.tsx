'use client';
import { useEffect, useState } from 'react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => { setCustomers(d); setLoading(false); });
  }, []);

  // Silent background refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/customers').then(r => r.json()).then(d => { if(Array.isArray(d)) setCustomers(d); }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact?.includes(search) ||
    c.room_number?.includes(search) ||
    c.portal_username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Guests</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>
          {customers.length} total guests ·{' '}
          <span style={{ color: 'var(--blue)' }}>{customers.filter(c => c.portal_username).length} with portal accounts</span>
        </p>
      </div>

      <div className="search-wrap" style={{ maxWidth: 340 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input className="input-field search-input" placeholder="Search guests or portal username…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="glass" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
            <p>No guests found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Contact</th><th>Room</th><th>Type</th><th>Check-In</th><th>Status</th><th>Payment</th><th>Portal Account</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={`${c.id}-${c.booking_id}`}>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>#{c.id}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ fontSize: 13 }}>{c.contact}</td>
                    <td>Room {c.room_number}</td>
                    <td>
                      <span className={`badge ${c.room_type==='SINGLE'?'badge-blue':c.room_type==='DOUBLE'?'badge-green':'badge-amber'}`}>{c.room_type||'—'}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{c.check_in_date?String(c.check_in_date).slice(0,10):'—'}</td>
                    <td>
                      <span className={`badge ${c.booking_status==='ACTIVE'?'badge-green':'badge-blue'}`}>
                        {c.booking_status==='ACTIVE'?'● Staying':'Checked Out'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.payment_status==='PAID'?'badge-green':'badge-amber'}`}>
                        {c.payment_status==='PAID'?'✓ Paid':'⚠ Unpaid'}
                      </span>
                    </td>
                    <td>
                      {c.portal_username
                        ? <span style={{ color: 'var(--blue)', fontSize: 13, fontWeight: 500 }}>@{c.portal_username}</span>
                        : <span style={{ color: 'var(--text3)', fontSize: 12 }}>No account</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
