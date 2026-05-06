'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [tema, setTema] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const salvo = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTema(salvo);
    if (salvo === 'light') document.documentElement.classList.add('light');
  }, []);

  function toggle() {
    const novo = tema === 'dark' ? 'light' : 'dark';
    setTema(novo);
    localStorage.setItem('theme', novo);
    document.documentElement.classList.toggle('light', novo === 'light');
  }

  return (
    <button onClick={toggle} style={{ background: 'none', border: '1px solid var(--avp-border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16, color: 'var(--avp-text)' }}>
      {tema === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
