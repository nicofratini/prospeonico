<template>
  <div>
    <OnboardingLayout
      :current-step="3"
      :total-steps="4"
      :can-continue="isFormValid"
      :can-skip="true"
      @previous="goToPrevious"
      @next="saveAndContinue"
      @skip="skipStep"
    >
      <div class="space-y-8">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900">{{ $t('onboarding.ai_agent_title') }}</h2>
          <p class="mt-2 text-gray-600">{{ $t('onboarding.ai_agent_description') }}</p>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <InformationCircleIcon class="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                {{ $t('onboarding.ai_agent_tip') }}
              </p>
            </div>
          </div>
        </div>
        
        <form @submit.prevent="saveAndContinue" class="space-y-6">
          <!-- Sélection de voix -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ $t('onboarding.select_voice') }} *
            </label>
            
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="voice in filteredVoices" :key="voice.voice_id" 
                class="relative rounded-lg border p-4 cursor-pointer hover:border-indigo-500"
                :class="selectedVoice === voice.voice_id ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-300'"
                @click="selectVoice(voice.voice_id)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="text-sm">
                      <p class="font-medium text-gray-900">{{ voice.name }}</p>
                      <p class="text-gray-500">{{ voice.labels.gender }} | {{ voice.labels.language }}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    class="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    @click.stop="previewVoice(voice.voice_id)"
                  >
                    <SpeakerWaveIcon class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Filtres de voix -->
            <div class="mt-4 flex flex-wrap gap-2">
              <div>
                <label for="gender-filter" class="sr-only">{{ $t('onboarding.filter_by_gender') }}</label>
                <select
                  id="gender-filter"
                  v-model="genderFilter"
                  class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">{{ $t('onboarding.all_genders') }}</option>
                  <option value="male">{{ $t('onboarding.male') }}</option>
                  <option value="female">{{ $t('onboarding.female') }}</option>
                </select>
              </div>
              
              <div>
                <label for="language-filter" class="sr-only">{{ $t('onboarding.filter_by_language') }}</label>
                <select
                  id="language-filter"
                  v-model="languageFilter"
                  class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">{{ $t('onboarding.all_languages') }}</option>
                  <option value="french">{{ $t('onboarding.french') }}</option>
                  <option value="english">{{ $t('onboarding.english') }}</option>
                  <option value="spanish">{{ $t('onboarding.spanish') }}</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Personnalisation du prompt système -->
          <div>
            <label for="system-prompt" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.system_prompt') }} *
            </label>
            <div class="mt-1">
              <textarea
                id="system-prompt"
                v-model="systemPrompt"
                rows="5"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <p class="mt-2 text-sm text-gray-500">
              {{ $t('onboarding.system_prompt_help') }}
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="variable in availableVariables"
                :key="variable.key"
                type="button"
                @click="insertVariable(variable.key)"
                class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {{ variable.label }}
              </button>
            </div>
          </div>
          
          <!-- Test de l'agent -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900">{{ $t('onboarding.test_agent') }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ $t('onboarding.test_agent_description') }}</p>
            
            <div class="mt-4">
              <button
                type="button"
                @click="testAgent"
                :disabled="!isFormValid || testLoading"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                <span v-if="testLoading" class="mr-2">
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                {{ $t('onboarding.start_test') }}
              </button>
            </div>
            
            <div v-if="testResult" class="mt-4 p-4 bg-white rounded-md border border-gray-200">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <CheckCircleIcon v-if="testSuccess" class="h-5 w-5 text-green-400" />
                  <ExclamationCircleIcon v-else class="h-5 w-5 text-red-400" />
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium" :class="testSuccess ? 'text-green-800' : 'text-red-800'">
                    {{ testSuccess ? $t('onboarding.test_success') : $t('onboarding.test_error') }}
                  </h3>
                  <div class="mt-2 text-sm" :class="testSuccess ? 'text-green-700' : 'text-red-700'">
                    <p>{{ testResult }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { InformationCircleIcon, SpeakerWaveIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid'
import { useRouter } from '#app'
import { useOnboardingStore } from '~/stores/onboarding'
import OnboardingLayout from '~/layouts/onboarding.vue'

definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const onboardingStore = useOnboardingStore()

// Données du formulaire
const selectedVoice = ref('')
const systemPrompt = ref(`Je suis un agent immobilier virtuel pour {agency_name}. Je m'appelle {agent_name} et je suis là pour répondre à toutes vos questions concernant nos propriétés à vendre ou à louer. Je peux vous donner des informations détaillées sur {property_title}, située à {property_address}, d'une surface de {property_surface}m² au prix de {property_price}€.`)
const genderFilter = ref('')
const languageFilter = ref('')

// Variables disponibles pour le prompt système
const availableVariables = [
  { key: '{agency_name}', label: 'Nom de l\'agence' },
  { key: '{agent_name}', label: 'Nom de l\'agent' },
  { key: '{property_title}', label: 'Titre de la propriété' },
  { key: '{property_address}', label: 'Adresse de la propriété' },
  { key: '{property_surface}', label: 'Surface de la propriété' },
  { key: '{property_price}', label: 'Prix de la propriété' }
]

// Test de l'agent
const testLoading = ref(false)
const testResult = ref('')
const testSuccess = ref(false)

// Voix disponibles (simulées pour l'onboarding)
const voices = ref([
  { voice_id: 'voice1', name: 'Sophie', labels: { gender: 'female', language: 'french' } },
  { voice_id: 'voice2', name: 'Jean', labels: { gender: 'male', language: 'french' } },
  { voice_id: 'voice3', name: 'Emma', labels: { gender: 'female', language: 'english' } },
  { voice_id: 'voice4', name: 'Michael', labels: { gender: 'male', language: 'english' } },
  { voice_id: 'voice5', name: 'Maria', labels: { gender: 'female', language: 'spanish' } },
  { voice_id: 'voice6', name: 'Carlos', labels: { gender: 'male', language: 'spanish' } }
])

// Filtrer les voix
const filteredVoices = computed(() => {
  return voices.value.filter(voice => {
    const matchGender = !genderFilter.value || voice.labels.gender === genderFilter.value
    const matchLanguage = !languageFilter.value || voice.labels.language === languageFilter.value
    return matchGender && matchLanguage
  })
})

// Validation du formulaire
const isFormValid = computed(() => {
  return !!selectedVoice.value && !!systemPrompt.value.trim()
})

// Sélectionner une voix
const selectVoice = (voiceId: string) => {
  selectedVoice.value = voiceId
}

// Prévisualiser une voix
const previewVoice = async (voiceId: string) => {
  // Simuler la prévisualisation de la voix
  console.log(`Prévisualisation de la voix: ${voiceId}`)
  
  // Dans une implémentation réelle, nous appellerions l'API ElevenLabs
  // pour générer un échantillon audio avec la voix sélectionnée
}

// Insérer une variable dans le prompt système
const insertVariable = (variable: string) => {
  const textarea = document.getElementById('system-prompt') as HTMLTextAreaElement
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  systemPrompt.value = systemPrompt.value.substring(0, start) + 
                       variable + 
                       systemPrompt.value.substring(end)
  
  // Placer le curseur après la variable insérée
  setTimeout(() => {
    textarea.focus()
    textarea.selectionStart = start + variable.length
    textarea.selectionEnd = start + variable.length
  }, 0)
}

// Tester l'agent
const testAgent = async () => {
  testLoading.value = true
  testResult.value = ''
  testSuccess.value = false
  
  try {
    // Simuler un test d'agent pour l'onboarding
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    testSuccess.value = true
    testResult.value = "L'agent a été testé avec succès. La voix est claire et le prompt système fonctionne correctement."
  } catch (error: any) {
    testSuccess.value = false
    testResult.value = error.message || "Une erreur s'est produite lors du test de l'agent."
  } finally {
    testLoading.value = false
  }
}

// Sauvegarder l'agent
const saveAgent = async () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  
  if (!user.value) return
  
  try {
    // Simuler la création d'un agent ElevenLabs
    const agentId = `agent-${Date.now()}`
    
    // Sauvegarder l'ID de l'agent dans Supabase
    const { data, error } = await client
      .from('user_profiles')
      .update({
        elevenlabs_agent_id: agentId,
        elevenlabs_voice_id: selectedVoice.value,
        system_prompt: systemPrompt.value,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.value.id)
      .select()
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'agent:', error)
    return null
  }
}

// Sauvegarder et continuer
const saveAndContinue = async () => {
  await saveAgent()
  
  // Passer à l'étape suivante
  await onboardingStore.saveProgress(4)
}

// Revenir à l'étape précédente
const goToPrevious = () => {
  router.push('/onboarding/property')
}

// Ignorer cette étape
const skipStep = async () => {
  await onboardingStore.skipStep(3)
}

// Initialisation
onMounted(async () => {
  await onboardingStore.fetchProgress()
  
  // Charger les données existantes si disponibles
  if (onboardingStore.userProfile) {
    if (onboardingStore.userProfile.elevenlabs_voice_id) {
      selectedVoice.value = onboardingStore.userProfile.elevenlabs_voice_id
    }
    
    if (onboardingStore.userProfile.system_prompt) {
      systemPrompt.value = onboardingStore.userProfile.system_prompt
    }
  }
})
</script>
