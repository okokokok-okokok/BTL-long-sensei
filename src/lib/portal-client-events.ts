export const PORTAL_CHANGED_KEY = 'ptit_portal_changed';
export const PORTAL_CHANGED_EVENT = 'ptit:portal-changed';

let portalChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    portalChannel = new BroadcastChannel('ptit_portal_channel');
  } catch {
    /* BroadcastChannel optional fallback */
  }
}

// Send an immediate invalidation signal to other tabs (storage + BroadcastChannel) and the current tab (CustomEvent).
export function notifyPortalChanged() {
  if (typeof window === 'undefined') return;
  const stamp = `${Date.now()}-${Math.random()}`;
  try {
    localStorage.setItem(PORTAL_CHANGED_KEY, stamp);
  } catch {
    /* Focus refresh still works if storage is disabled. */
  }
  try {
    window.dispatchEvent(new CustomEvent(PORTAL_CHANGED_EVENT, { detail: stamp }));
  } catch {
    /* Ignore error in restricted contexts */
  }
  try {
    portalChannel?.postMessage(stamp);
  } catch {
    /* Ignore BroadcastChannel post errors */
  }
}

// Unified listener for changes from other tabs, current tab, broadcast channel, or tab visibility.
export function onPortalChanged(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, 80);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PORTAL_CHANGED_KEY) debounced();
  };
  const handleCustom = () => debounced();
  const handleChannel = () => debounced();
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') debounced();
  };
  const handleFocus = () => debounced();

  window.addEventListener('storage', handleStorage);
  window.addEventListener(PORTAL_CHANGED_EVENT, handleCustom);
  window.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('focus', handleFocus);
  if (portalChannel) {
    portalChannel.addEventListener('message', handleChannel);
  }

  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(PORTAL_CHANGED_EVENT, handleCustom);
    window.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('focus', handleFocus);
    if (portalChannel) {
      portalChannel.removeEventListener('message', handleChannel);
    }
  };
}
