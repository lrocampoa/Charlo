"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';
import { auth } from '@/lib/firebase/config';

export default function KnowledgeBaseSOPs() {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'sops' | 'faqs'>('knowledge');
  const { selectedCompany } = useCompany();
  const { t } = useLanguage();
  
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isBuildingBrain, setIsBuildingBrain] = useState(false);
  const [sopCards, setSopCards] = useState<{ id: string, title: string, content: string }[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState('');
  const [modalError, setModalError] = useState('');
  
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
  const [faqError, setFaqError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = async () => {
    if (!selectedCompany?.id) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompany.id}/knowledge`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.sources) setDataSources(data.sources);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    if (selectedCompany) {
      if (selectedCompany.advancedSOPs) {
        try {
          const parsed = JSON.parse(selectedCompany.advancedSOPs);
          if (Array.isArray(parsed)) {
            setSopCards(parsed);
          } else {
            setSopCards([{ id: Date.now().toString(), title: "Legacy SOP", content: selectedCompany.advancedSOPs }]);
          }
        } catch {
          setSopCards([{ id: Date.now().toString(), title: "Legacy SOP", content: selectedCompany.advancedSOPs }]);
        }
      } else {
        setSopCards([]);
      }
    }
  }, [selectedCompany?.id]);

  const rebuildCache = async (cardsToSave?: any[]) => {
    setIsBuildingBrain(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/companies/${selectedCompany?.id}/sops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ advancedSOPs: JSON.stringify(cardsToSave || sopCards) })
      });
      alert('AI Brain successfully rebuilt with new data!');
    } catch (e) {
      console.error("Cache rebuild failed", e);
    } finally {
      setIsBuildingBrain(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany?.id) return;
    
    setIsUploading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(`/api/companies/${selectedCompany.id}/knowledge/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      await fetchSources();
      await rebuildCache();
    } catch (err: any) {
      alert(`Upload Failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submitUrl = async () => {
    if (!modalUrl || !selectedCompany?.id) return;
    
    setModalError('');
    setIsScraping(true);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompany.id}/knowledge/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ url: modalUrl })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      await fetchSources();
      await rebuildCache();
      setModalUrl('');
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Are you sure you want to delete this data source?")) return;
    if (!selectedCompany?.id) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/companies/${selectedCompany.id}/knowledge?sourceId=${sourceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      await fetchSources();
      await rebuildCache();
    } catch (e) {
      console.error(e);
      alert("Failed to delete source");
    }
  };

  const generateFaqs = async () => {
    if (!selectedCompany?.id) return;
    setIsGeneratingFaqs(true);
    setFaqError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompany.id}/analytics/faqs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.faqs) setFaqs(data.faqs);
    } catch (e: any) {
      setFaqError(e.message || "Error al generar FAQs");
    } finally {
      setIsGeneratingFaqs(false);
    }
  };

  const addFaqToSops = (faq: any) => {
    const newCard = {
      id: Date.now().toString(),
      title: `FAQ: ${faq.question}`,
      content: faq.answer
    };
    setSopCards([...sopCards, newCard]);
    setActiveTab('sops');
    alert("FAQ añadido a tus SOPs. ¡Recuerda darle clic a 'Guardar y Compilar' para que la IA lo aprenda!");
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>{t('knowledge.title')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            {t('knowledge.subtitle')} <strong>{selectedCompany?.name || '...'}</strong> {t('knowledge.subtitle2')}
          </p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-full)', padding: 4 }}>
          <button 
            onClick={() => setActiveTab('knowledge')}
            style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-full)', background: activeTab === 'knowledge' ? 'var(--bg-primary)' : 'transparent', fontWeight: activeTab === 'knowledge' ? 600 : 400, boxShadow: activeTab === 'knowledge' ? 'var(--glass-shadow)' : 'none', transition: 'all var(--transition-fast)' }}
          >
            {t('knowledge.dataSources')}
          </button>
          <button 
            onClick={() => setActiveTab('sops')}
            style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-full)', background: activeTab === 'sops' ? 'var(--bg-primary)' : 'transparent', fontWeight: activeTab === 'sops' ? 600 : 400, boxShadow: activeTab === 'sops' ? 'var(--glass-shadow)' : 'none', transition: 'all var(--transition-fast)' }}
          >
            {t('knowledge.actionLibrary')}
          </button>
          <button 
            onClick={() => setActiveTab('faqs')}
            style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-full)', background: activeTab === 'faqs' ? 'var(--bg-primary)' : 'transparent', fontWeight: activeTab === 'faqs' ? 600 : 400, boxShadow: activeTab === 'faqs' ? 'var(--glass-shadow)' : 'none', transition: 'all var(--transition-fast)' }}
          >
            Preguntas Frecuentes
          </button>
        </div>
      </div>

      {activeTab === 'knowledge' && (
        <div className="glass-panel" style={{ padding: 24, flex: 1, position: 'relative' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>{t('knowledge.dataSources')}</h3>
          
          {loading ? (
            <p>Loading...</p>
          ) : dataSources.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t('knowledge.noDataSources')}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dataSources.map((source) => (
                <li key={source.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                    {source.type === 'pdf' ? '📄' : source.type === 'website' ? '🌐' : source.type === 'google_doc' ? '📝' : source.type === 'google_sheet' ? '📊' : '🖼️'} 
                    {source.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{t('knowledge.active')}</span>
                    <button 
                      onClick={() => handleDeleteSource(source.id)} 
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <input 
              type="file" 
              accept=".pdf,image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            <button 
              className="btn-secondary" 
              style={{ flex: 1 }} 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isScraping}
            >
              {isUploading ? 'Uploading...' : t('knowledge.uploadPdf')}
            </button>
            <button 
              className="btn-secondary" 
              style={{ flex: 1 }} 
              onClick={() => setIsModalOpen(true)}
              disabled={isUploading || isScraping || isBuildingBrain}
            >
              {isScraping ? 'Scraping...' : t('knowledge.scrapeWeb')}
            </button>
          </div>

          <div style={{ marginTop: 40, borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🧠</span> Base de Conocimiento Avanzada (SOPs)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
                  Divide tus manuales y políticas en tarjetas para que la IA los procese mejor.
                </p>
              </div>
              <button 
                className="btn-secondary" 
                onClick={() => setSopCards([...sopCards, { id: Date.now().toString(), title: '', content: '' }])}
              >
                + Añadir SOP
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {sopCards.length === 0 ? (
                <div className="glass-panel" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Aún no has añadido Procedimientos Operativos (SOPs). Añade el primero.
                </div>
              ) : (
                sopCards.map((card, index) => (
                  <div key={card.id} className="glass-panel" style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setSopCards(sopCards.filter(c => c.id !== card.id))}
                      style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                      title="Eliminar SOP"
                    >
                      ×
                    </button>
                    <input 
                      className="glass-input" 
                      placeholder="Título (ej. Política de Reembolso)" 
                      value={card.title}
                      onChange={(e) => {
                        const newCards = [...sopCards];
                        newCards[index].title = e.target.value;
                        setSopCards(newCards);
                      }}
                      style={{ width: 'calc(100% - 30px)', marginBottom: 12, fontWeight: 600 }}
                    />
                    <textarea 
                      className="glass-input" 
                      placeholder="Escribe el contenido del procedimiento o política aquí..." 
                      value={card.content}
                      onChange={(e) => {
                        const newCards = [...sopCards];
                        newCards[index].content = e.target.value;
                        setSopCards(newCards);
                      }}
                      rows={4}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>
                ))
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {selectedCompany?.geminiCacheId ? (
                  <span style={{ color: 'var(--success)' }}>✅ Cerebro AI Activo</span>
                ) : (
                  <span>ℹ️ Caché inactiva. Guarda para compilar.</span>
                )}
              </div>
              <button 
                className="btn-primary" 
                onClick={() => rebuildCache(sopCards)}
                disabled={isBuildingBrain || isUploading || isScraping}
              >
                {isBuildingBrain ? 'Compilando Cerebro...' : 'Guardar y Compilar'}
              </button>
            </div>
          </div>

          {/* ADD LINK MODAL */}
          {isModalOpen && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              borderRadius: 'inherit'
            }}>
              <div className="glass-panel" style={{ padding: 32, width: '90%', maxWidth: 450, boxShadow: 'var(--glass-shadow-lg)' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 12 }}>{t('knowledge.addLinkTitle')}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20 }}>{t('knowledge.addLinkSubtitle')}</p>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="https://..."
                  value={modalUrl}
                  onChange={(e) => { setModalUrl(e.target.value); setModalError(''); }}
                  style={{ width: '100%', marginBottom: modalError ? 8 : 16 }}
                  autoFocus
                  disabled={isScraping}
                />
                
                {modalError && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem', marginBottom: 16, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    ⚠️ {modalError}
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => { setIsModalOpen(false); setModalError(''); setModalUrl(''); }} disabled={isScraping}>
                    {t('knowledge.cancel')}
                  </button>
                  <button className="btn-primary" onClick={submitUrl} disabled={!modalUrl || isScraping}>
                    {isScraping ? '...' : t('knowledge.scan')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sops' && (
        <div className="glass-panel" style={{ padding: 24, flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            📥 {t('knowledge.actionQueue')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
            {t('knowledge.actionQueueDesc')}
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: 16, backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--border-radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>⚠️ {t('knowledge.missingSop')}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>2 {t('knowledge.ago')}</span>
              </div>
              <p style={{ fontSize: '0.95rem', marginBottom: 12 }}>User asked: "Can I bring my emotional support iguana?"</p>
              <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>{t('knowledge.writeProcedure')}</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'faqs' && (
        <div className="glass-panel" style={{ padding: 24, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✨</span> Descubrir FAQs con IA
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 600 }}>
                Analizamos los últimos chats de tus clientes para encontrar las preguntas que más hacen. Si la IA responde mal a alguna, puedes añadirla rápidamente a tus SOPs.
              </p>
            </div>
            <button 
              className="btn-primary" 
              onClick={generateFaqs}
              disabled={isGeneratingFaqs}
            >
              {isGeneratingFaqs ? 'Analizando Chats...' : 'Generar Reporte de FAQs'}
            </button>
          </div>

          {faqError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', marginBottom: 24 }}>
              {faqError}
            </div>
          )}

          {isGeneratingFaqs && (
             <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
               <div className="spinner-small" style={{ margin: '0 auto 16px' }}></div>
               <p>Leyendo conversaciones y encontrando patrones...</p>
             </div>
          )}

          {!isGeneratingFaqs && faqs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {faqs.map((faq, idx) => (
                <div key={idx} style={{ padding: 20, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {faq.frequencyCount} veces
                      </span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{faq.question}</h4>
                    </div>
                    <button 
                      className="btn-secondary" 
                      onClick={() => addFaqToSops(faq)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      + Añadir a SOPs
                    </button>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: '8px', borderLeft: '3px solid var(--accent-color)' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>Respuesta Ideal (basada en el AI)</p>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isGeneratingFaqs && faqs.length === 0 && !faqError && (
            <div className="glass-panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Haz clic en "Generar Reporte" para analizar tus chats recientes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
