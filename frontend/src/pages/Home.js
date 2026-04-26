import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoriesAPI, threadsAPI } from '../api';

const AVATAR_COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'];
const getColor = (str) => AVATAR_COLORS[(str||'').charCodeAt(0) % AVATAR_COLORS.length];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [latestThreads, setLatestThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([categoriesAPI.getAll(), threadsAPI.getAll({ limit: 8 })])
      .then(([c, t]) => { setCategories(c.data); setLatestThreads(t.data.threads || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page-with-sidebar">
      {/* Sidebar - left side */}
      <div className="sidebar">
        <div className="sidebar-widget">
          <div className="sidebar-widget-header"><h3>סטטיסטיקות פורום</h3></div>
          <div className="sidebar-widget-body">
            <div className="sidebar-stat-row"><span className="label">נושאים:</span><span className="value">{latestThreads.length}+</span></div>
            <div className="sidebar-stat-row"><span className="label">קטגוריות:</span><span className="value">{categories.length}</span></div>
            <div className="sidebar-stat-row"><span className="label">הודעה אחרונה:</span><span className="value">{latestThreads[0] ? timeAgo(latestThreads[0].last_post_at) : '—'}</span></div>
          </div>
        </div>
        <div className="sidebar-widget">
          <div className="sidebar-widget-header"><h3>מאמרים אחרונים</h3></div>
          <div className="sidebar-widget-body">
            {latestThreads.slice(0, 3).map(t => (
              <div key={t.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                <Link to={`/thread/${t.id}`} style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 2 }}>{t.title}</Link>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.author_display_name} · {timeAgo(t.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content - right side */}
      <div>
        {/* Announcement */}
        <div className="announcement">
          <span className="announcement-icon">🕎</span>
          <div className="announcement-text">
            <strong>ברוכים הבאים לפורום חב"ד!</strong> הצטרפו לדיונים תורניים בנושאי חסידות, הלכה, שליחות ועוד.
          </div>
        </div>

        {/* Latest Threads Section */}
        <div className="thread-list" style={{ marginBottom: 20 }}>
          <div className="thread-list-header">
            <h2 style={{ color: 'var(--category-header-text)' }}>הודעות אחרונות</h2>
          </div>
          {latestThreads.map(t => (
            <div className="thread-row" key={t.id}>
              <div className="thread-avatar" style={{ background: getColor(t.author_username) }}>
                {(t.author_display_name || t.author_username || '?')[0]}
              </div>
              <div className="thread-info">
                <h3>
                  {t.is_pinned && <span className="badge badge-pinned" style={{ marginLeft: 6 }}>נעוץ</span>}
                  <Link to={`/thread/${t.id}`}>{t.title}</Link>
                </h3>
                <div className="thread-meta">
                  {t.author_display_name || t.author_username} · {timeAgo(t.created_at)} · {t.category_name}
                </div>
              </div>
              <div className="thread-stat"><span className="num">{t.reply_count}</span><span className="label">תגובות</span></div>
              <div className="thread-stat"><span className="num">{formatNum(t.view_count)}</span><span className="label">צפיות</span></div>
              <div className="forum-last-post">
                <div className="lp-avatar" style={{ background: getColor(t.last_post_username), flexShrink: 0 }}>
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

        {/* Forum Categories */}
        {categories.map(section => (
          <div className="forum-section" key={section.id}>
            <div className="forum-section-header">
              <h2>{section.icon} {section.name}</h2>
            </div>
            {/* Parent category row */}
            <ForumRow cat={section} />
            {/* Children */}
            {section.children?.map(child => <ForumRow key={child.id} cat={child} isChild />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function ForumRow({ cat, isChild }) {
  return (
    <div className="forum-row" style={isChild ? { gridTemplateColumns: '30px 1fr 80px 80px 200px' } : {}}>
      <div className="forum-icon" style={{ background: `${cat.color}15`, fontSize: isChild ? 16 : 22, width: isChild ? 30 : 44, height: isChild ? 30 : 44 }}>
        {cat.icon}
      </div>
      <div className="forum-info">
        <h3><Link to={`/category/${cat.slug}`}>{cat.name}</Link></h3>
        {cat.description && <div className="forum-desc">{cat.description}</div>}
      </div>
      <div className="forum-stat">
        <div className="stat-num">{formatNum(cat.thread_count || 0)}</div>
        <div className="stat-label">נושאים</div>
      </div>
      <div className="forum-stat">
        <div className="stat-num">{formatNum(cat.post_count || 0)}</div>
        <div className="stat-label">הודעות</div>
      </div>
      <div className="forum-last-post">
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {cat.last_post_at ? timeAgo(cat.last_post_at) : '—'}
        </div>
      </div>
    </div>
  );
}

function timeAgo(date) {
  if (!date) return '';
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'לפני רגע';
  if (diff < 3600) return `לפני ${Math.floor(diff/60)} דקות`;
  if (diff < 86400) return `לפני ${Math.floor(diff/3600)} שעות`;
  if (diff < 604800) return `לפני ${Math.floor(diff/86400)} ימים`;
  return new Date(date).toLocaleDateString('he-IL');
}

function formatNum(n) {
  n = parseInt(n) || 0;
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n/1000).toFixed(1) + 'K';
  return n.toString();
}
