const CACHE_NAME = 'ivynovel-v2' // 更新版本号，让浏览器强制更新缓存

// 只缓存静态资源，不缓存页面和 API
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
  self.skipWaiting()
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
  self.clients.claim()
})

// 网络优先策略：优先请求网络，失败时回退到缓存
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 只缓存成功的静态资源（JS/CSS/图片），不缓存 HTML 和 API
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
