<template>
  <div>
    <OnboardingLayout
      :current-step="1"
      :total-steps="4"
      :can-continue="isFormValid"
      :can-skip="true"
      @next="saveAndContinue"
      @skip="skipStep"
    >
      <div class="space-y-8">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900">{{ $t('onboarding.welcome_title') }}</h2>
          <p class="mt-2 text-gray-600">{{ $t('onboarding.welcome_description') }}</p>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <InformationCircleIcon class="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                {{ $t('onboarding.welcome_tip') }}
              </p>
            </div>
          </div>
        </div>
        
        <form @submit.prevent="saveAndContinue" class="space-y-6">
          <!-- Nom de l'agence -->
          <div>
            <label for="agency-name" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.agency_name') }} *
            </label>
            <div class="mt-1">
              <input
                id="agency-name"
                v-model="agencyName"
                type="text"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <!-- Logo de l'agence -->
          <div>
            <label for="agency-logo" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.agency_logo') }}
            </label>
            <div class="mt-1 flex items-center space-x-4">
              <div v-if="logoPreview" class="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                <img :src="logoPreview" alt="Logo preview" class="h-full w-full object-contain" />
              </div>
              <div v-else class="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <PhotographIcon class="h-8 w-8 text-gray-300" />
              </div>
              <div>
                <input
                  id="agency-logo"
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  ref="logoInput"
                  @change="handleLogoUpload"
                />
                <button
                  type="button"
                  @click="$refs.logoInput.click()"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {{ $t('onboarding.upload_logo') }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Adresse de l'agence -->
          <div>
            <label for="agency-address" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.agency_address') }}
            </label>
            <div class="mt-1">
              <textarea
                id="agency-address"
                v-model="agencyAddress"
                rows="3"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
          
          <!-- Téléphone de l'agence -->
          <div>
            <label for="agency-phone" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.agency_phone') }}
            </label>
            <div class="mt-1">
              <input
                id="agency-phone"
                v-model="agencyPhone"
                type="tel"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <!-- Email de l'agence -->
          <div>
            <label for="agency-email" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.agency_email') }}
            </label>
            <div class="mt-1">
              <input
                id="agency-email"
                v-model="agencyEmail"
                type="email"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { InformationCircleIcon, PhotographIcon } from '@heroicons/vue/24/solid'
import { useOnboardingStore } from '~/stores/onboarding'
import OnboardingLayout from '~/layouts/onboarding.vue'

definePageMeta({
  middleware: ['auth']
})

const onboardingStore = useOnboardingStore()
const supabase = useSupabaseClient()

// Données du formulaire
const agencyName = ref('')
const agencyAddress = ref('')
const agencyPhone = ref('')
const agencyEmail = ref('')
const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const logoInput = ref<HTMLInputElement | null>(null)

// Validation du formulaire
const isFormValid = computed(() => {
  return !!agencyName.value.trim()
})

// Gestion du logo
const handleLogoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    logoFile.value = input.files[0]
    
    // Créer un aperçu du logo
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(logoFile.value)
  }
}

// Téléchargement du logo vers Supabase Storage
const uploadLogo = async (): Promise<string | null> => {
  if (!logoFile.value) return null
  
  const user = useSupabaseUser()
  if (!user.value) return null
  
  const fileExt = logoFile.value.name.split('.').pop()
  const fileName = `${user.value.id}-${Date.now()}.${fileExt}`
  const filePath = `agency-logos/${fileName}`
  
  try {
    const { data, error } = await supabase.storage
      .from('agency-assets')
      .upload(filePath, logoFile.value, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) throw error
    
    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('agency-assets')
      .getPublicUrl(filePath)
    
    return publicUrl
  } catch (error) {
    console.error('Erreur lors du téléchargement du logo:', error)
    return null
  }
}

// Sauvegarder et continuer
const saveAndContinue = async () => {
  let logoUrl = null
  
  if (logoFile.value) {
    logoUrl = await uploadLogo()
  }
  
  await onboardingStore.updateUserProfile({
    agency_name: agencyName.value,
    agency_logo: logoUrl,
    agency_address: agencyAddress.value,
    agency_phone: agencyPhone.value,
    agency_email: agencyEmail.value
  })
  
  // Passer à l'étape suivante
  await onboardingStore.saveProgress(2)
}

// Ignorer cette étape
const skipStep = async () => {
  await onboardingStore.skipStep(1)
}

// Charger les données existantes
onMounted(async () => {
  await onboardingStore.fetchProgress()
  
  if (onboardingStore.userProfile) {
    agencyName.value = onboardingStore.userProfile.agency_name || ''
    agencyAddress.value = onboardingStore.userProfile.agency_address || ''
    agencyPhone.value = onboardingStore.userProfile.agency_phone || ''
    agencyEmail.value = onboardingStore.userProfile.agency_email || ''
    
    if (onboardingStore.userProfile.agency_logo) {
      logoPreview.value = onboardingStore.userProfile.agency_logo
    }
  }
})
</script>
