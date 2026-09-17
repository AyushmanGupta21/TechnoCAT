import React from 'react';
import Link from 'next/link';

export default function PlaceholderPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FCFF', color: '#111827', fontFamily: 'sans-serif' }}>
      <img src="/logo.jpg" alt="TechnoCAT" style={{ height: '60px', marginBottom: '24px' }} />
      <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', color: '#0F172A' }}>Error Tracking</h1>
      <p style={{ color: '#64748B', marginBottom: '32px' }}>This feature is currently under development.</p>
      <Link href="/intelligence" style={{ padding: '12px 24px', background: '#2563EB', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
        &larr; Back to Intelligence Hub
      </Link>
    </div>
  );
}
