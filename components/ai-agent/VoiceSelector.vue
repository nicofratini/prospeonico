<template>
  <div>
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else>
      <!-- Filtres -->
      <div class="mb-4">
        <label for="voice-filter" class="block text-sm font-medium text-gray-700 mb-1">{{ $t('ai_agent.filter_voices') }}</label>
        <div class="flex space-x-4">
          <div class="w-1/3">
            <select
              id="gender-filter"
              v-model="filters.gender"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">{{ $t('ai_agent.all_genders') }}</option>
              <option value="male">{{ $t('ai_agent.male') }}</option>
              <option value="female">{{ $t('ai_agent.female') }}</option>
              <option value="other">{{ $t('ai_agent.other_gender') }}</option>
            </select>
          </div>
          <div class="w-1/3">
            <select
              id="language-filter"
              v-model="filters.language"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">{{ $t('ai_agent.all_languages') }}</option>
              <option value="fr">{{ $t('ai_agent.french') }}</option>
              <option value="en">{{ $t('ai_agent.english') }}</option>
              <option value="es">{{ $t('ai_agent.spanish') }}</option>
              <option value="de">{{ $t('ai_agent.german') }}</option>
            </select>
          </div>
          <div class="w-1/3">
            <input
              type="text"
              v-model="filters.search"
              :placeholder="$t('ai_agent.search_voices')"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            />
          </div>
        </div>
      </div>
      
      <!-- Liste des voix -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="voice in filteredVoices" 
          :key="voice.voice_id"
          :class="[
            'relative rounded-lg border p-4 hover:border-indigo-400 transition-colors duration-150',
            modelValue === voice.voice_id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          ]"
        >
          <div class="flex items-start">
            <div class="flex-1">
              <h3 class="text-sm font-medium text-gray-900">{{ voice.name }}</h3>
              <div class="mt-1 flex items-center text-xs text-gray-500">
                <span 
                  :class="[
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2',
                    voice.gender === 'male' ? 'bg-blue-100 text-blue-800' : 
                    voice.gender === 'female' ? 'bg-pink-100 text-pink-800' : 
                    'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ voice.gender === 'male' ? $t('ai_agent.male') : 
                     voice.gender === 'female' ? $t('ai_agent.female') : 
                     $t('ai_agent.other_gender') }}
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {{ getLanguageName(voice.language) }}
                </span>
              </div>
              <p v-if="voice.description" class="mt-2 text-xs text-gray-500 line-clamp-2">{{ voice.description }}</p>
            </div>
            <div class="ml-2 flex-shrink-0">
              <button
                type="button"
                @click="previewVoice(voice.voice_id)"
                class="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <SpeakerWaveIcon class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div class="mt-4">
            <button
              type="button"
              @click="selectVoice(voice.voice_id)"
              :class="[
                'w-full inline-flex justify-center items-center px-3 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                modelValue === voice.voice_id
                  ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              ]"
            >
              {{ modelValue === voice.voice_id ? $t('ai_agent.selected') : $t('ai_agent.select') }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Message si aucune voix ne correspond aux filtres -->
      <div v-if="filteredVoices.length === 0" class="text-center py-8">
        <SpeakerXMarkIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('ai_agent.no_voices_found') }}</h3>
        <p class="mt-1 text-sm text-gray-500">{{ $t('ai_agent.try_different_filters') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/vue/24/outline'
import { ElevenLabsVoice } from '~/types/elevenlabs'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'preview', voiceId: string): void
}>()

// État
const loading = ref(true)
const voices = ref<ElevenLabsVoice[]>([])

// Filtres
const filters = ref({
  gender: 'all',
  language: 'all',
  search: ''
})

// Voix filtrées
const filteredVoices = computed(() => {
  return voices.value.filter(voice => {
    // Filtre par genre
    if (filters.value.gender !== 'all' && voice.gender !== filters.value.gender) {
      return false
    }
    
    // Filtre par langue
    if (filters.value.language !== 'all' && voice.language !== filters.value.language) {
      return false
    }
    
    // Filtre par recherche
    if (filters.value.search && !voice.name.toLowerCase().includes(filters.value.search.toLowerCase())) {
      return false
    }
    
    return true
  })
})

// Charger les voix
const loadVoices = async () => {
  loading.value = true
  
  try {
    const { data, error } = await useFetch('/api/ai/voices')
    
    if (error.value) throw error.value
    
    if (data.value?.voices) {
      voices.value = data.value.voices
    }
  } catch (error) {
    console.error('Erreur lors du chargement des voix:', error)
  } finally {
    loading.value = false
  }
}

// Sélectionner une voix
const selectVoice = (voiceId: string) => {
  emit('update:modelValue', voiceId)
}

// Prévisualiser une voix
const previewVoice = (voiceId: string) => {
  emit('preview', voiceId)
}

// Obtenir le nom de la langue à partir du code
const getLanguageName = (languageCode?: string) => {
  if (!languageCode) return $t('ai_agent.unknown_language')
  
  const languages: Record<string, string> = {
    'fr': $t('ai_agent.french'),
    'en': $t('ai_agent.english'),
    'es': $t('ai_agent.spanish'),
    'de': $t('ai_agent.german'),
    'it': $t('ai_agent.italian'),
    'pt': $t('ai_agent.portuguese'),
    'nl': $t('ai_agent.dutch'),
    'ru': $t('ai_agent.russian'),
    'ja': $t('ai_agent.japanese'),
    'zh': $t('ai_agent.chinese'),
    'ar': $t('ai_agent.arabic')
  }
  
  return languages[languageCode] || languageCode
}

// Charger les voix au montage du composant
onMounted(() => {
  loadVoices()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
