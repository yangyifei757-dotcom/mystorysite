const CACHE_NAME = 'ivynovel-v5'

const urlsToCache = [
  '/favicon.ico',
  '/logo.png',
  '/manifest.json',
]

// 安装：立即激活
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
  self.skipWaiting()
})

// 激活：删除所有旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name)
        })
      )
    )
  )
  self.clients.claim()
})

// 网络优先，只缓存静态资源
self.addEventListener('fetch', (event) => {
  const url = event.request.url

  // 不拦截 API、Supabase、支付等请求
  if (
    event.request.method !== 'GET' ||
    url.includes('/api/') ||
    url.includes('supabase.co') ||
    url.includes('stripe.com') ||
    url.includes('creem.io')
  ) {
    return
  }

  // 只缓存 _next/static 下的静态资源
  if (url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            return response
          })
        )
      })
    )
    return
  }

  // 其他请求（HTML、页面）：网络优先，失败时回退到缓存的首页
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cached) => {
        // 如果请求的是页面，回退到缓存首页
        if (event.request.mode === 'navigate') {
          return caches.match('/') || fetch(event.request)
        }
        return cached
      })
    })
  )
})
