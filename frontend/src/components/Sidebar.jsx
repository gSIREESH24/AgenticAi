import { useState } from 'react';
import './Sidebar.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Sidebar({
  open,
  onToggle,
  token,
  chats,
  setChats,
  activeChatId,
  setActiveChatId,
  pdfs,
  setPdfs,
  activePdfId,
  setActivePdfId,
  currentView,
  setCurrentView,
  onLogout,
  username
}) {
  const handleDeleteChat = async (e, id) => {
    try {
      const res = await fetch(`${API_BASE}/api/chats/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setChats(prev => prev.filter(c => c._id !== id));
        if (activeChatId === id) {
          setActiveChatId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePdf = async (e, id) => {
    try {
      const res = await fetch(`${API_BASE}/api/pdfs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPdfs(prev => prev.filter(p => p._id !== id));
        if (activePdfId === id) {
          setActivePdfId(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getFriendlyTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <aside className={`sidebar ${open ? 'open' : 'collapsed'}`}>
      <button
        type="button"
        className="sb-toggle-btn"
        onClick={onToggle}
        id="sidebar-toggle-btn"
        title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div className="sb-brand">
        <div className="sb-logo">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <defs>
              <linearGradient id="lg-edge" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fbbf24"/>
                <stop offset="0.5" stopColor="#f97316"/>
                <stop offset="1" stopColor="#ea580c"/>
              </linearGradient>
              <linearGradient id="lg-fill" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="rgba(251,191,36,0.2)"/>
                <stop offset="1" stopColor="rgba(234,88,12,0.1)"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            <path d="M20 2L36 20L20 38L4 20Z" fill="url(#lg-fill)" stroke="url(#lg-edge)" strokeWidth="1.5" filter="url(#glow)"/>
            <path d="M20 10L28 20L20 30L12 20Z" fill="none" stroke="url(#lg-edge)" strokeWidth="1" opacity="0.6"/>
            <circle cx="20" cy="20" r="2.5" fill="url(#lg-edge)"/>
            <line x1="20" y1="14" x2="20" y2="17" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="20" y1="23" x2="20" y2="26" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="14" y1="20" x2="17" y2="20" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="23" y1="20" x2="26" y2="20" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        {open && (
          <div className="sb-brand-text">
            <span className="sb-brand-name">Synthetix</span>
            <span className="sb-brand-sub">AI Agent</span>
          </div>
        )}
      </div>

      <div className="sb-mode-toggle">
        <button
          type="button"
          className={`sb-mode-btn ${currentView === 'chat' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('chat');
          }}
          title={!open ? 'AI Chatbot' : undefined}
        >
          💬 {open && <span>Chatbot</span>}
        </button>
        <button
          type="button"
          className={`sb-mode-btn ${currentView === 'pdf-extractor' ? 'active' : ''}`}
          onClick={() => {
            setCurrentView('pdf-extractor');
          }}
          title={!open ? 'PDF Analyzer' : undefined}
        >
          📄 {open && <span>PDF RAG</span>}
        </button>
      </div>

      {currentView === 'chat' ? (
        <>
          <button
            type="button"
            className="sb-new-chat"
            id="new-chat-btn"
            title="New conversation"
            onClick={() => {
              setActiveChatId(null);
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
            </svg>
            {open && <span>New conversation</span>}
          </button>

          {open && chats.length > 0 && <span className="sb-section-label">Recent chats</span>}

          <div className="sb-history">
            {chats.map(chat => (
              <button
                type="button"
                key={chat._id}
                className={`sb-history-item ${activeChatId === chat._id ? 'active' : ''}`}
                onClick={() => {
                  setActiveChatId(chat._id);
                }}
                title={!open ? chat.title : undefined}
              >
                <div className="sb-hist-icon">{chat.emoji || '💬'}</div>
                {open && (
                  <div className="sb-hist-info">
                    <span className="sb-hist-title">{chat.title}</span>
                    <span className="sb-hist-time">{getFriendlyTime(chat.updatedAt)}</span>
                  </div>
                )}
                {open && (
                  <button
                    type="button"
                    className="sb-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(e, chat._id);
                    }}
                    title="Delete conversation"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className="sb-new-chat"
            title="Upload new PDF"
            onClick={() => {
              setActivePdfId(null);
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
            </svg>
            {open && <span>New Upload</span>}
          </button>

          {open && pdfs.length > 0 && <span className="sb-section-label">Recent uploads</span>}

          <div className="sb-history">
            {pdfs.map(pdfItem => (
              <button
                type="button"
                key={pdfItem._id}
                className={`sb-history-item ${activePdfId === pdfItem._id ? 'active' : ''}`}
                onClick={() => {
                  setActivePdfId(pdfItem._id);
                }}
                title={!open ? pdfItem.fileName : undefined}
              >
                <div className="sb-hist-icon">📄</div>
                {open && (
                  <div className="sb-hist-info">
                    <span className="sb-hist-title">{pdfItem.fileName}</span>
                    <span className="sb-hist-time">
                      {pdfItem.chunks ? `${pdfItem.chunks.length} chunks` : '0 chunks'}
                    </span>
                  </div>
                )}
                {open && (
                  <button
                    type="button"
                    className="sb-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePdf(e, pdfItem._id);
                    }}
                    title="Delete PDF history"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="sb-bottom">
        <button
          type="button"
          className="sb-bottom-btn"
          id="logout-btn"
          title="Logout"
          onClick={onLogout}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="18" height="18">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {open && <span>Logout ({username})</span>}
        </button>
      </div>
    </aside>
  );
}
