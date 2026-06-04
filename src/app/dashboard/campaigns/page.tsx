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

interface MetaTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'proactive' | 'templates'>('manual');
  
  const [metaTemplates, setMetaTemplates] = useState<MetaTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [submittingTemplate, setSubmittingTemplate] = useState(false);

  // Template Builder Form State
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('MARKETING');
  const [newTemplateLang, setNewTemplateLang] = useState('es_MX');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [newTemplateOptOut, setNewTemplateOptOut] = useState('ALTO 🛑');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  const [templateName, setTemplateName] = useState('');
  const [languageCode, setLanguageCode] = useState('es_MX');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [proactiveTriggers, setProactiveTriggers] = useState<any[]>([]);
  const [loadingTriggers, setLoadingTriggers] = useState(false);

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
    
    async function fetchTriggers() {
      if (!user || !selectedCompanyId) return;
      setLoadingTriggers(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/companies/${selectedCompanyId}/triggers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProactiveTriggers(data.triggers || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTriggers(false);
      }
    }

    async function fetchCustomers() {
      if (!user || !selectedCompanyId) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/companies/${selectedCompanyId}/customers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    async function fetchTemplates() {
      if (!user || !selectedCompanyId) return;
      setLoadingTemplates(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/companies/${selectedCompanyId}/templates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMetaTemplates(data.templates || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    
    fetchCampaigns();
    fetchTriggers();
    fetchCustomers();
    fetchTemplates();
  }, [selectedCompanyId, user]);

  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    if (!user || !selectedCompanyId) return;
    try {
      const token = await user.getIdToken();
      await fetch(`/api/companies/${selectedCompanyId}/triggers/${triggerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive })
      });
      setProactiveTriggers(prev => prev.map(t => t.id === triggerId ? { ...t, isActive } : t));
    } catch (err) {
      console.error(err);
    }
  };

  const loadPresets = async (category: string) => {
    if (!user || !selectedCompanyId) return;
    if (!confirm(`¿Cargar presets para ${category}? Esto añadirá nuevos triggers.`)) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}/triggers/presets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ category })
      });
      if (res.ok) {
        const data = await res.json();
        setProactiveTriggers([...proactiveTriggers, ...data.triggers]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCompanyId) return;
    
    if (!templateName.trim()) {
      alert("Por favor ingresa el nombre del template aprobado por Meta.");
      return;
    }

    if (targetType === 'specific' && selectedPhones.length === 0) {
      alert("Por favor selecciona al menos un cliente.");
      return;
    }

    const msg = targetType === 'all' 
      ? `¿Estás seguro de enviar el template "${templateName}" a TODOS los clientes de tu CRM?`
      : `¿Estás seguro de enviar el template "${templateName}" a ${selectedPhones.length} clientes seleccionados?`;

    if (!confirm(msg)) {
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
          languageCode,
          targetPhones: targetType === 'specific' ? selectedPhones : undefined
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

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCompanyId) return;
    
    if (!newTemplateName.trim() || !newTemplateBody.trim()) {
      alert("Por favor completa el nombre y el cuerpo del mensaje.");
      return;
    }

    setSubmittingTemplate(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          category: newTemplateCategory,
          language: newTemplateLang,
          bodyText: newTemplateBody.trim(),
          optOutButton: newTemplateOptOut.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Template enviado a revisión. Meta puede tardar un par de minutos en aprobarlo.");
        setNewTemplateName('');
        setNewTemplateBody('');
        setAiPrompt('');
        // Optimistic UI insert
        setMetaTemplates([{
          id: data.id,
          name: newTemplateName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          category: newTemplateCategory,
          language: newTemplateLang,
          status: 'PENDING'
        }, ...metaTemplates]);
      } else {
        alert(data.error || "Error al crear el template.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red.");
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!user || !selectedCompanyId) return;
    if (!aiPrompt.trim()) {
      alert("Por favor escribe de qué trata el mensaje (ej: 'Promo del día de las madres').");
      return;
    }

    setGeneratingAI(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}/templates/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          category: newTemplateCategory,
          language: newTemplateLang
        })
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setNewTemplateBody(data.text);
      } else {
        alert(data.error || "Error al generar con IA.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const togglePhoneSelection = (phone: string) => {
    if (selectedPhones.includes(phone)) {
      setSelectedPhones(selectedPhones.filter(p => p !== phone));
    } else {
      setSelectedPhones([...selectedPhones, phone]);
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
          Envía mensajes de marketing a todos tus clientes o configura campañas proactivas.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button 
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
          style={{ padding: '8px 16px', background: activeTab === 'manual' ? 'var(--primary)' : 'transparent', border: 'none', borderRadius: '20px', color: '#fff', cursor: 'pointer' }}
        >
          Campañas Manuales
        </button>
        <button 
          className={`tab-btn ${activeTab === 'proactive' ? 'active' : ''}`}
          onClick={() => setActiveTab('proactive')}
          style={{ padding: '8px 16px', background: activeTab === 'proactive' ? 'var(--primary)' : 'transparent', border: 'none', borderRadius: '20px', color: '#fff', cursor: 'pointer' }}
        >
          Campañas Proactivas (Triggers)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
          style={{ padding: '8px 16px', background: activeTab === 'templates' ? 'var(--primary)' : 'transparent', border: 'none', borderRadius: '20px', color: '#fff', cursor: 'pointer' }}
        >
          Gestor de Templates
        </button>
      </div>

      {!isWhatsAppConfigured ? (
        <div className="glass-panel" style={{ padding: 32, textAlign: 'center', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚙️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>WhatsApp No Configurado</h2>
          <p>Para enviar campañas, primero debes configurar tu Meta Token y Phone ID en la sección de Ajustes.</p>
        </div>
      ) : activeTab === 'manual' ? (
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Audiencia</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      checked={targetType === 'all'} 
                      onChange={() => setTargetType('all')} 
                      style={{ accentColor: 'var(--accent-color)' }}
                    />
                    Todos los clientes ({customers.length})
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      checked={targetType === 'specific'} 
                      onChange={() => setTargetType('specific')} 
                      style={{ accentColor: 'var(--accent-color)' }}
                    />
                    Clientes específicos
                  </label>
                </div>
              </div>

              {targetType === 'specific' && (
                <div className="custom-scrollbar" style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: 8, background: 'rgba(0,0,0,0.2)' }}>
                  {customers.length === 0 ? (
                    <div style={{ padding: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No hay clientes en el CRM.</div>
                  ) : (
                    customers.map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedPhones.includes(c.customerId)} 
                          onChange={() => togglePhoneSelection(c.customerId)}
                          style={{ accentColor: 'var(--accent-color)' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.9rem' }}>{c.name || 'Cliente'}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.customerId}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}

              {targetType === 'all' && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  ℹ️ Esta campaña se enviará a TODOS los {customers.length} clientes registrados en el CRM de este negocio.
                </div>
              )}

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
      ) : activeTab === 'templates' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, alignItems: 'start' }}>
          
          {/* Template Builder Form */}
          <div className="glass-panel" style={{ position: 'sticky', top: 24 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>Crear Nuevo Template</h2>
            
            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre del Template</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="ej. promo_verano_01 (solo minusculas)"
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Categoría</label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    style={{
                      padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none'
                    }}
                  >
                    <option value="MARKETING">Marketing (Promos)</option>
                    <option value="UTILITY">Utilidad (Alertas)</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Idioma</label>
                  <select
                    value={newTemplateLang}
                    onChange={(e) => setNewTemplateLang(e.target.value)}
                    style={{
                      padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none'
                    }}
                  >
                    <option value="es_MX">Español (es_MX)</option>
                    <option value="en_US">Inglés (en_US)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mensaje</label>
                </div>
                
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: 12, borderRadius: 8, display: 'flex', gap: 8, flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>✨ Generar con IA</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="ej. Escribe un mensaje invitando al gran evento de aniversario..."
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={generatingAI}
                      style={{
                        padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500
                      }}
                    >
                      {generatingAI ? 'Generando...' : 'Generar'}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Usa <code style={{background:'rgba(255,255,255,0.1)', padding:'2px 4px', borderRadius:4}}>{'{{1}}'}</code> para variables.
                </div>
                <textarea
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  placeholder="¡Hola! Te ofrecemos un descuento..."
                  rows={4}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Botón de Opt-Out (Opcional)</label>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Recomendado para Marketing.
                </div>
                <input
                  type="text"
                  value={newTemplateOptOut}
                  onChange={(e) => setNewTemplateOptOut(e.target.value)}
                  placeholder="ej. ALTO 🛑"
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none'
                  }}
                />
              </div>

              <button 
                type="submit"
                className="btn-primary"
                disabled={submittingTemplate}
                style={{ marginTop: 8 }}
              >
                {submittingTemplate ? 'Enviando a revisión...' : 'Enviar a Meta'}
              </button>
            </form>
          </div>

          {/* Template List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Tus Templates de Meta</h2>
            </div>
            
            {loadingTemplates ? (
               <div style={{ color: 'var(--text-secondary)' }}>Cargando templates...</div>
            ) : metaTemplates.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                No tienes ningún template registrado en Meta.
              </div>
            ) : (
              <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>Nombre</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>Categoría</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metaTemplates.map((tpl, idx) => (
                      <tr key={tpl.id || idx} style={{ borderBottom: idx === metaTemplates.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 500 }}>{tpl.name} <span style={{color:'var(--text-secondary)', fontSize:'0.8rem'}}>({tpl.language})</span></td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {tpl.category}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {tpl.status === 'APPROVED' && <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>🟢 Aprobado</span>}
                          {tpl.status === 'PENDING' && <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>🟡 Pendiente</span>}
                          {tpl.status === 'REJECTED' && <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>🔴 Rechazado</span>}
                          {tpl.status === 'PAUSED' && <span style={{ color: '#9ca3af', background: 'rgba(156,163,175,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>⚪️ Pausado</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'proactive' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Campañas Proactivas (Automáticas)</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <select onChange={(e) => e.target.value && loadPresets(e.target.value)} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} defaultValue="">
                <option value="" disabled>Cargar Presets por Categoría...</option>
                <option value="retail">🛒 Retail & E-commerce</option>
                <option value="services">✂️ Salones & Clínicas</option>
                <option value="restaurants">🍔 Restaurantes</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {proactiveTriggers.length === 0 ? (
               <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                 No tienes campañas proactivas configuradas. Selecciona una categoría arriba para cargar templates.
               </div>
            ) : (
              proactiveTriggers.map(trigger => (
                <div key={trigger.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>{trigger.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>{trigger.description}</p>
                    <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
                      <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4 }}>Trigger: {trigger.condition}</span>
                      <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 4 }}>Template: {trigger.templateName}</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.9rem', color: trigger.isActive ? '#10b981' : 'var(--text-secondary)' }}>
                        {trigger.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                      <input 
                        type="checkbox" 
                        checked={trigger.isActive} 
                        onChange={(e) => toggleTrigger(trigger.id, e.target.checked)}
                        style={{ width: 40, height: 20, accentColor: '#10b981' }}
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
