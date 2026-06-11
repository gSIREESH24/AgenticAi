import { useState, useRef, useEffect, useCallback } from 'react';
import './ChatArea.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const suggestions = [
  { emoji: '🎬', label: 'Movie recommendations',   sub: 'Get curated film picks'             },
  { emoji: '💡', label: 'Explain a concept',        sub: 'Make anything easy to understand'   },
  { emoji: '🧑‍💻', label: 'Help me write code',      sub: 'Debug, refactor or build something' },
  { emoji: '📝', label: 'Draft content for me',     sub: 'Emails, essays, summaries'          },
];

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function WelcomeScreen({ onSuggest }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-orb-wrap">
        <div className="orb-ring orb-ring-1"/>
        <div className="orb-ring orb-ring-2"/>
        <div className="orb-ring orb-ring-3"/>
        <div className="orb-sparks"/>
        <div className="welcome-orb">
          <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" width="58" height="58">
            <defs>
              <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"/>
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8"/>
              </radialGradient>
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 4"/>
            <circle cx="28"  cy="6"  r="2.8" fill="url(#nodeGrad)" filter="url(#nodeGlow)" opacity="0.9"/>
            <circle cx="47"  cy="17" r="2.2" fill="white" filter="url(#nodeGlow)" opacity="0.7"/>
            <circle cx="47"  cy="39" r="2.8" fill="url(#nodeGrad)" filter="url(#nodeGlow)" opacity="0.9"/>
            <circle cx="28"  cy="50" r="2.2" fill="white" filter="url(#nodeGlow)" opacity="0.7"/>
            <circle cx="9"   cy="39" r="2.8" fill="url(#nodeGrad)" filter="url(#nodeGlow)" opacity="0.9"/>
            <circle cx="9"   cy="17" r="2.2" fill="white" filter="url(#nodeGlow)" opacity="0.7"/>
            <line x1="28" y1="28" x2="28" y2="6"  stroke="rgba(255,255,255,0.35)" strokeWidth="1"   strokeLinecap="round"/>
            <line x1="28" y1="28" x2="47" y2="17" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" strokeLinecap="round"/>
            <line x1="28" y1="28" x2="47" y2="39" stroke="rgba(255,255,255,0.35)" strokeWidth="1"   strokeLinecap="round"/>
            <line x1="28" y1="28" x2="28" y2="50" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" strokeLinecap="round"/>
            <line x1="28" y1="28" x2="9"  y2="39" stroke="rgba(255,255,255,0.35)" strokeWidth="1"   strokeLinecap="round"/>
            <line x1="28" y1="28" x2="9"  y2="17" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" strokeLinecap="round"/>
            <line x1="28" y1="6"  x2="47" y2="17" stroke="rgba(255,255,255,0.15)" strokeWidth="0.7"/>
            <line x1="47" y1="17" x2="47" y2="39" stroke="rgba(255,255,255,0.15)" strokeWidth="0.7"/>
            <line x1="47" y1="39" x2="28" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.7"/>
            <line x1="28" y1="50" x2="9"  y2="39" stroke="rgba(255,255,255,0.15)" strokeWidth="0.7"/>
            <line x1="9"  y1="39" x2="9"  y2="17" stroke="rgba(255,255,255,0.15)" strokeWidth="0.7"/>
            <line x1="9"  y1="17" x2="28" y2="6"  stroke="rgba(255,255,255,0.15)" strokeWidth="0.7"/>
            <circle cx="28" cy="14" r="1.5" fill="rgba(255,255,255,0.5)"/>
            <circle cx="28" cy="42" r="1.5" fill="rgba(255,255,255,0.5)"/>
            <circle cx="14" cy="21" r="1.5" fill="rgba(255,255,255,0.5)"/>
            <circle cx="42" cy="21" r="1.5" fill="rgba(255,255,255,0.5)"/>
            <circle cx="14" cy="35" r="1.5" fill="rgba(255,255,255,0.5)"/>
            <circle cx="42" cy="35" r="1.5" fill="rgba(255,255,255,0.5)"/>
            <circle cx="28" cy="28" r="5.5" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
            <circle cx="28" cy="28" r="3"   fill="white" filter="url(#nodeGlow)"/>
          </svg>
        </div>
      </div>
      <h1 className="welcome-title">How can I help you today?</h1>
      <p className="welcome-sub">
        Your intelligent AI agent — powered by Google Gemini. Ask questions, generate ideas, write code or just have a conversation.
      </p>
      <div className="welcome-suggestions">
        {suggestions.map((s, i) => (
          <button key={i} className="suggestion-chip" onClick={() => onSuggest(s.label)}>
            <div className="chip-icon">{s.emoji}</div>
            <div className="chip-text">
              <span className="chip-label">{s.label}</span>
              <span className="chip-sub">{s.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="typing-row">
      <div className="msg-av msg-av-ai">AI</div>
      <div className="typing-bubble">
        <div className="typing-dots">
          <span className="t-dot"/> <span className="t-dot"/> <span className="t-dot"/>
        </div>
        <span className="typing-text">Thinking…</span>
      </div>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="error-banner">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
        <circle cx="10" cy="10" r="8"/>
        <path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
      </svg>
      <span>{message}</span>
      <button className="error-dismiss" onClick={onDismiss}>✕</button>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (text) => {
    if (!text) return '';
    const codeBlockRx = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let last = 0, match;

    const parseInline = (inlineText) => {
      const boldCodeRx = /(\*\*|`)(.*?)\1/g;
      const result = [];
      let idx = 0, m;
      while ((m = boldCodeRx.exec(inlineText)) !== null) {
        if (m.index > idx) result.push(inlineText.slice(idx, m.index));
        if (m[1] === '**') {
          result.push(<strong key={m.index} className="msg-bold">{m[2]}</strong>);
        } else {
          result.push(<code key={m.index} className="msg-inline-code">{m[2]}</code>);
        }
        idx = m.index + m[0].length;
      }
      if (idx < inlineText.length) result.push(inlineText.slice(idx));
      return result.length ? result : inlineText;
    };

    const parseMarkdownInlineAndBlocks = (rawText, blockKey) => {
      const lines = rawText.split('\n');
      const elements = [];
      let currentList = null;
      let listType = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('### ')) {
          if (currentList) {
            const Tag = listType === 'ul' ? 'ul' : 'ol';
            elements.push(<Tag key={`${blockKey}-list-${i}`} className={`msg-${listType}`}>{currentList}</Tag>);
            currentList = null;
            listType = null;
          }
          elements.push(<h3 key={`${blockKey}-h3-${i}`} className="msg-h3">{parseInline(line.slice(4))}</h3>);
          continue;
        }
        if (line.startsWith('## ')) {
          if (currentList) {
            const Tag = listType === 'ul' ? 'ul' : 'ol';
            elements.push(<Tag key={`${blockKey}-list-${i}`} className={`msg-${listType}`}>{currentList}</Tag>);
            currentList = null;
            listType = null;
          }
          elements.push(<h2 key={`${blockKey}-h2-${i}`} className="msg-h2">{parseInline(line.slice(3))}</h2>);
          continue;
        }
        if (line.startsWith('# ')) {
          if (currentList) {
            const Tag = listType === 'ul' ? 'ul' : 'ol';
            elements.push(<Tag key={`${blockKey}-list-${i}`} className={`msg-${listType}`}>{currentList}</Tag>);
            currentList = null;
            listType = null;
          }
          elements.push(<h1 key={`${blockKey}-h1-${i}`} className="msg-h1">{parseInline(line.slice(2))}</h1>);
          continue;
        }
        
        const ulMatch = line.match(/^[\s]*[-*][\s]+(.*)/);
        if (ulMatch) {
          if (listType !== 'ul') {
            if (currentList) {
              const Tag = listType === 'ul' ? 'ul' : 'ol';
              elements.push(<Tag key={`${blockKey}-list-${i}`} className={`msg-${listType}`}>{currentList}</Tag>);
            }
            currentList = [];
            listType = 'ul';
          }
          currentList.push(<li key={`${blockKey}-li-${i}`} className="msg-li">{parseInline(ulMatch[1])}</li>);
          continue;
        }
        
        const olMatch = line.match(/^[\s]*\d+\.[\s]+(.*)/);
        if (olMatch) {
          if (listType !== 'ol') {
            if (currentList) {
              const Tag = listType === 'ul' ? 'ul' : 'ol';
              elements.push(<Tag key={`${blockKey}-list-${i}`} className={`msg-${listType}`}>{currentList}</Tag>);
            }
            currentList = [];
            listType = 'ol';
          }
          currentList.push(<li key={`${blockKey}-li-${i}`} className="msg-li">{parseInline(olMatch[1])}</li>);
          continue;
        }
        
        if (line.trim() === '') {
          if (currentList) {
            const Tag = listType === 'ul' ? 'ul' : 'ol';
            elements.push(<Tag key={`${blockKey}-list-${i}`} className={`msg-${listType}`}>{currentList}</Tag>);
            currentList = null;
            listType = null;
          }
          continue;
        }
        
        if (currentList) {
          const Tag = listType === 'ul' ? 'ul' : 'ol';
          elements.push(<Tag key={`${blockKey}-list-${i}`} className={`msg-${listType}`}>{currentList}</Tag>);
          currentList = null;
          listType = null;
        }
        
        elements.push(<p key={`${blockKey}-p-${i}`} className="msg-p">{parseInline(line)}</p>);
      }
      
      if (currentList) {
        const Tag = listType === 'ul' ? 'ul' : 'ol';
        elements.push(<Tag key={`${blockKey}-list-end`} className={`msg-${listType}`}>{currentList}</Tag>);
      }
      
      return elements;
    };

    while ((match = codeBlockRx.exec(text)) !== null) {
      if (match.index > last) {
        parts.push(...parseMarkdownInlineAndBlocks(text.slice(last, match.index), `block-${last}`));
      }
      parts.push(
        <pre key={match.index} className="msg-code-block">
          {match[1] && <span className="code-lang">{match[1]}</span>}
          <code>{match[2].trim()}</code>
        </pre>
      );
      last = match.index + match[0].length;
    }
    if (last < text.length) {
      parts.push(...parseMarkdownInlineAndBlocks(text.slice(last), `block-${last}`));
    }
    return parts.length ? parts : text;
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`msg-row ${isUser ? 'msg-user' : 'msg-ai'}`}>
      <div className={`msg-av ${isUser ? 'msg-av-user' : 'msg-av-ai'}`}>
        {isUser ? 'You' : 'AI'}
      </div>
      <div className="msg-bubble-wrap">
        <div className={`msg-bubble ${isUser ? 'msg-bubble-user' : 'msg-bubble-ai'}`}>
          <div className="msg-text">{renderContent(msg.content)}</div>
        </div>
        <div className="msg-meta">
          <span className="msg-time">{formatTime(msg.createdAt)}</span>
          {!isUser && (
            <div className="msg-actions">
              <button className="msg-action-btn" title={copied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
                {copied ? (
                  <svg viewBox="0 0 16 16" fill="none" stroke="#4ade80" strokeWidth="1.8" width="12" height="12">
                    <path d="M2 8l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
                    <rect x="5" y="5" width="9" height="9" rx="2"/>
                    <path d="M10 5V3a2 2 0 00-2-2H3a2 2 0 00-2 2v5a2 2 0 002 2h2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatArea({
  isDark,
  onToggleTheme,
  onToggleSidebar,
  token,
  activeChatId,
  setActiveChatId,
  chats,
  setChats
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(data => setApiStatus(data.geminiReady ? 'ok' : 'no-key'))
      .catch(() => setApiStatus('error'));
  }, []);

  useEffect(() => {
    if (activeChatId) {
      loadChatMessages(activeChatId);
    } else {
      setMessages([]);
      setShowWelcome(true);
      setError(null);
    }
  }, [activeChatId]);

  const loadChatMessages = async (chatId) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load conversation');
      setMessages(data.messages);
      setShowWelcome(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const sendMessage = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || isTyping) return;

    const dummyUserMsg = { _id: 'temp-user', role: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, dummyUserMsg]);
    setInput('');
    setIsTyping(true);
    setShowWelcome(false);
    setError(null);

    try {
      if (activeChatId) {
        const res = await fetch(`${API_BASE}/api/chats/${activeChatId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to send message');
        
        setMessages(prev => prev.filter(m => m._id !== 'temp-user').concat(data.messages));
        
        setChats(prev => {
          const target = prev.find(c => c._id === activeChatId);
          if (target) {
            target.updatedAt = new Date().toISOString();
            return [target, ...prev.filter(c => c._id !== activeChatId)];
          }
          return prev;
        });
      } else {
        const res = await fetch(`${API_BASE}/api/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to start conversation');
        
        setChats(prev => [data.chat, ...prev]);
        setMessages(data.messages);
        setActiveChatId(data.chat._id);
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m._id !== 'temp-user'));
      setError(err.message);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, activeChatId, token, setChats, setActiveChatId]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggest = (text) => {
    inputRef.current?.focus();
    sendMessage(text);
  };

  const statusColor = {
    ok:      '#4ade80',
    'no-key':'#fbbf24',
    error:   '#f87171',
    unknown: '#9ca3af',
  }[apiStatus];

  const statusLabel = {
    ok:      'Agent Ready',
    'no-key':'API Key Missing',
    error:   'Backend Offline',
    unknown: 'Connecting…',
  }[apiStatus];

  return (
    <main className="chat-area">
      <header className="chat-header">
        <div className="hdr-left">
          <button className="hdr-menu-btn" onClick={onToggleSidebar} id="menu-toggle-btn" title="Toggle sidebar">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="hdr-brand-wrap">
            <span className="hdr-brand">SYNTHETIX <span>AI</span></span>
            <div className="hdr-agent-pill">
              <span className="hdr-pill-dot" style={{ background: statusColor, boxShadow: `0 0 7px ${statusColor}` }}/>
              {statusLabel}
            </div>
          </div>
        </div>

        <div className="hdr-right">
          <button className="hdr-icon-btn theme-toggle-btn" id="theme-toggle-btn" onClick={onToggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <SunIcon/> : <MoonIcon/>}
          </button>
        </div>
      </header>

      {showWelcome ? (
        <WelcomeScreen onSuggest={handleSuggest}/>
      ) : (
        <div className="messages-container">
          <div className="messages-inner">
            {messages.map(msg => <Message key={msg._id} msg={msg}/>)}
            {isTyping && <TypingIndicator/>}
            <div ref={bottomRef}/>
          </div>
        </div>
      )}

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)}/>}

      <div className="input-area">
        <div className="input-wrap">
          <div className="input-bar">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              className="chat-input"
              placeholder={apiStatus === 'error' ? 'Backend offline — start server first' : 'Ask me anything…'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              autoComplete="off"
              disabled={isTyping || apiStatus === 'error'}
            />
            <div className="input-btns">
              <button
                id="send-btn"
                className={`send-btn ${input.trim() ? 'ready' : ''}`}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping || apiStatus === 'error'}
                title="Send message"
              >
                <SendIcon/>
              </button>
            </div>
          </div>
          <p className="input-footer">
            <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </main>
  );
}
