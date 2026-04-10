'use client';
import { useEffect, useState } from 'react';

interface HKRoom { room_number: string; status: string; notes: string; room_type: string; available: boolean; }

const STATUS_CONFIG: Record<string, { label: string; emoji: string; badge: string; cardBg: string; cardBorder: string }> = {
  CLEAN:          { label: 'Clean',          emoji: '✅', badge: 'badge-green',  cardBg: 'rgba(45,212,164,0.05)',   cardBorder: 'rgba(45,212,164,0.15)'  },
  NEEDS_CLEANING: { label: 'Needs Cleaning', emoji: '⚠️', badge: 'badge-amber',  cardBg: 'rgba(251,191,36,0.05)',   cardBorder: 'rgba(251,191,36,0.15)'  },
  IN_PROGRESS:    { label: 'In Progress',    emoji: '🔄', badge: 'badge-blue',   cardBg: 'rgba(96,165,250,0.05)',   cardBorder: 'rgba(96,165,250,0.15)'  },
};

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{type === 'success' ? '✓' : '✕'} {msg}</div>;
}

export default function HousekeepingPage() {
  const [rooms, setRooms] = useState<HKRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/housekeeping').then(r => r.json()).then(d => { setRooms(d); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  // Silent background refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/housekeeping').then(r => r.json()).then(d => { if(Array.isArray(d)) setRooms(d); }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(room_number: string, status: string) {
    const res = await fetch('/api/housekeeping', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_number, status }),
    });
    if (res.ok) {
      setRooms(prev => prev.map(r => r.room_number === room_number ? { ...r, status } : r));
      setToast({ msg: `Room ${room_number} marked as ${STATUS_CONFIG[status]?.label}`, type: 'success' });
    }
  }

  const filtered = filter === 'ALL' ? rooms : rooms.filter(r => r.status === filter);

  const counts = {
    CLEAN: rooms.filter(r => r.status === 'CLEAN').length,
    NEEDS_CLEANING: rooms.filter(r => r.status === 'NEEDS_CLEANING').length,
    IN_PROGRESS: rooms.filter(r => r.status === 'IN_PROGRESS').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Housekeeping</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>Track and manage room cleaning status</p>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            borderRadius: 12, background: cfg.cardBg, border: `1px solid ${cfg.cardBorder}`,
            cursor: 'pointer',
          }} onClick={() => setFilter(filter === key ? 'ALL' : key)}>
            <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{cfg.label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginLeft: 4 }}>
              {counts[key as keyof typeof counts]}
            </span>
          </div>
        ))}
        {filter !== 'ALL' && (
          <button className="btn-ghost" style={{ padding: '8px 14px', fontSize: 12 }} onClick={() => setFilter('ALL')}>
            Show All
          </button>
        )}
      </div>

      {/* Room grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {[...Array(9)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {filtered.map(room => {
            const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.CLEAN;
            return (
              <div key={room.room_number} style={{
                background: cfg.cardBg,
                border: `1px solid ${cfg.cardBorder}`,
                borderRadius: 14, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Room {room.room_number}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{room.room_type}</div>
                  </div>
                  <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 600,
                    background: room.available ? 'rgba(45,212,164,0.1)' : 'rgba(248,113,113,0.1)',
                    color: room.available ? 'var(--green)' : 'var(--red)',
                    border: `1px solid ${room.available ? 'rgba(45,212,164,0.2)' : 'rgba(248,113,113,0.2)'}`,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {room.available ? 'Vacant' : 'Occupied'}
                  </span>
                </div>

                <select
                  className="input-field"
                  value={room.status}
                  onChange={e => updateStatus(room.room_number, e.target.value)}
                  style={{ fontSize: 12, padding: '6px 10px', marginTop: 4 }}
                >
                  <option value="CLEAN">✅ Clean</option>
                  <option value="NEEDS_CLEANING">⚠️ Needs Cleaning</option>
                  <option value="IN_PROGRESS">🔄 In Progress</option>
                </select>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧹</div>
          <p>No rooms in this category</p>
        </div>
      )}
    </div>
  );
}
