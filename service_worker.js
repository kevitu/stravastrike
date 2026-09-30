'use strict';

const CACHE_PREFIX = 'strava-strike-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const APP_SHELL = ['./', './index.html', './assets/css/app.css', './assets/js/app.js', './assets/icon_192.png', './assets/icon_512.png', './manifest.webmanifest'];
const STATIC_URLS = new Set(APP_SHELL.map((path) => new URL(path, self.registration.scope).href));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  // Let an existing page finish its lifecycle before activating a future version.
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  // Exact static allowlist only: POSTs, APIs, screenshots, admin pages and private
  // records bypass this worker. User data is never written to Cache Storage.
  if (request.method !== 'GET' || !STATIC_URLS.has(request.url)) return;
  event.respondWith((async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(request, { signal: controller.signal });
      if (response.ok && response.type !== 'opaque') {
        try { const cache = await caches.open(CACHE_NAME); await cache.put(request, response.clone()); } catch { /* Storage failures never block network responses. */ }
        return response;
      }
      const cached = await caches.match(request);
      return cached || response;
    } catch {
      const cached = await caches.match(request);
      return cached || Response.error();
    } finally { clearTimeout(timeout); }
  })());
});
