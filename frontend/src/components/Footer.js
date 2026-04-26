import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetch((process.env.REACT_APP_API_URL || 'http://localhost:5001/api') + '/public/settings')
      .then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  let footerLinks = [];
  try { footerLinks = JSON.parse(settings.footer_links || '[]'); } catch { footerLinks = []; }
  if (footerLinks.length === 0) {
    footerLinks = [
      { label: 'בית', url: '/' },
      { label: 'תקנון הפורום', url: '/terms' },
      { label: 'מדיניות פרטיות', url: '/privacy' },
      { label: 'צור קשר', url: '/contact' },
    ];
  }

  return (
    <footer className="footer" style={{ direction: 'rtl' }}>
      <div className="footer-inner">
        <div className="footer-links">
          {footerLinks.map((link, i) => (
            link.url.startsWith('http') ? <a key={i} href={link.url} target="_blank" rel="noreferrer">{link.label}</a> : <Link key={i} to={link.url}>{link.label}</Link>
          ))}
        </div>
        <span className="footer-copy">{settings.footer_text || `פורום חב"ד © ${new Date().getFullYear()} · כל הזכויות שמורות`}</span>
      </div>
    </footer>
  );
}
