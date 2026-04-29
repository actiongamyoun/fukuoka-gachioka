import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 후쿠오카같이오까 - Vite + React + PWA
// 배포: Vercel (자동 SSL/CDN)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: '후쿠오카같이오까',
        short_name: '후쿠오카',
        description: '후쿠오카 한국인 여행자를 위한 정보 + 실시간 채팅',
        theme_color: '#E94E3C',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'ko',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 정보 큐레이션 탭 오프라인 캐싱
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            // Supabase 스팟 데이터: 네트워크 우선, 실패 시 캐시
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/spots.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-spots-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1일
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // 이미지: 캐시 우선
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7일
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Google Maps API는 캐싱 X (Realtime tile)
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ],
        // 채팅은 항상 최신 - SW 캐싱 X (Realtime은 WebSocket)
        navigateFallbackDenylist: [/^\/api/, /^\/auth/]
      },
      devOptions: {
        enabled: false // 개발 중 SW 비활성화 (디버깅 편의)
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  }
})
