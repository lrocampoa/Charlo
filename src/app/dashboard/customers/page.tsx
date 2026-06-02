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

  // Helper to format facts gracefully
  const renderFactGroup = (title: string, items: any, icon: string) => {
    if (!items) return null;
    const itemsArray = Array.isArray(items) ? items : [items];
    if (itemsArray.length === 0) return null;
    
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{icon}</span> {title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {itemsArray.map((item, idx) => (
            <span key={idx} style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
              {String(item)}
            </span>
          ))}
        </div>
      </div>
    );
  };

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {customers.map((customer, idx) => {
            const facts = customer.extractedFacts || {};
            const customerName = facts.name || customer.customerId;
            const hasPhone = customerName !== customer.customerId;
            
            // Get latest order and reservation
            const latestOrder = customer.orders?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            const latestRes = customer.reservations?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}
                onClick={() => setSelectedCustomer(customer)}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0 }}>
                    {customerName?.substring(0, 2).toUpperCase() || 'CU'}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customerName}</h3>
                    {hasPhone && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        📞 {customer.customerId}
                      </div>
                    )}
                    <div style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Última interacción: {customer.lastInteractionAt ? formatDistanceToNow(new Date(customer.lastInteractionAt), { addSuffix: true, locale: es }) : 'Reciente'}
                    </div>
                  </div>
                </div>
                
                {/* Highlights (Orders & Res) */}
                {(latestOrder || latestRes || customer.lifetimeValue > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                    {customer.lifetimeValue > 0 && (
                      <div style={{ fontSize: '0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <strong>LTV:</strong> ${customer.lifetimeValue.toFixed(2)}
                      </div>
                    )}
                    {latestOrder && (
                      <div style={{ fontSize: '0.8rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <strong>Última Compra:</strong> ${latestOrder.total} ({format(new Date(latestOrder.createdAt), 'd MMM')})
                      </div>
                    )}
                    {latestRes && (
                      <div style={{ fontSize: '0.8rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <strong>Última Reserva:</strong> {latestRes.serviceName || 'Servicio'} ({format(new Date(latestRes.date), 'd MMM')})
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Facts Snippet */}
                <div style={{ flex: 1 }}>
                  {Object.keys(facts).length === 0 ? (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                      Aún no hay datos extraídos para este cliente.
                    </div>
                  ) : (
                    <>
                      {renderFactGroup("Ubicación", facts.location || facts.address, "📍")}
                      {renderFactGroup("Restricciones/Dieta", facts.dietary_restrictions || facts.diet, "🥗")}
                      {renderFactGroup("Familia", facts.family, "👨‍👩‍👧")}
                      {renderFactGroup("Mascotas", facts.pets, "🐾")}
                      {renderFactGroup("Preferencias", facts.preferences, "⭐")}
                      {renderFactGroup("Lista de Deseos", facts.wishlist, "🎁")}
                      
                      {/* Render any other random facts */}
                      {Object.entries(facts).map(([key, value]) => {
                        const knownKeys = ['name', 'location', 'address', 'dietary_restrictions', 'diet', 'family', 'pets', 'preferences', 'wishlist'];
                        if (knownKeys.includes(key.toLowerCase())) return null;
                        return renderFactGroup(key.replace(/_/g, ' '), value, "📌");
                      })}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SMART PROFILE MODAL */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', padding: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header */}
            <div style={{ padding: 32, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold' }}>
                  {(selectedCustomer.extractedFacts?.name || selectedCustomer.customerId)?.substring(0, 2).toUpperCase() || 'CU'}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 600 }}>{selectedCustomer.extractedFacts?.name || selectedCustomer.customerId}</h2>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      📞 {selectedCustomer.customerId}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      🕒 {selectedCustomer.lastInteractionAt ? formatDistanceToNow(new Date(selectedCustomer.lastInteractionAt), { addSuffix: true, locale: es }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 32, flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
              
              {/* Main Column: Insights & Timeline */}
              <div>
                {/* AI INSIGHTS BLOCK */}
                {(() => {
                  const res = selectedCustomer.reservations || [];
                  if (res.length >= 2) {
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
                      <div style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: '1.4rem' }}>✨</span>
                          <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#a78bfa' }}>AI Smart Insight</h4>
                        </div>
                        <p style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: 16 }}>
                          Este cliente suele reservar <strong>{mostFrequentService}</strong> cada <strong>{avgDays} días</strong> en promedio. 
                          Su próxima visita predicha {isOverdue ? 'era para el' : 'es para el'} <strong>{format(nextVisitDate, "dd 'de' MMMM", { locale: es })}</strong>.
                        </p>
                        {isOverdue && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 8 }}>
                            <span style={{ color: '#f87171', fontSize: '0.95rem', fontWeight: 600 }}>⚠️ Retrasado por {differenceInDays(new Date(), nextVisitDate)} días.</span>
                            <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.9rem', marginLeft: 'auto' }} onClick={() => alert("Funcionalidad en desarrollo: Trigger WhatsApp Template")}>
                              Enviar Seguimiento
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* TIMELINE */}
                <div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>Historial de Actividad</h4>
                  
                  {(() => {
                    const timeline = [
                      ...(selectedCustomer.reservations || []).map((r: any) => ({ type: 'reservation', date: new Date(r.createdAt || r.date), data: r })),
                      ...(selectedCustomer.orders || []).map((o: any) => ({ type: 'order', date: new Date(o.createdAt), data: o }))
                    ].sort((a, b) => b.date.getTime() - a.date.getTime());

                    if (timeline.length === 0) return <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', padding: 20, textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>No hay actividad registrada (reservas o compras).</p>;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, borderLeft: '2px solid var(--border-color)', paddingLeft: 24, marginLeft: 12 }}>
                        {timeline.map((item, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -35, top: 4, width: 18, height: 18, borderRadius: '50%', background: item.type === 'reservation' ? '#f59e0b' : '#3b82f6', border: '3px solid var(--bg-primary)' }}></div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                              {format(item.date, "dd MMM yyyy, HH:mm", { locale: es })}
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                              {item.type === 'reservation' ? (
                                <div>
                                  <strong style={{ color: '#fcd34d', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>📅 Reserva Confirmada</strong>
                                  <p style={{ fontSize: '1rem', marginTop: 8, color: 'var(--text-primary)' }}>Servicio: {item.data.serviceName}</p>
                                  <p style={{ fontSize: '0.9rem', marginTop: 4, color: 'var(--text-secondary)' }}>Para el {format(new Date(item.data.date), "dd/MM/yyyy")}</p>
                                </div>
                              ) : (
                                <div>
                                  <strong style={{ color: '#93c5fd', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>🛒 Orden de Compra</strong>
                                  <p style={{ fontSize: '1rem', marginTop: 8, color: 'var(--text-primary)' }}>Total: ${item.data.total}</p>
                                  <p style={{ fontSize: '0.9rem', marginTop: 4, color: 'var(--text-secondary)' }}>{item.data.items?.length || 0} artículo(s)</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Sidebar Column: Extracted Facts */}
              <div>
                 <div style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 16, border: '1px solid var(--border-color)', position: 'sticky', top: 32 }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.4rem' }}>🧠</span> Memoria del CRM
                  </h4>
                  
                  {Object.keys(selectedCustomer.extractedFacts || {}).length === 0 ? (
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aún no hay datos extraídos. El AI enriquecerá este perfil a medida que converse con el cliente.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {renderFactGroup("Ubicación", selectedCustomer.extractedFacts.location || selectedCustomer.extractedFacts.address, "📍")}
                      {renderFactGroup("Restricciones/Dieta", selectedCustomer.extractedFacts.dietary_restrictions || selectedCustomer.extractedFacts.diet, "🥗")}
                      {renderFactGroup("Familia", selectedCustomer.extractedFacts.family, "👨‍👩‍👧")}
                      {renderFactGroup("Mascotas", selectedCustomer.extractedFacts.pets, "🐾")}
                      {renderFactGroup("Preferencias", selectedCustomer.extractedFacts.preferences, "⭐")}
                      {renderFactGroup("Lista de Deseos", selectedCustomer.extractedFacts.wishlist, "🎁")}
                      
                      {/* Render any other random facts */}
                      {Object.entries(selectedCustomer.extractedFacts).map(([key, value]: [string, any]) => {
                        const knownKeys = ['name', 'location', 'address', 'dietary_restrictions', 'diet', 'family', 'pets', 'preferences', 'wishlist'];
                        if (knownKeys.includes(key.toLowerCase())) return null;
                        return renderFactGroup(key.replace(/_/g, ' '), value, "📌");
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

