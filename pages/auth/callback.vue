<template>
  <div>
    <Head>
      <title>{{ $t('auth.callback_title') }} | Prospeo</title>
    </Head>
    
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 text-center">
        <div v-if="loading">
          <svg class="animate-spin h-12 w-12 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 class="mt-6 text-center text-xl font-medium text-gray-900">
            {{ $t('auth.processing_authentication') }}
          </h2>
        </div>
        
        <div v-if="error" class="rounded-md bg-red-50 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationCircleIcon class="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">{{ error }}</h3>
              <div class="mt-4">
                <NuxtLink to="/auth/login" class="text-sm font-medium text-red-800 underline">
                  {{ $t('auth.return_to_login') }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid'
import { useRouter } from '#app'

definePageMeta({
  layout: 'auth',
  middleware: ['guest']
})

const nuxtApp = useNuxtApp()
const handleAuthCallback = nuxtApp.$handleAuthCallback
const router = useRouter()
const user = useSupabaseUser()

const loading = ref(true)
const error = ref<string | null>(null)

// Vérifier si l'utilisateur est nouveau pour rediriger vers l'onboarding
const checkIfNewUser = async (userId: string) => {
  const client = useSupabaseClient()
  
  try {
    // Vérifier si l'utilisateur a déjà complété l'onboarding
    const { data, error: dbError } = await client
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .single()
    
    if (dbError) throw dbError
    
    // Si l'utilisateur n'a pas de profil ou n'a pas complété l'onboarding
    if (!data || !data.onboarding_completed) {
      return true
    }
    
    return false
  } catch (e) {
    console.error('Erreur lors de la vérification du statut d\'onboarding:', e)
    return true // Par défaut, considérer comme nouvel utilisateur en cas d'erreur
  }
}

onMounted(async () => {
  try {
    // Traiter le callback d'authentification
    const { data, error: authError } = await handleAuthCallback()
    
    if (authError) {
      error.value = authError.message
      loading.value = false
      return
    }
    
    // Vérifier si l'utilisateur est connecté
    if (data?.session?.user) {
      // Vérifier si l'utilisateur est nouveau pour rediriger vers l'onboarding
      const isNewUser = await checkIfNewUser(data.session.user.id)
      
      if (isNewUser) {
        // Rediriger vers l'onboarding
        router.push('/onboarding/welcome')
      } else {
        // Rediriger vers le dashboard
        router.push('/dashboard')
      }
    } else {
      error.value = $t('auth.error_authentication_failed')
    }
  } catch (e: any) {
    error.value = e.message || $t('auth.error_unknown')
  } finally {
    loading.value = false
  }
})
</script>
