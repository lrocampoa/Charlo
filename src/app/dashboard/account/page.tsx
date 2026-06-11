"use client";

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { linkWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

export default function AccountPage() {
  const { t, language, setLanguage } = useLanguage();
  const { globalUser } = useCompany();
  const { user } = useAuth();
  
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const providers = user?.providerData || [];
  const hasGoogle = providers.some(p => p.providerId === 'google.com');
  const hasFacebook = providers.some(p => p.providerId === 'facebook.com');
  const hasPassword = providers.some(p => p.providerId === 'password');

  const handleLinkGoogle = async () => {
    if (!user) return;
    setIsLinking(true);
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(user, provider);
      alert('Cuenta de Google vinculada con éxito.');
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert('Error al vincular cuenta: ' + e.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkFacebook = async () => {
    if (!user) return;
    setIsLinking(true);
    try {
      const provider = new FacebookAuthProvider();
      await linkWithPopup(user, provider);
      alert('Cuenta de Meta (Facebook) vinculada con éxito.');
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert('Error al vincular cuenta: ' + e.message);
    } finally {
      setIsLinking(false);
    }
  };

  const getLimitForTier = (tier?: string) => {
    switch(tier) {
      case 'starter': return 2000;
      case 'growth': return 5000;
      case 'pro': return 15000;
      default: return 2000;
    }
  };

  const handleManageBilling = async () => {
    if (!user) return;
    setIsCheckoutLoading(true);
    try {
      const token = await user.getIdToken();
      if (globalUser?.stripeCustomerId) {
        // Open Customer Portal
        const res = await fetch('/api/stripe/create-portal-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert('Error: ' + data.error);
      } else {
        // Open Checkout for Growth Tier
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ tier: 'growth' })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert('Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al procesar facturación.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{t('sidebar.myAccount')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gestiona tu perfil, preferencias globales y suscripción.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
        
        {/* User Profile */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Perfil de Usuario</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre</label>
              <input type="text" readOnly value={user?.displayName || ''} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" readOnly value={user?.email || ''} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Cuentas Vinculadas</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
            Conecta tus cuentas sociales para iniciar sesión más fácilmente o integrarte con otros servicios.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>📧</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Google</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {hasGoogle ? 'Conectado' : 'No conectado'}
                  </div>
                </div>
              </div>
              {!hasGoogle && (
                <button 
                  onClick={handleLinkGoogle} 
                  disabled={isLinking}
                  className="btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  {isLinking ? '...' : 'Vincular'}
                </button>
              )}
              {hasGoogle && (
                <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>✅</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.2rem', color: '#1877F2' }}>📘</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Facebook / Meta</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {hasFacebook ? 'Conectado' : 'No conectado'}
                  </div>
                </div>
              </div>
              {!hasFacebook && (
                <button 
                  onClick={handleLinkFacebook} 
                  disabled={isLinking}
                  className="btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  {isLinking ? '...' : 'Vincular'}
                </button>
              )}
              {hasFacebook && (
                <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>✅</span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.2rem' }}>✉️</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Email y Contraseña</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {hasPassword ? 'Configurado' : 'No configurado'}
                  </div>
                </div>
              </div>
              {hasPassword && (
                <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>✅</span>
              )}
            </div>
          </div>
        </div>

        {/* Global Preferences */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Preferencias Globales</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {t('settings.selectLanguage')}
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'es')}
                style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </label>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tema Visual</label>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Subscription & Usage */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💳</span> Suscripción y Uso de IA
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>Plan Actual</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--accent-color)' }}>
                  {globalUser?.subscription?.tier || 'free'}
                </p>
              </div>
              <button 
                className="btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                onClick={handleManageBilling}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? 'Cargando...' : globalUser?.stripeCustomerId ? 'Gestionar Facturación' : 'Mejorar a Growth ($99)'}
              </button>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mensajes de IA globales usados este mes</span>
                <span style={{ fontWeight: 600 }}>
                  {globalUser?.usage?.aiMessagesCurrentMonth || 0} / {getLimitForTier(globalUser?.subscription?.tier)}
                </span>
              </div>
              
              {/* Progress bar */}
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  background: 'var(--accent-color)', 
                  width: `${Math.min(100, ((globalUser?.usage?.aiMessagesCurrentMonth || 0) / getLimitForTier(globalUser?.subscription?.tier)) * 100)}%`,
                  transition: 'width 0.5s ease-in-out'
                }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
