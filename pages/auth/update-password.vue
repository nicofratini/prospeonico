<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ $t('auth.update_password_title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ $t('auth.update_password_description') }}
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
      
      <div v-if="success" class="rounded-md bg-green-50 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <CheckCircleIcon class="h-5 w-5 text-green-400" aria-hidden="true" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">{{ $t('auth.password_updated_successfully') }}</h3>
            <div class="mt-2 text-sm text-green-700">
              <p>{{ $t('auth.redirecting_to_login') }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <form v-if="!success" class="mt-8 space-y-6" @submit.prevent="handleUpdatePassword">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">{{ $t('auth.new_password') }}</label>
          <div class="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              v-model="password"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              :placeholder="$t('auth.new_password_placeholder')"
            />
          </div>
        </div>
        
        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700">{{ $t('auth.confirm_password') }}</label>
          <div class="mt-1">
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              v-model="confirmPassword"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              :placeholder="$t('auth.confirm_password_placeholder')"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || password !== confirmPassword || password.length < 6"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
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
            {{ $t('auth.update_password_button') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LockClosedIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid'
import { useRouter } from '#app'

definePageMeta({
  layout: 'auth',
  middleware: ['guest']
})

const client = useSupabaseClient()
const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<any>(null)
const success = ref(false)

const handleUpdatePassword = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = { message: 'auth.error_passwords_dont_match' }
    return
  }
  
  if (password.value.length < 6) {
    error.value = { message: 'auth.error_password_too_short' }
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const { error: updateError } = await client.auth.updateUser({
      password: password.value
    })
    
    if (updateError) {
      error.value = updateError
      return
    }
    
    success.value = true
    
    // Rediriger vers la page de connexion après 3 secondes
    setTimeout(() => {
      router.push('/auth/login')
    }, 3000)
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
    case 'auth.error_passwords_dont_match':
      return $t('auth.error_passwords_dont_match')
    case 'auth.error_password_too_short':
      return $t('auth.error_password_too_short')
    default:
      return error.message || $t('auth.error_unknown')
  }
}
</script>
