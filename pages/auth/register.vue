<template>
  <div>
    <Head>
      <title>{{ $t('auth.sign_up_title') }} | Prospeo</title>
      <meta name="description" :content="$t('auth.sign_up_description')" />
    </Head>
    
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {{ $t('auth.sign_up_title') }}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            {{ $t('auth.sign_up_description') }}
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
        
        <form class="mt-8 space-y-6" @submit.prevent="handleSignUp">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="full-name" class="sr-only">{{ $t('auth.full_name') }}</label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                v-model="fullName"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :placeholder="$t('auth.full_name_placeholder')"
              />
            </div>
            <div>
              <label for="email-address" class="sr-only">{{ $t('auth.email') }}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="email"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :placeholder="$t('auth.email_placeholder')"
              />
            </div>
            <div>
              <label for="password" class="sr-only">{{ $t('auth.password') }}</label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                v-model="password"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :placeholder="$t('auth.password_placeholder')"
              />
            </div>
            <div>
              <label for="confirm-password" class="sr-only">{{ $t('auth.confirm_password') }}</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                v-model="confirmPassword"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                :placeholder="$t('auth.confirm_password_placeholder')"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading || password !== confirmPassword"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
            >
              <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span v-else class="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlusIcon class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
              </span>
              {{ $t('auth.sign_up_button') }}
            </button>
          </div>
        </form>
        
        <!-- Ajout des boutons de connexion sociale -->
        <SocialLoginButtons />
        
        <div class="text-center mt-4">
          <p class="text-sm text-gray-600">
            {{ $t('auth.already_have_account') }}
            <NuxtLink to="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              {{ $t('auth.sign_in_link') }}
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserPlusIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid'
import { useRouter } from '#app'
import SocialLoginButtons from '~/components/auth/SocialLoginButtons.vue'

definePageMeta({
  layout: 'auth',
  middleware: ['guest']
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<any>(null)
const successMessage = ref('')

// Rediriger si déjà connecté
watch(user, (newUser) => {
  if (newUser) {
    router.push('/dashboard')
  }
}, { immediate: true })

const handleSignUp = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = { message: 'auth.error_passwords_dont_match' }
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const { data, error: signUpError } = await client.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: fullName.value
        }
      }
    })
    
    if (signUpError) {
      error.value = signUpError
      return
    }
    
    if (data?.user) {
      successMessage.value = 'auth.sign_up_success'
      // Redirection vers la page de confirmation
      router.push('/auth/confirm-email')
    }
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
    case 'User already registered':
      return $t('auth.error_user_already_registered')
    case 'Password should be at least 6 characters':
      return $t('auth.error_password_too_short')
    case 'auth.error_passwords_dont_match':
      return $t('auth.error_passwords_dont_match')
    default:
      return error.message || $t('auth.error_unknown')
  }
}
</script>
