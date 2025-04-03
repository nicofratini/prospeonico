<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ $t('auth.reset_password_title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ $t('auth.reset_password_description') }}
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
            <h3 class="text-sm font-medium text-green-800">{{ $t('auth.reset_password_email_sent') }}</h3>
          </div>
        </div>
      </div>
      
      <form v-if="!success" class="mt-8 space-y-6" @submit.prevent="handleResetPassword">
        <div>
          <label for="email-address" class="block text-sm font-medium text-gray-700">{{ $t('auth.email') }}</label>
          <div class="mt-1">
            <input
              id="email-address"
              name="email"
              type="email"
              autocomplete="email"
              required
              v-model="email"
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              :placeholder="$t('auth.email_placeholder')"
            />
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
              <KeyIcon class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
            </span>
            {{ $t('auth.send_reset_instructions') }}
          </button>
        </div>
      </form>
      
      <div class="text-center">
        <p class="text-sm text-gray-600">
          {{ $t('auth.back_to_login') }}
          <NuxtLink to="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            {{ $t('auth.sign_in_link') }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KeyIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/vue/24/solid'

definePageMeta({
  layout: 'auth',
  middleware: ['guest']
})

const client = useSupabaseClient()

const email = ref('')
const loading = ref(false)
const error = ref<any>(null)
const success = ref(false)

const handleResetPassword = async () => {
  loading.value = true
  error.value = null
  success.value = false
  
  try {
    const { error: resetError } = await client.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/auth/update-password`
    })
    
    if (resetError) {
      error.value = resetError
      return
    }
    
    success.value = true
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
    case 'Email not found':
      return $t('auth.error_email_not_found')
    default:
      return error.message || $t('auth.error_unknown')
  }
}
</script>
