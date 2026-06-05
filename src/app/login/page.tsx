"use client";

import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CharloLogo } from '@/components/CharloLogo';
import { useLanguage } from '@/context/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Forgot Password State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError(t('login.errorInvalidCredential'));
      } else {
        setError(t('login.errorGeneric'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: any) => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err: any) {
      setError(t('login.providerError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(t('login.resetSuccess'));
    } catch (err: any) {
      setResetMessage(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        
        {/* Language Switcher */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, fontSize: '0.85rem' }}>
          <button 
            type="button"
            onClick={() => setLanguage('es')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: language === 'es' ? 700 : 400, color: language === 'es' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
          >ES</button>
          <span style={{ color: 'var(--border-color)' }}>|</span>
          <button 
            type="button"
            onClick={() => setLanguage('en')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: language === 'en' ? 700 : 400, color: language === 'en' ? 'var(--accent-color)' : 'var(--text-secondary)' }}
          >EN</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <CharloLogo width={80} height={80} showText={false} />
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: 24, textAlign: 'center' }}>{t('login.title')}</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('login.email')}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('login.password')}</label>
              <button 
                type="button" 
                onClick={() => { setResetEmail(email); setIsResetModalOpen(true); setResetMessage(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
              >
                {t('login.forgotPassword')}
              </button>
            </div>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ marginTop: 8 }}>
            {isLoading ? t('login.signingIn') : t('login.signIn')}
          </button>
          
          
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button 
              type="button" 
              disabled={isLoading}
              onClick={() => handleProviderSignIn(new GoogleAuthProvider())} 
              className="btn-secondary" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px' }}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 16, height: 16 }} /> Google
            </button>
            <button 
              type="button" 
              disabled={isLoading}
              onClick={() => handleProviderSignIn(new FacebookAuthProvider())} 
              className="btn-secondary" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px' }}
            >
              <img src="https://www.facebook.com/favicon.ico" alt="Facebook" style={{ width: 16, height: 16 }} /> Facebook
            </button>
          </div>
        </form>
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {t('login.noAccount')} <Link href="/signup" style={{ color: 'var(--accent-color)', fontWeight: 500 }}>{t('login.signUp')}</Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {isResetModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 24 }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 16, fontWeight: 600 }}>{t('login.resetPassword')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>{t('login.resetInstructions')}</p>
            
            {resetMessage && (
              <p style={{ color: resetMessage === t('login.resetSuccess') ? '#10b981' : 'var(--danger)', marginBottom: 16, fontSize: '0.9rem' }}>
                {resetMessage}
              </p>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input 
                type="email" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
                required 
                placeholder={t('login.email')}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border-color)', outline: 'none', color: 'var(--text-primary)' }} 
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsResetModalOpen(false)}>{t('login.cancel')}</button>
                <button type="submit" disabled={isResetting} className="btn-primary">
                  {isResetting ? '...' : t('login.sendResetLink')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
