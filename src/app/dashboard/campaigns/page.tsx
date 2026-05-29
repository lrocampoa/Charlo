"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';

interface Campaign {
  id: string;
  templateName: string;
  languageCode: string;
  audienceSize: number;
  sentCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [templateName, setTemplateName] = useState('');
  const [languageCode, setLanguageCode] = useState('es_MX');

  useEffect(() => {
    async function fetchCampaigns() {
      if (!user || !selectedCompanyId) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/companies/${selectedCompanyId}/campaigns`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, [selectedCompanyId, user]);

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCompanyId) return;
    
    if (!templateName.trim()) {
      alert("Por favor ingresa el nombre del template aprobado por Meta.");
      return;
    }

    if (!confirm(`¿Estás seguro de enviar el template "${templateName}" a todos los clientes de tu CRM?`)) {
      return;
    }

    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateName: templateName.trim(),
          languageCode
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`¡Campaña enviada! Entregados: ${data.campaign.sentCount}, Fallidos: ${data.campaign.failedCount}`);
        setCampaigns([data.campaign, ...campaigns]);
        setTemplateName('');
      } else {
        alert(data.error || "Error al enviar la campaña.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red.");
    } finally {
      setSending(false);
    }
  };

  if (!selectedCompanyId) {
    return <div style={{ color: 'var(--text-secondary)', padding: 24 }}>Selecciona una empresa para gestionar campañas.</div>;
  }

  const isWhatsAppConfigured = selectedCompany?.metaAccessToken && selectedCompany?.whatsappPhoneNumberId;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>📢</span> Campañas de WhatsApp
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Envía mensajes de marketing a todos tus clientes usando Templates pre-aprobados por Meta (regla de las 24 horas).
        </p>
      </div>

      {!isWhatsAppConfigured ? (
        <div className="glass-panel" style={{ padding: 32, textAlign: 'center', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚙️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>WhatsApp No Configurado</h2>
          <p>Para enviar campañas, primero debes configurar tu Meta Token y Phone ID en la sección de Ajustes.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, alignItems: 'start' }}>
          
          {/* Create Campaign Form */}
          <div className="glass-panel" style={{ position: 'sticky', top: 24 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Nueva Campaña</h2>
            
            <form onSubmit={handleSendCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre del Template (Meta API)</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="ej. promo_verano_01"
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Idioma del Template</label>
                <select
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none'
                  }}
                >
                  <option value="es_MX">Español (es_MX)</option>
                  <option value="es_LA">Español (es_LA)</option>
                  <option value="es">Español (es)</option>
                  <option value="en_US">Inglés (en_US)</option>
                </select>
              </div>

              <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ℹ️ Esta campaña se enviará a TODOS los clientes registrados en el CRM de este negocio.
              </div>

              <button 
                type="submit"
                className="btn-primary"
                disabled={sending}
                style={{ marginTop: 8 }}
              >
                {sending ? '🚀 Enviando...' : '🚀 Enviar Campaña'}
              </button>
            </form>
          </div>

          {/* Campaign History */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Historial de Campañas</h2>
            
            {loading ? (
               <div style={{ color: 'var(--text-secondary)' }}>Cargando historial...</div>
            ) : campaigns.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                No has enviado ninguna campaña aún.
              </div>
            ) : (
              <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>Template</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>Audiencia</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>Estado</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp, idx) => (
                      <tr key={camp.id || idx} style={{ borderBottom: idx === campaigns.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 500 }}>{camp.templateName} <span style={{color:'var(--text-secondary)', fontSize:'0.8rem'}}>({camp.languageCode})</span></td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                          {camp.sentCount} / {camp.audienceSize}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {camp.status === 'success' && <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>Completado</span>}
                          {camp.status === 'partial' && <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>Parcial</span>}
                          {camp.status === 'failed' && <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>Fallido</span>}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {new Date(camp.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
