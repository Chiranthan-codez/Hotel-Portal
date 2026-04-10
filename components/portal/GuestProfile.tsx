'use client';
import { useEffect, useState } from 'react';

function Toast({ msg, type, onClose }: { msg: string; type: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{msg}</div>;
}

export default function GuestProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', contact: '' });
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null);

  useEffect(() => {
    fetch('/api/customer/profile').then(r => r.json()).then(d => {
      setProfile(d);
      setForm({ name: d.name || '', email: d.email || '', contact: d.contact || '' });
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch('/api/customer/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) { setToast({ msg: 'Profile updated!', type: 'success' }); setEditing(false); setProfile((p:any) => ({ ...p, ...form })); }
    else setToast({ msg: 'Update failed', type: 'error' });
  }

  if (!profile) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 40, width: 200, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560 }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>My Profile</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>Manage your guest account details</p>
      </div>

      {/* Avatar card */}
      <div className="glass" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg,var(--green),#16a085)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: '#0a0c0f', fontWeight: 700, flexShrink: 0,
        }}>{profile.name?.[0]?.toUpperCase() || '?'}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>@{profile.username}</div>
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>● Guest Account</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Info / Edit form */}
      <div className="glass" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>Account Details</h3>

        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Full Name', profile.name],
              ['Username', `@${profile.username}`],
              ['Email', profile.email || '—'],
              ['Contact', profile.contact || '—'],
              ['Customer ID', profile.customer_id ? `#${profile.customer_id}` : 'Not linked'],
              ['Member Since', profile.created_at ? String(profile.created_at).slice(0,10) : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                borderBottom: '1px solid var(--border)', fontSize: 14,
              }}>
                <span style={{ color: 'var(--text3)' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>Full Name</label>
              <input className="input-field" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>Email</label>
              <input className="input-field" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="your@email.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>Contact Number</label>
              <input className="input-field" value={form.contact} onChange={e => setForm(f=>({...f,contact:e.target.value}))} placeholder="Mobile number" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn-gold" type="submit" disabled={submitting} style={{ flex: 1 }}>{submitting ? 'Saving…' : 'Save Changes'}</button>
              <button className="btn-ghost" type="button" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Linked customer info */}
      {profile.customer_id && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(45,212,164,.07)', border: '1px solid rgba(45,212,164,.2)', fontSize: 13, color: 'var(--text2)' }}>
          ✅ Your account is linked to <strong style={{ color: 'var(--green)' }}>Customer #{profile.customer_id}</strong>. All bookings made at the front desk are reflected in your portal.
        </div>
      )}
      {!profile.customer_id && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(96,165,250,.07)', border: '1px solid rgba(96,165,250,.2)', fontSize: 13, color: 'var(--text2)' }}>
          ℹ Your account is not yet linked to a front-desk customer record. It will be linked automatically when you make your first booking.
        </div>
      )}
    </div>
  );
}
