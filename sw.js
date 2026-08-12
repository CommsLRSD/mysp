var CACHE_NAME = 'mysp-shell-v1';
var CACHE_PREFIX = 'mysp-';
var CORE_ASSETS = [
	'/mysp/',
	'/mysp/index.html',
	'/mysp/css/style.css',
	'/mysp/js/main.js',
	'/mysp/js/auth-gate.js',
	'/mysp/manifest.webmanifest',
	'/mysp/public/images/mysp-icon-192.png',
	'/mysp/public/images/mysp-icon-512.png'
];

self.addEventListener('install', function (event)
{
	event.waitUntil(
		caches.open(CACHE_NAME).then(function (cache)
		{
			return cache.addAll(CORE_ASSETS);
		}).then(function ()
		{
			return self.skipWaiting();
		})
	);
});

self.addEventListener('activate', function (event)
{
	event.waitUntil(
		caches.keys().then(function (keys)
		{
			return Promise.all(
				keys.map(function (key)
				{
					if (key !== CACHE_NAME && key.indexOf(CACHE_PREFIX) === 0) return caches.delete(key);
				})
			);
		}).then(function ()
		{
			return self.clients.claim();
		})
	);
});

self.addEventListener('fetch', function (event)
{
	if (event.request.method !== 'GET') return;
	var url = new URL(event.request.url);
	if (url.origin !== self.location.origin) return;

	event.respondWith(
		caches.match(event.request).then(function (cached)
		{
			if (cached) return cached;
			return fetch(event.request).then(function (response)
			{
				if (!response) throw new Error('Empty network response');
				if (response.status !== 200 || response.type !== 'basic') return response;
				var responseClone = response.clone();
				caches.open(CACHE_NAME).then(function (cache)
				{
					return cache.put(event.request, responseClone);
				}).catch(function () {});
				return response;
			}).catch(function ()
			{
				return caches.match('/mysp/index.html');
			});
		})
	);
});
