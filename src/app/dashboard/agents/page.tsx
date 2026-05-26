"use client";

import React, { useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AgentConfig() {
  const [agents, setAgents] = useState([
    { id: 1, name: 'Router Agent', status: 'active', desc: 'Identifies intent and routes to correct agent.' },
    { id: 2, name: 'Sales Agent', status: 'active', desc: 'Recommends products and captures leads.' },
    { id: 3, name: 'Booking Agent', status: 'inactive', desc: 'Integrates with Calendly and Google Sheets.' },
  ]);
  const { selectedCompany } = useCompany();
  const { t } = useLanguage();

  const toggleAgent = (id: number) => {
    setAgents(agents.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a));
  };

  return (
    <div>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{t('agents.title')}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>{t('agents.subtitle')}</p>

      <div className="glass-panel" style={{ padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>{t('agents.brandPersona')}</h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <button className="btn-primary">{t('agents.casual')}</button>
          <button className="btn-secondary">{t('agents.professional')}</button>
          <button className="btn-secondary">{t('agents.salesDriven')}</button>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {t('agents.currentTone')}: <strong>{selectedCompany?.persona || t('agents.noPersona')}</strong>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {agents.map((agent) => (
          <div key={agent.id} className="glass-panel" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>{agent.name}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{agent.desc}</p>
            </div>
            <button 
              onClick={() => toggleAgent(agent.id)}
              className={agent.status === 'active' ? 'btn-primary' : 'btn-secondary'}
              style={{ backgroundColor: agent.status === 'active' ? 'var(--success)' : '' }}
            >
              {agent.status === 'active' ? t('agents.active') : t('agents.enable')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
