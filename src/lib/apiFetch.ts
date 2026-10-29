// Keep the active tab's identity consistent for every request, including legacy screens.
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (typeof window !== 'undefined') {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin);
    if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
      const token = sessionStorage.getItem('ptit_session_token');
      if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return fetch(input, { ...init, headers, credentials: init.credentials || 'same-origin' });
}
