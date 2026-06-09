"use client";

import React, { useEffect, useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function OrdersPage() {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!selectedCompanyId || !user) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/companies/${selectedCompanyId}/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [selectedCompanyId]);

  if (loading) return <div style={{ color: '#fff', padding: 24 }}>{t('orders.loading')}</div>;

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#fff', marginBottom: 24 }}>{t('orders.title')}</h1>
      
      {orders.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>{t('orders.noOrders')}</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('orders.id')}</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('orders.customer')}</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('orders.items')}</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('orders.total')}</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>{t('orders.status')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={order.id} style={{ borderBottom: idx === orders.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{order.id.slice(0, 8)}...</td>
                  <td style={{ padding: '16px 24px' }}>{order.customerId}</td>
                  <td style={{ padding: '16px 24px' }}>
                    {order.items.map((item: any) => `${item.name}`).join(', ')}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>${order.total}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 12, 
                      fontSize: '0.8rem', 
                      backgroundColor: order.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: order.status === 'pending' ? '#f59e0b' : '#10b981'
                    }}>
                      {order.status}
                    </span>
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
