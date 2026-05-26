"use client";

import React, { useEffect, useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/context/LanguageContext';

export default function CustomersPage() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedCompanyId) return;
    
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/companies/${selectedCompanyId}/customers`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch (error) {
        console.error("Failed to fetch CRM profiles", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, [selectedCompanyId]);

  if (!selectedCompanyId) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>{t('customers.noBusiness')}</div>;
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>{t('customers.title')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('customers.subtitle')} <strong>{selectedCompany?.name}</strong>.<br/>
          <span style={{ fontSize: '0.85rem' }}>{t('customers.subtitle2')}</span>
        </p>
      </div>

      {isLoading ? (
        <p>{t('customers.loading')}</p>
      ) : customers.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed var(--border-color)' }}>
          {t('customers.noProfiles')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {customers.map((customer, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {customer.customerId?.substring(0, 2).toUpperCase() || 'CU'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{customer.extractedFacts?.name || customer.customerId}</h3>
                  <div style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {t('customers.lastActive')}: {customer.lastInteractionAt ? formatDistanceToNow(new Date(customer.lastInteractionAt), { addSuffix: true }) : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{t('customers.extractedFacts')}</h4>
                {Object.keys(customer.extractedFacts || {}).length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{t('customers.noFacts')}</p>
                ) : (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(customer.extractedFacts).map(([key, value]: [string, any]) => {
                      if (key === 'name' || key === 'knowledgeGapFound' || key === 'missingSopTitle' || key === 'severity' || key === 'description') return null;
                      
                      const displayValue = Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value);
                      
                      return (
                        <li key={key} style={{ fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--accent-color)', fontWeight: 600, marginRight: 8, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</span>
                          <span style={{ color: 'var(--text-primary)' }}>{displayValue}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
