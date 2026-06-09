"use client";

import React, { useEffect, useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function PaymentsPage() {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      if (!selectedCompanyId || !user) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/companies/${selectedCompanyId}/payments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, [selectedCompanyId]);

  if (loading) return <div style={{ color: '#fff', padding: 24 }}>{t('payments.loading')}</div>;

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#fff' }}>{t('payments.title')}</h1>
        <div style={{ padding: '8px 16px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-color)', borderRadius: 'var(--border-radius-full)', fontSize: '0.9rem', fontWeight: 500 }}>
          {t('payments.aiAnalyzed')}
        </div>
      </div>
      
      {payments.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>{t('payments.noPayments')}</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('payments.reference')}</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('payments.phone')}</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('payments.sender')}</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('payments.amount')}</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('payments.date')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, idx) => (
                <tr key={payment.id} style={{ borderBottom: idx === payments.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{payment.reference || 'N/A'}</td>
                  <td style={{ padding: '16px 24px' }}>{payment.customerId}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{payment.senderName || 'N/A'}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: '#10b981' }}>₡{payment.amount?.toLocaleString('es-CR')}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {payment.receiptDate ? new Date(payment.receiptDate).toLocaleString() : new Date(payment.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
