'use client';
import { useEffect, useState } from 'react';

interface Room { room_number: string; room_type: string; price_per_day: number; available: boolean; cleaning_status?: string; }
interface Booking { id: number; room_number: string; check_in_date: string; check_out_date: string; status: string; total_bill: number; payment_status: string; customer_name: string; contact: string; customer_id: number; room_type: string; price_per_day: number; portal_username?: string; payment_method?: string; transaction_ref?: string; }

function Toast({ msg, type, onClose }: { msg: string; type: 'success'|'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{type==='success'?'✓':'✕'} {msg}</div>;
}

function InvoiceModal({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🏨</div>
          <h2 className="font-display" style={{ fontSize: 22, color: 'var(--gold2)' }}>LuxStay Hotel</h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>INVOICE / RECEIPT</p>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          {[
            ['Booking ID', `#${data.id}`],
            ['Guest Name', data.customer_name],
            ['Contact', data.contact],
            ['Room', `${data.room_number} (${data.room_type})`],
            ['Rate', `₹${Number(data.price_per_day).toLocaleString('en-IN')}/day`],
            ['Check-In', data.check_in_date?String(data.check_in_date).slice(0,10):'—'],
            ['Check-Out', data.check_out_date?String(data.check_out_date).slice(0,10):'—'],
            ['Nights', data.nights||'—'],
            ['Portal User', data.portal_username||'—'],
            ['Payment', data.payment_status==='PAID'?`✅ Paid via ${data.payment_method||''}`:(data.payment_status||'—')],
            ...(data.transaction_ref?[['Txn Ref', data.transaction_ref]]:[] as any),
          ].map(([k,v]) => (
            <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(42,48,69,.5)', fontSize: 13 }}>
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

/* ── Checkout Confirmation Modal ────────────────────────────────────────────── */
function CheckoutModal({ booking, onClose, onConfirm }: { booking: Booking; onClose: () => void; onConfirm: () => void }) {
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
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))',
            border: '2px solid rgba(251,191,36,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>🚪</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Confirm Check-Out</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Review the details before checking out</p>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
          padding: 20, marginBottom: 20,
        }}>
          {/* Guest info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--gold3), var(--gold))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#0a0c0f', fontWeight: 700,
            }}>{booking.customer_name?.[0]?.toUpperCase() || '?'}</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{booking.customer_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{booking.contact}</div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Room', value: `${booking.room_number}`, sub: booking.room_type, icon: '🛏' },
              { label: 'Rate', value: `₹${Number(booking.price_per_day).toLocaleString('en-IN')}`, sub: 'per night', icon: '💰' },
              { label: 'Check-In', value: String(booking.check_in_date).slice(0,10), sub: '', icon: '📅' },
              { label: 'Nights Stayed', value: `${nights}`, sub: `until ${today}`, icon: '🌙' },
            ].map(d => (
              <div key={d.label} style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(201,169,110,0.04)', border: '1px solid rgba(201,169,110,0.08)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{d.icon}</span> {d.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{d.value}</div>
                {d.sub && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{d.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Estimated bill */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,169,110,0.1), rgba(201,169,110,0.03))',
          border: '1px solid rgba(201,169,110,0.2)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Estimated Total Bill</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--gold)' }}>
            ₹{estimatedBill.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            {nights} night{nights > 1 ? 's' : ''} × ₹{Number(booking.price_per_day).toLocaleString('en-IN')}
          </div>
        </div>

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

/* ── Admin Payment Modal ────────────────────────────────────────────────────── */
function AdminPaymentModal({ booking, onClose, onPaid }: { booking: Booking; onClose: () => void; onPaid: (msg: string) => void }) {
  const [method, setMethod] = useState('CASH');
  const [step, setStep] = useState<'form'|'processing'|'done'>('form');
  const [ref, setRef] = useState('');

  const nights = booking.check_out_date
    ? Math.max(1, Math.round((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000*60*60*24)))
    : 1;

  async function pay() {
    setStep('processing');
    await new Promise(r => setTimeout(r, 1500));
    const res = await fetch(`/api/bookings/${booking.id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, amount: booking.total_bill }),
    });
    const d = await res.json();
    if (res.ok) {
      setRef(d.transaction_ref);
      setStep('done');
      onPaid(`Payment of ₹${Number(booking.total_bill).toLocaleString('en-IN')} recorded for ${booking.customer_name}`);
    } else {
      setStep('form');
    }
  }

  return (
    <div className="modal-overlay" onClick={step === 'done' ? onClose : undefined}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>

        {step === 'form' && (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
                background: 'linear-gradient(135deg, rgba(45,212,164,0.2), rgba(45,212,164,0.05))',
                border: '2px solid rgba(45,212,164,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>💳</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Record Payment</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                Booking #{booking.id} · {booking.customer_name}
              </p>
            </div>

            {/* Guest + Room info */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
              padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--gold3), var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#0a0c0f', fontWeight: 700,
                }}>{booking.customer_name?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{booking.customer_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Room {booking.room_number} · {booking.room_type}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{nights} night{nights > 1 ? 's' : ''}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {String(booking.check_in_date).slice(0,10)} → {booking.check_out_date ? String(booking.check_out_date).slice(0,10) : '—'}
                </div>
              </div>
            </div>

            {/* Amount due */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(201,169,110,0.1), rgba(201,169,110,0.03))',
              border: '1px solid rgba(201,169,110,0.2)', borderRadius: 12,
              padding: '16px', marginBottom: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Amount Due</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--gold)' }}>
                ₹{Number(booking.total_bill).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 10, fontWeight: 600 }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['CASH', '💵', 'Cash'],
                  ['UPI', '📱', 'UPI'],
                  ['CARD', '💳', 'Card'],
                  ['NETBANKING', '🏦', 'Net Banking'],
                ].map(([val, icon, label]) => (
                  <button key={val} onClick={() => setMethod(val)} style={{
                    padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                    border: method === val ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: method === val ? 'rgba(201,169,110,0.1)' : 'var(--surface)',
                    color: method === val ? 'var(--gold)' : 'var(--text2)',
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
              <button className="btn-gold" onClick={pay} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                ✓ Record Payment
              </button>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px',
              border: '3px solid var(--border)', borderTopColor: 'var(--gold)',
              animation: 'spin 0.8s linear infinite',
            }} />
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Processing Payment…</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Recording ₹{Number(booking.total_bill).toLocaleString('en-IN')} via {method}</p>
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
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>Payment Recorded!</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 4 }}>
              ₹{Number(booking.total_bill).toLocaleString('en-IN')} from {booking.customer_name}
            </p>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 18 }}>via {method}</p>
            <div style={{
              background: 'var(--surface)', borderRadius: 10, padding: '12px 16px',
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

/* ── Main Bookings Page ─────────────────────────────────────────────────────── */
export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [payFilter, setPayFilter] = useState('ALL');
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [showNew, setShowNew] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [checkoutModal, setCheckoutModal] = useState<Booking|null>(null);
  const [payingId, setPayingId] = useState<number|null>(null);
  const [form, setForm] = useState({ customer_name: '', contact: '', room_number: '' });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([fetch('/api/bookings').then(r=>r.json()), fetch('/api/rooms').then(r=>r.json())]).then(([b,r])=>{ setBookings(b); setRooms(r); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  // Silent background refresh every 4 seconds — only updates data, never touches loading/UI
  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([fetch('/api/bookings').then(r=>r.json()), fetch('/api/rooms').then(r=>r.json())])
        .then(([b,r]) => { if(Array.isArray(b)) setBookings(b); if(Array.isArray(r)) setRooms(r); })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  function showToast(msg:string, type:'success'|'error'='success') { setToast({msg,type}); }

  async function handleBook(e:React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch('/api/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
    const d = await res.json(); setSubmitting(false);
    if(res.ok){ showToast(`Booking #${d.booking_id} confirmed — Room ${d.room_number}`); setShowNew(false); setForm({customer_name:'',contact:'',room_number:''}); load(); }
    else showToast(d.error,'error');
  }

  async function handleCheckout(b:Booking) {
    const res = await fetch(`/api/bookings/${b.id}/checkout`, { method:'POST' });
    const d = await res.json();
    if(res.ok){
      setCheckoutModal(null);
      setInvoice(d);
      showToast(`${b.customer_name} checked out — ₹${Number(d.total_bill).toLocaleString('en-IN')}`);
      load();
    } else showToast(d.error,'error');
  }

  async function handlePaymentDone(b:Booking) {
    setPayingId(b.id);
    const res = await fetch(`/api/bookings/${b.id}/payment`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ method: 'CASH', amount: b.total_bill }),
    });
    const d = await res.json();
    setPayingId(null);
    if(res.ok){
      showToast(`Payment recorded for ${b.customer_name} — ₹${Number(b.total_bill).toLocaleString('en-IN')} (Cash)`);
      load();
    } else showToast(d.error,'error');
  }

  const availableRooms = rooms.filter(r => r.available && r.cleaning_status === 'CLEAN');

  const filtered = bookings.filter(b => {
    const ms = b.customer_name?.toLowerCase().includes(search.toLowerCase()) || b.room_number?.toLowerCase().includes(search.toLowerCase()) || String(b.id).includes(search);
    const mf = filter==='ALL' || b.status===filter;
    const mp = payFilter==='ALL' || b.payment_status===payFilter;
    return ms && mf && mp;
  });

  const unpaidCount = bookings.filter(b => b.payment_status==='UNPAID'&&b.status==='CHECKED_OUT').length;
  const activeCount = bookings.filter(b => b.status==='ACTIVE').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}
      {invoice && <InvoiceModal data={invoice} onClose={()=>setInvoice(null)} />}
      {checkoutModal && (
        <CheckoutModal
          booking={checkoutModal}
          onClose={() => setCheckoutModal(null)}
          onConfirm={() => handleCheckout(checkoutModal)}
        />
      )}


      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize:26, fontWeight:600, color:'var(--text)' }}>Bookings</h1>
          <p style={{ color:'var(--text3)', fontSize:14, marginTop:2 }}>
            {activeCount} active · {bookings.length} total ·{' '}
            <span style={{ color:'var(--amber)' }}>{unpaidCount} awaiting payment</span>
          </p>
        </div>
        <button className="btn-gold" onClick={()=>setShowNew(true)}>+ New Booking</button>
      </div>

      {/* Unpaid alert banner */}
      {unpaidCount > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--amber)', fontSize: 14 }}>{unpaidCount} Unpaid Bill{unpaidCount > 1 ? 's' : ''}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Checked-out guests with outstanding payments</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '7px 14px', borderColor: 'rgba(251,191,36,0.3)', color: 'var(--amber)' }}
            onClick={() => { setFilter('CHECKED_OUT'); setPayFilter('UNPAID'); }}
          >View Unpaid →</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-wrap" style={{ flex:'1 1 200px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="input-field search-input" placeholder="Search guest, room, ID…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {[['ALL','All'],['ACTIVE','Active'],['CHECKED_OUT','Checked Out']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', border:filter===v?'1px solid var(--gold)':'1px solid var(--border)', background:filter===v?'rgba(201,169,110,.12)':'transparent', color:filter===v?'var(--gold)':'var(--text3)', fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
        ))}
        <div style={{ width:1, height:20, background:'var(--border)' }} />
        {[['ALL','All Pay'],['PAID','Paid'],['UNPAID','Unpaid']].map(([v,l])=>(
          <button key={v} onClick={()=>setPayFilter(v)} style={{ padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', border:payFilter===v?'1px solid var(--green)':'1px solid var(--border)', background:payFilter===v?'rgba(45,212,164,.1)':'transparent', color:payFilter===v?'var(--green)':'var(--text3)', fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
        ))}
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:24, display:'flex', flexDirection:'column', gap:10 }}>
            {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{ height:56 }} />)}
          </div>
        ) : filtered.length===0 ? (
          <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
            <p>No bookings found</p>
            <button className="btn-gold" style={{ marginTop:16 }} onClick={()=>setShowNew(true)}>Make First Booking</button>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Bill</th><th>Status</th><th>Payment</th><th>Portal</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b=>{
                  const nights = b.check_out_date ? Math.max(1,Math.round((new Date(b.check_out_date).getTime()-new Date(b.check_in_date).getTime())/(1000*60*60*24))) : null;
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight:700, color:'var(--gold)', fontSize:12 }}>#{b.id}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{b.customer_name}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{b.contact}</div>
                      </td>
                      <td>
                        <div>Room {b.room_number}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{b.room_type}</div>
                      </td>
                      <td style={{ fontSize:12 }}>{b.check_in_date?String(b.check_in_date).slice(0,10):'—'}</td>
                      <td style={{ fontSize:12 }}>{b.check_out_date?String(b.check_out_date).slice(0,10):'—'}</td>
                      <td style={{ fontWeight:600, color:b.total_bill?'var(--gold)':'var(--text3)' }}>
                        {b.total_bill?`₹${Number(b.total_bill).toLocaleString('en-IN')}`:'—'}
                      </td>
                      <td><span className={`badge ${b.status==='ACTIVE'?'badge-green':'badge-blue'}`}>{b.status==='ACTIVE'?'● Active':'Done'}</span></td>
                      <td>
                        <span className={`badge ${b.payment_status==='PAID'?'badge-green':'badge-amber'}`}>
                          {b.payment_status==='PAID'?`✓ ${b.payment_method||'Paid'}`:'⚠ Unpaid'}
                        </span>
                      </td>
                      <td style={{ fontSize:12, color:'var(--text3)' }}>
                        {b.portal_username ? <span style={{ color:'var(--blue)' }}>@{b.portal_username}</span> : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {b.status==='ACTIVE' && (
                            <button
                              className="btn-ghost"
                              style={{
                                padding:'5px 12px', fontSize:12,
                                borderColor: 'rgba(251,191,36,0.3)', color: 'var(--amber)',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}
                              onClick={() => setCheckoutModal(b)}
                            >
                              🚪 Check Out
                            </button>
                          )}
                          {b.status==='CHECKED_OUT' && b.payment_status==='UNPAID' && (
                            <button
                              className="btn-gold"
                              disabled={payingId === b.id}
                              style={{
                                padding:'5px 12px', fontSize:12,
                                display: 'flex', alignItems: 'center', gap: 4,
                                opacity: payingId === b.id ? 0.7 : 1,
                              }}
                              onClick={() => handlePaymentDone(b)}
                            >
                              {payingId === b.id ? '⏳ Processing…' : '💵 Payment Done'}
                            </button>
                          )}
                          {b.status==='CHECKED_OUT' && (
                            <button className="btn-ghost" style={{ padding:'5px 12px', fontSize:12 }} onClick={()=>setInvoice({ ...b, nights, booking_id:b.id, check_in_date:String(b.check_in_date).slice(0,10), check_out_date:String(b.check_out_date).slice(0,10) })}>📄 Invoice</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New booking modal */}
      {showNew && (
        <div className="modal-overlay" onClick={()=>setShowNew(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <h2 style={{ fontSize:20, fontWeight:600, color:'var(--text)', marginBottom:6 }}>New Booking</h2>
            <p style={{ color:'var(--text3)', fontSize:13, marginBottom:22 }}>Fill in guest details to confirm reservation</p>
            <form onSubmit={handleBook} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, color:'var(--text2)', marginBottom:6, fontWeight:500 }}>Guest Full Name</label>
                <input className="input-field" placeholder="e.g. Priya Sharma" value={form.customer_name} onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))} required />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, color:'var(--text2)', marginBottom:6, fontWeight:500 }}>Contact Number</label>
                <input className="input-field" placeholder="10-digit mobile" value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} required pattern="[0-9]{7,15}" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, color:'var(--text2)', marginBottom:6, fontWeight:500 }}>Select Room</label>
                <select className="input-field" value={form.room_number} onChange={e=>setForm(f=>({...f,room_number:e.target.value}))} required>
                  <option value="">— Choose available room —</option>
                  {availableRooms.map(r=>(
                    <option key={r.room_number} value={r.room_number}>Room {r.room_number} — {r.room_type} — ₹{Number(r.price_per_day).toLocaleString('en-IN')}/day</option>
                  ))}
                </select>
                {availableRooms.length===0 && <p style={{ color:'var(--red)', fontSize:12, marginTop:4 }}>No rooms available</p>}
              </div>
              {form.room_number && (()=>{ const r=rooms.find(r=>r.room_number===form.room_number); return r?(<div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(201,169,110,.07)', border:'1px solid rgba(201,169,110,.15)', fontSize:13, color:'var(--text2)' }}>Type: <b style={{color:'var(--text)'}}>{r.room_type}</b> · Rate: <b style={{color:'var(--gold)'}}>₹{Number(r.price_per_day).toLocaleString('en-IN')}/day</b></div>):null; })()}
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button className="btn-gold" type="submit" disabled={submitting||!availableRooms.length} style={{ flex:1 }}>{submitting?'Booking…':'Confirm Booking'}</button>
                <button className="btn-ghost" type="button" onClick={()=>setShowNew(false)} style={{ flex:1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
