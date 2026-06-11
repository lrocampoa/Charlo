"use client";

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, getAdditionalUserInfo, sendEmailVerification, fetchSignInMethodsForEmail, linkWithCredential, AuthCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CharloLogo } from '@/components/CharloLogo';
import { useLanguage } from '@/context/LanguageContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Account Linking State
  const [linkModalData, setLinkModalData] = useState<{email: string, methods: string[], pendingCred: AuthCredential} | null>(null);
  
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError(t('signup.errorPasswordMatch'));
    }

    setIsLoading(true);
    setIsSeeding(false);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Auto-seed for new Email/Password users
      setIsSeeding(true);
      const token = await userCred.user.getIdToken();
      await fetch('/api/seed', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });

      // Send verification email
      await sendEmailVerification(userCred.user);

      router.push('/verify-email');
    } catch (err: any) {
      setError(t('signup.errorGeneric'));
      setIsLoading(false);
      setIsSeeding(false);
    }
  };

  const handleProviderSignIn = async (provider: any) => {
    setError('');
    setIsLoading(true);
    setIsSeeding(false);
    try {
      const userCred = await signInWithPopup(auth, provider);
      
      // Auto-seed ONLY if they are a brand new user
      const additionalInfo = getAdditionalUserInfo(userCred);
      if (additionalInfo?.isNewUser) {
        setIsSeeding(true);
        const token = await userCred.user.getIdToken();
        await fetch('/api/seed', { 
          method: 'POST', 
          headers: { Authorization: `Bearer ${token}` } 
        });
      }

      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email;
        let pendingCred = null;
        if (provider.providerId === 'facebook.com') {
            pendingCred = FacebookAuthProvider.credentialFromError(err);
        } else if (provider.providerId === 'google.com') {
            pendingCred = GoogleAuthProvider.credentialFromError(err);
        }
        
        if (email && pendingCred) {
          fetchSignInMethodsForEmail(auth, email).then(methods => {
              setLinkModalData({ email, methods, pendingCred: pendingCred as AuthCredential });
          }).catch(() => {
              setError(t('signup.errorEmailCollision'));
          });
        } else {
          setError(t('signup.errorEmailCollision'));
        }
      } else {
        setError(t('signup.errorGeneric'));
      }
      setIsLoading(false);
      setIsSeeding(false);
    }
  };

  const handleLinkAccount = async (method: string) => {
    if (!linkModalData) return;
    setError('');
    setIsLoading(true);
    try {
        let providerToLink: any = null;
        if (method === 'google.com') providerToLink = new GoogleAuthProvider();
        else if (method === 'facebook.com') providerToLink = new FacebookAuthProvider();
        
        if (providerToLink) {
            const result = await signInWithPopup(auth, providerToLink);
            await linkWithCredential(result.user, linkModalData.pendingCred);
            router.push('/dashboard');
        } else if (method === 'password') {
            setError(t('signup.errorEmailCollision'));
        }
    } catch (err) {
        setError(t('signup.errorGeneric'));
    } finally {
        setIsLoading(false);
        setLinkModalData(null);
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
        <h2 style={{ fontSize: '1.75rem', marginBottom: 24, textAlign: 'center' }}>{t('signup.title')}</h2>
        {error && <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('signup.email')}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('signup.password')}</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('signup.confirmPassword')}</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.5)', outline: 'none', color: 'var(--text-primary)' }}
            />
          </div>
          <button type="submit" disabled={isLoading || isSeeding} className="btn-primary" style={{ marginTop: 8 }}>
            {isSeeding ? t('signup.settingUpWorkspace') : isLoading ? t('signup.signingUp') : t('signup.signUp')}
          </button>
          
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button 
              type="button" 
              disabled={isLoading || isSeeding}
              onClick={() => handleProviderSignIn(new GoogleAuthProvider())} 
              className="btn-secondary" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px' }}
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 16, height: 16 }} /> Google
            </button>
            <button 
              type="button" 
              disabled={isLoading || isSeeding}
              onClick={() => handleProviderSignIn(new FacebookAuthProvider())} 
              className="btn-secondary" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px' }}
            >
              <img src="https://www.facebook.com/favicon.ico" alt="Facebook" style={{ width: 16, height: 16 }} /> Facebook
            </button>
          </div>
        </form>
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {t('signup.alreadyAccount')} <Link href="/login" style={{ color: 'var(--accent-color)', fontWeight: 500 }}>{t('signup.signIn')}</Link>
        </p>
      </div>

      {/* Account Linking Modal */}
      {linkModalData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 24 }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 16, fontWeight: 600 }}>{t('signup.linkModalTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.95rem' }}>
                {t('signup.linkModalDesc')} <br/>
                <strong>{linkModalData.email}</strong>
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {linkModalData.methods.includes('google.com') && (
                    <button onClick={() => handleLinkAccount('google.com')} className="btn-secondary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '10px' }}>
                        <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 16, height: 16 }} /> Google
                    </button>
                )}
                {linkModalData.methods.includes('password') && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        Por favor cierra esto e inicia sesión con tu correo y contraseña para vincular las cuentas automáticamente.
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn-secondary" onClick={() => setLinkModalData(null)}>{t('signup.linkModalCancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
