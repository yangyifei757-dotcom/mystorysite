/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'dajwjltopgbbzdavvoac.supabase.co', // 你的 Supabase 存储域名
      'picsum.photos',                     // 如果还在用测试图
      // 以后如有其他封面图床，在此添加
    ],
  },
}
module.exports = nextConfig
