import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categoriesAPI, threadsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Pin, Lock } from 'lucide-react';

const COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
const getColor = (s) => COLORS[(s||'').charCodeAt(0) % COLORS.length];

export default function CategoryPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [threads, setThreads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      categoriesAPI.getBySlug(slug),
      threadsAPI.getAll({ category_slug: slug, page, limit: 20 })
    ]).then(([c, t]) => {
      setCategory(c.data);
      setThreads(t.data.threads || []);
      setTotal(t.data.total || 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, [slug, page]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!category) return <div className="empty-state"><p>קטגוריה לא נמצאה</p></div>;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/">פורומים</Link> <span>›</span> <span>{category.name}</span>
      </div>

      <div className="thread-list">
        <div className="thread-list-header">
          <h2>{category.icon} {category.name}</h2>
          {user && <Link to={`/new-thread/${slug}`} className="btn btn-accent"><Plus size={16} />אשכול חדש</Link>}
        </div>

        {threads.length === 0 ? (
          <div className="empty-state"><p>אין אשכולות בקטגוריה זו עדיין</p></div>
        ) : threads.map(t => (
          <div className={`thread-row ${t.is_pinned ? 'pinned' : ''}`} key={t.id}>
              <div className="thread-avatar" style={{ background: getColor(t.author_username) }}>
                {(t.author_display_name || t.author_username || '?')[0]}
              </div>
              <div className="thread-info">
                <h3>
                  {t.is_pinned && <Pin size={12} style={{ display: 'inline', marginLeft: 4, color: '#d97706' }} />}
                  {t.is_locked && <Lock size={12} style={{ display: 'inline', marginLeft: 4, color: '#dc2626' }} />}
                  <Link to={`/thread/${t.id}`}>{t.title}</Link>
                </h3>
                <div className="thread-meta">
                  {t.author_display_name || t.author_username} · {timeAgo(t.created_at)}
                </div>
              </div>
            <div className="thread-stat"><span className="num">{t.reply_count}</span><span className="label">תגובות</span></div>
            <div className="thread-stat"><span className="num">{t.view_count}</span><span className="label">צפיות</span></div>
            <div className="forum-last-post">
              <div className="lp-avatar" style={{ background: getColor(t.last_post_username) }}>
                {(t.last_post_display_name || t.last_post_username || '?')[0]}
              </div>
              <div className="lp-info">
                <span className="lp-title">{t.last_post_display_name || t.last_post_username}</span>
                <span className="lp-meta">{timeAgo(t.last_post_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {total > 20 && (
        <div className="pagination">
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
            <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(d) { if(!d)return''; const s=(Date.now()-new Date(d))/1000; if(s<60)return'לפני רגע'; if(s<3600)return`לפני ${Math.floor(s/60)} דקות`; if(s<86400)return`לפני ${Math.floor(s/3600)} שעות`; if(s<604800)return`לפני ${Math.floor(s/86400)} ימים`; return new Date(d).toLocaleDateString('he-IL'); }
