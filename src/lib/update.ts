/**
 * Drops the service worker and every cached file, then reloads, so the latest
 * deployed version is fetched. Progress lives in localStorage and is kept.
 */
export async function refreshApp() {
  try {
    const registrations = (await navigator.serviceWorker?.getRegistrations()) ?? [];
    await Promise.all(registrations.map((r) => r.unregister()));
    if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } finally {
    location.reload();
  }
}
