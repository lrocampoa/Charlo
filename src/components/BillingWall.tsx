"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface BillingWallProps {
  companyId: string;
  onComplete: () => void;
}

export default function BillingWall({ companyId, onComplete }: BillingWallProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleCheckout = async (tier: string) => {
    setIsLoading(tier);
    setError('');
    
    if (tier === 'free') {
      try {
        const res = await fetch(`/api/companies/${companyId}/set-sandbox`, { method: 'POST' });
        if (!res.ok) throw new Error('Error activating Sandbox');
        onComplete();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(null);
      }
      return;
    }

    // Paid tiers checkout
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In real app, you need to pass Firebase ID token if the API route requires it, 
          // or we can remove the ID token requirement in the checkout API if we use next-auth cookies.
          // For now, we will assume the route handles auth correctly if called from client side (it expects Bearer token).
        },
        body: JSON.stringify({ companyId, tier })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(null);
    }
  };

  const handlePortal = async () => {
    setIsLoading('portal');
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      if (!res.ok) throw new Error('Portal failed');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      backgroundColor: 'rgba(10, 15, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', overflowY: 'auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 800 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16, background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Selecciona tu Plan
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Potencia tu negocio con el mejor asistente virtual con IA para WhatsApp y Meta.
        </p>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: 24, padding: '12px 24px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1200 }}>
        
        {/* Sandbox Tier */}
        <div className="glass-panel" style={{ width: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(10, 15, 26, 0.95)', color: '#fff' }}>
          <div style={{ width: 100, height: 100, marginBottom: 20, position: 'relative' }}>
             <Image src="/sandbox-v2.png" alt="Sandbox" fill style={{ objectFit: 'contain' }} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Sandbox</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 24 }}>Gratis</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', width: '100%', gap: 12, display: 'flex', flexDirection: 'column', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            <li>✅ Prueba en el Simulador</li>
            <li>✅ Conecta WhatsApp</li>
            <li>⚠️ <strong>Solo responde a 1 número</strong></li>
            <li>❌ Sin integraciones</li>
          </ul>
          <button 
            className="btn-secondary" 
            style={{ width: '100%', marginTop: 'auto' }}
            onClick={() => handleCheckout('free')}
            disabled={isLoading !== null}
          >
            {isLoading === 'free' ? 'Activando...' : 'Iniciar Sandbox'}
          </button>
        </div>

        {/* Starter Tier */}
        <div className="glass-panel" style={{ width: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(0, 191, 255, 0.3)', position: 'relative', backgroundColor: 'rgba(10, 15, 26, 0.95)', color: '#fff' }}>
          <div style={{ width: 100, height: 100, marginBottom: 20, position: 'relative' }}>
            <Image src="/starter-v2.png" alt="Starter" fill style={{ objectFit: 'contain' }} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#4facfe' }}>Starter</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>$49<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mes</span></p>
          <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', marginBottom: 24 }}>14 Días de Prueba Gratis</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', width: '100%', gap: 12, display: 'flex', flexDirection: 'column', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            <li>✅ Hasta 1,000 Mensajes IA</li>
            <li>✅ WhatsApp y Facebook</li>
            <li>✅ Responde a todos</li>
            <li>✅ Soporte Básico</li>
          </ul>
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: 'auto', background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}
            onClick={() => handleCheckout('starter')}
            disabled={isLoading !== null}
          >
            {isLoading === 'starter' ? 'Cargando...' : 'Iniciar Prueba'}
          </button>
        </div>

        {/* Growth Tier */}
        <div className="glass-panel" style={{ width: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(16, 185, 129, 0.5)', transform: 'scale(1.05)', zIndex: 2, boxShadow: '0 20px 40px rgba(16,185,129,0.2)', backgroundColor: 'rgba(10, 15, 26, 0.95)', color: '#fff' }}>
          <div style={{ position: 'absolute', top: -12, background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)', padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700, color: '#000' }}>
            MÁS POPULAR
          </div>
          <div style={{ width: 100, height: 100, marginBottom: 20, position: 'relative', marginTop: 12 }}>
            <Image src="/growth-v2.png" alt="Growth" fill style={{ objectFit: 'contain' }} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#10b981' }}>Growth</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>$99<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mes</span></p>
          <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', marginBottom: 24 }}>14 Días de Prueba Gratis</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', width: '100%', gap: 12, display: 'flex', flexDirection: 'column', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            <li>✅ Hasta 5,000 Mensajes IA</li>
            <li>✅ Instagram DM Integrado</li>
            <li>✅ Agentes Especializados</li>
            <li>✅ Soporte Prioritario</li>
          </ul>
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: 'auto', background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)', border: 'none', color: '#000' }}
            onClick={() => handleCheckout('growth')}
            disabled={isLoading !== null}
          >
            {isLoading === 'growth' ? 'Cargando...' : 'Iniciar Prueba'}
          </button>
        </div>

        {/* Pro Tier */}
        <div className="glass-panel" style={{ width: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(168, 85, 247, 0.3)', backgroundColor: 'rgba(10, 15, 26, 0.95)', color: '#fff' }}>
          <div style={{ width: 100, height: 100, marginBottom: 20, position: 'relative' }}>
            <Image src="/pro-v2.png" alt="Pro" fill style={{ objectFit: 'contain' }} />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#a855f7' }}>Pro</h3>
          <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 4 }}>$249<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mes</span></p>
          <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', marginBottom: 24 }}>14 Días de Prueba Gratis</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', width: '100%', gap: 12, display: 'flex', flexDirection: 'column', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            <li>✅ Mensajes Ilimitados</li>
            <li>✅ Extracción de Pagos SINPE</li>
            <li>✅ Uber Flash Automático</li>
            <li>✅ Soporte 24/7</li>
          </ul>
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: 'auto', background: 'linear-gradient(90deg, #a855f7 0%, #c084fc 100%)', border: 'none' }}
            onClick={() => handleCheckout('pro')}
            disabled={isLoading !== null}
          >
            {isLoading === 'pro' ? 'Cargando...' : 'Iniciar Prueba'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <button 
          onClick={handlePortal} 
          disabled={isLoading !== null}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          ¿Ya tienes una suscripción? Gestionar Facturación
        </button>
      </div>
    </div>
  );
}
