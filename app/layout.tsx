import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'IvyNovel - Immersive Romance Stories',
  description: 'Discover and read addictive romance novels. Subscribe for unlimited access.',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D47B8C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="IvyNovel" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-background text-foreground antialiased`}>
        {children}
        <Analytics />

        {/* 浏览器兼容提示（自带浏览器白屏问题） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var ua = navigator.userAgent;
                var isWeChat = /MicroMessenger/.test(ua);
                var isXiaomi = /MiuiBrowser/.test(ua);
                var isHuawei = /HuaweiBrowser/.test(ua);
                var isOppo = /OppoBrowser/.test(ua);
                var isVivo = /VivoBrowser/.test(ua);
                var isSamsung = /SamsungBrowser/.test(ua);

                if (isWeChat || isXiaomi || isHuawei || isOppo || isVivo || isSamsung) {
                  if (!localStorage.getItem('browser_warning_shown')) {
                    localStorage.setItem('browser_warning_shown', '1');
                    setTimeout(function() {
                      var banner = document.createElement('div');
                      banner.style.cssText = 'position:fixed;bottom:20px;left:20px;right:20px;background:#D47B8C;color:white;padding:12px 16px;border-radius:12px;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);text-align:center;';
                      banner.innerHTML = 'For the best reading experience, please open IvyNovel in <strong>Chrome</strong> or <strong>Safari</strong>.<button onclick="this.parentNode.remove()" style="background:transparent;border:none;color:white;font-size:18px;margin-left:12px;cursor:pointer;">✕</button>';
                      document.body.appendChild(banner);
                    }, 2000);
                  }
                }
              })();
            `,
          }}
        />

        {/* 注册 Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                    .then((reg) => {
                      setInterval(() => reg.update(), 60000)

                      reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                            window.location.reload()
                          }
                        })
                      })
                    })
                    .catch((err) => {
                      console.error('Service Worker registration failed:', err)
                    })
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
