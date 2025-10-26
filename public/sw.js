// Service Worker for PWA
const CACHE_NAME = 'echanneling-v1';
const urlsToCache = [
  '/',
  '/offline',
  '/styles/globals.css',
  '/logo.png',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Error caching resources:', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests and development noise
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('chrome-extension') ||
      event.request.url.includes('.well-known') ||
      event.request.url.includes('webpack.hot-update') ||
      event.request.url.includes('_next/static/webpack') ||
      event.request.url.includes('sockjs-node') ||
      event.request.url.includes('__nextjs_original-stack-frame')) {
    return;
  }

  // Network first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            }).catch(err => console.log('Cache put failed:', err));
          }
          
          return response;
        })
        .catch((error) => {
          console.log('Network failed, trying cache:', error);
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a minimal error response instead of undefined
            return new Response(
              JSON.stringify({ error: 'Network unavailable' }),
              { 
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Cache first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          }).catch(err => console.log('Cache put failed:', err));

          return response;
        });
      })
      .catch((error) => {
        console.log('Both cache and network failed:', error);
        // If both cache and network fail, show offline page for document requests
        if (event.request.destination === 'document') {
          return caches.match('/offline').then(offlineResponse => {
            if (offlineResponse) {
              return offlineResponse;
            }
            // Fallback response if offline page not cached
            return new Response(
              '<html><body><h1>Offline</h1><p>Please check your connection.</p></body></html>',
              { 
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html' }
              }
            );
          });
        }
        
        // For other requests, return a minimal error response
        return new Response(
          'Resource not available offline',
          { 
            status: 503,
            statusText: 'Service Unavailable'
          }
        );
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/appointments') && request.method === 'POST') {
        try {
          const response = await fetch(request.clone());
          if (response && response.ok) {
            await cache.delete(request);
            console.log('Successfully synced appointment');
          } else {
            console.log('Sync response not ok:', response ? response.status : 'no response');
          }
        } catch (error) {
          console.error('Failed to sync appointment:', error);
        }
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/check.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'eChanneling Alert', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-appointments') {
    event.waitUntil(checkUpcomingAppointments());
  }
});

async function checkUpcomingAppointments() {
  try {
    const response = await fetch('/api/appointments/upcoming');
    if (!response || !response.ok) {
      console.log('Unable to fetch upcoming appointments:', response ? response.status : 'no response');
      return;
    }
    
    const appointments = await response.json();
    
    if (!Array.isArray(appointments)) {
      console.log('Invalid appointments data received');
      return;
    }
    
    // Check for appointments in the next hour
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    appointments.forEach((appointment) => {
      try {
        const appointmentTime = new Date(appointment.dateTime || appointment.appointmentDate);
        
        if (appointmentTime >= now && appointmentTime <= oneHourFromNow) {
          self.registration.showNotification('Appointment Reminder', {
            body: `You have an appointment with Dr. ${appointment.doctorName || 'Unknown'} at ${appointmentTime.toLocaleTimeString()}`,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: `appointment-${appointment.id}`,
            requireInteraction: true
          });
        }
      } catch (appointmentError) {
        console.error('Error processing appointment:', appointmentError);
      }
    });
  } catch (error) {
    console.error('Failed to check appointments:', error);
  }
}

// Message event handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});
