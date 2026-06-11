"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { TeamManagement } from '@/components/TeamManagement';

function SettingsContent() {
  const { t } = useLanguage();
  const { selectedCompanyId, companies, refreshCompanies } = useCompany();
  const { user } = useAuth();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') || 'general';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSaving, setIsSaving] = useState(false);
  const [isFbSdkLoaded, setIsFbSdkLoaded] = useState(false);
  
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  
  // Form state for General & Knowledge
  const [formData, setFormData] = useState<any>({
    name: '',
    persona: '',
    calendlyLink: '',
    knowledgeBase: '',
    productsCatalog: '',
    testPhoneNumber: ''
  });

  // Prefs state
  const [humanEscalations, setHumanEscalations] = useState(true);
  const [usageAlerts, setUsageAlerts] = useState(true);
  const [promotions, setPromotions] = useState(true);

  useEffect(() => {
    if (selectedCompany) {
      setFormData({
        name: selectedCompany.name || '',
        persona: selectedCompany.persona || '',
        calendlyLink: selectedCompany.calendlyLink || '',
        knowledgeBase: selectedCompany.knowledgeBase || '',
        productsCatalog: selectedCompany.productsCatalog || '',
        testPhoneNumber: selectedCompany.testPhoneNumber || ''
      });
      
      if (selectedCompany.notificationPreferences) {
        setHumanEscalations(selectedCompany.notificationPreferences.humanEscalations ?? true);
        setUsageAlerts(selectedCompany.notificationPreferences.usageAlerts ?? true);
        setPromotions(selectedCompany.notificationPreferences.promotions ?? true);
      }
    }
  }, [selectedCompany]);

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
        version          : 'v19.0'
      });
      setIsFbSdkLoaded(true);
    };

    const script = document.createElement('script');
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCompanyId || !user) return;
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/companies/${selectedCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      await refreshCompanies();
      alert('Configuración guardada exitosamente.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuración.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async (prefs: any) => {
    if (!selectedCompanyId || !user) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/companies/${selectedCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notificationPreferences: prefs })
      });
      refreshCompanies();
    } catch (err) {
      console.error(err);
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

  const handlePauseToggle = async () => {
    if (!selectedCompany || !user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompany.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isPaused: !selectedCompany.isPaused })
      });
      if (!res.ok) {
         const data = await res.json();
         alert(data.error || 'Error cambiando estado');
      } else {
         refreshCompanies();
      }
    } catch(e) {
       alert('Error de red al intentar cambiar el estado.');
    }
  };

  if (!selectedCompany) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        Selecciona un negocio del menú izquierdo para configurar sus ajustes.
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: '🤖 Identidad' },
    { id: 'knowledge', label: '🧠 Conocimiento' },
    { id: 'channels', label: '🔌 Canales' },
    { id: 'team', label: '👥 Equipo' },
    { id: 'prefs', label: '⚙️ Preferencias' }
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Ajustes del Negocio</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gestiona la configuración exclusiva para <strong>{selectedCompany.name || 'este negocio'}</strong>.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, borderBottom: '1px solid var(--border-color)', paddingBottom: 16, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              router.push(`/dashboard/settings?tab=${tab.id}`, { scroll: false });
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 'var(--border-radius-sm)',
              background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              border: activeTab === tab.id ? '1px solid var(--border-color)' : '1px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 700 }}>
        
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Identidad del Agente</h2>
              <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.name')}</label>
                  <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.persona')} (Tono y forma de ser)</label>
                  <textarea rows={4} required value={formData.persona || ''} onChange={e => setFormData({...formData, persona: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.calendlyLink')} (Opcional)</label>
                  <input type="url" value={formData.calendlyLink || ''} onChange={e => setFormData({...formData, calendlyLink: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="submit" disabled={isSaving} className="btn-primary">
                    {isSaving ? t('companies.saving') : t('companies.save')}
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: selectedCompany.isPaused ? '#ef4444' : '#10b981' }}>
                  {selectedCompany.isPaused ? 'Asistente Pausado' : 'Asistente Activo'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4, maxWidth: '80%' }}>
                  {selectedCompany.isPaused 
                    ? 'Tus clientes recibirán una respuesta automática indicando que el asistente está inactivo.'
                    : 'El asistente está procesando y respondiendo a los mensajes de tus clientes normalmente.'}
                </p>
              </div>
              <button 
                onClick={handlePauseToggle}
                style={{
                  background: selectedCompany.isPaused ? '#10b981' : 'rgba(239, 68, 68, 0.2)',
                  color: selectedCompany.isPaused ? 'white' : '#ef4444',
                  border: selectedCompany.isPaused ? 'none' : '1px solid rgba(239, 68, 68, 0.5)',
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minWidth: 160
                }}
              >
                {selectedCompany.isPaused ? 'Activar Asistente' : 'Pausar Asistente'}
              </button>
            </div>
          </div>
        )}

        {/* KNOWLEDGE TAB */}
        {activeTab === 'knowledge' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Base de Conocimiento Textual</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                Esta es la información básica que el agente siempre recordará. Para catálogos muy extensos o subir archivos PDF, ve a la sección "Conocimiento y SOPs" en el menú principal.
              </p>
              <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.productsCatalog')}</label>
                  <textarea rows={6} value={formData.productsCatalog || ''} onChange={e => setFormData({...formData, productsCatalog: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('companies.knowledgeBase')} (Políticas, Horarios, Ubicación)</label>
                  <textarea rows={8} value={formData.knowledgeBase || ''} onChange={e => setFormData({...formData, knowledgeBase: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="submit" disabled={isSaving} className="btn-primary">
                    {isSaving ? t('companies.saving') : t('companies.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CHANNELS TAB */}
        {activeTab === 'channels' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {isSaving ? 'Conectando...' : 'Conectar con Meta'}
              </button>
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="fade-in">
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>👥</span> Accesos de Equipo
              </h2>
              <TeamManagement companyId={selectedCompany.id} ownerId={selectedCompany.ownerId || ''} />
            </div>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'prefs' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🔔</span> Preferencias de Alertas
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
                Controla qué notificaciones recibes en tu WhatsApp para este negocio.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={humanEscalations} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setHumanEscalations(val);
                      handleSavePreferences({ humanEscalations: val, usageAlerts, promotions });
                    }} 
                    style={{ width: 18, height: 18, accentColor: 'var(--accent-color)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>Escalamientos a Humanos</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Te notificamos cuando un cliente requiere hablar con un humano.</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={usageAlerts} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setUsageAlerts(val);
                      handleSavePreferences({ humanEscalations, usageAlerts: val, promotions });
                    }} 
                    style={{ width: 18, height: 18, accentColor: 'var(--accent-color)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>Alertas de Límites de Uso</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Te avisamos al alcanzar cuotas de mensajes.</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={promotions} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setPromotions(val);
                      handleSavePreferences({ humanEscalations, usageAlerts, promotions: val });
                    }} 
                    style={{ width: 18, height: 18, accentColor: 'var(--accent-color)' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>Promociones y Novedades</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ofertas especiales y actualizaciones de Charlo.</div>
                  </div>
                </label>
              </div>
            </div>

            {selectedCompany.subscription?.tier === 'free' && (
              <div className="glass-panel">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🧪</span> Modo Sandbox
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
                  Estás en el plan gratis. Para probar tu asistente, ingresa tu número de teléfono de WhatsApp personal. El bot SOLO responderá a este número.
                </p>
                <form onSubmit={handleSaveConfig} style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                  <label style={{ flex: 1, display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Tu Número Personal (con código de país, ej. 50688889999)
                    <input 
                      type="text" 
                      value={formData.testPhoneNumber || ''} 
                      onChange={e => setFormData({...formData, testPhoneNumber: e.target.value})}
                      placeholder="Ej. 50688889999"
                      style={{ width: '100%', padding: '10px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', marginTop: 8 }}
                    />
                  </label>
                  <button 
                    type="submit"
                    className="btn-primary" 
                    disabled={isSaving}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Sandbox'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
