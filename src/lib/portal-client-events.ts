export const PORTAL_CHANGED_KEY = 'ptit_portal_changed';

// Only send an invalidation signal. Each tab fetches data with its own session.
export function notifyPortalChanged() {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PORTAL_CHANGED_KEY, `${Date.now()}-${Math.random()}`); } catch { /* Focus refresh still works if storage is disabled. */ }
}
