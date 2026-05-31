"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TeamMember {
  id: string;
  email: string;
}

export function TeamManagement({ companyId, ownerId }: { companyId: string, ownerId: string }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwner = user?.uid === ownerId;

  const fetchTeam = async () => {
    if (!user || !companyId) return;
    try {
      setLoading(true);
      setError('');
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${companyId}/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
      } else {
        setError(data.error || 'Failed to fetch team');
      }
    } catch (e) {
      console.error(e);
      setError('Error fetching team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && companyId) {
      fetchTeam();
    }
  }, [user, companyId]);

  const handleRemove = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member's access?")) return;
    
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/companies/${companyId}/team/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        await fetchTeam();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (e) {
      console.error(e);
      alert('Network error removing member');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Cargando equipo...</div>;
  if (error) return <div style={{ color: '#ef4444' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {members.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay otros miembros en este equipo.</p>
      ) : (
        members.map(member => (
          <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{member.email}</span>
            </div>
            {isOwner && (
              <button 
                type="button"
                onClick={() => handleRemove(member.id)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                Remover Acceso
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
