"use client";

import React from 'react';

export default function Inbox() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Omnichannel Inbox</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Monitor live AI conversations and take over when needed.</p>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 24, overflow: 'hidden' }}>
        {/* Chat List */}
        <div className="glass-panel" style={{ width: 300, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Active Chats</div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {[
              { name: 'Maria Vargas', platform: 'WhatsApp', status: 'AI Handling', preview: 'Quería saber si tienen...', active: true },
              { name: 'John Smith', platform: 'Web Chat', status: 'Needs Human', preview: 'I want a refund right now!', active: false },
            ].map((chat, i) => (
              <div key={i} style={{ padding: 16, borderBottom: '1px solid var(--border-color)', background: chat.active ? 'var(--bg-secondary)' : 'transparent', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong>{chat.name}</strong>
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, background: chat.status === 'Needs Human' ? 'var(--danger)' : 'var(--success)', color: '#fff' }}>
                    {chat.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{chat.preview}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 600 }}>Maria Vargas (WhatsApp)</h3>
            <button className="btn-primary" style={{ backgroundColor: 'var(--danger)' }}>Take Over Chat</button>
          </div>
          
          <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ alignSelf: 'flex-start', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '16px 16px 16px 0', maxWidth: '70%' }}>
              Hola, pura vida! Quería saber si tienen espacio para 4 personas este sábado.
            </div>
            <div style={{ alignSelf: 'flex-end', background: 'var(--accent-color)', color: '#fff', padding: '12px 16px', borderRadius: '16px 16px 0 16px', maxWidth: '70%' }}>
              ¡Hola Maria! Pura vida 🤙 Sí tenemos espacio. ¿A qué hora les gustaría visitarnos?
              <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 4, textAlign: 'right' }}>Sent by AI Booking Agent</div>
            </div>
          </div>
          
          <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, marginBottom: 8, fontSize: '0.85rem', textAlign: 'center' }}>
              You are in monitoring mode. The AI is handling this conversation.
            </div>
            <input 
              disabled
              type="text" 
              placeholder="Take over chat to reply..." 
              style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', outline: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
