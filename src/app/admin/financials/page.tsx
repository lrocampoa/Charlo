"use client";

import React, { useEffect, useState } from 'react';
import { DollarSign, Users, CreditCard, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const mockMRRData = [
  { month: 'Ene', mrr: 12000 },
  { month: 'Feb', mrr: 14500 },
  { month: 'Mar', mrr: 17800 },
  { month: 'Abr', mrr: 21000 },
  { month: 'May', mrr: 24500 },
  { month: 'Jun', mrr: 29000 },
];

const mockCostData = [
  { month: 'Ene', whatsapp: 1200, gemini: 300, profit: 10500 },
  { month: 'Feb', whatsapp: 1500, gemini: 450, profit: 12550 },
  { month: 'Mar', whatsapp: 2100, gemini: 600, profit: 15100 },
  { month: 'Abr', whatsapp: 2800, gemini: 800, profit: 17400 },
  { month: 'May', whatsapp: 3200, gemini: 1100, profit: 20200 },
  { month: 'Jun', whatsapp: 3900, gemini: 1400, profit: 23700 },
];

const mockUsersNearLimit = [
  { id: '1', name: 'Clínica Dental Sonrisas', tier: 'starter', usage: 1850, limit: 2000 },
  { id: '2', name: 'Boutique Elegance', tier: 'starter', usage: 1980, limit: 2000 },
  { id: '3', name: 'Pizza Luigi', tier: 'growth', usage: 4800, limit: 5000 },
];

export default function FinancialsDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking an API call
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Activity className="animate-spin" size={40} style={{ marginRight: 16 }} />
        <span>Cargando datos financieros...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Métricas Financieras y de Uso</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Resumen de ingresos, suscripciones y costos de API de Charlo.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* MRR Card */}
        <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
            <DollarSign size={18} />
            <span style={{ fontSize: '0.9rem' }}>MRR (Ingreso Mensual)</span>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>$29,000</span>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> +18% vs mes pasado
          </span>
        </div>

        {/* Members Card */}
        <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
            <Users size={18} />
            <span style={{ fontSize: '0.9rem' }}>Usuarios Activos</span>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>145</span>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>112 Pagos</span>
            <span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>33 En Prueba</span>
          </div>
        </div>

        {/* API Costs Card */}
        <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
            <Activity size={18} />
            <span style={{ fontSize: '0.9rem' }}>Costos de API (Est. Jun)</span>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>$5,300</span>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>WhatsApp: $3,900</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Gemini: $1,400</span>
          </div>
        </div>

        {/* Churn Card */}
        <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
            <CreditCard size={18} />
            <span style={{ fontSize: '0.9rem' }}>Tasa de Cancelación (Churn)</span>
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 700 }}>2.4%</span>
          <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingDown size={14} /> Saludable
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* MRR Chart */}
        <div className="glass-panel" style={{ flex: 1, minWidth: 400, padding: 24 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24 }}>Crecimiento de MRR</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={mockMRRData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'MRR']}
                />
                <Area type="monotone" dataKey="mrr" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Costs vs Profit Chart */}
        <div className="glass-panel" style={{ flex: 1, minWidth: 400, padding: 24 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 24 }}>Costos Operativos vs Margen</h3>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <LineChart data={mockCostData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="profit" stroke="var(--success)" strokeWidth={3} dot={false} name="Margen Bruto" />
                <Line type="monotone" dataKey="whatsapp" stroke="#25D366" strokeWidth={2} dot={false} name="Costo WhatsApp" />
                <Line type="monotone" dataKey="gemini" stroke="#4285F4" strokeWidth={2} dot={false} name="Costo Gemini" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Users Near Limit Table */}
      <div className="glass-panel" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16 }}>Oportunidades de Upsell (Usuarios cerca del límite)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 8px' }}>Negocio</th>
              <th style={{ padding: '12px 8px' }}>Plan Actual</th>
              <th style={{ padding: '12px 8px' }}>Uso de IA (Mes)</th>
              <th style={{ padding: '12px 8px' }}>Progreso</th>
            </tr>
          </thead>
          <tbody>
            {mockUsersNearLimit.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 8px', fontWeight: 500 }}>{user.name}</td>
                <td style={{ padding: '12px 8px', textTransform: 'capitalize', color: 'var(--accent-color)' }}>{user.tier}</td>
                <td style={{ padding: '12px 8px' }}>{user.usage} / {user.limit}</td>
                <td style={{ padding: '12px 8px', width: '30%' }}>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: user.usage / user.limit > 0.9 ? 'var(--error)' : 'var(--warning)', width: `${(user.usage / user.limit) * 100}%` }}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
