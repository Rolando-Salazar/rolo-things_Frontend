import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  Inbox,
  CalendarDays,
  CalendarRange,
  FolderOpen,
  BarChart2,
  CheckCircle2,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import TodayDashboard from './pages/TodayDashboard';
import Auth from './pages/Auth';
import { supabase } from './lib/supabase';

const Sidebar = ({ toggleTheme, isDark }: { toggleTheme: () => void, isDark: boolean }) => {
  return (
    <aside className="sidebar">
      <h1>
        <CheckCircle2 color="var(--accent-color)" size={24} />
        Rolo-Things
      </h1>
      <nav className="nav-menu" style={{ flex: 1 }}>
        <NavLink to="/inbox" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Inbox size={18} /> Inbox
        </NavLink>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CalendarDays size={18} /> Today
        </NavLink>
        <NavLink to="/upcoming" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CalendarRange size={18} /> Upcoming
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FolderOpen size={18} /> Projects
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart2 size={18} /> Analytics & Progress
        </NavLink>
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
            padding: '0.5rem 0.75rem', backgroundColor: 'transparent', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left'
          }}
          className="nav-item"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
            padding: '0.5rem 0.75rem', backgroundColor: 'transparent', border: 'none',
            color: 'var(--danger-color)', cursor: 'pointer', borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left'
          }}
          className="nav-item hover-danger"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>
    </aside>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isDark, setIsDark] = useState(() => {
    if (localStorage.getItem('theme') === 'dark') return true;
    if (localStorage.getItem('theme') === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  if (!session) {
    return <Auth />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar toggleTheme={toggleTheme} isDark={isDark} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<TodayDashboard session={session} />} />
            <Route path="*" element={<div><br /><h2>Work in progress...</h2></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
