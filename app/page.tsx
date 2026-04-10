'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'staff' | 'customer-login' | 'customer-register';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('staff');
  const router = useRouter();

  return (
    <div className="hero-bg min-h-screen flex items-center justify-center p-4">
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 30%, rgba(201,169,110,0.07) 0%, transparent 60%)',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: '0 auto 14px',
            background: 'linear-gradient(135deg,rgba(201,169,110,.22),rgba(201,169,110,.05))',
            border: '1px solid rgba(201,169,110,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>🏨</div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>LuxStay</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Hotel Management System</p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 4, marginBottom: 16,
        }}>
          {([
            ['staff', '🏢 Staff Login'],
            ['customer-login', '👤 Guest Login'],
            ['customer-register', '✨ Create Account'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '9px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
              background: tab === id ? 'linear-gradient(135deg,var(--gold),var(--gold3))' : 'transparent',
              color: tab === id ? '#0a0c0f' : 'var(--text3)',
              transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>

        <div className="glass" style={{ padding: 32 }}>
          {tab === 'staff'            && <StaffLoginForm router={router} />}
          {tab === 'customer-login'   && <CustomerLoginForm router={router} setTab={setTab} />}
          {tab === 'customer-register'&& <CustomerRegisterForm router={router} />}
        </div>
      </div>
    </div>
  );
}

/* ── Staff Login ─────────────────────────────────────────────────────────────── */
function StaffLoginForm({ router }: { router: any }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [show, setShow] = useState(false); const [err, setErr] = useState(''); const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true);
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
    const d = await res.json(); setLoading(false);
    if (res.ok) router.push('/dashboard');
    else setErr(d.error || 'Login failed');
  }

  return (
    <>
      <h2 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Staff Portal</h2>
      <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 22 }}>Sign in with your staff credentials</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Username" value={u} onChange={setU} placeholder="e.g. admin" />
        <PasswordField label="Password" value={p} onChange={setP} show={show} toggleShow={() => setShow(!show)} placeholder="Enter password" />
        {err && <ErrBox msg={err} />}
        <button className="btn-gold" type="submit" disabled={loading} style={{ width: '100%', padding: 12, marginTop: 4, opacity: loading ? .7 : 1 }}>{loading ? 'Signing in…' : 'Sign In'}</button>
      </form>
      <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 10, background: 'rgba(201,169,110,.06)', border: '1px solid rgba(201,169,110,.12)' }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Demo Credentials</p>
        {[['admin','hotel123','ADMIN'],['staff','staff123','STAFF'],['manager','mgr123','MANAGER']].map(([un,pw,role]) => (
          <button key={un} type="button" onClick={() => { setU(un); setP(pw); }} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '3px 0', fontSize: 13, display: 'block', width: '100%' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{un}</span>
            <span style={{ color: 'var(--text3)' }}> / {pw}</span>
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text3)' }}>({role})</span>
          </button>
        ))}
        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Click to auto-fill</p>
      </div>
    </>
  );
}

/* ── Customer Login ──────────────────────────────────────────────────────────── */
function CustomerLoginForm({ router, setTab }: { router: any; setTab: (tab: Tab) => void }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [show, setShow] = useState(false); const [err, setErr] = useState(''); const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true);
    const res = await fetch('/api/auth/customer-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
    const d = await res.json(); setLoading(false);
    if (res.ok) router.push('/portal');
    else setErr(d.error || 'Login failed');
  }

  return (
    <>
      <h2 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Guest Portal</h2>
      <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 22 }}>Sign in to manage your bookings</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Username" value={u} onChange={setU} placeholder="Your guest username" />
        <PasswordField label="Password" value={p} onChange={setP} show={show} toggleShow={() => setShow(!show)} placeholder="Enter password" />
        {err && <ErrBox msg={err} />}
        <button className="btn-gold" type="submit" disabled={loading} style={{ width: '100%', padding: 12, marginTop: 4, opacity: loading ? .7 : 1 }}>{loading ? 'Signing in…' : 'Sign In as Guest'}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
        No account?{' '}
        <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setTab('customer-register')}>
          Create one →
        </span>
      </p>
    </>
  );
}

/* ── Customer Register ───────────────────────────────────────────────────────── */
function CustomerRegisterForm({ router }: { router: any }) {
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', contact: '', customer_id: '' });
  const [show, setShow] = useState(false); const [err, setErr] = useState(''); const [loading, setLoading] = useState(false);

  function f(k: string) { return (v: string) => setForm(prev => ({ ...prev, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true);
    const payload: any = { ...form };
    if (payload.customer_id) payload.customer_id = parseInt(payload.customer_id);
    else delete payload.customer_id;
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = await res.json(); setLoading(false);
    if (res.ok) router.push('/portal');
    else setErr(d.error || 'Registration failed');
  }

  return (
    <>
      <h2 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Create Guest Account</h2>
      <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 22 }}>Book rooms, track stays and pay online</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <Field label="Full Name *" value={form.name} onChange={f('name')} placeholder="e.g. Priya Sharma" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Username *" value={form.username} onChange={f('username')} placeholder="Choose username" />
          <PasswordField label="Password *" value={form.password} onChange={f('password')} show={show} toggleShow={() => setShow(!show)} placeholder="Min 4 chars" />
        </div>
        <Field label="Email" value={form.email} onChange={f('email')} placeholder="your@email.com" type="email" />
        <Field label="Contact Number" value={form.contact} onChange={f('contact')} placeholder="10-digit mobile" />
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)', fontSize: 12, color: 'var(--text3)' }}>
          <strong style={{ color: 'var(--blue)' }}>Existing guest?</strong> Enter your Customer ID (optional) to link your past bookings.
          <Field label="" value={form.customer_id} onChange={f('customer_id')} placeholder="Customer ID (optional)" type="number" />
        </div>
        {err && <ErrBox msg={err} />}
        <button className="btn-gold" type="submit" disabled={loading} style={{ width: '100%', padding: 12, marginTop: 4, opacity: loading ? .7 : 1 }}>{loading ? 'Creating account…' : 'Create Account & Continue'}</button>
      </form>
    </>
  );
}

/* ── Shared field components ─────────────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>{label}</label>}
      <input className="input-field" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function PasswordField({ label, value, onChange, show, toggleShow, placeholder }: { label: string; value: string; onChange: (v: string) => void; show: boolean; toggleShow: () => void; placeholder: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input className="input-field" type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ paddingRight: 40 }} />
        <button type="button" onClick={toggleShow} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 15 }}>
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,.2)', color: 'var(--red)', fontSize: 13 }}>
      ⚠ {msg}
    </div>
  );
}
