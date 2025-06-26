const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.gptmaker\.ai\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'gptmaker-api',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore-api',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60
        }
      }
    }
  ]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['firebase-admin'],
  // Desabilitar coleta de dados estáticos durante build para evitar erros com Firebase
  trailingSlash: false,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Não executar APIs durante build
  staticPageGenerationTimeout: 30,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    appDir: true,
    serverActions: false,
  },
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
        querystring: false,
        path: false,
        child_process: false
      }
    }
    
    // Ignorar módulos problemáticos do WhatsApp Web.js
    config.externals = config.externals || []
    config.externals.push({
      'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
      'node-webpmux': 'commonjs node-webpmux',
      'sharp': 'commonjs sharp',
      'puppeteer': 'commonjs puppeteer'
    })
    
    // Resolver problemas específicos do fluent-ffmpeg
    config.resolve.alias = {
      ...config.resolve.alias,
      'fluent-ffmpeg': false
    }
    
    // Resolver problemas com undici/firebase
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    })
    
    return config
  }
}

module.exports = withPWA(nextConfig) 