"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          setError("Access Denied. Admins Only.");
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
          setEscalations(data.escalations || []);
        } else {
            setError("Failed to fetch admin data.");
        }
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchAdminData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Admin Dashboard...</div>;

  if (error) {
    return (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 16, border: '1px dashed var(--danger)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: 16 }}>Unauthorized</h2>
            <p>{error}</p>
            <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => router.push('/dashboard')}>Go to Main Dashboard</button>
        </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Global Admin Overview</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Charlo platform-wide metrics and health</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* Stat Cards */}
        <div className="glass-panel" onClick={() => router.push('/admin/details/users')} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Enrolled Users</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.totalUsers || 0}</span>
        </div>
        <div className="glass-panel" onClick={() => router.push('/admin/details/businesses')} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Businesses</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.totalBusinesses || 0}</span>
        </div>
        <div className="glass-panel" onClick={() => router.push('/admin/details/conversations')} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Conversations Had</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.totalConversations || 0}</span>
        </div>
        <div className="glass-panel" onClick={() => router.push('/admin/details/conversations')} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Time Saved (Platform)</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.hoursSaved || 0}h</span>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Est. 5min/resolution</span>
        </div>
        <div className="glass-panel" onClick={() => router.push('/admin/details/conversations')} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>AI Handled / Escalated</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.aiHandled || 0} / {metrics?.humanHandled || 0}</span>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{metrics?.aiResolutionRate || 0}% AI Resolution Rate</span>
        </div>
        <div className="glass-panel" onClick={() => router.push('/admin/details/orders')} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Platform Sales/Orders</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.totalOrders || 0}</span>
        </div>
        <div className="glass-panel" onClick={() => router.push('/admin/details/reservations')} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Platform Reservations</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.totalReservations || 0}</span>
        </div>
        <div className="glass-panel" onClick={() => router.push('/admin/details/qa')} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total QA / Knowledge Gaps</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.totalQA || 0}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>Recent Escalations</h3>
        {escalations.length === 0 ? (
           <p style={{ color: 'var(--text-secondary)' }}>No escalations found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Company ID</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Platform</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Reason (Last Message)</th>
                </tr>
              </thead>
              <tbody>
                {escalations.map((esc, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.9rem' }}>{esc.companyId}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem', backgroundColor: esc.status === 'needs_human' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: esc.status === 'needs_human' ? '#eab308' : '#3b82f6' }}>
                        {esc.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{esc.platform}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"{esc.reason}"</td>
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
