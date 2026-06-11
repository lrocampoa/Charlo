"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

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
  components?: any[];
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { t } = useLanguage();
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
  const [newTemplateOptOut, setNewTemplateOptOut] = useState('Darse de baja');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  const [templateName, setTemplateName] = useState('');
  const [languageCode, setLanguageCode] = useState('es_MX');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [proactiveTriggers, setProactiveTriggers] = useState<any[]>([]);
  const [loadingTriggers, setLoadingTriggers] = useState(false);

  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean, type: 'success' | 'error', message: string }>({ open: false, type: 'success', message: '' });
  const showFeedback = (type: 'success' | 'error', message: string) => { setFeedbackModal({ open: true, type, message }); };

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

  const selectedTemplateData = useMemo(() => {
    return metaTemplates.find(t => t.name === templateName);
  }, [metaTemplates, templateName]);

  const requiredVars = useMemo(() => {
    if (!selectedTemplateData || !selectedTemplateData.components) return [];
    const bodyComp = selectedTemplateData.components.find((c: any) => c.type === 'BODY');
    if (!bodyComp || !bodyComp.text) return [];
    const matches = bodyComp.text.match(/\{\{\d+\}\}/g);
    if (!matches) return [];
    const numVars = new Set<string>(matches.map((m: string) => m.match(/\d+/)?.[0] as string));
    return Array.from(numVars).sort((a, b) => parseInt(a) - parseInt(b));
  }, [selectedTemplateData]);

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
    if (!confirm(t('campaigns.confirmPresets').replace('{0}', category))) return;
    
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
      showFeedback('error', t('campaigns.alertEnterTemplate'));
      return;
    }

    if (targetType === 'specific' && selectedPhones.length === 0) {
      showFeedback('error', t('campaigns.alertSelectCustomer'));
      return;
    }

    const msg = targetType === 'all' 
      ? t('campaigns.confirmSendAll').replace('{0}', templateName)
      : t('campaigns.confirmSendSpecific').replace('{0}', templateName).replace('{1}', selectedPhones.length.toString());

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
          targetPhones: targetType === 'specific' ? selectedPhones : undefined,
          templateVariables
        })
      });

      const data = await res.json();
      if (res.ok) {
        showFeedback('success', t('campaigns.alertSent').replace('{0}', data.campaign.sentCount.toString()).replace('{1}', data.campaign.failedCount.toString()));
        setCampaigns([data.campaign, ...campaigns]);
        setTemplateName('');
      } else {
        showFeedback('error', data.error || t('campaigns.alertSendError'));
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', t('campaigns.alertNetworkError'));
    } finally {
      setSending(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCompanyId) return;
    
    if (!newTemplateName.trim() || !newTemplateBody.trim()) {
      showFeedback('error', t('campaigns.alertFillTemplate'));
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
        showFeedback('success', t('campaigns.alertTemplateReview'));
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
        showFeedback('error', data.error || t('campaigns.alertCreateError'));
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', t('campaigns.alertNetworkError'));
    } finally {
      setSubmittingTemplate(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!user || !selectedCompanyId) return;
    if (!aiPrompt.trim()) {
      showFeedback('error', t('campaigns.alertAiPrompt'));
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
        showFeedback('error', data.error || t('campaigns.alertAiError'));
      }
    } catch (err) {
      console.error(err);
      showFeedback('error', t('campaigns.alertNetworkError'));
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
    return <div style={{ color: 'var(--text-secondary)', padding: 24 }}>{t('campaigns.selectCompany')}</div>;
  }

  const isWhatsAppConfigured = selectedCompany?.metaAccessToken && selectedCompany?.whatsappPhoneNumberId;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>📢</span> {t('campaigns.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('campaigns.subtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button 
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
          style={{ padding: '8px 16px', background: activeTab === 'manual' ? 'var(--accent-color)' : 'transparent', border: 'none', borderRadius: '20px', color: activeTab === 'manual' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: activeTab === 'manual' ? 600 : 400 }}
        >
          {t('campaigns.manualTab')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'proactive' ? 'active' : ''}`}
          onClick={() => setActiveTab('proactive')}
          style={{ padding: '8px 16px', background: activeTab === 'proactive' ? 'var(--accent-color)' : 'transparent', border: 'none', borderRadius: '20px', color: activeTab === 'proactive' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: activeTab === 'proactive' ? 600 : 400 }}
        >
          {t('campaigns.proactiveTab')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
          style={{ padding: '8px 16px', background: activeTab === 'templates' ? 'var(--accent-color)' : 'transparent', border: 'none', borderRadius: '20px', color: activeTab === 'templates' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: activeTab === 'templates' ? 600 : 400 }}
        >
          {t('campaigns.templatesTab')}
        </button>
      </div>

      {!isWhatsAppConfigured ? (
        <div className="glass-panel" style={{ padding: 32, textAlign: 'center', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚙️</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>{t('campaigns.notConfiguredTitle')}</h2>
          <p>{t('campaigns.notConfiguredDesc')}</p>
        </div>
      ) : activeTab === 'manual' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, alignItems: 'start' }}>
          
          {/* Create Campaign Form */}
          <div className="glass-panel" style={{ position: 'sticky', top: 24 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>{t('campaigns.newCampaign')}</h2>
            
            <form onSubmit={handleSendCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('campaigns.templateNameLabel')}</label>
                <select
                  value={templateName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTemplateName(val);
                    const tpl = metaTemplates.find(t => t.name === val);
                    if (tpl) setLanguageCode(tpl.language);
                    setTemplateVariables({}); // Reset vars on template change
                  }}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none'
                  }}
                  required
                >
                  <option value="" disabled>{t('campaigns.templateNamePlaceholder')}</option>
                  {metaTemplates.filter(t => t.status === 'APPROVED').map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.language})</option>
                  ))}
                </select>
              </div>

              {requiredVars.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--border-radius-sm)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Variables del Template</h4>
                  {requiredVars.map(varNum => (
                    <div key={varNum} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Variable {`{{${varNum}}}`}</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          value={templateVariables[varNum]?.startsWith('$crm.') ? templateVariables[varNum] : 'custom'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              setTemplateVariables(prev => ({ ...prev, [varNum]: '' }));
                            } else {
                              setTemplateVariables(prev => ({ ...prev, [varNum]: val }));
                            }
                          }}
                          style={{
                            padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', flex: 1
                          }}
                        >
                          <option value="custom">Texto Personalizado</option>
                          <option value="$crm.name">Nombre del Cliente</option>
                          <option value="$crm.customerId">Teléfono del Cliente</option>
                        </select>
                        
                        {(!templateVariables[varNum] || !templateVariables[varNum].startsWith('$crm.')) && (
                          <input
                            type="text"
                            placeholder="Valor de la variable"
                            value={templateVariables[varNum] || ''}
                            onChange={(e) => setTemplateVariables(prev => ({ ...prev, [varNum]: e.target.value }))}
                            style={{
                              padding: '8px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                              background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', flex: 2
                            }}
                            required
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('campaigns.templateLangLabel')}</label>
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
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('campaigns.audienceLabel')}</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      checked={targetType === 'all'} 
                      onChange={() => setTargetType('all')} 
                      style={{ accentColor: 'var(--accent-color)' }}
                    />
                    {t('campaigns.allCustomers')} ({customers.length})
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="targetType" 
                      checked={targetType === 'specific'} 
                      onChange={() => setTargetType('specific')} 
                      style={{ accentColor: 'var(--accent-color)' }}
                    />
                    {t('campaigns.specificCustomers')}
                  </label>
                </div>
              </div>

              {targetType === 'specific' && (
                <div className="custom-scrollbar" style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: 8, background: 'rgba(0,0,0,0.2)' }}>
                  {customers.length === 0 ? (
                    <div style={{ padding: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('campaigns.noCustomers')}</div>
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
                          <span style={{ fontSize: '0.9rem' }}>{c.name || t('orders.customer')}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.customerId}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}

              {targetType === 'all' && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {t('campaigns.allWarning')}
                </div>
              )}

              <button 
                type="submit"
                className="btn-primary"
                disabled={sending}
                style={{ marginTop: 8 }}
              >
                {sending ? t('campaigns.sending') : t('campaigns.sendBtn')}
              </button>
            </form>
          </div>

          {/* Campaign History */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>{t('campaigns.historyTitle')}</h2>
            
            {loading ? (
               <div style={{ color: 'var(--text-secondary)' }}>{t('campaigns.loadingHistory')}</div>
            ) : campaigns.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                {t('campaigns.noHistory')}
              </div>
            ) : (
              <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('campaigns.templateTh')}</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('campaigns.audienceTh')}</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('campaigns.statusTh')}</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('campaigns.dateTh')}</th>
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
                          {camp.status === 'success' && <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{t('campaigns.completed')}</span>}
                          {camp.status === 'partial' && <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{t('campaigns.partial')}</span>}
                          {camp.status === 'failed' && <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{t('campaigns.failed')}</span>}
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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16 }}>{t('campaigns.newTemplateTitle')}</h2>
            
            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('campaigns.templateNameLabelBuilder')}</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder={t('campaigns.templateNamePlaceholderBuilder')}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('campaigns.categoryLabel')}</label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    style={{
                      padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none'
                    }}
                  >
                    <option value="MARKETING">{t('campaigns.marketingOpt')}</option>
                    <option value="UTILITY">{t('campaigns.utilityOpt')}</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('campaigns.langLabel')}</label>
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
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('campaigns.messageLabel')}</label>
                </div>
                
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: 12, borderRadius: 8, display: 'flex', gap: 8, flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{t('campaigns.generateAiLabel')}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={t('campaigns.generatePlaceholder')}
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
                      {generatingAI ? t('campaigns.generatingBtn') : t('campaigns.generateBtn')}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {t('campaigns.varsNote')}
                </div>
                <textarea
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  placeholder={t('campaigns.msgPlaceholder')}
                  rows={4}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('campaigns.optOutLabel')}</label>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {t('campaigns.optOutNote')}
                </div>
                <input
                  type="text"
                  value={newTemplateOptOut}
                  onChange={(e) => setNewTemplateOptOut(e.target.value)}
                  placeholder={t('campaigns.optOutPlaceholder')}
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
                {submittingTemplate ? t('campaigns.submitReviewBtn') : t('campaigns.submitBtn')}
              </button>
            </form>
          </div>

          {/* Template List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('campaigns.metaTemplatesTitle')}</h2>
            </div>
            
            {loadingTemplates ? (
               <div style={{ color: 'var(--text-secondary)' }}>{t('campaigns.loadingTemplates')}</div>
            ) : metaTemplates.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                {t('campaigns.noTemplates')}
              </div>
            ) : (
              <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('campaigns.nameTh')}</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('campaigns.categoryTh')}</th>
                      <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('campaigns.statusTh')}</th>
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
                          {tpl.status === 'APPROVED' && <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{t('campaigns.statusApproved')}</span>}
                          {tpl.status === 'PENDING' && <span style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{t('campaigns.statusPending')}</span>}
                          {tpl.status === 'REJECTED' && <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{t('campaigns.statusRejected')}</span>}
                          {tpl.status === 'PAUSED' && <span style={{ color: '#9ca3af', background: 'rgba(156,163,175,0.1)', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{t('campaigns.statusPaused')}</span>}
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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('campaigns.proactiveTitle')}</h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <select onChange={(e) => e.target.value && loadPresets(e.target.value)} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} defaultValue="">
                <option value="" disabled>{t('campaigns.loadPresetsOpt')}</option>
                <option value="retail">{t('campaigns.presetRetail')}</option>
                <option value="services">{t('campaigns.presetServices')}</option>
                <option value="restaurants">{t('campaigns.presetRestaurants')}</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {proactiveTriggers.length === 0 ? (
               <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                 {t('campaigns.noProactive')}
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
                        {trigger.isActive ? t('campaigns.triggerActive') : t('campaigns.triggerInactive')}
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

      {feedbackModal.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: 'var(--border-radius-lg)', maxWidth: '400px', width: '90%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: feedbackModal.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: feedbackModal.type === 'success' ? '#10b981' : '#ef4444', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {feedbackModal.type === 'success' ? '✓' : '⚠️'}
              </div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600 }}>
                {feedbackModal.type === 'success' ? 'Éxito' : 'Error'}
              </h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {feedbackModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', fontWeight: 500 }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
