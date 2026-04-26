import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await login(username, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'שגיאה בהתחברות'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🕎 התחברות</h2>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14, textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>שם משתמש או אימייל</label><input value={username} onChange={e => setUsername(e.target.value)} required /></div>
          <div className="form-group"><label>סיסמה</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: 12, fontSize: 15 }} disabled={loading}>{loading ? 'מתחבר...' : 'התחבר'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>אין לך חשבון? <Link to="/register">הרשמה</Link></p>
      </div>
    </div>
  );
}
