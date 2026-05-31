"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function InvitePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');

  const inviteId = params.id as string;

  const handleAccept = async () => {
    setIsAccepting(true);
    setError('');
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/invites/${inviteId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        // Successfully joined, redirect to dashboard
        router.push('/dashboard/companies');
      } else {
        setError(data.error || "Failed to accept invite");
      }
    } catch (e: any) {
      console.error(e);
      setError("An error occurred while accepting the invitation.");
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
      <div className="glass-panel" style={{ padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 16, fontWeight: 600 }}>Team Invitation</h2>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {!user ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              You need to log in to accept this invitation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn-primary" onClick={() => router.push(`/login?redirect=/invite/${inviteId}`)}>
                Log In
              </button>
              <button className="btn-secondary" onClick={() => router.push(`/signup?redirect=/invite/${inviteId}`)}>
                Sign Up
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              You are logged in as <strong>{user.email}</strong>. Click below to accept the invitation and join the business.
            </p>
            <button 
              className="btn-primary" 
              style={{ width: '100%' }} 
              onClick={handleAccept} 
              disabled={isAccepting}
            >
              {isAccepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
