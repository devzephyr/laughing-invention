"use client";

import { useEffect, useState } from 'react';

export default function DbStatusBadge() {
  const [status, setStatus] = useState<'unknown' | 'ok' | 'fail'>('unknown');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('admin')) return;
    let mounted = true;
    fetch('/api/db-status')
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        setStatus(j.ok ? 'ok' : 'fail');
      })
      .catch(() => setStatus('fail'));
    return () => {
      mounted = false;
    };
  }, []);

  if (status === 'unknown') return null;
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium ${status === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
      <span className={`h-2 w-2 rounded-full ${status === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
      DB: {status === 'ok' ? 'connected' : 'error'}
    </span>
  );
}
