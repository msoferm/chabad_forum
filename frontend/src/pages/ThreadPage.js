import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { threadsAPI, postsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { ThumbsUp, Edit2, MessageSquare, Clock, Award } from 'lucide-react';

const COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
const getColor = (s) => COLORS[(s||'').charCodeAt(0) % COLORS.length];
const ROLE_HE = { admin: 'מנהל', moderator: 'מנחה', user: 'חבר' };

export default function ThreadPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([threadsAPI.getById(id), postsAPI.getAll({ thread_id: id })])
      .then(([t, p]) => { setThread(t.data); setPosts(p.data.posts || []); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await postsAPI.create({ thread_id: id, content: reply });
      setReply('');
      load();
    } catch (err) { alert(err.response?.data?.error || 'שגיאה'); }
    finally { setSubmitting(false); }
  };

  const handleLike = async (postId) => {
    try { await postsAPI.like(postId); load(); } catch {}
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!thread) return <div className="empty-state"><p>אשכול לא נמצא</p></div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">פורומים</Link>
        <span>›</span>
        <Link to={`/category/${thread.category_slug}`}>{thread.category_name}</Link>
        <span>›</span>
        <span>{thread.title}</span>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
          {thread.is_pinned && <span className="badge badge-pinned" style={{ marginLeft: 8 }}>נעוץ</span>}
          {thread.is_locked && <span className="badge badge-locked" style={{ marginLeft: 8 }}>נעול</span>}
          {thread.title}
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
          <span>👁 {thread.view_count} צפיות</span>
          <span>💬 {thread.reply_count} תגובות</span>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post, i) => (
        <div className="post-card" key={post.id}>
          <div className="post-user-panel">
            <div className="post-avatar" style={{ background: getColor(post.username) }}>
              {(post.display_name || post.username || '?')[0]}
            </div>
            <span className="post-username">{post.display_name || post.username}</span>
            {post.user_role !== 'user' && (
              <span className={`post-role ${post.user_role}`}>{ROLE_HE[post.user_role]}</span>
            )}
            <div className="post-user-stats">
              <div>הודעות: {post.user_post_count || 0}</div>
              <div>הצטרף: {post.user_joined ? new Date(post.user_joined).toLocaleDateString('he-IL') : '—'}</div>
            </div>
          </div>
          <div className="post-content-area">
            <div className="post-header">
              <span><Clock size={12} /> {new Date(post.created_at).toLocaleDateString('he-IL')} {new Date(post.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
              {post.edited_at && <span style={{ fontStyle: 'italic' }}>נערך</span>}
              <span>#{i + 1}</span>
            </div>
            <div className="post-body">{post.content}</div>
            <div className="post-footer">
              {user && (
                <button className={`post-action ${post.liked ? 'liked' : ''}`} onClick={() => handleLike(post.id)}>
                  <ThumbsUp size={14} /> {post.like_count > 0 && post.like_count} אהבתי
                </button>
              )}
              {user && <button className="post-action"><MessageSquare size={14} /> ציטוט</button>}
            </div>
          </div>
        </div>
      ))}

      {/* Reply Form */}
      {user && !thread.is_locked ? (
        <div className="post-card" style={{ gridTemplateColumns: '1fr' }}>
          <form onSubmit={handleReply} style={{ padding: 20 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, color: 'var(--primary)' }}>הוסף תגובה</h3>
            <div className="form-group">
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="כתוב את תגובתך כאן..." rows={5} />
            </div>
            <button type="submit" className="btn btn-accent" disabled={submitting}>
              {submitting ? 'שולח...' : 'שלח תגובה'}
            </button>
          </form>
        </div>
      ) : !user ? (
        <div className="post-card" style={{ gridTemplateColumns: '1fr', padding: 24, textAlign: 'center' }}>
          <p>כדי להגיב, יש <Link to="/login">להתחבר</Link> או <Link to="/register">להירשם</Link></p>
        </div>
      ) : null}
    </div>
  );
}
