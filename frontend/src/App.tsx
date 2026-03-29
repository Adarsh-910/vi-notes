import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ReportPage from './pages/ReportPage';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <Router>
      <div className="app-container">
        <button 
          onClick={toggleTheme} 
          style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, background: 'var(--bg-secondary)', border: '2px solid var(--accent-color)', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
          title="Toggle Light/Dark Mode"
        >
          {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
        </button>
        <Routes>
          <Route path="/auth" element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} />
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/report/:id" element={<ReportPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
