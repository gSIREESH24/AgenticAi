# Synthetix AI — Chat Application

A premium, modern AI chat application featuring a gorgeous dynamic user interface in light and dark modes, powered by a fast **Express.js** backend integrated with the **Google Gemini API**.

---

## 🎨 Key Features

- **Dynamic Amber Theme**: Premium styling combining rich black/amber colors (dark mode) and soft brownish-orange colors (light mode).
- **Responsive Layout**: Designed to adjust seamlessly between desktop and mobile devices.
- **Virtual Keyboard Resizing**: Optimized for mobile devices using `dvh` units and `interactive-widget=resizes-content` viewport tags.
- **Collapse/Expand Sidebar**: Compact 60px icon rail or expanded sidebar with conversation history and state indicators.
- **Creative Neural Logo & Orb**: Custom-built geometric constellation network SVGs with breathing glowing animations.
- **Full-featured Backend**:
  - Built with Express, Helmet, CORS, and Express Rate Limit.
  - Fully integrated with `@google/generative-ai` SDK (Gemini-1.5-Flash).
  - Session-based conversation memory management.

---

## 📂 Project Structure

```text
Ai-Agent/
├── frontend/               # React (Vite) Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatArea.jsx    # Chat screen, welcome orb, and messages
│   │   │   ├── ChatArea.css
│   │   │   ├── Sidebar.jsx     # Collapsible sidebar & geometric logo
│   │   │   └── Sidebar.css
│   │   ├── App.jsx             # Main layout & responsive overlay
│   │   ├── App.css
│   │   ├── index.css           # Global theme variables & animations
│   │   └── main.jsx
│   ├── index.html              # Mobile viewport & PWA configurations
│   └── package.json
│
└── backend/                # Express + Gemini API Backend
    ├── services/
    │   └── geminiService.js    # Gemini SDK interaction wrapper
    ├── routes/
    │   └── chat.js             # Session & chat history routes
    ├── server.js               # Express entrypoint with security/rate-limiting
    ├── .env                    # Local environment config (API key here)
    └── package.json
```

---

## 🚀 How to Run the Project

### 1. Set Up the Backend
1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Double-check your environment variables in `.env` (the Gemini API Key should be added):
   ```ini
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   ```
3. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   The backend will start listening at [http://localhost:5000](http://localhost:5000).

### 2. Set Up the Frontend
1. Open a new terminal window/tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Run the frontend development server:
   ```bash
   npm run dev
   ```
   The application will start, usually listening at [http://localhost:5173](http://localhost:5173).

---

## 🔒 Security & Performance
- **Rate Limiting**: Global requests are limited to 200 per 15 minutes, and chat messages to 20 per minute per client.
- **Headers**: Secured using `helmet` to add critical security headers and prevent exploits.
- **Session Cleanup**: In-memory sessions automatically expire after 2 hours of inactivity to conserve server memory.
