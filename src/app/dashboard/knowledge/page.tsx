"use client";

import React, { useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

export default function KnowledgeBaseSOPs() {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'sops'>('knowledge');
  const { selectedCompany } = useCompany();
  const { t } = useLanguage();

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
        </div>
      </div>

      {activeTab === 'knowledge' && (
        <div className="glass-panel" style={{ padding: 24, flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>{t('knowledge.dataSources')}</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>📄 Business_Configuration.json</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{t('knowledge.active')}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>📘 {t('knowledge.uploaded')}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedCompany?.knowledgeBase ? 'Active' : 'Empty'}</span>
            </li>
          </ul>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn-secondary" style={{ flex: 1 }}>{t('knowledge.uploadPdf')}</button>
            <button className="btn-secondary" style={{ flex: 1 }}>{t('knowledge.scrapeWeb')}</button>
          </div>
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
            
            <div style={{ padding: 16, backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--border-radius-sm)', opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>✅ {t('knowledge.completedSop')}</span>
              </div>
              <p style={{ fontSize: '0.95rem', textDecoration: 'line-through' }}>Refund policy for digital goods</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
