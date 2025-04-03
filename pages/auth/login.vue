<template>
  <div>
    <Head>
      <title>{{ $t('auth.sign_in_title') }} | Prospeo</title>
      <meta name="description" :content="$t('auth.sign_in_description')" />
    </Head>
    
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {{ $t('auth.sign_in_title') }}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            {{ $t('auth.sign_in_description') }}
          </p>
        </div>
        
        <div v-if="error" class="rounded-md bg-red-50 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationCircleIcon class="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">{{ formatError(error) }}</h3>
            </div>
          </div>
        </div>
        
        <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email-address" class="sr-only">{{ $t('auth.email') }}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="email"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :placeholder="$t('auth.email_placeholder')"
              />
            </div>
            <div>
              <label for="password" class="sr-only">{{ $t('auth.password') }}</label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                v-model="password"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :placeholder="$t('auth.password_placeholder')"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                v-model="rememberMe"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                {{ $t('auth.remember_me') }}
              </label>
            </div>

            <div class="text-sm">
              <NuxtLink to="/auth/reset-password" class="font-medium text-indigo-600 hover:text-indigo-500">
                {{ $t('auth.forgot_password') }}
              </NuxtLink>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span v-else class="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
              </span>
              {{ $t('auth.sign_in_button') }}
            </button>
          </div>
        </form>
        
        <!-- Ajout des boutons de connexion sociale -->
        <SocialLoginButtons />
        
        <div class="text-center mt-4">
          <p class="text-sm text-gray-600">
            {{ $t('auth.no_account') }}
            <NuxtLink to="/auth/register" class="font-medium text-indigo-600 hover:text-indigo-500">
              {{ $t('auth.sign_up_link') }}
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LockClosedIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid'
import { useRouter } from '#app'
import SocialLoginButtons from '~/components/auth/SocialLoginButtons.vue'

definePageMeta({
  layout: 'auth',
  middleware: ['guest']
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const error = ref<any>(null)

// Rediriger si déjà connecté
watch(user, (newUser) => {
  if (newUser) {
    router.push('/dashboard')
  }
}, { immediate: true })

const handleLogin = async () => {
  loading.value = true
  error.value = null
  
  try {
    const { error: signInError } = await client.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    
    if (signInError) {
      error.value = signInError
      return
    }
    
    // Redirection gérée par le watcher sur user
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

const formatError = (error: any) => {
  if (!error) return ''
  
  // Traduire les erreurs courantes
  switch (error.message) {
    case 'Invalid login credentials':
      return $t('auth.error_invalid_credentials')
    case 'Email not confirmed':
      return $t('auth.error_email_not_confirmed')
    default:
      return error.message || $t('auth.error_unknown')
  }
}
</script>
