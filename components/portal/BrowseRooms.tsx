'use client';
import { useEffect, useState } from 'react';

interface Room { room_number: string; room_type: string; price_per_day: number; available: boolean; cleaning_status?: string; }

function Toast({ msg, type, onClose }: { msg: string; type: 'success'|'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{type==='success'?'✓':'✕'} {msg}</div>;
}

const TYPE_INFO: Record<string, { icon: string; desc: string; perks: string[] }> = {
  SINGLE: { icon: '🛏', desc: 'Cosy single room for solo travellers', perks: ['Single bed', 'Private bath', 'Free Wi-Fi', 'Daily housekeeping'] },
  DOUBLE: { icon: '🛋', desc: 'Spacious double room for couples or friends', perks: ['Double/twin beds', 'Work desk', 'Mini fridge', 'City view'] },
  DELUXE: { icon: '✨', desc: 'Premium suite with luxury amenities', perks: ['King bed', 'Jacuzzi', 'Lounge area', 'Complimentary breakfast', 'Butler service'] },
};

export default function BrowseRooms({ setTab }: { setTab: (t: any) => void }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [booking, setBooking] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [toast, setToast] = useState<{msg:string;type:'success'|'error'}|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<any>(null);

  useEffect(() => {
    fetch('/api/customer/rooms').then(r => r.json()).then(d => { setRooms(Array.isArray(d)?d:[]); setLoading(false); });
  }, []);

  async function confirmBook() {
    if (!booking) return;
    setSubmitting(true);
    const res = await fetch('/api/customer/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_number: booking.room_number, check_in_date: checkIn }),
    });
    const d = await res.json(); setSubmitting(false);
    if (res.ok) { setConfirmed(d); setBooking(null); setRooms(prev => prev.map(r => r.room_number === booking.room_number ? { ...r, available: false } : r)); }
    else setToast({ msg: d.error, type: 'error' });
  }

  const filtered = rooms.filter(r => filter === 'ALL' || r.room_type === filter);
  const typeColor: Record<string, string> = { SINGLE: 'badge-blue', DOUBLE: 'badge-green', DELUXE: 'badge-amber' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Browse Rooms</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>
          {rooms.filter(r => r.available && r.cleaning_status === 'CLEAN').length} rooms available right now
        </p>
      </div>

      {/* Booking confirmed banner */}
      {confirmed && (
        <div style={{ padding: '20px 24px', borderRadius: 14, background: 'rgba(45,212,164,0.1)', border: '1px solid rgba(45,212,164,0.25)' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>✅ Booking Confirmed!</p>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            Room {confirmed.room_number} ({confirmed.room_type}) booked from {confirmed.check_in_date} · ₹{Number(confirmed.price_per_day).toLocaleString('en-IN')}/day
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn-gold" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => setTab('mybookings')}>View My Bookings</button>
            <button className="btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }} onClick={() => setConfirmed(null)}>Browse More</button>
          </div>
        </div>
      )}

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {['ALL', 'SINGLE', 'DOUBLE', 'DELUXE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: filter === f ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: filter === f ? 'rgba(201,169,110,0.12)' : 'transparent',
            color: filter === f ? 'var(--gold)' : 'var(--text3)',
            fontFamily: "'DM Sans',sans-serif",
          }}>{f === 'ALL' ? 'All Types' : f}</button>
        ))}
      </div>

      {/* Room grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 16 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {filtered.map(room => {
            const info = TYPE_INFO[room.room_type] || TYPE_INFO.SINGLE;
            const isBookable = room.available && room.cleaning_status === 'CLEAN';
            const needsCleaning = !room.available && room.cleaning_status && room.cleaning_status !== 'CLEAN';
            return (
              <div key={room.room_number} style={{
                borderRadius: 16, overflow: 'hidden',
                background: 'var(--surface)', border: `1px solid ${isBookable ? 'var(--border)' : needsCleaning ? 'rgba(251,191,36,.2)' : 'rgba(248,113,113,.2)'}`,
                display: 'flex', flexDirection: 'column',
                opacity: isBookable ? 1 : 0.6,
              }}>
                {/* Room header */}
                <div style={{
                  padding: '20px 20px 14px',
                  background: isBookable
                    ? 'linear-gradient(135deg,rgba(201,169,110,0.1),rgba(201,169,110,0.02))'
                    : needsCleaning ? 'rgba(251,191,36,0.05)' : 'rgba(248,113,113,0.05)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 28 }}>{info.icon}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 6 }}>Room {room.room_number}</div>
                    </div>
                    <span className={`badge ${typeColor[room.room_type]||'badge-blue'}`}>{room.room_type}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>{info.desc}</p>
                </div>

                {/* Perks */}
                <div style={{ padding: '12px 20px', flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {info.perks.map(p => (
                      <span key={p} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
                      ₹{Number(room.price_per_day).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>per night</div>
                  </div>
                  {isBookable ? (
                    <button className="btn-gold" style={{ fontSize: 13, padding: '8px 18px' }} onClick={() => setBooking(room)}>
                      Book Now
                    </button>
                  ) : needsCleaning ? (
                    <span className="badge badge-amber">🧹 Cleaning</span>
                  ) : (
                    <span className="badge badge-red">Occupied</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking confirmation modal */}
      {booking && (
        <div className="modal-overlay" onClick={() => setBooking(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{TYPE_INFO[booking.room_type]?.icon || '🛏'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Confirm Booking</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 22 }}>Room {booking.room_number} · {booking.room_type}</p>

            <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              {[
                ['Room', `${booking.room_number} (${booking.room_type})`],
                ['Rate', `₹${Number(booking.price_per_day).toLocaleString('en-IN')}/night`],
              ].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text3)' }}>{k}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Check-in Date</label>
              <input className="input-field" type="date" value={checkIn} min={new Date().toISOString().split('T')[0]} onChange={e => setCheckIn(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-gold" onClick={confirmBook} disabled={submitting} style={{ flex: 1 }}>{submitting ? 'Booking…' : 'Confirm Booking'}</button>
              <button className="btn-ghost" onClick={() => setBooking(null)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
