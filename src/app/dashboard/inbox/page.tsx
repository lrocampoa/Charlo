"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useCompany } from '@/context/CompanyContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export default function Inbox() {
  const { selectedCompanyId } = useCompany();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [isViewingArchived, setIsViewingArchived] = useState(false);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);
  const [sessionTasks, setSessionTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedSession = sessions.find(s => s.id === selectedSessionId) || null;

  const activeChats = sessions.filter(s => !s.archived);
  const archivedChats = sessions.filter(s => s.archived);
  const displayedChats = isViewingArchived ? archivedChats : activeChats;

  const formatSessionId = (id: string, platform: string) => {
    if (!id) return 'Unknown';
    if (platform === 'whatsapp' && /^\d+$/.test(id)) {
      if (id.startsWith('506') && id.length === 11) {
        return `+506 ${id.slice(3, 7)} ${id.slice(7)}`;
      }
      return `+${id}`;
    }
    return id;
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'whatsapp':
        return (
          <span style={{ background: '#25D366', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            WhatsApp
          </span>
        );
      case 'instagram':
        return (
          <span style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            Instagram
          </span>
        );
      case 'messenger':
        return (
          <span style={{ background: '#0084FF', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654v4.235l4.086-2.243c1.09.301 2.246.464 3.445.464 6.627 0 12-4.975 12-11.11S18.627 0 12 0zm1.191 14.962l-3.056-3.26-5.963 3.26 6.554-6.962 3.13 3.259 5.888-3.259-6.553 6.962z"/></svg>
            Messenger
          </span>
        );
      default:
        return (
          <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem' }}>
            {platform}
          </span>
        );
    }
  };

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

  // Fetch live messages for selected session
  useEffect(() => {
    if (!selectedSessionId || !db) {
      setCurrentMessages([]);
      return;
    }

    const docId = selectedSessionId;
    const q = query(
      collection(db, 'sessions', docId, 'messages')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      liveMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      
      // Merge with legacy history if it exists
      const session = sessions.find(s => s.id === selectedSessionId);
      const legacyHistory = session?.history || [];
      
      const allMessages = [...legacyHistory, ...liveMessages];
      setCurrentMessages(allMessages);
    });

    return () => unsubscribe();
  }, [selectedSessionId, db, sessions]);

  // Fetch tasks for selected session
  useEffect(() => {
    if (!selectedSessionId || !db) {
      setSessionTasks([]);
      return;
    }

    const docId = selectedSessionId;
    const q = query(
      collection(db, 'sessions', docId, 'tasks')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      tasks.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      setSessionTasks(tasks);
    });

    return () => unsubscribe();
  }, [selectedSessionId, db]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [currentMessages]);

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
    if (!window.confirm(t('inbox.confirmDelete'))) return;
    try {
      // 1. Delete all messages in the subcollection first
      const messagesRef = collection(db, 'sessions', chatId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const deletePromises = messagesSnapshot.docs.map(messageDoc => deleteDoc(messageDoc.ref));
      await Promise.all(deletePromises);

      // 2. Delete the session document itself
      const sessionDocRef = doc(db, 'sessions', chatId);
      await deleteDoc(sessionDocRef);
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

  const handleResendMessage = async (msg: any) => {
    if (!selectedCompanyId || !selectedSessionId || !user) return;
    setIsResending(msg.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/companies/${selectedCompanyId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: selectedSession?.sessionId,
          text: msg.parts?.[0]?.text || "",
          platform: selectedSession?.platform,
          customerPhone: selectedSession?.customerPhone
        })
      });

      if (res.ok) {
        // Delete the old failed message
        const docId = `${selectedCompanyId}_${selectedSessionId}`;
        const msgRef = doc(db, `sessions/${docId}/messages/${msg.id}`);
        await deleteDoc(msgRef);
      } else {
        alert(t('inbox.resendFailed'));
      }
    } catch (e) {
      console.error("Failed to resend message", e);
    } finally {
      setIsResending(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>{t('inbox.title')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('inbox.subtitle')}</p>
        </div>
        <button 
          className="btn-secondary"
          onClick={async () => {
            const token = await user?.getIdToken();
            await fetch('/api/seed-chats', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            alert(t('inbox.injectSuccess'));
          }}
        >
          {t('inbox.injectChats')}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: 24, overflow: 'hidden' }}>
        {/* Chat List */}
        <div className="glass-panel" style={{ width: 320, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>
            {isViewingArchived ? t('inbox.archivedChatsTitle') : t('inbox.activeChats')}
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Archived Folder Button (WhatsApp Style) */}
            {!isViewingArchived && archivedChats.length > 0 && (
              <div 
                onClick={() => { setIsViewingArchived(true); setSelectedSessionId(null); }}
                style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{ fontSize: '1.2rem' }}>📥</div>
                <div style={{ flex: 1, fontWeight: 600 }}>{t('inbox.archived')}</div>
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
                <div style={{ flex: 1, fontWeight: 600 }}>{t('inbox.backToActive')}</div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {chat.customerName || formatSessionId(chat.customerPhone || chat.sessionId, chat.platform)}
                  </strong>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 12, background: chat.status === 'needs_human' ? 'var(--danger)' : chat.status === 'human_handling' ? '#3b82f6' : 'var(--success)', color: '#fff' }}>
                    {chat.status === 'needs_human' ? t('inbox.needsHuman') : chat.status === 'human_handling' ? t('inbox.human') : t('inbox.ai')}
                  </span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  {getPlatformBadge(chat.platform)}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {chat.lastMessage || '...'}
                </p>

                {/* Hover Actions Menu */}
                {hoveredChatId === chat.id && (
                  <div style={{ position: 'absolute', right: 16, bottom: 12, display: 'flex', gap: 6, background: 'var(--bg-primary)', padding: '4px', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleArchiveChat(e, chat.id, !!chat.archived)}
                      style={{ fontSize: '1rem', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      title={chat.archived ? t('inbox.unarchiveChat') : t('inbox.archiveChat')}
                    >
                      {chat.archived ? '📤' : '📥'}
                    </button>
                    <button 
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      style={{ fontSize: '1rem', padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      title={t('inbox.deleteChat')}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {displayedChats.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                {isViewingArchived ? t('inbox.noArchivedChats') : t('inbox.noActiveChats')}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
          {selectedSession ? (
            <>
              <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h3 style={{ fontWeight: 600 }}>{selectedSession.customerName || formatSessionId(selectedSession.customerPhone || selectedSession.sessionId, selectedSession.platform)}</h3>
                  {getPlatformBadge(selectedSession.platform)}
                </div>
                {selectedSession.status !== 'human_handling' ? (
                  <button 
                    style={{ backgroundColor: 'transparent', color: 'var(--warning)', border: '1px solid var(--warning)', padding: '8px 16px', borderRadius: 'var(--border-radius-full)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} 
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--warning)'; e.currentTarget.style.color = '#000'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--warning)'; }}
                    onClick={handleTakeOver}
                  >
                    {t('inbox.takeOverChat')}
                  </button>
                ) : (
                  <button className="btn-secondary" onClick={handleReturnToAI}>{t('inbox.returnToAi')}</button>
                )}
              </div>
              
              {/* Pending Tasks Banner */}
              {sessionTasks.filter(t => t.status === 'pending').length > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                    <span style={{ fontWeight: 600 }}>{sessionTasks.filter(t => t.status === 'pending').length} Tarea(s) Pendiente(s) (Human in the loop)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {sessionTasks.filter(t => t.status === 'pending').map(task => (
                      <button key={task.id} onClick={() => setSelectedTask(task)} style={{ padding: '6px 12px', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        Revisar Borrador ({task.type === 'SEND_EMAIL' ? 'Correo' : task.type})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(currentMessages || []).map((msg: any, i: number) => {
                  const isUser = msg.role === 'user';
                  const isHumanRep = msg.role === 'human';
                  const isModel = msg.role === 'model' || msg.role === 'human';
                  const msgText = (msg.parts?.[0]?.text || "").replace(/\[Meta Profile Name: .*?\]\s*/g, '');
                  
                  // Styling logic
                  const bgColor = isUser 
                    ? '#e5e7eb' // Light gray for user
                    : isHumanRep 
                      ? '#3b82f6' // Solid blue for human
                      : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'; // Purple gradient for AI
                  
                  return (
                    <div 
                      key={msg.id || i} 
                      style={{ 
                        alignSelf: isUser ? 'flex-start' : 'flex-end', 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-start' : 'flex-end',
                        maxWidth: '75%' 
                      }}
                      onMouseEnter={() => setHoveredMessageId(msg.id || i.toString())}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      <div style={{
                        background: bgColor,
                        color: isUser ? '#1f2937' : '#fff', 
                        padding: '14px 18px', 
                        borderRadius: isUser ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                        lineHeight: 1.5,
                        boxShadow: isUser ? 'none' : '0 4px 14px rgba(0,0,0,0.1)',
                        border: isUser ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        position: 'relative'
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {msgText}
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)', 
                        marginTop: 6, 
                        padding: '0 4px',
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                        justifyContent: isUser ? 'flex-start' : 'flex-end'
                      }}>
                        {msg.status === 'failed' && hoveredMessageId === (msg.id || i.toString()) && (
                          <button 
                            onClick={() => handleResendMessage(msg)}
                            disabled={isResending === msg.id}
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              border: 'none', 
                              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                              color: 'var(--danger)', 
                              cursor: isResending === msg.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            🔄 {isResending === msg.id ? t('inbox.resending') : t('inbox.resend')}
                          </button>
                        )}
                        {isHumanRep && <span style={{ color: '#3b82f6', fontWeight: 600 }}>{t('inbox.sentByHuman')}</span>}
                        {!isUser && !isHumanRep && <span style={{ color: '#a855f7', fontWeight: 600 }}>{t('inbox.sentByAi')}</span>}
                        <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        
                        {!isUser && msg.status && (
                          <span style={{ display: 'flex', alignItems: 'center' }} title={msg.status}>
                            {msg.status === 'sent' && (
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                            {msg.status === 'delivered' && (
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}><polyline points="20 6 9 17 4 12"></polyline><polyline points="20 12 15 17"></polyline></svg>
                            )}
                            {msg.status === 'read' && (
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}><polyline points="20 6 9 17 4 12"></polyline><polyline points="20 12 15 17"></polyline></svg>
                            )}
                            {msg.status === 'failed' && (
                              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
                {selectedSession.status !== 'human_handling' ? (
                  <div 
                    style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed rgba(245, 158, 11, 0.3)', color: 'var(--warning)', padding: '12px', borderRadius: 8, textAlign: 'center', fontSize: '0.9rem' }}
                    dangerouslySetInnerHTML={{ __html: t('inbox.monitoringMode') }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                      <input 
                        type="text" 
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder={t('inbox.typeMessage')}
                        style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', outline: 'none', color: 'var(--text-primary)' }}
                      />
                      <button type="submit" className="btn-primary" disabled={isSending || !messageText.trim()}>
                        {isSending ? t('inbox.sending') : t('inbox.send')}
                      </button>
                    </form>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4, display: 'inline-block' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <span dangerouslySetInnerHTML={{ __html: t('inbox.metaNote') }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              {t('inbox.selectConversation')}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Revisión de Tarea */}
      {selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedTask(null)}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: 600, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Revisar Tarea: {selectedTask.type === 'SEND_EMAIL' ? 'Enviar Correo' : selectedTask.type}</h3>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            
            {selectedTask.type === 'SEND_EMAIL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: 'var(--text-secondary)' }}>La IA ha redactado este correo para el cliente. Revísalo y presiona enviar. (Se abrirá tu cliente de correo por defecto).</p>
                
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Para:</label>
                <input 
                  type="email" 
                  value={selectedTask.data.to || ''} 
                  onChange={(e) => setSelectedTask({...selectedTask, data: {...selectedTask.data, to: e.target.value}})}
                  style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Asunto:</label>
                <input 
                  type="text" 
                  value={selectedTask.data.subject || ''} 
                  onChange={(e) => setSelectedTask({...selectedTask, data: {...selectedTask.data, subject: e.target.value}})}
                  style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
                
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cuerpo del Correo:</label>
                <textarea 
                  value={selectedTask.data.body || ''} 
                  onChange={(e) => setSelectedTask({...selectedTask, data: {...selectedTask.data, body: e.target.value}})}
                  rows={8}
                  style={{ padding: '12px', borderRadius: 4, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setSelectedTask(null)}>Cancelar</button>
              <button 
                className="btn-primary" 
                onClick={async () => {
                  if (!db) return;
                  try {
                    // 1. Abrir mailto para enviar el correo desde la app local
                    if (selectedTask.type === 'SEND_EMAIL') {
                      const mailtoLink = `mailto:${selectedTask.data.to}?subject=${encodeURIComponent(selectedTask.data.subject)}&body=${encodeURIComponent(selectedTask.data.body)}`;
                      window.open(mailtoLink, '_blank');
                    }
                    
                    // 2. Marcar como completada en Firestore
                    const docId = selectedSessionId; // The ID is just selectedSessionId on this page (it combines companyId_sessionId via formatting where it matters, wait: here we use selectedSessionId directly to match other queries)
                    // Wait, let's verify how tasks collection is built in this page:
                    // query(collection(db, 'sessions', selectedSessionId, 'tasks'))
                    // Yes, selectedSessionId is the full doc ID (`${companyId}_${sessionId}`)
                    await updateDoc(doc(db, `sessions/${selectedSessionId}/tasks/${selectedTask.id}`), {
                      status: 'completed',
                      data: selectedTask.data,
                      completedAt: new Date().toISOString()
                    });
                    
                    setSelectedTask(null);
                  } catch (e) {
                    console.error("Error completando la tarea", e);
                  }
                }}
              >
                Enviar y Completar Tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
