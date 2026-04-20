export async function resetAppData() {
  if (typeof window === "undefined") return;

  // 1. Unregister all service workers
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }

  // 2. Clear all caches
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  // 3. Clear local storage (if you use it)
  localStorage.clear();

  // 4. Hard reload (important)
  window.location.reload();
}
