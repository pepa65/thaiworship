const CACHE_NAME='thaiworship-cache';
const urlsToCache=['/', '/index.html', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png', 'favicon.ico', 'maskable_icon.png', 'safari-pinned-tab.svg'];
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => cache.addAll(urlsToCache))
	);
});
self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request)
			.then(response => response || fetch(event.request))
	);
});
