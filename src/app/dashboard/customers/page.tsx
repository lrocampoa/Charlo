"use client";

import React, { useEffect, useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { formatDistanceToNow, format, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLanguage } from '@/context/LanguageContext';

export default function CustomersPage() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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
            <div 
              key={idx} 
              className="glass-panel" 
              style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setSelectedCustomer(customer)}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {customer.customerId?.substring(0, 2).toUpperCase() || 'CU'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{customer.extractedFacts?.name || customer.customerId}</h3>
                  <div style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {t('customers.lastActive')}: {customer.lastInteractionAt ? formatDistanceToNow(new Date(customer.lastInteractionAt), { addSuffix: true }) : 'N/A'}
                  </div>
                  {(customer.lifetimeValue > 0 || customer.orders?.length > 0 || customer.reservations?.length > 0) && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      {customer.lifetimeValue > 0 && (
                        <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          LTV: ${customer.lifetimeValue}
                        </span>
                      )}
                      {customer.orders?.length > 0 && (
                        <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                          Órdenes: {customer.orders.length}
                        </span>
                      )}
                      {customer.reservations?.length > 0 && (
                        <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          Reservas: {customer.reservations.length}
                        </span>
                      )}
                    </div>
                  )}
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
                        <li key={key} style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

      {/* SMART PROFILE MODAL */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', padding: 0, position: 'relative' }}>
            
            {/* Header */}
            <div style={{ padding: 24, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {selectedCustomer.customerId?.substring(0, 2).toUpperCase() || 'CU'}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{selectedCustomer.extractedFacts?.name || selectedCustomer.customerId}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>ID/Phone: {selectedCustomer.customerId}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 32 }}>
              
              {/* AI INSIGHTS BLOCK */}
              {(() => {
                const res = selectedCustomer.reservations || [];
                if (res.length >= 2) {
                  // Sort oldest to newest for calculation
                  const sortedRes = [...res].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  let totalDays = 0;
                  for (let i = 1; i < sortedRes.length; i++) {
                    totalDays += differenceInDays(new Date(sortedRes[i].date), new Date(sortedRes[i-1].date));
                  }
                  const avgDays = Math.round(totalDays / (sortedRes.length - 1));
                  const lastRes = sortedRes[sortedRes.length - 1];
                  const nextVisitDate = addDays(new Date(lastRes.date), avgDays);
                  const isOverdue = new Date() > nextVisitDate;
                  const mostFrequentService = lastRes.serviceName || "su servicio habitual";

                  return (
                    <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 12, padding: 20, marginBottom: 32 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.2rem' }}>✨</span>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#a78bfa' }}>AI Smart Insight</h4>
                      </div>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: 16 }}>
                        Este cliente suele reservar <strong>{mostFrequentService}</strong> cada <strong>{avgDays} días</strong> en promedio. 
                        Su próxima visita predicha {isOverdue ? 'era para el' : 'es para el'} <strong>{format(nextVisitDate, "dd 'de' MMMM", { locale: es })}</strong>.
                      </p>
                      {isOverdue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ color: '#f87171', fontSize: '0.9rem', fontWeight: 600 }}>⚠️ Retrasado por {differenceInDays(new Date(), nextVisitDate)} días.</span>
                          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => alert("Funcionalidad en desarrollo: Trigger WhatsApp Template")}>
                            Enviar Seguimiento
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                
                {/* TIMELINE */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>Historial de Actividad</h4>
                  
                  {(() => {
                    const timeline = [
                      ...(selectedCustomer.reservations || []).map((r: any) => ({ type: 'reservation', date: new Date(r.createdAt || r.date), data: r })),
                      ...(selectedCustomer.orders || []).map((o: any) => ({ type: 'order', date: new Date(o.createdAt), data: o }))
                    ].sort((a, b) => b.date.getTime() - a.date.getTime());

                    if (timeline.length === 0) return <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay actividad registrada.</p>;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '2px solid var(--border-color)', paddingLeft: 16, marginLeft: 8 }}>
                        {timeline.map((item, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -25, top: 4, width: 14, height: 14, borderRadius: '50%', background: item.type === 'reservation' ? '#f59e0b' : '#3b82f6', border: '2px solid var(--bg-primary)' }}></div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                              {format(item.date, "dd MMM yyyy, HH:mm", { locale: es })}
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                              {item.type === 'reservation' ? (
                                <div>
                                  <strong style={{ color: '#fcd34d' }}>📅 Reserva Confirmada</strong>
                                  <p style={{ fontSize: '0.9rem', marginTop: 4 }}>{item.data.serviceName} - {format(new Date(item.data.date), "dd/MM/yyyy")}</p>
                                </div>
                              ) : (
                                <div>
                                  <strong style={{ color: '#93c5fd' }}>🛒 Orden de Compra</strong>
                                  <p style={{ fontSize: '0.9rem', marginTop: 4 }}>Total: ${item.data.total}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* FACTS */}
                <div>
                   <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>Datos Extraídos</h4>
                   <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                    {Object.keys(selectedCustomer.extractedFacts || {}).length === 0 ? (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{t('customers.noFacts')}</p>
                    ) : (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {Object.entries(selectedCustomer.extractedFacts).map(([key, value]: [string, any]) => {
                          if (key === 'name' || key === 'knowledgeGapFound' || key === 'missingSopTitle' || key === 'severity' || key === 'description') return null;
                          const displayValue = Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value);
                          return (
                            <li key={key} style={{ fontSize: '0.95rem' }}>
                              <div style={{ color: 'var(--accent-color)', fontWeight: 600, textTransform: 'capitalize', marginBottom: 2 }}>{key.replace(/_/g, ' ')}</div>
                              <div style={{ color: 'var(--text-primary)', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 6 }}>{displayValue}</div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
