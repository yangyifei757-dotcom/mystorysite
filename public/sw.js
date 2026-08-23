const CACHE_NAME = 'ivynovel-v3' // 更新版本号，强制刷新缓存

const urlsToCache = [
  '/favicon.ico',
  '/logo.png',
  '/manifest.json',
]

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting() // 立即激活
})

// 激活时删除旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim() // 立即控制所有页面
})

// 网络优先策略：优先请求服务器，失败时回退缓存
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 只缓存静态资源（/ _next/ 下的 JS/CSS）
        if (response && response.status === 200 && event.request.url.includes('/_next/')) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // 离线时回退到缓存
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('/')
        })
      })
  )
})
