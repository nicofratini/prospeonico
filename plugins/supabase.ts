// Configuration des providers d'authentification Supabase
// Fichier: /home/ubuntu/prospeo-complete/plugins/supabase.ts

import { defineNuxtPlugin } from '#app'
import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  
  // Configurer les providers d'authentification
  // Note: Cette configuration est principalement informative car les providers
  // sont réellement configurés dans le dashboard Supabase
  const authProviders = {
    google: {
      enabled: true,
      // Ces valeurs seraient normalement définies dans le dashboard Supabase
      clientId: 'GOOGLE_CLIENT_ID',
      clientSecret: 'GOOGLE_CLIENT_SECRET',
      redirectUrl: `${supabaseUrl}/auth/v1/callback`
    },
    // Autres providers peuvent être ajoutés ici
    github: {
      enabled: false
    },
    azure: {
      enabled: false
    }
  }
  
  // Méthode pour se connecter avec Google
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    return { data, error }
  }
  
  // Méthode pour gérer le callback OAuth
  const handleAuthCallback = async () => {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  }
  
  // Exposer les méthodes d'authentification sociale
  nuxtApp.provide('signInWithGoogle', signInWithGoogle)
  nuxtApp.provide('handleAuthCallback', handleAuthCallback)
  
  return {
    provide: {
      supabase,
      authProviders
    }
  }
})
