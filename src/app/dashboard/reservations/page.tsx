"use client";

import React, { useEffect, useState } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ReservationsPage() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncSource, setSyncSource] = useState<'native' | 'google_cal' | 'sheets'>('native');

  useEffect(() => {
    async function fetchReservations() {
      if (!selectedCompanyId || !user) return;
      setLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/companies/${selectedCompanyId}/reservations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReservations(data.reservations || []);
        }
      } catch (err) {
        console.error("Error fetching reservations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, [selectedCompanyId]);

  const handleSyncChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // In a real implementation, we would save this to the company settings in Firebase
    setSyncSource(e.target.value as any);
  };

  if (!selectedCompanyId) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Selecciona una empresa primero.</div>;
  }

  return (
    <div className="fade-in" style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{t('sidebar.reservations')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Administra las reservas y citas de tu negocio.</p>
        </div>
        
        {/* Sync Settings */}
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Fuente de Sincronización</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>¿Dónde se guardan las reservas?</span>
          </div>
          <select 
            className="glass-input" 
            value={syncSource}
            onChange={handleSyncChange}
            style={{ minWidth: 200, cursor: 'pointer' }}
          >
            <option value="native">Nativo (Base de Datos Charlo)</option>
            <option value="google_cal">Google Calendar (API)</option>
            <option value="sheets">Google Sheets</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: 24 }}>Cargando reservas...</div>
      ) : reservations.length === 0 ? (
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 16 }}>No hay reservas próximas registradas.</p>
          <button className="btn-primary" onClick={() => alert("Función para crear reserva manualmente próximamente.")}>
            + Añadir Reserva Manual
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Fecha / Hora</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Cliente</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Servicio</th>
                <th style={{ padding: '16px 24px', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res, idx) => (
                <tr key={res.id} style={{ borderBottom: idx === reservations.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{res.date} a las {res.time}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 500 }}>{res.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{res.customerPhone}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 500 }}>{res.serviceName || 'Reserva Genérica'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {res.partySize} {res.partySize === 1 ? 'persona' : 'personas'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 12, 
                      fontSize: '0.8rem', 
                      backgroundColor: res.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: res.status === 'pending' ? '#f59e0b' : '#10b981'
                    }}>
                      {res.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
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
