const CACHE = 'uniavp-v1'
const OFFLINE_URLS = ['/consultor/login', '/gestor/login', '/login', '/manifest.json', '/logo.png']

// ── Instalação: pré-cache das páginas de login ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS).catch(() => {}))
  )
  self.skipWaiting()
})

// ── Ativação: limpa caches antigos ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first, fallback para cache ──
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return
  if (e.request.url.includes('supabase')) return
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const clone = r.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return r
      })
      .catch(() => caches.match(e.request))
  )
})

// ── Push: recebe notificação e exibe ──
self.addEventListener('push', (e) => {
  let data = { title: 'Universidade AVP', body: 'Você tem uma nova notificação!', url: '/' }
  try { data = { ...data, ...e.data.json() } } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: { url: data.url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  )
})

// ── Clique na notificação: abre ou foca a aba ──
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(url) && 'focus' in c) return c.focus()
      }
      return clients.openWindow(url)
    })
  )
})
