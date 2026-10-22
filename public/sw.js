// Combined service worker: PWA installability + OneSignal push, in one
// file, per OneSignal's documented approach for sites with their own
// service worker:
// https://documentation.onesignal.com/docs/onesignal-service-worker
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Minimal install/activate/fetch handlers — not doing any real caching
// yet, just enough for browsers that still check for a fetch handler as
// part of their "is this installable" criteria.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
