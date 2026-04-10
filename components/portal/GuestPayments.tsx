'use client';
import { useEffect, useState } from 'react';

export default function GuestPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<any>(null);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      fetch('/api/customer/payments').then(r=>r.json()),
      fetch('/api/customer/bookings').then(r=>r.json()),
    ]).then(([p, b]) => {
      setPayments(Array.isArray(p)?p:[]);
      setBookings(Array.isArray(b)?b:[]);
      setLoading(false);
    });
  }
  useEffect(() => { load(); }, []);

  // Silent background refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([
        fetch('/api/customer/payments').then(r=>r.json()),
        fetch('/api/customer/bookings').then(r=>r.json()),
      ]).then(([p, b]) => {
        if(Array.isArray(p)) setPayments(p);
        if(Array.isArray(b)) setBookings(b);
      }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const unpaidBookings = bookings.filter(b => b.status==='CHECKED_OUT' && b.payment_status==='UNPAID');
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDue = unpaidBookings.reduce((s, b) => s + Number(b.total_bill || 0), 0);

  function Toast({ msg, type }: { msg: string; type: string }) {
    useEffect(() => { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); }, []);
    return <div className={`toast toast-${type}`}>{msg}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {toast && <Toast {...toast} />}
      {payModal && (
        <PayModal
          booking={payModal}
          onClose={() => { setPayModal(null); load(); }}
          onSuccess={(msg: string) => setToast({ msg, type: 'success' })}
        />
      )}

      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Payments</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>Your billing and payment history</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
        {[
          { label: 'Total Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, icon: '✅', color: 'var(--green)', bg: 'rgba(45,212,164,.08)' },
          { label: 'Transactions', value: payments.length, icon: '🧾', color: 'var(--blue)', bg: 'rgba(96,165,250,.08)' },
          { label: 'Pending Bills', value: unpaidBookings.length, icon: '⏳', color: 'var(--amber)', bg: 'rgba(251,191,36,.08)' },
          { label: 'Amount Due', value: `₹${totalDue.toLocaleString('en-IN')}`, icon: '💰', color: 'var(--red)', bg: 'rgba(248,113,113,.08)' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ background: c.bg, border: `1px solid ${c.color}22` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{loading?'—':c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Pending payments */}
      {unpaidBookings.length > 0 && (
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--amber)' }}>⚠ Pending Payments</h3>
            {unpaidBookings.length > 1 && (
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                Total due: <strong style={{ color: 'var(--gold)' }}>₹{totalDue.toLocaleString('en-IN')}</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unpaidBookings.map(b => {
              const nights = b.check_out_date
                ? Math.max(1, Math.round((new Date(b.check_out_date).getTime()-new Date(b.check_in_date).getTime())/(1000*60*60*24)))
                : 1;
              return (
                <div key={b.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                  padding: '16px 18px', borderRadius: 12,
                  background: 'rgba(251,191,36,.04)', border: '1px solid rgba(251,191,36,.2)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>🛏</div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>Room {b.room_number} · #{b.id}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 12 }}>
                        {b.check_in_date?String(b.check_in_date).slice(0,10):'—'} → {b.check_out_date?String(b.check_out_date).slice(0,10):'—'}
                        <span style={{ color: 'var(--text3)', marginLeft: 6 }}>({nights} night{nights>1?'s':''})</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--gold)', fontSize: 18 }}>₹{Number(b.total_bill).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{b.room_type}</div>
                    </div>
                    <button
                      className="btn-gold"
                      style={{
                        fontSize: 13, padding: '9px 20px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        animation: 'subtlePulse 2s ease-in-out infinite',
                      }}
                      onClick={() => setPayModal(b)}
                    >
                      💳 Pay Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Payment History</h3>
        </div>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : payments.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💳</div>
            <p>No payments yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref</th><th>Room</th><th>Method</th><th>Amount</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text3)' }}>{p.transaction_ref}</td>
                    <td>Room {p.room_number} <span style={{ color: 'var(--text3)', fontSize: 11 }}>({p.room_type})</span></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {p.method === 'UPI' ? '📱' : p.method === 'CARD' ? '💳' : p.method === 'CASH' ? '💵' : '🏦'} {p.method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--gold)' }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-green">✓ {p.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{p.paid_at ? String(p.paid_at).slice(0,10) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes subtlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,169,110,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(201,169,110,0); }
        }
      `}</style>
    </div>
  );
}

function PayModal({ booking, onClose, onSuccess }: { booking: any; onClose: () => void; onSuccess: (msg: string) => void }) {
  const [method, setMethod] = useState('UPI');
  const [step, setStep] = useState<'form'|'processing'|'done'>('form');
  const [ref, setRef] = useState('');

  const nights = booking.check_out_date
    ? Math.max(1, Math.round((new Date(booking.check_out_date).getTime()-new Date(booking.check_in_date).getTime())/(1000*60*60*24)))
    : (booking.nights || 1);

  async function pay() {
    setStep('processing');
    await new Promise(r => setTimeout(r, 1800));
    const res = await fetch('/api/customer/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: booking.id, method, amount: booking.total_bill }),
    });
    const d = await res.json();
    if (res.ok) {
      setRef(d.transaction_ref); setStep('done');
      onSuccess(`₹${Number(booking.total_bill).toLocaleString('en-IN')} paid via ${method}`);
    } else setStep('form');
  }

  return (
    <div className="modal-overlay" onClick={step==='done'?onClose:undefined}>
      <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ maxWidth: 440 }}>
        {step==='form' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
                background: 'linear-gradient(135deg, rgba(45,212,164,0.2), rgba(45,212,164,0.05))',
                border: '2px solid rgba(45,212,164,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>💳</div>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Complete Payment</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>Booking #{booking.id} · Room {booking.room_number}</p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(201,169,110,0.1), rgba(201,169,110,0.03))',
              border: '1px solid rgba(201,169,110,0.2)', borderRadius: 12,
              textAlign: 'center', padding: '16px', marginBottom: 20
            }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Amount Due</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--gold)' }}>₹{Number(booking.total_bill).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                {nights} night{nights > 1 ? 's' : ''} × ₹{Number(booking.price_per_day).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Choose Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['UPI','📱','UPI'],['CARD','💳','Card'],['CASH','💵','Cash'],['NETBANKING','🏦','Net Banking']].map(([v,icon,l]) => (
                  <button key={v} onClick={()=>setMethod(v)} style={{
                    padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                    border: method===v ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: method===v ? 'rgba(201,169,110,.1)' : 'var(--surface)',
                    color: method===v ? 'var(--gold)' : 'var(--text2)',
                    fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13,
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 16 }}>{icon}</span> {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-gold" onClick={pay} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>✓ Pay Now</button>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            </div>
          </>
        )}
        {step==='processing' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px',
              border: '3px solid var(--border)', borderTopColor: 'var(--green)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 16 }}>Processing…</p>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 6 }}>₹{Number(booking.total_bill).toLocaleString('en-IN')} via {method}</p>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {step==='done' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(45,212,164,0.15)', border: '2px solid rgba(45,212,164,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              animation: 'popIn 0.3s ease',
            }}>✅</div>
            <h2 style={{ fontWeight: 700, color: 'var(--green)', fontSize: 19, marginBottom: 6 }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 14 }}>₹{Number(booking.total_bill).toLocaleString('en-IN')} paid via {method}</p>
            <div style={{
              background: 'var(--surface)', borderRadius: 10, padding: '10px 14px',
              fontSize: 12, color: 'var(--text3)', marginBottom: 18, wordBreak: 'break-all',
              border: '1px solid var(--border)',
            }}>
              Ref: <strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{ref}</strong>
            </div>
            <button className="btn-gold" onClick={onClose} style={{ width: '100%' }}>Done</button>
            <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
