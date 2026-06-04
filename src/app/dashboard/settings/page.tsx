"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { TeamManagement } from '@/components/TeamManagement';

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { selectedCompanyId, companies, refreshCompanies } = useCompany();
  const { user } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isFbSdkLoaded, setIsFbSdkLoaded] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [sandboxNumber, setSandboxNumber] = useState('');

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  useEffect(() => {
    if (selectedCompany?.testPhoneNumber) {
      setSandboxNumber(selectedCompany.testPhoneNumber);
    }
  }, [selectedCompany]);

  const handleSaveSandbox = async () => {
    if (!selectedCompanyId || !user) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/companies/${selectedCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ testPhoneNumber: sandboxNumber })
      });
      refreshCompanies();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
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

  useEffect(() => {
    if ((window as any).FB) {
      setIsFbSdkLoaded(true);
      return;
    }
    
    (window as any).fbAsyncInit = function() {
      (window as any).FB.init({
        appId            : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
        autoLogAppEvents : true,
        xfbml            : true,
        version          : 'v19.0' // Use current Graph API version
      });
      setIsFbSdkLoaded(true);
    };

    const script = document.createElement('script');
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const handleManageBilling = async () => {
    if (!selectedCompanyId || !user) return;
    setIsCheckoutLoading(true);
    try {
      const token = await user.getIdToken();
      if (selectedCompany?.stripeCustomerId) {
        // Open Customer Portal
        const res = await fetch('/api/stripe/create-portal-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ companyId: selectedCompanyId })
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert('Error: ' + data.error);
      } else {
        // Open Checkout for Growth Tier
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ companyId: selectedCompanyId, tier: 'growth' })
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

  const handleMetaLogin = () => {
    if (!(window as any).FB || !selectedCompanyId || !user) return;
    
    (window as any).FB.login(async (response: any) => {
      if (response.authResponse) {
        setIsSaving(true);
        try {
          const token = await user.getIdToken();
          const res = await fetch(`/api/companies/${selectedCompanyId}/meta-auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              accessToken: response.authResponse.accessToken 
            })
          });
          
          if (res.ok) {
            await refreshCompanies();
            alert('Conexión con Meta exitosa.');
          } else {
            alert('Error al conectar con Meta.');
          }
        } catch (e) {
          console.error(e);
          alert('Error de red al conectar.');
        } finally {
          setIsSaving(false);
        }
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      scope: 'whatsapp_business_management,whatsapp_business_messaging,pages_messaging,pages_read_engagement,pages_show_list,instagram_manage_messages,instagram_basic',
      extras: { feature: 'whatsapp_embedded_signup', version: 2 },
      return_scopes: true
    });
  };


  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{t('settings.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('settings.subtitle')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 600 }}>
        
        {/* Language Settings */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>{t('settings.languagePreferences')}</h2>
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
        </div>

        {/* Subscription & Usage */}
        {selectedCompany && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💳</span> Suscripción y Uso de IA
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>Plan Actual</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize', color: 'var(--accent-color)' }}>
                    {selectedCompany.subscription?.tier || 'starter'}
                  </p>
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  onClick={handleManageBilling}
                  disabled={isCheckoutLoading}
                >
                  {isCheckoutLoading ? 'Cargando...' : selectedCompany.stripeCustomerId ? 'Gestionar Facturación' : 'Mejorar a Growth ($99)'}
                </button>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Mensajes de IA usados este mes</span>
                  <span style={{ fontWeight: 600 }}>
                    {selectedCompany.usage?.aiMessagesCurrentMonth || 0} / {getLimitForTier(selectedCompany.subscription?.tier)}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    background: 'var(--accent-color)', 
                    width: `${Math.min(100, ((selectedCompany.usage?.aiMessagesCurrentMonth || 0) / getLimitForTier(selectedCompany.subscription?.tier)) * 100)}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sandbox Configuration */}
        {selectedCompany && selectedCompany.subscription?.tier === 'free' && (
          <div className="glass-panel" style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🧪</span> Modo Sandbox
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
              Estás en el plan gratis. Para probar tu asistente, ingresa tu número de teléfono de WhatsApp personal. El bot SOLO responderá a este número.
            </p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <label style={{ flex: 1, display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Tu Número Personal (con código de país, ej. 50688889999)
                <input 
                  type="text" 
                  value={sandboxNumber} 
                  onChange={e => setSandboxNumber(e.target.value)}
                  placeholder="Ej. 50688889999"
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', marginTop: 8 }}
                />
              </label>
              <button 
                className="btn-primary" 
                onClick={handleSaveSandbox} 
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar Sandbox'}
              </button>
            </div>
          </div>
        )}

        {/* Canales Conectados */}
        {selectedCompany && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔌</span> Canales Conectados
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {selectedCompany.whatsappPhoneNumberId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
                  <span>✅</span> WhatsApp
                  <button 
                    onClick={async () => {
                      if(confirm('¿Desconectar WhatsApp?')) {
                        const token = await user?.getIdToken();
                        await fetch(`/api/companies/${selectedCompanyId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ whatsappPhoneNumberId: "" }) });
                        refreshCompanies();
                      }
                    }} 
                    style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', marginLeft: 8, opacity: 0.8, fontWeight: 'bold' }}>✕</button>
                </div>
              )}
              {selectedCompany.facebookPageId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
                  <span>✅</span> Messenger
                  <button 
                    onClick={async () => {
                      if(confirm('¿Desconectar Messenger?')) {
                        const token = await user?.getIdToken();
                        await fetch(`/api/companies/${selectedCompanyId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ facebookPageId: "" }) });
                        refreshCompanies();
                      }
                    }} 
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', marginLeft: 8, opacity: 0.8, fontWeight: 'bold' }}>✕</button>
                </div>
              )}
              {selectedCompany.instagramAccountId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#ec4899', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
                  <span>✅</span> Instagram
                  <button 
                    onClick={async () => {
                      if(confirm('¿Desconectar Instagram?')) {
                        const token = await user?.getIdToken();
                        await fetch(`/api/companies/${selectedCompanyId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ instagramAccountId: "" }) });
                        refreshCompanies();
                      }
                    }} 
                    style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer', marginLeft: 8, opacity: 0.8, fontWeight: 'bold' }}>✕</button>
                </div>
              )}
              {!selectedCompany.whatsappPhoneNumberId && !selectedCompany.facebookPageId && !selectedCompany.instagramAccountId && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No tienes canales conectados actualmente.</p>
              )}
            </div>
          </div>
        )}

        {/* Team Management */}
        {selectedCompany && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👥</span> Accesos de Equipo
            </h2>
            <TeamManagement companyId={selectedCompany.id} ownerId={selectedCompany.ownerId || ''} />
          </div>
        )}

        {/* Meta Integration */}
        {selectedCompany && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#1877F2' }}>🌐</span> Conectar Meta Business
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
              Conecta tu cuenta de WhatsApp, página de Facebook y cuenta de Instagram en un solo paso para gestionar todos tus mensajes desde Charlo.
            </p>
            <button 
              onClick={handleMetaLogin} 
              disabled={!isFbSdkLoaded || isSaving}
              style={{ 
                background: '#1877F2', 
                color: 'white', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '8px', 
                fontWeight: 600, 
                cursor: (!isFbSdkLoaded || isSaving) ? 'not-allowed' : 'pointer',
                opacity: (!isFbSdkLoaded || isSaving) ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              {isSaving ? 'Conectando...' : 'Conectar con Meta'}
            </button>
          </div>
        )}


        {!selectedCompany && (
          <div className="glass-panel" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Selecciona un negocio del menú izquierdo para configurar WhatsApp.
          </div>
        )}

      </div>
    </div>
  );
}
