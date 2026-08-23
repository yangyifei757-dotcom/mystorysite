/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'dajwjltopgbbzdavvoac.supabase.co',
      'picsum.photos',
      // 如果有其他封面域名，请在这里添加
    ],
  },
  async headers() {
    return [
      {
        // 对 HTML 页面禁用缓存，确保用户刷新能获取最新内容
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
