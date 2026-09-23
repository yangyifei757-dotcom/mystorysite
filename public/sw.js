const CACHE_NAME = 'ivynovel-v4' // 版本号更新，强制所有 PWA 刷新

const urlsToCache = [
  '/favicon.ico',
  '/logo.png',
  '/manifest.json',
]

// 安装：立即激活新 SW
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

// 网络优先，只缓存静态资源，绝不缓存 HTML 和 API
self.addEventListener('fetch', (event) => {
  const url = event.request.url

  // 不缓存 API、Supabase、Stripe、Creem 等请求
  if (
    event.request.method !== 'GET' ||
    url.includes('/api/') ||
    url.includes('supabase.co') ||
    url.includes('stripe.com') ||
    url.includes('creem.io')
  ) {
    return // 直接走网络，不拦截
  }

  // 只缓存 _next/static 下的 JS/CSS
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

  // 其他请求（HTML、页面）走网络优先，失败才回退缓存
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
