"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';

export default function AdminDetailsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const type = params.type as string;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/details/${type}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
          setError("Access Denied. Admins Only.");
          return;
        }

        if (res.ok) {
          const result = await res.json();
          setData(result.data || []);
        } else {
          setError(`Failed to fetch ${type} data.`);
        }
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, type]);

  if (authLoading || loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  if (error) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 16, border: '1px dashed var(--danger)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: 16 }}>Error</h2>
        <p>{error}</p>
        <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => router.push('/admin')}>Go Back</button>
      </div>
    );
  }

  // Format type name nicely
  const title = type.charAt(0).toUpperCase() + type.slice(1);
  
  const getColumns = () => {
    if (data.length === 0) return [];
    // Automatically generate columns based on the keys of the first object
    return Object.keys(data[0]).filter(key => key !== 'id');
  };

  const columns = getColumns();

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button 
          onClick={() => router.push('/admin')}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: 8,
            borderRadius: '50%',
            color: 'var(--text-primary)'
          }}
          className="hover-bg-light"
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 4 }}>{title} Details</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Viewing all records for {type}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 24 }}>
        {data.length === 0 ? (
           <p style={{ color: 'var(--text-secondary)' }}>No {type} found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>ID</th>
                  {columns.map(col => (
                    <th key={col} style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {row.id}
                    </td>
                    {columns.map(col => (
                      <td key={col} style={{ padding: '12px 16px', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {String(row[col])}
                      </td>
                    ))}
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
