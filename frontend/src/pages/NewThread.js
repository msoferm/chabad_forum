import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { threadsAPI, categoriesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function NewThread() {
  const { categorySlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoriesAPI.getAll().then(r => {
      const allCats = [];
      r.data.forEach(c => { allCats.push(c); c.children?.forEach(ch => allCats.push(ch)); });
      setCategories(allCats);
      if (categorySlug) {
        const match = allCats.find(c => c.slug === categorySlug);
        if (match) setForm(f => ({ ...f, category_id: match.id }));
      }
    });
  }, [categorySlug]);

  if (!user) { navigate('/login'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content || !form.category_id) return alert('יש למלא את כל השדות');
    setSubmitting(true);
    try {
      const res = await threadsAPI.create(form);
      navigate(`/thread/${res.data.id}`);
    } catch (err) { alert(err.response?.data?.error || 'שגיאה'); setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 20, color: 'var(--primary)' }}>אשכול חדש</h1>
      <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 24 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>קטגוריה</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
              <option value="">בחר קטגוריה</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>כותרת</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="כותרת האשכול" required />
          </div>
          <div className="form-group">
            <label>תוכן</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="כתוב את ההודעה שלך..." rows={10} required />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
            <button type="submit" className="btn btn-accent" disabled={submitting}>{submitting ? 'שולח...' : 'פרסם אשכול'}</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}
