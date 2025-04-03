<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="space-y-8">
      <!-- En-tête -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('ai_agent.title') }}</h1>
        <p class="mt-2 text-sm text-gray-500">{{ $t('ai_agent.description') }}</p>
      </div>
      
      <!-- Formulaire de configuration -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">{{ $t('ai_agent.configuration') }}</h3>
        </div>
        
        <div class="px-4 py-5 sm:p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
          
          <form v-else @submit.prevent="saveAgent" class="space-y-6">
            <!-- Nom de l'agent -->
            <div>
              <label for="agent-name" class="block text-sm font-medium text-gray-700">{{ $t('ai_agent.agent_name') }}</label>
              <div class="mt-1">
                <input 
                  type="text" 
                  id="agent-name" 
                  v-model="agentForm.name" 
                  required
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ $t('ai_agent.agent_name_description') }}</p>
            </div>
            
            <!-- Sélection de voix -->
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ $t('ai_agent.voice_selection') }}</label>
              <div class="mt-1">
                <VoiceSelector 
                  v-model="agentForm.voice_id" 
                  @preview="previewVoice"
                />
              </div>
            </div>
            
            <!-- Prompt système -->
            <div>
              <label for="system-prompt" class="block text-sm font-medium text-gray-700">{{ $t('ai_agent.system_prompt') }}</label>
              <div class="mt-1">
                <textarea 
                  id="system-prompt" 
                  v-model="agentForm.system_prompt" 
                  rows="8"
                  required
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                ></textarea>
              </div>
              <p class="mt-1 text-sm text-gray-500">{{ $t('ai_agent.system_prompt_description') }}</p>
            </div>
            
            <!-- Variables disponibles -->
            <div class="bg-gray-50 p-4 rounded-md">
              <h4 class="text-sm font-medium text-gray-900">{{ $t('ai_agent.available_variables') }}</h4>
              <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div class="flex items-center">
                  <button 
                    type="button" 
                    @click="insertVariable('{{agency_name}}')"
                    class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {{agency_name}}
                  </button>
                  <span class="ml-2 text-xs text-gray-500">{{ $t('ai_agent.agency_name_var') }}</span>
                </div>
                <div class="flex items-center">
                  <button 
                    type="button" 
                    @click="insertVariable('{{agent_name}}')"
                    class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {{agent_name}}
                  </button>
                  <span class="ml-2 text-xs text-gray-500">{{ $t('ai_agent.agent_name_var') }}</span>
                </div>
                <div class="flex items-center">
                  <button 
                    type="button" 
                    @click="insertVariable('{{agency_address}}')"
                    class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {{agency_address}}
                  </button>
                  <span class="ml-2 text-xs text-gray-500">{{ $t('ai_agent.agency_address_var') }}</span>
                </div>
                <div class="flex items-center">
                  <button 
                    type="button" 
                    @click="insertVariable('{{agency_phone}}')"
                    class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {{agency_phone}}
                  </button>
                  <span class="ml-2 text-xs text-gray-500">{{ $t('ai_agent.agency_phone_var') }}</span>
                </div>
              </div>
            </div>
            
            <!-- Boutons d'action -->
            <div class="flex justify-end space-x-3">
              <button 
                type="button" 
                @click="resetForm" 
                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {{ $t('common.reset') }}
              </button>
              <button 
                type="submit" 
                :disabled="saving"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              >
                <span v-if="saving" class="mr-2">
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                {{ saving ? $t('common.saving') : $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Statut de l'agent -->
      <div v-if="agentStatus" class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">{{ $t('ai_agent.status') }}</h3>
        </div>
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <span 
                :class="[
                  'inline-flex items-center justify-center h-12 w-12 rounded-md',
                  agentStatus === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                ]"
              >
                <CheckCircleIcon v-if="agentStatus === 'active'" class="h-6 w-6 text-green-600" />
                <ClockIcon v-else class="h-6 w-6 text-yellow-600" />
              </span>
            </div>
            <div class="ml-4">
              <h4 class="text-lg font-medium text-gray-900">
                {{ agentStatus === 'active' ? $t('ai_agent.status_active') : $t('ai_agent.status_pending') }}
              </h4>
              <p class="mt-1 text-sm text-gray-500">
                {{ agentStatus === 'active' ? $t('ai_agent.status_active_description') : $t('ai_agent.status_pending_description') }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Exemple de prompt -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 class="text-lg leading-6 font-medium text-gray-900">{{ $t('ai_agent.example_prompt') }}</h3>
        </div>
        <div class="px-4 py-5 sm:p-6">
          <div class="prose prose-sm max-w-none text-gray-500">
            <p>{{ $t('ai_agent.example_prompt_intro') }}</p>
            <pre class="bg-gray-50 p-4 rounded-md overflow-auto text-xs">{{ examplePrompt }}</pre>
            <button 
              @click="copyExamplePrompt" 
              class="mt-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ClipboardIcon class="h-4 w-4 mr-1" />
              {{ $t('common.copy') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ClipboardIcon 
} from '@heroicons/vue/24/outline'
import VoiceSelector from '~/components/ai-agent/VoiceSelector.vue'
import { 
  ElevenLabsAgent, 
  ElevenLabsCreateAgentRequest, 
  ElevenLabsUpdateAgentRequest 
} from '~/types/elevenlabs'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

const client = useSupabaseClient()
const { showToast } = useToast()

// État
const loading = ref(true)
const saving = ref(false)
const agency = ref<any>(null)
const agent = ref<ElevenLabsAgent | null>(null)
const agentStatus = ref<string | null>(null)

// Formulaire
const agentForm = reactive<{
  name: string;
  voice_id: string;
  system_prompt: string;
}>({
  name: '',
  voice_id: '',
  system_prompt: ''
})

// Exemple de prompt
const examplePrompt = computed(() => {
  return `Vous êtes un assistant virtuel pour l'agence immobilière {{agency_name}}. Votre nom est {{agent_name}}.

Votre rôle est de répondre aux appels téléphoniques, de fournir des informations sur les biens disponibles, et de prendre des rendez-vous pour des visites.

Lorsque vous répondez à un appel, présentez-vous de la manière suivante :
"Bonjour, je suis {{agent_name}} de l'agence {{agency_name}}. Comment puis-je vous aider aujourd'hui ?"

Informations importantes :
- Adresse de l'agence : {{agency_address}}
- Numéro de téléphone : {{agency_phone}}
- Horaires d'ouverture : Du lundi au vendredi de 9h à 19h, le samedi de 10h à 17h

Pour les demandes de visite, proposez des créneaux disponibles et collectez les informations suivantes :
- Nom complet
- Numéro de téléphone
- Email
- Créneau horaire souhaité

Restez toujours poli, professionnel et serviable. Si vous ne pouvez pas répondre à une question, proposez de transférer l'appel à un conseiller humain.`
})

// Charger les données de l'agence et de l'agent
const loadAgencyAndAgent = async () => {
  loading.value = true
  
  try {
    // Charger l'agence depuis Supabase
    const { data: agencyData, error: agencyError } = await client
      .from('agencies')
      .select('*')
      .single()
    
    if (agencyError) throw agencyError
    
    agency.value = agencyData
    
    // Si l'agence a un agent ElevenLabs associé, le charger
    if (agency.value.elevenlabs_agent_id) {
      const { data: agentData, error: agentError } = await useFetch(`/api/ai/agents/${agency.value.elevenlabs_agent_id}`)
      
      if (agentError.value) throw agentError.value
      
      if (agentData.value?.agent) {
        agent.value = agentData.value.agent
        agentStatus.value = agent.value.status
        
        // Remplir le formulaire avec les données de l'agent
        agentForm.name = agent.value.name
        agentForm.voice_id = agent.value.voice_id
        agentForm.system_prompt = agent.value.system_prompt
      }
    } else {
      // Initialiser le formulaire avec des valeurs par défaut
      agentForm.name = `Agent ${agency.value.name}`
      agentForm.system_prompt = examplePrompt.value
        .replace('{{agency_name}}', agency.value.name)
        .replace(/{{agent_name}}/g, agentForm.name)
        .replace('{{agency_address}}', agency.value.address)
        .replace('{{agency_phone}}', agency.value.phone)
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'agence et de l\'agent:', error)
    showToast('error', $t('ai_agent.error_loading'))
  } finally {
    loading.value = false
  }
}

// Prévisualiser une voix
const previewVoice = async (voiceId: string) => {
  try {
    const { data } = await useFetch('/api/ai/preview-voice', {
      method: 'POST',
      body: {
        voice_id: voiceId,
        text: `Bonjour, je suis ${agentForm.name} de l'agence ${agency.value?.name}. Comment puis-je vous aider aujourd'hui ?`
      }
    })
    
    if (data.value?.audio_url) {
      const audio = new Audio(data.value.audio_url)
      audio.play()
    }
  } catch (error) {
    console.error('Erreur lors de la prévisualisation de la voix:', error)
    showToast('error', $t('ai_agent.error_preview_voice'))
  }
}

// Insérer une variable dans le prompt système
const insertVariable = (variable: string) => {
  const textarea = document.getElementById('system-prompt') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    agentForm.system_prompt = agentForm.system_prompt.substring(0, start) + 
      variable + 
      agentForm.system_prompt.substring(end)
    
    // Remettre le focus et la position du curseur
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + variable.length
      textarea.selectionEnd = start + variable.length
    }, 0)
  } else {
    agentForm.system_prompt += variable
  }
}

// Copier l'exemple de prompt
const copyExamplePrompt = () => {
  navigator.clipboard.writeText(examplePrompt.value)
  showToast('success', $t('ai_agent.prompt_copied'))
}

// Réinitialiser le formulaire
const resetForm = () => {
  if (agent.value) {
    // Réinitialiser avec les valeurs de l'agent existant
    agentForm.name = agent.value.name
    agentForm.voice_id = agent.value.voice_id
    agentForm.system_prompt = agent.value.system_prompt
  } else {
    // Réinitialiser avec des valeurs par défaut
    agentForm.name = `Agent ${agency.value?.name || ''}`
    agentForm.voice_id = ''
    agentForm.system_prompt = examplePrompt.value
      .replace('{{agency_name}}', agency.value?.name || '')
      .replace(/{{agent_name}}/g, agentForm.name)
      .replace('{{agency_address}}', agency.value?.address || '')
      .replace('{{agency_phone}}', agency.value?.phone || '')
  }
}

// Sauvegarder l'agent
const saveAgent = async () => {
  if (!agentForm.voice_id) {
    showToast('error', $t('ai_agent.error_no_voice'))
    return
  }
  
  saving.value = true
  
  try {
    let agentId = agency.value?.elevenlabs_agent_id
    
    if (agentId) {
      // Mettre à jour l'agent existant
      const updateData: ElevenLabsUpdateAgentRequest = {
        name: agentForm.name,
        voice_id: agentForm.voice_id,
        system_prompt: agentForm.system_prompt
      }
      
      const { error } = await useFetch(`/api/ai/agents/${agentId}`, {
        method: 'PUT',
        body: updateData
      })
      
      if (error.value) throw error.value
    } else {
      // Créer un nouvel agent
      const createData: ElevenLabsCreateAgentRequest = {
        name: agentForm.name,
        voice_id: agentForm.voice_id,
        system_prompt: agentForm.system_prompt
      }
      
      const { data, error } = await useFetch('/api/ai/agents', {
        method: 'POST',
        body: createData
      })
      
      if (error.value) throw error.value
      
      if (data.value?.agent) {
        agentId = data.value.agent.agent_id
        
        // Mettre à jour l'agence avec l'ID de l'agent
        const { error: updateError } = await client
          .from('agencies')
          .update({ elevenlabs_agent_id: agentId })
          .eq('id', agency.value.id)
        
        if (updateError) throw updateError
      }
    }
    
    showToast('success', $t('ai_agent.save_success'))
    
    // Recharger les données
    await loadAgencyAndAgent()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'agent:', error)
    showToast('error', $t('ai_agent.error_saving'))
  } finally {
    saving.value = false
  }
}

// Composable pour les toasts (à implémenter séparément)
function useToast() {
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    console.log(`[${type}] ${message}`)
    // Implémentation réelle à ajouter
  }
  
  return { showToast }
}

// Charger les données au montage du composant
onMounted(() => {
  loadAgencyAndAgent()
})
</script>
