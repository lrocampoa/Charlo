"use client";

import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardOverview() {
  const { selectedCompanyId, selectedCompany, isSeeding } = useCompany();
  const { t } = useLanguage();

  const [metrics, setMetrics] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [showTestModal, setShowTestModal] = React.useState(false);

  React.useEffect(() => {
    if (!isSeeding && !localStorage.getItem('charlo_seen_test_modal')) {
      setShowTestModal(true);
    }
  }, [isSeeding]);

  const closeTestModal = () => {
    localStorage.setItem('charlo_seen_test_modal', 'true');
    setShowTestModal(false);
  };

  React.useEffect(() => {
    async function fetchAnalytics() {
      if (!selectedCompanyId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/companies/${selectedCompanyId}/analytics`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [selectedCompanyId]);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{t('overview.title')}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{t('overview.subtitle')} <strong>{selectedCompany?.name || '...'}</strong></p>
      </div>
      
      {isSeeding ? (
        <div style={{ padding: 40, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
          <div className="spinner-small" style={{ margin: '0 auto 16px', borderTopColor: 'var(--accent-color)' }}></div>
          <p>{t('overview.loadingTestBusinesses')}</p>
        </div>
      ) : !selectedCompanyId ? (
        <div style={{ padding: 40, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
          {t('overview.noBusiness')}
        </div>
      ) : loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('overview.loadingMetrics')}</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
            {/* Stat Cards */}
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('overview.totalConversations')}</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.totalConversations || 0}</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{t('overview.totalMessages')}: {metrics?.totalMessages || 0}</span>
            </div>
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('overview.estimatedTimeSaved')}</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.hoursSaved || 0}h</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{t('overview.basedOn5Min')}</span>
            </div>
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('overview.aiResolutionRate')}</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.aiResolutionRate || 0}%</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{metrics?.aiHandled || 0} {t('overview.aiHandledChats')}</span>
            </div>
            <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('overview.escalations')}</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>{metrics?.humanHandled || 0}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('overview.requireAttention')}</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 24, marginBottom: 40 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 20 }}>{t('overview.currentPlanUsage')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>{t('overview.whatsappApiMessages')}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>3,450 / 5,000</span>
                </div>
                <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '69%', height: '100%', backgroundColor: 'var(--accent-color)' }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>{t('overview.aiInteractionsGemini')}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>8,200 / 10,000</span>
                </div>
                <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: '82%', height: '100%', backgroundColor: 'var(--warning)' }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('overview.billingCycleResets')}</span>
              <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.9rem' }}>{t('overview.upgradePlan')}</button>
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
                <span style={{ fontWeight: 500 }}>{t('overview.whatsappApiConnected')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                <span style={{ fontWeight: 500 }}>{t('overview.charloCoreOperational')}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {t('overview.allSystemsOperational')}
              </p>
            </div>
          </div>
        </>
      )}

      {showTestModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 24 }}>
          <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: 500, padding: 32, textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 16, fontWeight: 600 }}>{t('overview.welcomeTitle')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '1.05rem', lineHeight: 1.5 }}>
              {t('overview.welcomeText')}<strong>{t('overview.welcomeTextBold')}</strong>.
            </p>
            <button className="btn-primary" onClick={closeTestModal} style={{ padding: '10px 24px', fontSize: '1rem' }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
