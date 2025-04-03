<template>
  <div>
    <TransitionRoot appear :show="isOpen" as="template">
      <Dialog as="div" @close="closeModal" class="relative z-10">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                  {{ call.started_at ? formatDate(call.started_at) : $t('calls.unknown_date') }}
                </DialogTitle>
                
                <div class="mt-2">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Informations sur l'appel -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                      <h4 class="text-sm font-medium text-gray-900 mb-3">{{ $t('calls.call_info') }}</h4>
                      
                      <div class="space-y-2">
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-500">{{ $t('calls.status') }}</span>
                          <span 
                            :class="[
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              statusClass
                            ]"
                          >
                            {{ $t(`calls.status.${call.status}`) }}
                          </span>
                        </div>
                        
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-500">{{ $t('calls.duration') }}</span>
                          <span class="text-sm font-medium text-gray-900">{{ formatDuration(call.duration) }}</span>
                        </div>
                        
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-500">{{ $t('calls.caller_number') }}</span>
                          <span class="text-sm font-medium text-gray-900">{{ call.caller_number || $t('calls.unknown') }}</span>
                        </div>
                        
                        <div class="flex justify-between">
                          <span class="text-sm text-gray-500">{{ $t('calls.caller_type') }}</span>
                          <span class="text-sm font-medium text-gray-900">{{ $t(`calls.caller_type.${call.caller_type}`) }}</span>
                        </div>
                        
                        <div v-if="call.property_id" class="flex justify-between">
                          <span class="text-sm text-gray-500">{{ $t('calls.property') }}</span>
                          <NuxtLink 
                            :to="`/dashboard/properties/${call.property_id}`"
                            class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            {{ $t('calls.view_property') }}
                          </NuxtLink>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Résumé de l'appel -->
                    <div class="bg-gray-50 p-4 rounded-lg">
                      <h4 class="text-sm font-medium text-gray-900 mb-3">{{ $t('calls.summary') }}</h4>
                      
                      <div v-if="call.summary" class="text-sm text-gray-700">
                        {{ call.summary }}
                      </div>
                      <div v-else class="text-sm text-gray-500 italic">
                        {{ $t('calls.no_summary') }}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Lecteur audio -->
                  <div v-if="!loadingAudio && audioUrl" class="mt-4">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">{{ $t('calls.recording') }}</h4>
                    <audio controls class="w-full">
                      <source :src="audioUrl" type="audio/mpeg">
                      {{ $t('calls.audio_not_supported') }}
                    </audio>
                  </div>
                  
                  <div v-else-if="loadingAudio" class="mt-4 flex justify-center py-4">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                  
                  <!-- Transcription -->
                  <div class="mt-4">
                    <div class="flex justify-between items-center mb-2">
                      <h4 class="text-sm font-medium text-gray-900">{{ $t('calls.transcript') }}</h4>
                      <button 
                        v-if="!loadingTranscript && !transcript.length" 
                        @click="loadTranscript"
                        class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {{ $t('calls.load_transcript') }}
                      </button>
                    </div>
                    
                    <div v-if="loadingTranscript" class="flex justify-center py-8">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                    
                    <div v-else-if="transcript.length" class="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <TranscriptViewer :segments="transcript" />
                    </div>
                    
                    <div v-else class="bg-gray-50 p-4 rounded-lg text-center">
                      <p class="text-sm text-gray-500">{{ $t('calls.no_transcript') }}</p>
                    </div>
                  </div>
                </div>

                <div class="mt-6 flex justify-end">
                  <button
                    type="button"
                    @click="closeModal"
                    class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {{ $t('common.close') }}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  Dialog, 
  DialogPanel, 
  DialogTitle, 
  TransitionChild, 
  TransitionRoot 
} from '@headlessui/vue'
import { Call, ElevenLabsConversationSegment } from '~/types/elevenlabs'
import TranscriptViewer from '~/components/calls/TranscriptViewer.vue'

const props = defineProps<{
  call: Call
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// État
const loadingAudio = ref(false)
const loadingTranscript = ref(false)
const audioUrl = ref<string | null>(null)
const transcript = ref<ElevenLabsConversationSegment[]>([])

// Classes CSS pour le statut
const statusClass = computed(() => {
  switch (props.call.status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

// Charger l'URL audio
const loadAudioUrl = async () => {
  if (!props.call.elevenlabs_conversation_id) return
  
  loadingAudio.value = true
  
  try {
    const { data, error } = await useFetch(`/api/ai/conversations/${props.call.elevenlabs_conversation_id}/audio`)
    
    if (error.value) throw error.value
    
    if (data.value?.audio_url) {
      audioUrl.value = data.value.audio_url
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'URL audio:', error)
  } finally {
    loadingAudio.value = false
  }
}

// Charger la transcription
const loadTranscript = async () => {
  if (!props.call.elevenlabs_conversation_id) return
  
  loadingTranscript.value = true
  
  try {
    const { data, error } = await useFetch(`/api/ai/conversations/${props.call.elevenlabs_conversation_id}`)
    
    if (error.value) throw error.value
    
    if (data.value?.conversation?.segments) {
      transcript.value = data.value.conversation.segments
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la transcription:', error)
  } finally {
    loadingTranscript.value = false
  }
}

// Formater la date
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Formater la durée
const formatDuration = (seconds?: number) => {
  if (!seconds) return '00:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Fermer la modale
const closeModal = () => {
  emit('close')
}

// Charger l'URL audio lorsque la modale s'ouvre
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadAudioUrl()
  }
}, { immediate: true })
</script>
