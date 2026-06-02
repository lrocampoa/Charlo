"use client";

import React, { useState, useEffect } from 'react';
import { useCompany } from '@/context/CompanyContext';

export default function LoyaltyPage() {
  const { selectedCompanyId, selectedCompany, refreshCompany } = useCompany();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for forms
  const [pointsEnabled, setPointsEnabled] = useState(false);
  const [pointsRatio, setPointsRatio] = useState(100); // e.g. 100 points = $1
  
  const [cashbackEnabled, setCashbackEnabled] = useState(false);
  const [cashbackPercentage, setCashbackPercentage] = useState(5); // e.g. 5%
  
  const [uberEnabled, setUberEnabled] = useState(false);
  const [uberClientId, setUberClientId] = useState('');
  const [uberClientSecret, setUberClientSecret] = useState('');

  useEffect(() => {
    if (selectedCompany?.loyaltyConfig) {
      setPointsEnabled(selectedCompany.loyaltyConfig.pointsEnabled || false);
      setPointsRatio(selectedCompany.loyaltyConfig.pointsRatio || 100);
      setCashbackEnabled(selectedCompany.loyaltyConfig.cashbackEnabled || false);
      setCashbackPercentage(selectedCompany.loyaltyConfig.cashbackPercentage || 5);
    }
    if (selectedCompany?.deliveryConfig) {
      setUberEnabled(selectedCompany.deliveryConfig.uberEnabled || false);
      setUberClientId(selectedCompany.deliveryConfig.uberClientId || '');
      setUberClientSecret(selectedCompany.deliveryConfig.uberClientSecret || '');
    }
  }, [selectedCompany]);

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/companies/${selectedCompanyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyaltyConfig: {
            pointsEnabled,
            pointsRatio,
            cashbackEnabled,
            cashbackPercentage
          },
          deliveryConfig: {
            uberEnabled,
            uberClientId,
            uberClientSecret
          }
        })
      });
      if (res.ok) {
        alert("Configuración guardada exitosamente.");
        refreshCompany();
      } else {
        alert("Error al guardar la configuración.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedCompanyId) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Selecciona una empresa para ver sus planes de fidelización.</div>;
  }

  return (
    <div className="fade-in" style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Fidelización de Clientes</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Configura los planes de recompensas para tus clientes recurrentes. El asistente virtual promoverá estos planes automáticamente para incrementar tus ventas.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Plan de Puntos */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⭐</span> Plan de Puntos Acumulables
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Los clientes acumulan puntos con cada compra que luego pueden canjear por descuentos.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={pointsEnabled} 
                onChange={(e) => {
                  setPointsEnabled(e.target.checked);
                  if (e.target.checked) setCashbackEnabled(false); // Mutually exclusive
                }} 
                style={{ width: 20, height: 20, accentColor: 'var(--accent-color)' }}
              />
              <span style={{ marginLeft: 8, fontWeight: 500 }}>{pointsEnabled ? 'Activo' : 'Inactivo'}</span>
            </label>
          </div>
          
          {pointsEnabled && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Equivalencia de Puntos a Dinero</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input 
                  type="number" 
                  value={pointsRatio} 
                  onChange={(e) => setPointsRatio(Number(e.target.value))}
                  className="input-field" 
                  style={{ width: 100 }}
                />
                <span style={{ color: 'var(--text-primary)' }}>puntos = $1 (o 1 CRC según tu moneda)</span>
              </div>
            </div>
          )}
        </div>

        {/* Plan de Cashback */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💸</span> Cashback (Dinero de Vuelta)
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Devuelve un porcentaje de la compra como saldo a favor para la próxima visita.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={cashbackEnabled} 
                onChange={(e) => {
                  setCashbackEnabled(e.target.checked);
                  if (e.target.checked) setPointsEnabled(false); // Mutually exclusive
                }} 
                style={{ width: 20, height: 20, accentColor: 'var(--accent-color)' }}
              />
              <span style={{ marginLeft: 8, fontWeight: 500 }}>{cashbackEnabled ? 'Activo' : 'Inactivo'}</span>
            </label>
          </div>
          
          {cashbackEnabled && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Porcentaje de Cashback (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input 
                  type="number" 
                  min="1" max="100"
                  value={cashbackPercentage} 
                  onChange={(e) => setCashbackPercentage(Number(e.target.value))}
                  className="input-field" 
                  style={{ width: 100 }}
                />
                <span style={{ color: 'var(--text-primary)' }}>% del total de la compra</span>
              </div>
            </div>
          )}
        </div>

        {/* Uber Flash Integration Settings */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚗</span> Integración Uber Flash
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Envía tus paquetes automáticamente al confirmar el pago por SINPE.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={uberEnabled} 
                onChange={(e) => setUberEnabled(e.target.checked)} 
                style={{ width: 20, height: 20, accentColor: 'var(--accent-color)' }}
              />
              <span style={{ marginLeft: 8, fontWeight: 500 }}>{uberEnabled ? 'Activo' : 'Inactivo'}</span>
            </label>
          </div>
          
          {uberEnabled && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', marginTop: 16 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Para integrar Uber Flash de manera real, necesitas una cuenta en <strong>Uber Direct (Developer Portal)</strong>. Si dejas estos campos vacíos, usaremos un entorno de simulación (Sandbox) para demostraciones.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Uber Direct Client ID</label>
                  <input 
                    type="text" 
                    value={uberClientId} 
                    onChange={(e) => setUberClientId(e.target.value)}
                    className="input-field" 
                    placeholder="Dejar vacío para modo simulación..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Uber Direct Client Secret</label>
                  <input 
                    type="password" 
                    value={uberClientSecret} 
                    onChange={(e) => setUberClientSecret(e.target.value)}
                    className="input-field" 
                    placeholder="Dejar vacío para modo simulación..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          className="btn-primary" 
          onClick={handleSave} 
          disabled={isSaving}
          style={{ padding: '12px 24px', fontSize: '1rem', marginTop: 16, alignSelf: 'flex-start' }}
        >
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </button>

      </div>
    </div>
  );
}
