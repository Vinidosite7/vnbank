// VANTA — Service Worker v1
// Handles push notifications for credit card due dates

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Handle push event (triggered by scheduleCardNotifications)
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'VANTA', {
      body: data.body || '',
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: data.tag || 'vanta-notification',
      data: { url: data.url || '/' },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    })
  )
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const appUrl = e.notification.data?.url || '/'
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(appUrl)
    })
  )
})

// Handle scheduled alarms via postMessage from the app
// The app posts { type: 'SCHEDULE_NOTIFICATIONS', notifications: [...] }
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    const notifications = e.data.notifications || []
    notifications.forEach(({ title, body, tag, delayMs }) => {
      if (delayMs > 0) {
        setTimeout(() => {
          self.registration.showNotification(title, {
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-96x96.png',
            tag,
            vibrate: [100, 50, 100],
          })
        }, delayMs)
      }
    })
  }
})
