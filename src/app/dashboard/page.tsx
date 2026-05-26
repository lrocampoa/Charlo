"use client";

import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardOverview() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { t } = useLanguage();

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{t('overview.title')}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{t('overview.subtitle')} <strong>{selectedCompany?.name || '...'}</strong></p>
      </div>
      
      {!selectedCompanyId ? (
        <div style={{ padding: 40, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
          {t('overview.noBusiness')}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
            {/* Stat Cards */}
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('overview.totalConversations')}</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>1,284</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>↑ 12% this week</span>
            </div>
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('overview.avgResolutionTime')}</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>1m 45s</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>↓ 15s faster</span>
            </div>
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('overview.botDeflectionRate')}</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>86%</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>↑ 2% this week</span>
            </div>
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('overview.escalations')}</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>14%</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Stable</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <div className="glass-panel" style={{ flex: 2, padding: 24 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>{t('overview.recentActivity')}</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ padding: '12px 16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>✅ {t('overview.aiResolved')} (Maria S.)</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>2m ago</span>
                </li>
                <li style={{ padding: '12px 16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--warning)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>⚠️ {t('overview.knowledgeGap')}: "Vegan options?"</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>15m ago</span>
                </li>
                <li style={{ padding: '12px 16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🔔 {t('overview.handoff')} (Angry Customer)</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>1h ago</span>
                </li>
              </ul>
            </div>
            
            <div className="glass-panel" style={{ flex: 1, padding: 24 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>{t('overview.systemHealth')}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                <span style={{ fontWeight: 500 }}>WhatsApp API connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                <span style={{ fontWeight: 500 }}>Charlo Core operational</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {t('overview.allSystemsOperational')}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
