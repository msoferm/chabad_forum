import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, LogIn, UserPlus, LogOut, Settings, MessageSquare, Zap } from 'lucide-react';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-top">
        <Link to="/" className="header-logo">
          <span className="header-logo-icon">🕎</span>
          <div>
            <h1>פורום חב"ד</h1>
            <p>חסידות · הלכה · שליחות · קהילה</p>
          </div>
        </Link>
        <div className="header-actions">
          {user ? (
            <>
              <div className="header-user">
                <div className="header-avatar">{user.display_name?.[0] || user.username[0]}</div>
                <span>{user.display_name || user.username}</span>
              </div>
              {isAdmin && <Link to="/admin" className="btn btn-accent btn-sm"><Settings size={14} />ניהול</Link>}
              <button className="btn btn-outline btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={logout}><LogOut size={14} /></button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}><LogIn size={14} />התחברות</Link>
              <Link to="/register" className="btn btn-accent btn-sm"><UserPlus size={14} />הרשמה</Link>
            </>
          )}
        </div>
      </div>
      <nav className="header-nav">
        <div className="header-nav-inner">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}><MessageSquare size={16} />פורומים</Link>
          <Link to="/latest" className={`nav-link ${location.pathname === '/latest' ? 'active' : ''}`}><Zap size={16} />מה חדש?</Link>
        </div>
      </nav>
      <div className="sub-nav">
        <div className="sub-nav-inner">
          <Link to="/" className="sub-nav-link">הודעות חדשות</Link>
          <Link to="/latest" className="sub-nav-link">חיפוש בפורומים</Link>
        </div>
      </div>
    </header>
  );
}
