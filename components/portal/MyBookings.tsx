'use client';
import { useEffect, useState } from 'react';

function Toast({ msg, type, onClose }: { msg: string; type: 'success'|'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{type==='success'?'✓':'✕'} {msg}</div>;
}

function InvoiceModal({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏨</div>
          <h2 className="font-display" style={{ fontSize: 20, color: 'var(--gold2)' }}>LuxStay Hotel</h2>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>INVOICE / RECEIPT</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 18 }}>
          {[
            ['Booking ID', `#${data.id}`],
            ['Room', `${data.room_number} (${data.room_type})`],
            ['Rate', `₹${Number(data.price_per_day).toLocaleString('en-IN')}/night`],
            ['Check-In', data.check_in_date ? String(data.check_in_date).slice(0,10) : '—'],
            ['Check-Out', data.check_out_date ? String(data.check_out_date).slice(0,10) : '—'],
            ['Nights', data.nights || '—'],
            ['Payment', data.payment_status === 'PAID' ? `✅ Paid (${data.payment_method||''})` : '❌ Unpaid'],
          ].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(42,48,69,.5)', fontSize: 13 }}>
              <span style={{ color: 'var(--text3)' }}>{k}</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontSize: 16, fontWeight: 700 }}>
            <span style={{ color: 'var(--text)' }}>Total Amount</span>
            <span style={{ color: 'var(--gold)' }}>₹{Number(data.total_bill).toLocaleString('en-IN')}</span>
          </div>
        </div>
        <button className="btn-ghost" onClick={onClose} style={{ width: '100%' }}>Close</button>
      </div>
    </div>
  );
}

/* ── Guest Checkout Confirmation ─────────────────────────────────────────────── */
function GuestCheckoutModal({ booking, onClose, onConfirm }: { booking: any; onClose: () => void; onConfirm: () => void }) {
  const [processing, setProcessing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const checkIn = new Date(booking.check_in_date);
  const checkOut = new Date(today);
  let nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights <= 0) nights = 1;
  const estimatedBill = nights * booking.price_per_day;

  async function handleConfirm() {
    setProcessing(true);
    await onConfirm();
    setProcessing(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, rgba(45,212,164,0.2), rgba(45,212,164,0.05))',
            border: '2px solid rgba(45,212,164,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>🚪</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Ready to Check Out?</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>We hope you enjoyed your stay!</p>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
          padding: 18, marginBottom: 18,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Room', value: `${booking.room_number}`, sub: booking.room_type, icon: '🛏' },
              { label: 'Rate', value: `₹${Number(booking.price_per_day).toLocaleString('en-IN')}`, sub: 'per night', icon: '💰' },
              { label: 'Check-In', value: String(booking.check_in_date).slice(0,10), sub: '', icon: '📅' },
              { label: 'Nights', value: `${nights}`, sub: `until ${today}`, icon: '🌙' },
            ].map(d => (
              <div key={d.label} style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(45,212,164,0.04)', border: '1px solid rgba(45,212,164,0.08)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{d.icon}</span> {d.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{d.value}</div>
                {d.sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{d.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(201,169,110,0.1), rgba(201,169,110,0.03))',
          border: '1px solid rgba(201,169,110,0.2)', borderRadius: 12,
          padding: '14px', marginBottom: 18, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 3 }}>Estimated Bill</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gold)' }}>
            ₹{estimatedBill.toLocaleString('en-IN')}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, textAlign: 'center' }}>
          After checkout you can pay your bill from the Payments section
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn-gold"
            onClick={handleConfirm}
            disabled={processing}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {processing ? (
              <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Processing…</>
            ) : (
              <>✓ Confirm Check-Out</>
            )}
          </button>
          <button className="btn-ghost" onClick={onClose} disabled={processing} style={{ flex: 1 }}>Cancel</button>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default function MyBookings({ setTab }: { setTab: (t: any) => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [payModal, setPayModal] = useState<any>(null);
  const [checkoutModal, setCheckoutModal] = useState<any>(null);
  const [filter, setFilter] = useState('ALL');

  function load() {
    setLoading(true);
    fetch('/api/customer/bookings').then(r => r.json()).then(d => {
      setBookings(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }
  useEffect(() => { load(); }, []);

  // Silent background refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/customer/bookings').then(r => r.json()).then(d => { if(Array.isArray(d)) setBookings(d); }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleCheckout(b: any) {
    const res = await fetch(`/api/customer/bookings/${b.id}/checkout`, { method: 'POST' });
    const d = await res.json();
    if (res.ok) {
      setCheckoutModal(null);
      setToast({ msg: `Checked out! Total bill: ₹${Number(d.total_bill).toLocaleString('en-IN')}`, type: 'success' });
      load();
      // Offer to pay immediately
      setTimeout(() => {
        setPayModal({ ...b, ...d, status: 'CHECKED_OUT', payment_status: 'UNPAID' });
      }, 500);
    } else {
      setToast({ msg: d.error, type: 'error' });
    }
  }

  const filtered = bookings.filter(b => filter === 'ALL' || b.status === filter);
  const unpaid = bookings.filter(b => b.status === 'CHECKED_OUT' && b.payment_status === 'UNPAID');
  const activeCount = bookings.filter(b => b.status === 'ACTIVE').length;

  if (!loading && bookings.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>My Bookings</h1></div>
      <div className="glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📋</div>
        <p style={{ fontSize: 16, marginBottom: 6, color: 'var(--text2)' }}>No bookings yet</p>
        <p style={{ fontSize: 13, marginBottom: 20 }}>Browse our rooms and make your first booking.</p>
        <button className="btn-gold" onClick={() => setTab('browse')}>Browse Rooms</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {invoice && <InvoiceModal data={invoice} onClose={() => setInvoice(null)} />}
      {payModal && <PaymentModal booking={payModal} onClose={() => { setPayModal(null); load(); }} onPaid={(msg) => setToast({ msg, type: 'success' })} />}
      {checkoutModal && (
        <GuestCheckoutModal
          booking={checkoutModal}
          onClose={() => setCheckoutModal(null)}
          onConfirm={() => handleCheckout(checkoutModal)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>My Bookings</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>
            {bookings.length} total · {activeCount} active
            {unpaid.length > 0 && <span style={{ color: 'var(--amber)' }}> · {unpaid.length} unpaid</span>}
          </p>
        </div>
        <button className="btn-gold" onClick={() => setTab('browse')}>+ New Booking</button>
      </div>

      {/* Unpaid bills alert */}
      {unpaid.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02))',
          border: '1px solid rgba(251,191,36,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--amber)', fontSize: 14 }}>
                {unpaid.length} Pending Payment{unpaid.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                Total: ₹{unpaid.reduce((s, b) => s + Number(b.total_bill || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <button className="btn-gold" style={{ padding: '8px 18px', fontSize: 13 }}
            onClick={() => setPayModal(unpaid[0])}
          >Pay Now →</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[['ALL','All'],['ACTIVE','Active'],['CHECKED_OUT','Completed']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: filter===v ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: filter===v ? 'rgba(201,169,110,.12)' : 'transparent',
            color: filter===v ? 'var(--gold)' : 'var(--text3)',
            fontFamily: "'DM Sans',sans-serif",
          }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 14 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(b => {
            const nights = b.check_out_date
              ? Math.max(1, Math.round((new Date(b.check_out_date).getTime()-new Date(b.check_in_date).getTime())/(1000*60*60*24)))
              : null;
            const isUnpaid = b.status === 'CHECKED_OUT' && b.payment_status === 'UNPAID';
            return (
              <div key={b.id} style={{
                borderRadius: 14, overflow: 'hidden',
                background: 'var(--surface)',
                border: isUnpaid ? '1px solid rgba(251,191,36,0.3)' : '1px solid var(--border)',
                transition: 'all 0.2s',
              }}>
                {/* Header */}
                <div style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)',
                  background: isUnpaid ? 'rgba(251,191,36,0.03)' : undefined,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Room {b.room_number}</span>
                      <span className={`badge ${b.room_type==='SINGLE'?'badge-blue':b.room_type==='DOUBLE'?'badge-green':'badge-amber'}`}>{b.room_type}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>₹{Number(b.price_per_day).toLocaleString('en-IN')}/night · Booking #{b.id}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span className={`badge ${b.status==='ACTIVE'?'badge-green':'badge-blue'}`}>{b.status==='ACTIVE'?'● Active':'Completed'}</span>
                    <span className={`badge ${b.payment_status==='PAID'?'badge-green':'badge-amber'}`}>{b.payment_status==='PAID'?'💳 Paid':'⚠ Unpaid'}</span>
                  </div>
                </div>

                {/* Details + Actions */}
                <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                    <div><span style={{ color: 'var(--text3)' }}>Check-in: </span><span style={{ color: 'var(--text)', fontWeight: 500 }}>{b.check_in_date ? String(b.check_in_date).slice(0,10) : '—'}</span></div>
                    {b.check_out_date && <div><span style={{ color: 'var(--text3)' }}>Out: </span><span style={{ color: 'var(--text)', fontWeight: 500 }}>{String(b.check_out_date).slice(0,10)}</span></div>}
                    {nights && <div><span style={{ color: 'var(--text3)' }}>Nights: </span><span style={{ color: 'var(--text)', fontWeight: 500 }}>{nights}</span></div>}
                    {b.total_bill > 0 && <div><span style={{ color: 'var(--text3)' }}>Total: </span><span style={{ color: 'var(--gold)', fontWeight: 700 }}>₹{Number(b.total_bill).toLocaleString('en-IN')}</span></div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {b.status === 'ACTIVE' && (
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={() => setCheckoutModal(b)}
                      >🚪 Check Out</button>
                    )}
                    {isUnpaid && (
                      <button
                        className="btn-gold"
                        style={{
                          fontSize: 12, padding: '6px 16px',
                          display: 'flex', alignItems: 'center', gap: 5,
                          animation: 'subtlePulse 2s ease-in-out infinite',
                        }}
                        onClick={() => setPayModal(b)}
                      >💳 Pay Now</button>
                    )}
                    {b.status === 'CHECKED_OUT' && (
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setInvoice({ ...b, nights })}>📄 Invoice</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes subtlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,169,110,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(201,169,110,0); }
        }
      `}</style>
    </div>
  );
}

/* ── Payment Modal (Guest) ───────────────────────────────────────────────────── */
function PaymentModal({ booking, onClose, onPaid }: { booking: any; onClose: () => void; onPaid: (msg: string) => void }) {
  const [method, setMethod] = useState('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form'|'processing'|'done'>('form');
  const [ref, setRef] = useState('');

  const nights = booking.check_out_date
    ? Math.max(1, Math.round((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000*60*60*24)))
    : (booking.nights || 1);

  async function pay() {
    setStep('processing'); setSubmitting(true);
    await new Promise(r => setTimeout(r, 1800));
    const res = await fetch('/api/customer/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: booking.id, method, amount: booking.total_bill }),
    });
    const d = await res.json(); setSubmitting(false);
    if (res.ok) { setRef(d.transaction_ref); setStep('done'); onPaid(`Payment of ₹${Number(booking.total_bill).toLocaleString('en-IN')} successful!`); }
    else { setStep('form'); }
  }

  return (
    <div className="modal-overlay" onClick={step==='done'?onClose:undefined}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        {step === 'form' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
                background: 'linear-gradient(135deg, rgba(45,212,164,0.2), rgba(45,212,164,0.05))',
                border: '2px solid rgba(45,212,164,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>💳</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Pay Your Bill</h2>
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>Room {booking.room_number} · Booking #{booking.id}</p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(201,169,110,0.1), rgba(201,169,110,0.03))',
              border: '1px solid rgba(201,169,110,0.2)', borderRadius: 12,
              padding: '16px', marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>Total Amount Due</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--gold)' }}>₹{Number(booking.total_bill).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                {nights} night{nights > 1 ? 's' : ''} × ₹{Number(booking.price_per_day).toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 10, fontWeight: 600 }}>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['UPI','📱','UPI'],['CARD','💳','Card'],['CASH','💵','Cash'],['NETBANKING','🏦','Net Banking']].map(([val,icon,label]) => (
                  <button key={val} onClick={() => setMethod(val)} style={{
                    padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                    border: method===val ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: method===val ? 'rgba(201,169,110,0.1)' : 'var(--surface)',
                    color: method===val ? 'var(--gold)' : 'var(--text2)',
                    fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13,
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <span style={{ fontSize: 16 }}>{icon}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-gold" onClick={pay} disabled={submitting} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
                ✓ Pay Now
              </button>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px',
              border: '3px solid var(--border)', borderTopColor: 'var(--green)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Processing Payment…</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>₹{Number(booking.total_bill).toLocaleString('en-IN')} via {method}</p>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 8 }}>Please do not close this window</p>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(45,212,164,0.15)', border: '2px solid rgba(45,212,164,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              animation: 'popIn 0.3s ease',
            }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 16 }}>₹{Number(booking.total_bill).toLocaleString('en-IN')} paid via {method}</p>
            <div style={{
              background: 'var(--surface)', borderRadius: 10, padding: '12px 14px',
              fontSize: 12, color: 'var(--text3)', marginBottom: 20, wordBreak: 'break-all',
              border: '1px solid var(--border)',
            }}>
              Transaction Ref: <strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{ref}</strong>
            </div>
            <button className="btn-gold" onClick={onClose} style={{ width: '100%' }}>Done</button>
            <style>{`@keyframes popIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
