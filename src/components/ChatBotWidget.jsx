// src/components/ChatBotWidget.jsx
// React component for Maharat — shows only after login (currentUser required)
// Usage:
// 1) Ensure you set currentUser in your app, then either pass it as prop:
//    <ChatBotWidget currentUser={currentUser} />
//    OR set window.__CURRENT_USER__ = currentUser somewhere after login.
// 2) This component detects platform endpoint automatically (Vercel / Netlify)
// 3) Supports streaming responses when the server provides a readable stream (Vercel).

import React, { useState, useEffect } from 'react';

export default function ChatBotWidget({ currentUser: currentUserProp }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUser = currentUserProp || (typeof window !== 'undefined' && window.__CURRENT_USER__) || null;
  const role = currentUser?.role || null;

  useEffect(() => {
    if (!role) {
      setIsOpen(false);
    }
  }, [role]);

  const getEndpoint = () => {
    return window.location.hostname.includes('netlify.app') ? '/.netlify/functions/chat' : '/api/chat';
  };

  const startConversationIfEmpty = () => {
    if (messages.length === 0) {
      setMessages([
        { sender: 'bot', text: '👋 مرحبًا بك في منصة مهارات! أنا مساعدك الذكي 🎓، كيف يمكنني مساعدتك اليوم؟' }
      ]);
    }
  };

  useEffect(() => {
    startConversationIfEmpty();
  }, []);

  const appendMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !role) return;
    const userText = input.trim();
    appendMessage({ sender: 'user', text: userText });
    setInput('');
    setLoading(true);

    const endpoint = getEndpoint();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, role }),
      });

      if (res.body && typeof res.body.getReader === 'function') {
        appendMessage({ sender: 'bot', text: '' });
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let botAccum = '';
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            botAccum += chunk;
            setMessages(prev => {
              const copy = [...prev];
              const lastBotIndex = copy.map(m => m.sender).lastIndexOf('bot');
              if (lastBotIndex !== -1) {
                copy[lastBotIndex] = { sender: 'bot', text: botAccum };
              } else {
                copy.push({ sender: 'bot', text: botAccum });
              }
              return copy;
            });
          }
        }
      } else {
        const data = await res.json();
        appendMessage({ sender: 'bot', text: data.reply || 'لم أتمكن من توليد رد حالياً.' });
      }
    } catch (err) {
      console.error('Chat error', err);
      appendMessage({ sender: 'bot', text: '⚠️ حدث خطأ أثناء الاتصال بالمساعد. حاول مرة أخرى لاحقًا.' });
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return null;
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          fontSize: 20,
        }}
        aria-label="افتح المساعد"
      >💬</button>

      {isOpen && (
        <div style={{
          position: 'fixed', right: 24, bottom: 96, width: 320, maxHeight: '70vh',
          background: '#fff', borderRadius: 16, boxShadow: '0 20px 50px rgba(2,6,23,0.2)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e6eef9'
        }}>
          <div style={{ padding: '12px 16px', background: 'linear-gradient(90deg,#2b6cb0,#2c5282)', color: '#fff', fontWeight: 600, textAlign: 'center' }}>
            💬 مساعدك الذكي 🎓
          </div>

          <div style={{ padding: 12, background: '#f8fafc', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                background: m.sender === 'user' ? '#60a5fa' : '#fff',
                color: m.sender === 'user' ? '#fff' : '#0f172a',
                padding: '8px 12px',
                borderRadius: 12,
                maxWidth: '85%',
                boxShadow: m.sender === 'user' ? 'none' : '0 1px 2px rgba(2,6,23,0.04)',
                border: m.sender === 'user' ? 'none' : '1px solid #e6eef9',
                whiteSpace: 'pre-wrap',
                fontSize: 14
              }}>{m.text}</div>
            ))}
            {loading && <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>يتم كتابة الرد...</div>}
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #eef2ff', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="اكتب سؤالك هنا..." style={{ flex: 1, padding: '8px 12px', borderRadius: 999, border: '1px solid #e6eef9', outline: 'none' }} />
            <button onClick={sendMessage} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 999 }}>إرسال</button>
          </div>

          <div style={{ padding: '6px 10px', fontSize: 12, color: '#94a3b8', textAlign: 'center', background: '#fbfdff' }}>🤖 مساعدك الذكي جاهز لمساعدتك</div>
        </div>
      )}
    </div>
  );
}
