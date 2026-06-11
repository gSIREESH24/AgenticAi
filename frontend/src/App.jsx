import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Auth from './components/Auth';
import PdfExtractor from './components/PdfExtractor';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [currentView, setCurrentView] = useState('chat');
  const [pdfs, setPdfs] = useState([]);
  const [activePdfId, setActivePdfId] = useState(null);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  useEffect(() => {
    if (token) {
      fetchChats();
      fetchPdfs();
    }
  }, [token]);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setChats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPdfs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pdfs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPdfs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setChats([]);
    setActiveChatId(null);
  };

  const toggleSidebar = () => setSidebarOpen(p => !p);
  const toggleTheme = () => setIsDark(p => !p);

  if (!token) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`app-layout ${sidebarOpen ? 'sb-open' : 'sb-closed'}`}>
      {isMobile && sidebarOpen && (
        <div className="sb-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        open={sidebarOpen}
        onToggle={toggleSidebar}
        isMobile={isMobile}
        token={token}
        chats={chats}
        setChats={setChats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        pdfs={pdfs}
        setPdfs={setPdfs}
        activePdfId={activePdfId}
        setActivePdfId={setActivePdfId}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
        username={user?.username}
      />

      {currentView === 'chat' ? (
        <ChatArea
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          token={token}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          chats={chats}
          setChats={setChats}
        />
      ) : (
        <PdfExtractor
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          token={token}
          activePdfId={activePdfId}
          setActivePdfId={setActivePdfId}
          pdfs={pdfs}
          setPdfs={setPdfs}
        />
      )}
    </div>
  );
}
