import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../api';
import { LayoutDashboard, FolderOpen, Users, MessageSquare, Settings, Megaphone, Trash2, Edit2, Plus, X, Shield, Ban, Pin, Lock, Eye, EyeOff, FileText } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'סקירה כללית', icon: LayoutDashboard },
  { id: 'categories', label: 'קטגוריות', icon: FolderOpen },
  { id: 'users', label: 'משתמשים', icon: Users },
  { id: 'threads', label: 'אשכולות', icon: MessageSquare },
  { id: 'pages', label: 'עמודים', icon: FileText },
  { id: 'announcements', label: 'הודעות', icon: Megaphone },
  { id: 'settings', label: 'הגדרות אתר', icon: Settings },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  if (!user || !isAdmin) { navigate('/'); return null; }

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h3 style={{ fontSize: 16, color: 'var(--primary)', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--accent)' }}>🛠️ ניהול הפורום</h3>
        {TABS.map(t => (
          <button key={t.id} className={`admin-nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'right' }}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>
      <div className="admin-content">
        {tab === 'dashboard' && <AdminOverview />}
        {tab === 'categories' && <AdminCategories />}
        {tab === 'users' && <AdminUsers />}
        {tab === 'threads' && <AdminThreads />}
        {tab === 'pages' && <AdminPages />}
        {tab === 'announcements' && <AdminAnnouncements />}
        {tab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminAPI.getStats().then(r => setStats(r.data)).catch(console.error); }, []);
  if (!stats) return <div className="loading"><div className="spinner" /></div>;
  return (
    <div>
      <h2 style={{ marginBottom: 20, color: 'var(--primary)' }}>סקירה כללית</h2>
      <div className="admin-stats">
        <div className="admin-stat-card"><h3>{stats.users?.total || 0}</h3><p>משתמשים</p></div>
        <div className="admin-stat-card"><h3>{stats.threads?.total || 0}</h3><p>אשכולות</p></div>
        <div className="admin-stat-card"><h3>{stats.posts?.total || 0}</h3><p>הודעות</p></div>
        <div className="admin-stat-card"><h3>{stats.categories?.total || 0}</h3><p>קטגוריות</p></div>
      </div>
      <div style={{ background: 'var(--border-light)', padding: 20, borderRadius: 'var(--radius)' }}>
        <h3 style={{ marginBottom: 8 }}>פעילות אחרונה</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>פעילים בשבוע האחרון: <strong>{stats.users?.active_week || 0}</strong> משתמשים</p>
      </div>
    </div>
  );
}

function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '📁', color: '#3b82f6', sort_order: 0, parent_id: '', is_visible: true });

  const load = () => adminAPI.getCategories().then(r => setCats(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, parent_id: form.parent_id || null };
    if (editing) await adminAPI.updateCategory(editing, data);
    else await adminAPI.createCategory(data);
    setShowForm(false); setEditing(null); load();
  };

  const openEdit = (c) => {
    setForm({ name: c.name, slug: c.slug, description: c.description || '', icon: c.icon, color: c.color, sort_order: c.sort_order, parent_id: c.parent_id || '', is_visible: c.is_visible });
    setEditing(c.id); setShowForm(true);
  };

  const openNew = () => {
    setForm({ name: '', slug: '', description: '', icon: '📁', color: '#3b82f6', sort_order: 0, parent_id: '', is_visible: true });
    setEditing(null); setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: 'var(--primary)' }}>ניהול קטגוריות</h2>
        <button className="btn btn-accent" onClick={openNew}><Plus size={14} />קטגוריה חדשה</button>
      </div>

      <table>
        <thead><tr><th>סדר</th><th>אייקון</th><th>שם</th><th>Slug</th><th>אב</th><th>נראה</th><th>פעולות</th></tr></thead>
        <tbody>
          {cats.map(c => (
            <tr key={c.id}>
              <td>{c.sort_order}</td>
              <td style={{ fontSize: 20 }}>{c.icon}</td>
              <td><strong>{c.name}</strong><br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.description}</span></td>
              <td style={{ fontSize: 12 }}>{c.slug}</td>
              <td style={{ fontSize: 12 }}>{c.parent_id ? cats.find(x => x.id === c.parent_id)?.name || '—' : '—'}</td>
              <td>{c.is_visible ? '✅' : '❌'}</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}><Edit2 size={12} /></button>
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={async () => { if(window.confirm('למחוק?')) { await adminAPI.deleteCategory(c.id); load(); }}}><Trash2 size={12} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3>{editing ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>שם</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="form-group"><label>Slug</label><input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required /></div>
                <div className="form-group"><label>אייקון</label><input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} /></div>
                <div className="form-group"><label>צבע</label><input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
                <div className="form-group"><label>סדר</label><input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>קטגוריית אב</label>
                  <select value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}>
                    <option value="">ללא (ראשי)</option>
                    {cats.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>תיאור</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
              <div className="form-group" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={form.is_visible} onChange={e => setForm({...form, is_visible: e.target.checked})} id="vis" />
                <label htmlFor="vis" style={{ margin: 0 }}>גלוי באתר</label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-accent">{editing ? 'עדכן' : 'צור'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', display_name: '', role: 'user' });
  const load = () => adminAPI.getUsers().then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(newUser);
      setShowNew(false); setNewUser({ username: '', email: '', password: '', display_name: '', role: 'user' }); load();
    } catch (err) { alert(err.response?.data?.error || 'שגיאה'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: 'var(--primary)' }}>ניהול משתמשים</h2>
        <button className="btn btn-accent" onClick={() => setShowNew(true)}><Plus size={14} />משתמש חדש</button>
      </div>

      {showNew && (
        <div style={{ background: 'var(--border-light)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>יצירת משתמש חדש</h3>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="form-group"><label>שם משתמש *</label><input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required /></div>
              <div className="form-group"><label>אימייל *</label><input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required /></div>
              <div className="form-group"><label>סיסמה *</label><input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required minLength={6} /></div>
              <div className="form-group"><label>שם תצוגה</label><input value={newUser.display_name} onChange={e => setNewUser({...newUser, display_name: e.target.value})} /></div>
              <div className="form-group"><label>תפקיד</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="user">משתמש</option><option value="moderator">מנחה</option><option value="admin">מנהל</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-accent">צור משתמש</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowNew(false)}>ביטול</button>
            </div>
          </form>
        </div>
      )}

      <table>
        <thead><tr><th>שם</th><th>אימייל</th><th>תפקיד</th><th>הודעות</th><th>חסום</th><th>הצטרף</th><th>פעולות</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td><strong>{u.username}</strong></td>
              <td style={{ fontSize: 12 }}>{u.email}</td>
              <td>
                <select value={u.role} onChange={async e => { await adminAPI.updateUserRole(u.id, e.target.value); load(); }}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 12 }}>
                  <option value="user">משתמש</option><option value="moderator">מנחה</option><option value="admin">מנהל</option>
                </select>
              </td>
              <td>{u.post_count}</td>
              <td>{u.is_banned ? '🚫' : '✅'}</td>
              <td style={{ fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('he-IL')}</td>
              <td>
                <button className="btn btn-outline btn-sm" onClick={async () => { await adminAPI.banUser(u.id, !u.is_banned); load(); }}>
                  {u.is_banned ? <><Eye size={12} /> שחרר</> : <><Ban size={12} /> חסום</>}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminThreads() {
  const [threads, setThreads] = useState([]);
  const [cats, setCats] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newThread, setNewThread] = useState({ category_id: '', title: '', content: '' });
  const load = () => { adminAPI.getThreads().then(r => setThreads(r.data)); adminAPI.getCategories().then(r => setCats(r.data)); };
  useEffect(() => { load(); }, []);

  const toggle = async (id, field, value) => { await adminAPI.updateThread(id, { [field]: value }); load(); };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createThread(newThread);
      setShowNew(false); setNewThread({ category_id: '', title: '', content: '' }); load();
    } catch (err) { alert(err.response?.data?.error || 'שגיאה'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: 'var(--primary)' }}>ניהול אשכולות</h2>
        <button className="btn btn-accent" onClick={() => setShowNew(true)}><Plus size={14} />אשכול חדש</button>
      </div>

      {showNew && (
        <div style={{ background: 'var(--border-light)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>אשכול חדש</h3>
          <form onSubmit={handleCreateThread}>
            <div className="form-group"><label>קטגוריה</label>
              <select value={newThread.category_id} onChange={e => setNewThread({...newThread, category_id: e.target.value})} required>
                <option value="">בחר קטגוריה</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>כותרת</label><input value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})} required /></div>
            <div className="form-group"><label>תוכן</label><textarea value={newThread.content} onChange={e => setNewThread({...newThread, content: e.target.value})} rows={4} required /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-accent">פרסם</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowNew(false)}>ביטול</button>
            </div>
          </form>
        </div>
      )}
      <table>
        <thead><tr><th>כותרת</th><th>מחבר</th><th>קטגוריה</th><th>נעוץ</th><th>נעול</th><th>גלוי</th><th>פעולות</th></tr></thead>
        <tbody>
          {threads.map(t => (
            <tr key={t.id}>
              <td><strong>{t.title}</strong></td>
              <td style={{ fontSize: 12 }}>{t.author}</td>
              <td style={{ fontSize: 12 }}>{t.category_name}</td>
              <td><button className="btn btn-outline btn-sm" onClick={() => toggle(t.id, 'is_pinned', !t.is_pinned)}>{t.is_pinned ? <Pin size={12} color="#d97706" /> : <Pin size={12} />}</button></td>
              <td><button className="btn btn-outline btn-sm" onClick={() => toggle(t.id, 'is_locked', !t.is_locked)}>{t.is_locked ? <Lock size={12} color="#dc2626" /> : <Lock size={12} />}</button></td>
              <td><button className="btn btn-outline btn-sm" onClick={() => toggle(t.id, 'is_visible', !t.is_visible)}>{t.is_visible ? <Eye size={12} /> : <EyeOff size={12} color="#dc2626" />}</button></td>
              <td><button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={async () => { if(window.confirm('למחוק?')) { await adminAPI.deleteThread(t.id); load(); }}}><Trash2 size={12} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminPages() {
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ slug: '', title: '', content: '', is_published: true, sort_order: 0 });
  const load = () => adminAPI.getPages().then(r => setPages(r.data));
  useEffect(() => { load(); }, []);

  const openEdit = (p) => { setForm({ slug: p.slug, title: p.title, content: p.content || '', is_published: p.is_published, sort_order: p.sort_order }); setEditing(p.id); };
  const openNew = () => { setForm({ slug: '', title: '', content: '', is_published: true, sort_order: 0 }); setEditing('new'); };
  const cancel = () => setEditing(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing === 'new') await adminAPI.createPage(form);
    else await adminAPI.updatePage(editing, form);
    setEditing(null); load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ color: 'var(--primary)' }}>ניהול עמודים</h2>
        <button className="btn btn-accent" onClick={openNew}><Plus size={14} />עמוד חדש</button>
      </div>

      {editing ? (
        <div style={{ background: 'var(--border-light)', padding: 20, borderRadius: 8 }}>
          <h3 style={{ marginBottom: 12 }}>{editing === 'new' ? 'עמוד חדש' : 'עריכת עמוד'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <div className="form-group"><label>כותרת *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div className="form-group"><label>Slug (כתובת) *</label><input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} required style={{ direction: 'ltr' }} placeholder="terms" /></div>
              <div className="form-group"><label>סדר</label><input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value) || 0})} /></div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                <input type="checkbox" checked={form.is_published} onChange={e => setForm({...form, is_published: e.target.checked})} id="pg_pub" />
                <label htmlFor="pg_pub" style={{ margin: 0 }}>מפורסם</label>
              </div>
            </div>
            <div className="form-group">
              <label>תוכן העמוד</label>
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={15} style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }} placeholder="ניתן להשתמש ב-Markdown: # כותרת, ** מודגש **, - רשימה" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-accent">💾 שמור</button>
              <button type="button" className="btn btn-outline" onClick={cancel}>ביטול</button>
            </div>
          </form>
        </div>
      ) : (
        <table>
          <thead><tr><th>כותרת</th><th>כתובת</th><th>מפורסם</th><th>עודכן</th><th>פעולות</th></tr></thead>
          <tbody>
            {pages.map(p => (
              <tr key={p.id}>
                <td><strong>{p.title}</strong></td>
                <td style={{ fontSize: 12, direction: 'ltr' }}>/{p.slug}</td>
                <td>{p.is_published ? '✅' : '❌'}</td>
                <td style={{ fontSize: 12 }}>{new Date(p.updated_at).toLocaleDateString('he-IL')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><Edit2 size={12} /> ערוך</button>
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={async () => { if(window.confirm('למחוק?')) { await adminAPI.deletePage(p.id); load(); }}}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30 }}>אין עמודים</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const load = () => adminAPI.getAnnouncements().then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    await adminAPI.createAnnouncement({ title, content });
    setTitle(''); setContent(''); load();
  };

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', marginBottom: 16 }}>הודעות מערכת</h2>
      <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
        <div className="form-group"><label>כותרת</label><input value={title} onChange={e => setTitle(e.target.value)} required /></div>
        <div className="form-group"><label>תוכן</label><textarea value={content} onChange={e => setContent(e.target.value)} rows={2} /></div>
        <button className="btn btn-accent"><Plus size={14} />הוסף הודעה</button>
      </form>
      {items.map(a => (
        <div key={a.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><strong>{a.title}</strong><br/><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.content}</span></div>
          <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={async () => { await adminAPI.deleteAnnouncement(a.id); load(); }}><Trash2 size={12} /></button>
        </div>
      ))}
    </div>
  );
}

function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [footerLinks, setFooterLinks] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminAPI.getSettings().then(r => {
      setSettings(r.data);
      try { setFooterLinks(JSON.parse(r.data.footer_links || '[]')); } catch { setFooterLinks([]); }
    });
  }, []);

  const handleSave = async () => {
    await adminAPI.updateSettings({ ...settings, footer_links: JSON.stringify(footerLinks) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  const addFooterLink = () => setFooterLinks(l => [...l, { label: '', url: '' }]);
  const updateFooterLink = (i, field, value) => setFooterLinks(l => { const n = [...l]; n[i] = { ...n[i], [field]: value }; return n; });
  const removeFooterLink = (i) => setFooterLinks(l => l.filter((_, idx) => idx !== i));

  return (
    <div>
      <h2 style={{ color: 'var(--primary)', marginBottom: 16 }}>הגדרות האתר</h2>

      <div style={{ background: 'var(--border-light)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12, fontSize: 15 }}>הגדרות כלליות</h3>
        <div className="form-group"><label>שם האתר</label><input value={settings.site_name || ''} onChange={e => updateField('site_name', e.target.value)} /></div>
        <div className="form-group"><label>תיאור</label><input value={settings.site_description || ''} onChange={e => updateField('site_description', e.target.value)} /></div>
        <div className="form-group"><label>לוגו (אימוג'י/טקסט)</label><input value={settings.site_logo || ''} onChange={e => updateField('site_logo', e.target.value)} /></div>
        <div className="form-grid">
          <div className="form-group"><label>צבע ראשי</label><input type="color" value={settings.primary_color || '#1a365d'} onChange={e => updateField('primary_color', e.target.value)} /></div>
          <div className="form-group"><label>צבע הדגשה</label><input type="color" value={settings.accent_color || '#c9a84c'} onChange={e => updateField('accent_color', e.target.value)} /></div>
        </div>
        <div className="form-group"><label>הודעת ברוכים הבאים</label><textarea value={settings.welcome_message || ''} onChange={e => updateField('welcome_message', e.target.value)} rows={3} /></div>
      </div>

      <div style={{ background: 'var(--border-light)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15 }}>קישורי פוטר</h3>
          <button className="btn btn-outline btn-sm" onClick={addFooterLink}><Plus size={12} />הוסף קישור</button>
        </div>
        {footerLinks.map((link, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input placeholder="טקסט (למשל: צור קשר)" value={link.label} onChange={e => updateFooterLink(i, 'label', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} />
            <input placeholder="כתובת (למשל: /contact)" value={link.url} onChange={e => updateFooterLink(i, 'url', e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, direction: 'ltr' }} />
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeFooterLink(i)}><Trash2 size={12} /></button>
          </div>
        ))}
        {footerLinks.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>אין קישורים מוגדרים. יוצגו קישורי ברירת מחדל.</p>}
      </div>

      <div style={{ background: 'var(--border-light)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>פוטר</h3>
        <div className="form-group"><label>טקסט פוטר</label><input value={settings.footer_text || ''} onChange={e => updateField('footer_text', e.target.value)} /></div>
      </div>

      <button className="btn btn-accent" onClick={handleSave} style={{ padding: '10px 24px', fontSize: 14 }}>💾 שמור הגדרות</button>
      {saved && <span style={{ marginRight: 12, color: 'var(--success)', fontSize: 14 }}>✅ נשמר בהצלחה!</span>}
    </div>
  );
}
