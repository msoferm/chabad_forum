import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

// Simple markdown-like renderer
function renderContent(text) {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function StaticPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/pages/${slug}`)
      .then(r => { setPage(r.data); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (error || !page) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <h2 style={{ color: 'var(--text-muted)', marginBottom: 12 }}>עמוד לא נמצא</h2>
      <Link to="/" className="btn btn-primary">חזרה לדף הבית</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="breadcrumb">
        <Link to="/">בית</Link> <span>›</span> <span>{page.title}</span>
      </div>
      <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '32px 40px', direction: 'rtl' }}>
        <h1 style={{ fontSize: 24, color: 'var(--primary)', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid var(--accent)' }}>{page.title}</h1>
        <div style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: renderContent(page.content) }} />
      </div>
    </div>
  );
}
