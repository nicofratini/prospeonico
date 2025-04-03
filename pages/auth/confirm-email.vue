<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ $t('auth.confirm_email_title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ $t('auth.confirm_email_description') }}
        </p>
      </div>
      
      <div class="bg-blue-50 p-4 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <InformationCircleIcon class="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              {{ $t('auth.confirm_email_instructions', { email: email }) }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="mt-6">
        <button
          @click="resendConfirmationEmail"
          :disabled="loading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span v-if="loading" class="mr-2">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          {{ $t('auth.resend_confirmation_email') }}
        </button>
      </div>
      
      <div class="mt-4 text-center">
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
import { InformationCircleIcon } from '@heroicons/vue/24/solid'

definePageMeta({
  layout: 'auth',
  middleware: ['guest']
})

const client = useSupabaseClient()
const route = useRoute()
const email = ref(route.query.email as string || '')
const loading = ref(false)
const message = ref('')

const resendConfirmationEmail = async () => {
  if (!email.value) return
  
  loading.value = true
  
  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email: email.value
    })
    
    if (error) {
      message.value = error.message
    } else {
      message.value = 'auth.confirmation_email_sent'
    }
  } catch (e: any) {
    message.value = e.message || 'auth.error_unknown'
  } finally {
    loading.value = false
  }
}
</script>
