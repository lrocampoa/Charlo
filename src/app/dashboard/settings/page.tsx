"use client";

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { selectedCompanyId, companies, refreshCompanies } = useCompany();
  const { user } = useAuth();
  
  const [metaToken, setMetaToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  useEffect(() => {
    if (selectedCompany) {
      setMetaToken(selectedCompany.metaAccessToken || '');
      setPhoneId(selectedCompany.whatsappPhoneNumberId || '');
    }
  }, [selectedCompany]);

  const handleSaveWhatsAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId || !user) return;
    
    setIsSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          metaAccessToken: metaToken,
          whatsappPhoneNumberId: phoneId
        })
      });
      
      if (res.ok) {
        await refreshCompanies();
        alert('Configuración guardada exitosamente.');
      } else {
        alert('Error al guardar la configuración.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar.');
    } finally {
      setIsSaving(false);
    }
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

        {/* WhatsApp Integration */}
        {selectedCompany && (
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#25D366' }}>💬</span> {t('settings.whatsappIntegration')}
            </h2>
            <form onSubmit={handleSaveWhatsAppConfig} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {t('settings.metaToken')}
                <input 
                  type="password"
                  value={metaToken}
                  onChange={(e) => setMetaToken(e.target.value)}
                  placeholder="EAALxxxxxxxxxxxxxx"
                  style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {t('settings.phoneId')}
                <input 
                  type="text"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  placeholder="123456789012345"
                  style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace' }}
                />
              </label>

              <button type="submit" className="btn-primary" disabled={isSaving} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                {isSaving ? 'Guardando...' : t('settings.saveChanges')}
              </button>
            </form>
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
