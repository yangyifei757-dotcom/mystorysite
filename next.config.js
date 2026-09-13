/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // 禁用 Vercel 图片优化，避免 402 错误
    domains: [
      'dajwjltopgbbzdavvoac.supabase.co',
      'picsum.photos',
    ],
  },
  async headers() {
    return [
      {
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
