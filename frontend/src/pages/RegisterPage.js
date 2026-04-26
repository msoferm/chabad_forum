import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('סיסמה חייבת להיות לפחות 6 תווים');
    setLoading(true); setError('');
    try { await register(form); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'שגיאה בהרשמה'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🕎 הרשמה לפורום</h2>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 14, textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>שם משתמש *</label><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required /></div>
          <div className="form-group"><label>שם תצוגה</label><input value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} placeholder="השם שיוצג בפורום" /></div>
          <div className="form-group"><label>אימייל *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div className="form-group"><label>סיסמה *</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} /></div>
          <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: 12, fontSize: 15 }} disabled={loading}>{loading ? 'נרשם...' : 'הרשמה'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>כבר רשום? <Link to="/login">התחבר</Link></p>
      </div>
    </div>
  );
}
