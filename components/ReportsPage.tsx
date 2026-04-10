'use client';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  // Silent background refresh every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/reports').then(r => r.json()).then(d => { if(d && !d.error) setData(d); }).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Reports</h1>
        <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>Revenue and performance analytics</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 14 }} />)}
      </div>
      <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
    </div>
  );

  const s = data?.summary || {};
  const rbt = data?.revenue_by_type || [];
  const monthly = (data?.bookings_by_month || []).slice(0, 6).reverse();
  const topRooms = data?.top_rooms || [];

  // Chart helpers
  const maxRevMonth = Math.max(...monthly.map((m: any) => Number(m.revenue)), 1);
  const maxRevType  = Math.max(...rbt.map((r: any) => Number(r.revenue)), 1);

  const TYPE_COLOR: Record<string, string> = {
    SINGLE: 'var(--blue)',
    DOUBLE: 'var(--green)',
    DELUXE: 'var(--gold)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 2 }}>Revenue and performance overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Revenue', value: `₹${Number(s.total_revenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: 'var(--gold)', bg: 'rgba(201,169,110,0.08)' },
          { label: 'Completed Stays', value: s.total_bookings || 0, icon: '✅', color: 'var(--green)', bg: 'rgba(45,212,164,0.08)' },
          { label: 'Total Nights', value: s.total_nights || 0, icon: '🌙', color: 'var(--blue)', bg: 'rgba(96,165,250,0.08)' },
          { label: 'Avg. Bill', value: `₹${Number(s.avg_bill || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: '📊', color: 'var(--purple)', bg: 'rgba(167,139,250,0.08)' },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}22`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Monthly Revenue Bar Chart */}
        <div className="glass" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Monthly Revenue</h3>
            {monthly.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6 }}>
                Last {monthly.length} month{monthly.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {monthly.length === 0 ? (
            <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px 0', fontSize: 14 }}>No data yet</p>
          ) : (() => {
            const CHART_H = 220;
            const ySteps = 4;
            const stepVal = Math.ceil(maxRevMonth / ySteps / 1000) * 1000 || 1000;
            const yMax = stepVal * ySteps;
            const MONTH_NAMES: Record<string, string> = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };
            const totalMonthlyRev = monthly.reduce((s: number, m: any) => s + Number(m.revenue), 0);
            const avgMonthlyRev = monthly.length ? totalMonthlyRev / monthly.length : 0;
            const bestMonth = monthly.reduce((best: any, m: any) => Number(m.revenue) > Number(best.revenue) ? m : best, monthly[0]);
            return (
              <>
                <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
                  {/* Y-axis labels */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: CHART_H, paddingBottom: 2, marginRight: 8, flexShrink: 0 }}>
                    {Array.from({ length: ySteps + 1 }, (_, i) => {
                      const val = yMax - (i * stepVal);
                      return (
                        <span key={i} style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'right', minWidth: 36, lineHeight: '1' }}>
                          ₹{val >= 1000 ? `${Math.round(val/1000)}k` : val}
                        </span>
                      );
                    })}
                  </div>
                  {/* Chart area */}
                  <div style={{ flex: 1, position: 'relative', height: CHART_H }}>
                    {/* Grid lines */}
                    {Array.from({ length: ySteps + 1 }, (_, i) => (
                      <div key={i} style={{
                        position: 'absolute', left: 0, right: 0,
                        top: `${(i / ySteps) * 100}%`,
                        borderTop: i === ySteps ? '1px solid var(--border)' : '1px dashed rgba(255,255,255,0.06)',
                      }} />
                    ))}
                    {/* Bars */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 6, padding: '0 4px', position: 'relative', zIndex: 1 }}>
                      {monthly.map((m: any) => {
                        const rev = Number(m.revenue);
                        const h = Math.max(6, (rev / yMax) * CHART_H);
                        const monthKey = m.month?.slice(5);
                        const monthLabel = MONTH_NAMES[monthKey] || monthKey;
                        const year = m.month?.slice(2, 4);
                        return (
                          <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 0 }}>
                            {/* Value label */}
                            <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 4, whiteSpace: 'nowrap' }}>
                              ₹{rev >= 100000 ? `${(rev/100000).toFixed(1)}L` : rev >= 1000 ? `${Math.round(rev/1000)}k` : rev}
                            </div>
                            {/* Bar */}
                            <div style={{
                              width: '100%', maxWidth: 52, height: h,
                              background: 'linear-gradient(180deg, var(--gold2), var(--gold3))',
                              borderRadius: '6px 6px 2px 2px',
                              transition: 'height 0.5s ease',
                              position: 'relative',
                            }}>
                              {/* Bookings chip inside bar */}
                              {h > 28 && (
                                <div style={{
                                  position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                                  fontSize: 9, color: 'rgba(0,0,0,0.6)', fontWeight: 700, whiteSpace: 'nowrap',
                                  background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 5px',
                                }}>
                                  {m.bookings}
                                </div>
                              )}
                            </div>
                            {/* Month label */}
                            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginTop: 8 }}>{monthLabel}</div>
                            <div style={{ fontSize: 9, color: 'var(--text3)' }}>'{year}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* Summary row */}
                <div style={{ display: 'flex', gap: 12, marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  {[
                    { label: 'Total', value: `₹${totalMonthlyRev >= 100000 ? `${(totalMonthlyRev/100000).toFixed(1)}L` : totalMonthlyRev.toLocaleString('en-IN')}`, color: 'var(--gold)' },
                    { label: 'Average', value: `₹${avgMonthlyRev >= 100000 ? `${(avgMonthlyRev/100000).toFixed(1)}L` : Math.round(avgMonthlyRev).toLocaleString('en-IN')}`, color: 'var(--blue)' },
                    { label: 'Best', value: MONTH_NAMES[bestMonth?.month?.slice(5)] || '—', color: 'var(--green)' },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {/* Revenue by Room Type */}
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Revenue by Room Type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rbt.map((r: any) => {
              const pct = maxRevType > 0 ? (Number(r.revenue) / maxRevType) * 100 : 0;
              const color = TYPE_COLOR[r.room_type] || 'var(--text3)';
              return (
                <div key={r.room_type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{r.room_type}</span>
                    <span style={{ color, fontWeight: 700 }}>₹{Number(r.revenue).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="progress-track">
                    <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: color, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    {r.bookings} bookings · {r.nights || 0} nights
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Rooms Table */}
      {topRooms.length > 0 && (
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Top Performing Rooms</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Room</th>
                <th>Type</th>
                <th>Rate / Day</th>
                <th>Bookings</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topRooms.map((r: any, i: number) => (
                <tr key={r.room_number}>
                  <td style={{ color: i === 0 ? 'var(--gold)' : 'var(--text3)', fontWeight: 700 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td>Room {r.room_number}</td>
                  <td><span className={`badge ${r.room_type === 'SINGLE' ? 'badge-blue' : r.room_type === 'DOUBLE' ? 'badge-green' : 'badge-amber'}`}>{r.room_type}</span></td>
                  <td>₹{Number(r.price_per_day).toLocaleString('en-IN')}</td>
                  <td>{r.bookings}</td>
                  <td style={{ fontWeight: 700, color: 'var(--gold)' }}>₹{Number(r.revenue).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {topRooms.length === 0 && (
        <div className="glass" style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <p>Complete some bookings to see performance reports</p>
        </div>
      )}
    </div>
  );
}
