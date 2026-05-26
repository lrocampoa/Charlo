"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useLanguage } from '@/context/LanguageContext';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
};

export default function SimulatorPage() {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Generate a fresh session ID for testing every time they load the page
    setSessionId(`test_${Date.now()}`);
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, companyId: selectedCompanyId, sessionId }),
      });

      const data = await response.json();
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: data.reply || t('simulator.error')
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { id: Date.now().toString(), sender: 'ai', text: t('simulator.connectionError') };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>{t('simulator.title')}</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          {t('simulator.subtitle')} <span style={{ color: 'var(--accent-color)' }}>{selectedCompany?.name || '...'}</span> {t('simulator.subtitle2')}
        </p>
      </div>

      {!selectedCompanyId ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
          {t('simulator.noBusiness')}
        </div>
      ) : (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
                padding: '12px 18px',
                borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                maxWidth: '70%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                lineHeight: 1.5
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 18px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px 16px 16px 0', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                {t('simulator.thinking')}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: 16, borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('simulator.typeMessage')}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 'var(--border-radius-full)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <button type="submit" className="btn-primary" disabled={!input.trim() || isLoading} style={{ borderRadius: 'var(--border-radius-full)', padding: '0 24px' }}>
                {t('simulator.send')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
