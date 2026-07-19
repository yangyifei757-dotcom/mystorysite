const CACHE_NAME = 'ivynovel-v1'

// 需要缓存的页面和资源
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo.png',
]

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

// 拦截网络请求，优先使用缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 缓存命中，直接返回
      if (response) {
        return response
      }
      // 否则发起网络请求
      return fetch(event.request).then((response) => {
        // 只缓存成功的 GET 请求
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response
        }
        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })
        return response
      })
    })
  )
})

// 更新缓存
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
})
