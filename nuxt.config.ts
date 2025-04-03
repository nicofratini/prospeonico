import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@nuxtjs/supabase'
  ],
  
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    vueI18n: {
      legacy: false,
      locale: 'fr',
      messages: {
        fr: require('./locales').default.fr,
        en: require('./locales').default.en
      }
    }
  },
  
  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/dashboard',
      exclude: ['/auth/register', '/auth/confirm-email', '/auth/reset-password', '/auth/update-password']
    }
  },
  
  runtimeConfig: {
    public: {
      elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
      calcomApiKey: process.env.CALCOM_API_KEY || 'MDM4MDFlZmFlNjM4NDY0Yzg0MmQ3YTg1ZjAyZDU0ZmYtMTczNzk2NTAyNQ==',
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || ''
    }
  },
  
  app: {
    head: {
      title: 'Prospeo - Plateforme immobilière avec agents IA',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'Prospeo est une plateforme immobilière intégrant des agents IA pour la gestion des appels et des biens immobiliers.' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  
  css: [
    '@/assets/css/main.css'
  ],
  
  build: {
    transpile: ['@heroicons/vue']
  }
})
