'use client';
import { useEffect, useState } from 'react';

interface Room { room_number: string; room_type: string; price_per_day: number; available: boolean; cleaning_status?: string; }

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{type === 'success' ? '✓' : '✕'} {msg}</div>;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({ room_number: '', room_type: 'SINGLE', price_per_day: '' });
  const [editPrice, setEditPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() { setLoading(true); fetch('/api/rooms').then(r => r.json()).then(d => { setRooms(d); setLoading(false); }); }
  useEffect(() => { load(); }, []);

  // Silent background refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/rooms').then(r => r.json()).then(d => { if(Array.isArray(d)) setRooms(d); }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  function showToast(msg: string, type: 'success' | 'error' = 'success') { setToast({ msg, type }); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, price_per_day: Number(form.price_per_day) }) });
    const d = await res.json(); setSubmitting(false);
    if (res.ok) { showToast('Room added successfully'); setShowAdd(false); setForm({ room_number: '', room_type: 'SINGLE', price_per_day: '' }); load(); }
    else showToast(d.error, 'error');
  }

  async function handleDelete(room: Room) {
    if (!confirm(`Remove Room ${room.room_number}?`)) return;
    const res = await fetch(`/api/rooms/${room.room_number}`, { method: 'DELETE' });
    const d = await res.json();
    if (res.ok) { showToast('Room removed'); load(); }
    else showToast(d.error, 'error');
  }

  async function handleUpdatePrice(e: React.FormEvent) {
    e.preventDefault(); if (!editRoom) return; setSubmitting(true);
    const res = await fetch(`/api/rooms/${editRoom.room_number}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_per_day: Number(editPrice) }) });
    const d = await res.json(); setSubmitting(false);
    if (res.ok) { showToast('Price updated'); setEditRoom(null); load(); }
    else showToast(d.error, 'error');
  }

  const filtered = rooms.filter(r => {
    const matchSearch = r.room_number.toLowerCase().includes(search.toLowerCase()) || r.room_type.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || (filter === 'AVAILABLE' ? r.available : !r.available);
    return matchSearch && matchFilter;
  });

  const typeColor: Record<string, string> = { SINGLE: 'badge-blue', DOUBLE: 'badge-green', DELUXE: 'badge-amber' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Room Management</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>{rooms.length} rooms total · {rooms.filter(r => r.available && r.cleaning_status === 'CLEAN').length} available{rooms.filter(r => r.cleaning_status && r.cleaning_status !== 'CLEAN').length > 0 ? ` · ${rooms.filter(r => r.cleaning_status && r.cleaning_status !== 'CLEAN').length} cleaning` : ''}</p>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Room</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: '1 1 220px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="input-field search-input" placeholder="Search rooms…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(['ALL', 'AVAILABLE', 'OCCUPIED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            border: filter === f ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: filter === f ? 'rgba(201,169,110,0.12)' : 'transparent',
            color: filter === f ? 'var(--gold)' : 'var(--text3)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏨</div>
            <p>No rooms found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Price / Day</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(room => (
                  <tr key={room.room_number}>
                    <td style={{ fontWeight: 600, fontSize: 15 }}>#{room.room_number}</td>
                    <td><span className={`badge ${typeColor[room.room_type] || 'badge-blue'}`}>{room.room_type}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--gold)' }}>₹{Number(room.price_per_day).toLocaleString('en-IN')}</td>
                    <td>
                      {room.available && room.cleaning_status === 'CLEAN'
                        ? <span className="badge badge-green">● Available</span>
                        : room.cleaning_status && room.cleaning_status !== 'CLEAN'
                          ? <span className="badge badge-amber">🧹 {room.cleaning_status === 'IN_PROGRESS' ? 'Cleaning' : 'Needs Cleaning'}</span>
                          : <span className="badge badge-red">● Occupied</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn-ghost"
                          style={{ padding: '5px 12px', fontSize: 12 }}
                          onClick={() => { setEditRoom(room); setEditPrice(String(room.price_per_day)); }}
                        >Edit Price</button>
                        {room.available && (
                          <button className="btn-danger" onClick={() => handleDelete(room)}>Remove</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add room modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Add New Room</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>Fill in the details to add a room to inventory</p>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Room Number</label>
                <input className="input-field" placeholder="e.g. 401" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Room Type</label>
                <select className="input-field" value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}>
                  <option value="SINGLE">SINGLE</option>
                  <option value="DOUBLE">DOUBLE</option>
                  <option value="DELUXE">DELUXE</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>Price per Day (₹)</label>
                <input className="input-field" type="number" placeholder="e.g. 2500" value={form.price_per_day} onChange={e => setForm(f => ({ ...f, price_per_day: e.target.value }))} required min={1} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn-gold" type="submit" disabled={submitting} style={{ flex: 1 }}>{submitting ? 'Adding…' : 'Add Room'}</button>
                <button className="btn-ghost" type="button" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit price modal */}
      {editRoom && (
        <div className="modal-overlay" onClick={() => setEditRoom(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Update Price — Room {editRoom.room_number}</h2>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>Current: ₹{Number(editRoom.price_per_day).toLocaleString('en-IN')}/day</p>
            <form onSubmit={handleUpdatePrice} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>New Price (₹)</label>
                <input className="input-field" type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} required min={1} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn-gold" type="submit" disabled={submitting} style={{ flex: 1 }}>{submitting ? 'Saving…' : 'Update Price'}</button>
                <button className="btn-ghost" type="button" onClick={() => setEditRoom(null)} style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
