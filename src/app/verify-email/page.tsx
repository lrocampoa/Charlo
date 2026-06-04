"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { CharloLogo } from '@/components/CharloLogo';
import { useLanguage } from '@/context/LanguageContext';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // If loading or user isn't logged in, do nothing (ProtectedRoute or this effect will handle it)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleResend = async () => {
    if (!user) return;
    setIsResending(true);
    setMessage('');
    setError('');
    try {
      await sendEmailVerification(user);
      setMessage(t('signup.verificationEmailSent') || 'Correo de verificación reenviado. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setError(err.message || 'Error al reenviar el correo. Intenta de nuevo más tarde.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    try {
      // Force refresh the user token to get the updated emailVerified status
      await user.reload();
      if (auth.currentUser?.emailVerified) {
        router.push('/dashboard');
      } else {
        setError('Tu correo aún no ha sido verificado. Haz clic en el enlace que enviamos a tu correo.');
      }
    } catch (err: any) {
      setError('Error al verificar el estado.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24, backgroundColor: 'var(--bg-secondary)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 450, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <CharloLogo width={140} height={42} />
        </div>
        
        <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Verifica tu Correo</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
          Hemos enviado un correo de verificación a <strong>{user.email}</strong>.<br/>
          Por favor, haz clic en el enlace dentro de ese correo para activar tu cuenta.
        </p>

        {message && <p style={{ color: 'var(--accent-color)', marginBottom: 16, fontSize: '0.9rem' }}>✅ {message}</p>}
        {error && <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: '0.9rem' }}>⚠️ {error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            className="btn-primary" 
            onClick={handleCheckVerification}
          >
            Ya verifiqué mi correo
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? 'Enviando...' : 'Reenviar correo de verificación'}
          </button>
          
          <button 
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', marginTop: 12, fontSize: '0.9rem' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
