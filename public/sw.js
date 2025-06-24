// Pet Medication Tracker Service Worker
// Provides offline functionality and caching

const CACHE_NAME = "pet-med-tracker-v1";
const STATIC_CACHE_URLS = [
	"/",
	"/pets",
	"/profile",
	"/qr-scanner",
	"/offline.html", // We'll create this as a fallback
];

// Install event - cache essential resources
self.addEventListener("install", (event) => {
	const installEvent = event;
	installEvent.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(STATIC_CACHE_URLS))
			.then(() => self.skipWaiting()),
	);
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	const activateEvent = event;
	activateEvent.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => caches.delete(cacheName)),
				);
			})
			.then(() => self.clients.claim()),
	);
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
	const fetchEvent = event;
	// Skip cross-origin requests
	if (!fetchEvent.request.url.startsWith(self.location.origin)) {
		return;
	}

	// For navigation requests, try network first, fallback to cache
	if (fetchEvent.request.mode === "navigate") {
		fetchEvent.respondWith(
			fetch(fetchEvent.request).catch(() => {
				return caches.match("/offline.html");
			}),
		);
		return;
	}

	// For other requests, try cache first, fallback to network
	fetchEvent.respondWith(
		caches
			.match(fetchEvent.request)
			.then((response) => {
				return response || fetch(fetchEvent.request);
			})
			.catch(() => {
				// Return a basic offline response for failed requests
				return new Response("Offline", {
					status: 503,
					statusText: "Service Unavailable",
				});
			}),
	);
});

// Handle push notifications (future enhancement)
self.addEventListener("push", (event) => {
	const pushEvent = event;
	const options = {
		body: pushEvent.data ? pushEvent.data.text() : "Medication reminder",
		icon: "/icon-192.png",
		badge: "/icon-192.png",
		vibrate: [100, 50, 100],
		data: {
			dateOfArrival: Date.now(),
			primaryKey: 1,
		},
		actions: [
			{
				action: "given",
				title: "Mark as Given",
				icon: "/icon-192.png",
			},
			{
				action: "snooze",
				title: "Remind Later",
				icon: "/icon-192.png",
			},
		],
	};

	pushEvent.waitUntil(
		self.registration.showNotification("Pet Medication Reminder", options),
	);
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
	const clickEvent = event;
	clickEvent.notification.close();

	if (clickEvent.action === "given") {
		// Handle "Mark as Given" action
		clickEvent.waitUntil(clients.openWindow("/pets"));
	} else if (clickEvent.action === "snooze") {
		// Handle "Remind Later" action
		// Could reschedule the notification
	} else {
		// Handle default notification click
		clickEvent.waitUntil(clients.openWindow("/"));
	}
});
