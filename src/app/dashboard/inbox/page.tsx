"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function Inbox() {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isViewingArchived, setIsViewingArchived] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null;

  // Split sessions
  const activeChats = sessions.filter(s => !s.archived);
  const archivedChats = sessions.filter(s => s.archived);
  const displayedChats = isViewingArchived ? archivedChats : activeChats;

  // Fetch live sessions
  useEffect(() => {
    if (!selectedCompanyId || !db) return;

    const q = query(
      collection(db, 'sessions'),
      where('companyId', '==', selectedCompanyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort manually to avoid requiring a Firestore Composite Index
      liveSessions.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setSessions(liveSessions);
    }, (error) => {
      console.error("Inbox listener error (Might need Firestore Rules):", error);
    });

    return () => unsubscribe();
  }, [selectedCompanyId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.history]);

  const handleTakeOver = async () => {
    if (!selectedSession || !db) return;
    try {
      const docRef = doc(db, 'sessions', selectedSession.id);
      await updateDoc(docRef, { status: 'human_handling' });
    } catch (e) {
      console.error("Failed to take over", e);
    }
  };

  const handleReturnToAI = async () => {
    if (!selectedSession || !db) return;
    try {
      const docRef = doc(db, 'sessions', selectedSession.id);
      await updateDoc(docRef, { status: 'ai_handling' });
    } catch (e) {
      console.error("Failed to return to AI", e);
    }
  };

  const handleArchiveChat = async (e: React.MouseEvent, chatId: string, isCurrentlyArchived: boolean) => {
    e.stopPropagation();
    if (!db) return;
    try {
      const docRef = doc(db, 'sessions', chatId);
      await updateDoc(docRef, { archived: !isCurrentlyArchived });
      // If we archive the chat we are currently viewing, maybe clear selection
      if (selectedSessionId === chatId) setSelectedSessionId(null);
    } catch (e) {
      console.error("Failed to archive chat", e);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!db) return;
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta conversación permanentemente?')) return;
    try {
      const docRef = doc(db, 'sessions', chatId);
      await deleteDoc(docRef);
      if (selectedSessionId === chatId) setSelectedSessionId(null);
    } catch (e) {
      console.error("Failed to delete chat", e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedSession || !user) return;
    
    setIsSending(true);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/companies/${selectedCompanyId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: selectedSession.sessionId,
          text: messageText,
          platform: selectedSession.platform,
          customerPhone: selectedSession.customerPhone
        })
      });
      setMessageText("");
    } catch (e) {
      console.error("Failed to send manual message", e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Omnichannel Inbox</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor live AI conversations and take over when needed.</p>
        </div>
        <button 
          className="btn-secondary"
          onClick={async () => {
            const token = await user?.getIdToken();
            await fetch('/api/seed-chats', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            alert('¡Chats simulados inyectados con éxito! Deberían aparecer ahora.');
          }}
        >
          🔮 Inyectar Chats de Prueba
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 24, overflow: 'hidden' }}>
        {/* Chat List */}
        <div className="glass-panel" style={{ width: 320, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
            {isViewingArchived ? '📥 Chats Archivados' : 'Active Chats'}
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Archived Folder Button (WhatsApp Style) */}
            {!isViewingArchived && archivedChats.length > 0 && (
              <div 
                onClick={() => { setIsViewingArchived(true); setSelectedSessionId(null); }}
                style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ fontSize: '1.2rem' }}>📥</div>
                <div style={{ flex: 1, fontWeight: 600 }}>Archivados</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12 }}>
                  {archivedChats.length}
                </div>
              </div>
            )}

            {/* Back to Active Chats Button */}
            {isViewingArchived && (
              <div 
                onClick={() => { setIsViewingArchived(false); setSelectedSessionId(null); }}
                style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <div style={{ fontSize: '1.2rem' }}>⬅️</div>
                <div style={{ flex: 1, fontWeight: 600 }}>Volver a Activos</div>
              </div>
            )}

            {displayedChats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => setSelectedSessionId(chat.id)}
                onMouseEnter={() => setHoveredChatId(chat.id)}
                onMouseLeave={() => setHoveredChatId(null)}
                style={{ 
                  padding: 16, 
                  borderBottom: '1px solid var(--border-color)', 
                  background: selectedSessionId === chat.id ? 'var(--bg-secondary)' : 'transparent', 
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {chat.customerPhone || chat.sessionId}
                  </strong>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 12, background: chat.status === 'needs_human' ? 'var(--danger)' : chat.status === 'human_handling' ? '#3b82f6' : 'var(--success)', color: '#fff' }}>
                    {chat.status === 'needs_human' ? 'Needs Human' : chat.status === 'human_handling' ? 'Human' : 'AI'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{chat.platform}</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {chat.lastMessage || '...'}
                </p>

                {/* Hover Actions Menu */}
                {hoveredChatId === chat.id && (
                  <div style={{ position: 'absolute', right: 16, bottom: 12, display: 'flex', gap: 6, background: 'var(--bg-primary)', padding: '4px', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleArchiveChat(e, chat.id, !!chat.archived)}
                      style={{ fontSize: '1rem', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      title={chat.archived ? "Desarchivar chat" : "Archivar chat"}
                    >
                      {chat.archived ? '📤' : '📥'}
                    </button>
                    <button 
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      style={{ fontSize: '1rem', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      title="Eliminar chat"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {displayedChats.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                {isViewingArchived ? 'No hay chats archivados.' : 'No hay chats activos.'}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
          {selectedSession ? (
            <>
              <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 600 }}>{selectedSession.customerPhone} ({selectedSession.platform})</h3>
                {selectedSession.status !== 'human_handling' ? (
                  <button className="btn-primary" style={{ backgroundColor: 'var(--danger)' }} onClick={handleTakeOver}>Take Over Chat</button>
                ) : (
                  <button className="btn-secondary" onClick={handleReturnToAI}>Return to AI</button>
                )}
              </div>
              
              <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(selectedSession.history || []).map((msg: any, i: number) => {
                  const isUser = msg.role === 'user';
                  const isHumanRep = msg.role === 'human';
                  return (
                    <div key={i} style={{ 
                      alignSelf: isUser ? 'flex-start' : 'flex-end', 
                      background: isUser ? 'var(--bg-secondary)' : isHumanRep ? '#3b82f6' : 'var(--accent-color)', 
                      color: isUser ? 'var(--text-primary)' : '#fff', 
                      padding: '12px 16px', 
                      borderRadius: isUser ? '16px 16px 16px 0' : '16px 16px 0 16px', 
                      maxWidth: '70%' 
                    }}>
                      {msg.parts[0]?.text}
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: 4, textAlign: isUser ? 'left' : 'right' }}>
                        {isHumanRep ? 'Sent by Human' : !isUser ? 'Sent by AI' : new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
                {selectedSession.status !== 'human_handling' ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, textAlign: 'center', fontSize: '0.9rem' }}>
                    You are in monitoring mode. Take over chat to reply.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                    <input 
                      type="text" 
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      placeholder="Escribe tu mensaje..." 
                      style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', outline: 'none', color: '#fff' }}
                    />
                    <button type="submit" className="btn-primary" disabled={isSending || !messageText.trim()}>
                      {isSending ? 'Enviando...' : 'Enviar'}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Select a conversation to view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
