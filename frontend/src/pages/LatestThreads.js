import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { threadsAPI } from '../api';
import { Zap } from 'lucide-react';

const COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
const getColor = (s) => COLORS[(s||'').charCodeAt(0) % COLORS.length];

export default function LatestThreads() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    threadsAPI.getAll({ limit: 30, search: search || undefined })
      .then(r => setThreads(r.data.threads || []))
      .catch(console.error).finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={24} /> מה חדש?</h1>
        <input placeholder="חיפוש..." value={search} onChange={e => { setSearch(e.target.value); setLoading(true); }}
          style={{ padding: '8px 14px', border: '1.5px solid var(--border)', borderRadius: 6, fontSize: 14, width: 250 }} />
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="thread-list">
          {threads.map(t => (
            <div className="thread-row" key={t.id}>
              <div className="thread-avatar" style={{ background: getColor(t.author_username) }}>
                {(t.author_display_name || t.author_username || '?')[0]}
              </div>
              <div className="thread-info">
                <h3><Link to={`/thread/${t.id}`}>{t.title}</Link></h3>
                <div className="thread-meta">
                  {t.author_display_name} · {timeAgo(t.created_at)} · <Link to={`/category/${t.category_slug}`} style={{ color: 'var(--info)' }}>{t.category_name}</Link>
                </div>
              </div>
              <div className="thread-stat"><span className="num">{t.reply_count}</span><span className="label">תגובות</span></div>
              <div className="thread-stat"><span className="num">{t.view_count}</span><span className="label">צפיות</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(t.last_post_at)}</div>
            </div>
          ))}
          {threads.length === 0 && <div className="empty-state"><p>לא נמצאו תוצאות</p></div>}
        </div>
      )}
    </div>
  );
}

function timeAgo(d) { if(!d)return''; const s=(Date.now()-new Date(d))/1000; if(s<60)return'לפני רגע'; if(s<3600)return`לפני ${Math.floor(s/60)} דקות`; if(s<86400)return`לפני ${Math.floor(s/3600)} שעות`; if(s<604800)return`לפני ${Math.floor(s/86400)} ימים`; return new Date(d).toLocaleDateString('he-IL'); }
