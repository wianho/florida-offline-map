// Florida Marine Navigation - Service Worker
// Enhanced for Ultimate Dataset (191 features, 0.76MB)

const CACHE_NAME = 'florida-marine-v3.0';
const CACHE_VERSION = '3.0';

// Files to cache for offline functionality
const CACHE_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/florida-ultimate-soundings.geojson',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    // Cache some tile layers for offline use (limited coverage)
    'https://tile.openstreetmap.org/7/40/50.png',
    'https://tile.openstreetmap.org/7/40/51.png',
    'https://tile.openstreetmap.org/7/41/50.png',
    'https://tile.openstreetmap.org/7/41/51.png'
];

// Tile patterns for dynamic caching
const TILE_PATTERNS = [
    /^https:\/\/.*\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png/,
    /^https:\/\/tileservice\.charts\.noaa\.gov\/tiles\/50000_1\/\d+\/\d+\/\d+\.png/
];

// Install Service Worker
self.addEventListener('install', function(event) {
    console.log('[ServiceWorker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[ServiceWorker] Caching core files...');
                return cache.addAll(CACHE_FILES);
            })
            .then(function() {
                console.log('[ServiceWorker] Core files cached successfully');
                return self.skipWaiting();
            })
            .catch(function(error) {
                console.error('[ServiceWorker] Caching failed:', error);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', function(event) {
    console.log('[ServiceWorker] Activating...');

    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        // Delete old caches
                        if (cacheName !== CACHE_NAME) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(function() {
                console.log('[ServiceWorker] Activated and ready');
                return self.clients.claim();
            })
    );
});

// Fetch Strategy: Cache First for App, Network First for Tiles
self.addEventListener('fetch', function(event) {
    const request = event.request;
    const url = new URL(request.url);

    // Handle different types of requests
    if (request.method !== 'GET') {
        return;
    }

    // Core app files - Cache First
    if (isCoreFile(request.url)) {
        event.respondWith(cacheFirstStrategy(request));
    }
    // Map tiles - Stale While Revalidate
    else if (isTileRequest(request.url)) {
        event.respondWith(staleWhileRevalidateStrategy(request));
    }
    // Other requests - Network First
    else {
        event.respondWith(networkFirstStrategy(request));
    }
});

// Check if URL is a core app file
function isCoreFile(url) {
    return CACHE_FILES.some(file => url.includes(file)) ||
           url.includes('leaflet') ||
           url.includes('.geojson') ||
           url.includes('manifest.json');
}

// Check if URL is a map tile
function isTileRequest(url) {
    return TILE_PATTERNS.some(pattern => pattern.test(url));
}

// Cache First Strategy (for core app files)
function cacheFirstStrategy(request) {
    return caches.match(request)
        .then(function(response) {
            if (response) {
                console.log('[ServiceWorker] Cache hit:', request.url);
                return response;
            }

            console.log('[ServiceWorker] Cache miss, fetching:', request.url);
            return fetch(request)
                .then(function(response) {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone response for caching
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(request, responseToCache);
                        });

                    return response;
                })
                .catch(function(error) {
                    console.error('[ServiceWorker] Fetch failed:', error);
                    // Return offline fallback if available
                    return caches.match('/index.html');
                });
        });
}

// Network First Strategy (for dynamic content)
function networkFirstStrategy(request) {
    return fetch(request)
        .then(function(response) {
            // Clone response for caching
            if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(function(cache) {
                        cache.put(request, responseToCache);
                    });
            }
            return response;
        })
        .catch(function(error) {
            console.log('[ServiceWorker] Network failed, trying cache:', request.url);
            return caches.match(request)
                .then(function(response) {
                    if (response) {
                        return response;
                    }
                    throw error;
                });
        });
}

// Stale While Revalidate Strategy (for map tiles)
function staleWhileRevalidateStrategy(request) {
    const fetchPromise = fetch(request)
        .then(function(response) {
            if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(function(cache) {
                        cache.put(request, responseToCache);
                    });
            }
            return response;
        })
        .catch(function(error) {
            console.log('[ServiceWorker] Tile fetch failed:', error);
        });

    return caches.match(request)
        .then(function(response) {
            return response || fetchPromise;
        });
}

// Background Sync for offline actions (future enhancement)
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync') {
        console.log('[ServiceWorker] Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Future: Sync offline navigation data, waypoints, etc.
    return Promise.resolve();
}

// Push notifications for navigation warnings (future enhancement)
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            tag: 'navigation-warning',
            requireInteraction: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// Cache size management
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'CACHE_SIZE') {
        event.waitUntil(
            getCacheSize().then(function(size) {
                event.ports[0].postMessage({
                    type: 'CACHE_SIZE_RESPONSE',
                    size: size
                });
            })
        );
    }
});

function getCacheSize() {
    return caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.keys()
                .then(function(keys) {
                    let totalSize = 0;
                    const sizePromises = keys.map(function(request) {
                        return cache.match(request)
                            .then(function(response) {
                                if (response) {
                                    return response.blob()
                                        .then(function(blob) {
                                            totalSize += blob.size;
                                        });
                                }
                            });
                    });

                    return Promise.all(sizePromises)
                        .then(function() {
                            return {
                                size: totalSize,
                                count: keys.length,
                                formatted: formatBytes(totalSize)
                            };
                        });
                });
        });
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}