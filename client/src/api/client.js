const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

async function request(method, path, body) {
  const hasBody = body !== undefined;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : {},
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || 'Request failed');
    err.status = res.status;
    err.field = data ? data.field : undefined;
    throw err;
  }
  return data;
}

// The server stores UTC as 'YYYY-MM-DD HH:MM:SS' (SQLite datetime). Parse it as UTC.
export function parseServerDate(s) {
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s) ? `${s.replace(' ', 'T')}Z` : s;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const createListing = (body) => request('POST', '/listings', body);
export const getAvailable = (status) =>
  request('GET', `/listings/available${status ? `?status=${encodeURIComponent(status)}` : ''}`);
export const claimListing = (id, body) => request('POST', `/listings/${id}/claim`, body);
export const transitionListing = (id, body) => request('POST', `/listings/${id}/transition`, body);
export const getListing = (id) => request('GET', `/listings/${id}`);
export const getImpact = () => request('GET', '/impact');
