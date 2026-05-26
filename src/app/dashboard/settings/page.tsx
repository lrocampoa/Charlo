"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>{t('settings.title')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{t('settings.subtitle')}</p>
      </div>

      <div className="glass-panel" style={{ padding: 24, maxWidth: 600, marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>{t('settings.languagePreferences')}</h3>
        
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {t('settings.selectLanguage')}
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => setLanguage('en')}
              className={language === 'en' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
            >
              🇺🇸 English
            </button>
            <button 
              onClick={() => setLanguage('es')}
              className={language === 'es' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, padding: '12px', fontSize: '1rem' }}
            >
              🇪🇸 Español
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800 }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 16 }}>Integraciones de Canales</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Conecta tus cuentas de redes sociales para que tus Agentes de IA puedan responder a tus clientes automáticamente en el negocio seleccionado.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          {/* WhatsApp & Meta Integration Card */}
          <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#25D366', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                W
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>WhatsApp (Meta)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cloud API oficial</p>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, flex: 1, lineHeight: 1.5 }}>
              Conecta tu número de WhatsApp Business para habilitar respuestas con IA. Requiere verificación de negocio en Meta.
            </p>

            <button 
              className="btn-primary" 
              style={{ width: '100%', backgroundColor: '#1877F2', borderColor: '#1877F2' }}
              onClick={() => alert("En desarrollo: Esta función abrirá 'Facebook Login for Business'.")}
            >
              Conectar con Facebook
            </button>
          </div>

          {/* Instagram Integration Card */}
          <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', opacity: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
                IG
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Instagram</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Direct Messages</p>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, flex: 1, lineHeight: 1.5 }}>
              Responde a los mensajes directos (DMs) y comentarios en tus publicaciones de Instagram usando a tus Agentes de IA.
            </p>

            <button className="btn-secondary" style={{ width: '100%' }} disabled>
              Próximamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
