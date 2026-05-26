"use client";

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 400 }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: 24, textAlign: 'center' }}>Welcome Back</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>Sign In</button>
          
          {/* Dev Mode Bypass */}
          <button type="button" onClick={() => router.push('/dashboard')} className="btn-secondary" style={{ marginTop: 8 }}>
            Preview Dashboard (No Login Required)
          </button>
        </form>
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link href="/signup" style={{ color: 'var(--accent-color)', fontWeight: 500 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
