<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium text-gray-900">{{ $t('call_analysis.timeline') }}</h3>
      <div class="flex space-x-2">
        <button 
          @click="zoomLevel = 'day'"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md',
            zoomLevel === 'day' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ $t('call_analysis.day') }}
        </button>
        <button 
          @click="zoomLevel = 'week'"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md',
            zoomLevel === 'week' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ $t('call_analysis.week') }}
        </button>
        <button 
          @click="zoomLevel = 'month'"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md',
            zoomLevel === 'month' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ $t('call_analysis.month') }}
        </button>
      </div>
    </div>
    
    <!-- Timeline -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else-if="events.length === 0" class="text-center py-8">
      <ClockIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('call_analysis.no_events') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ $t('call_analysis.no_events_description') }}</p>
    </div>
    
    <div v-else class="relative">
      <!-- Ligne verticale de la timeline -->
      <div class="absolute left-9 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <!-- Événements de la timeline -->
      <ul class="space-y-6">
        <li v-for="event in filteredEvents" :key="event.id" class="relative flex items-start">
          <!-- Indicateur d'importance -->
          <div 
            class="absolute left-9 w-3 h-3 rounded-full mt-1.5 -ml-1.5 z-10"
            :class="{
              'bg-red-500': event.importance === 'high',
              'bg-yellow-500': event.importance === 'medium',
              'bg-blue-500': event.importance === 'low'
            }"
          ></div>
          
          <!-- Date/heure -->
          <div class="flex-shrink-0 w-20 text-right">
            <span class="text-sm text-gray-500">{{ formatTime(event.timestamp) }}</span>
          </div>
          
          <!-- Contenu de l'événement -->
          <div class="ml-6 flex-1">
            <div 
              class="p-3 rounded-lg"
              :class="{
                'bg-red-50 border border-red-100': event.importance === 'high',
                'bg-yellow-50 border border-yellow-100': event.importance === 'medium',
                'bg-blue-50 border border-blue-100': event.importance === 'low'
              }"
            >
              <!-- Titre de l'événement -->
              <div class="flex items-center justify-between mb-1">
                <h4 class="text-sm font-medium text-gray-900">
                  {{ getEventTitle(event) }}
                </h4>
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-red-100 text-red-800': event.importance === 'high',
                    'bg-yellow-100 text-yellow-800': event.importance === 'medium',
                    'bg-blue-100 text-blue-800': event.importance === 'low'
                  }"
                >
                  {{ getEventType(event.type) }}
                </span>
              </div>
              
              <!-- Contenu spécifique au type d'événement -->
              <div class="text-sm text-gray-700">
                <!-- Insight -->
                <template v-if="event.type === 'insight'">
                  <div class="font-medium">{{ getInsightTypeLabel(event.content.insight_type) }}</div>
                  <div class="mt-1">{{ event.content.insight_text }}</div>
                </template>
                
                <!-- Tag -->
                <template v-else-if="event.type === 'tag'">
                  <div 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :style="{ backgroundColor: event.content.tag_color + '20', color: event.content.tag_color }"
                  >
                    {{ event.content.tag_name }}
                  </div>
                </template>
                
                <!-- Note -->
                <template v-else-if="event.type === 'note'">
                  <div>{{ event.content.text }}</div>
                </template>
                
                <!-- Follow-up -->
                <template v-else-if="event.type === 'follow_up'">
                  <div class="flex items-center">
                    <CalendarIcon class="h-4 w-4 text-gray-500 mr-1" />
                    <span>{{ formatDate(event.content.date) }}</span>
                  </div>
                  <div class="mt-1">{{ event.content.description }}</div>
                </template>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Ajouter une note ou un suivi -->
    <div class="mt-6 pt-6 border-t border-gray-200">
      <div class="flex space-x-2">
        <button 
          @click="showAddNoteForm = !showAddNoteForm; showAddFollowUpForm = false"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PencilIcon class="-ml-1 mr-1 h-4 w-4 text-gray-500" />
          {{ $t('call_analysis.add_note') }}
        </button>
        <button 
          @click="showAddFollowUpForm = !showAddFollowUpForm; showAddNoteForm = false"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <CalendarIcon class="-ml-1 mr-1 h-4 w-4 text-gray-500" />
          {{ $t('call_analysis.add_follow_up') }}
        </button>
      </div>
      
      <!-- Formulaire d'ajout de note -->
      <div v-if="showAddNoteForm" class="mt-4 p-4 bg-gray-50 rounded-md">
        <form @submit.prevent="addNote">
          <div>
            <label for="note-text" class="block text-sm font-medium text-gray-700">{{ $t('call_analysis.note') }}</label>
            <div class="mt-1">
              <textarea 
                id="note-text" 
                v-model="newNote.text" 
                rows="3"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                :placeholder="$t('call_analysis.note_placeholder')"
              ></textarea>
            </div>
          </div>
          <div class="mt-3">
            <label for="note-importance" class="block text-sm font-medium text-gray-700">{{ $t('call_analysis.importance') }}</label>
            <div class="mt-1">
              <select 
                id="note-importance" 
                v-model="newNote.importance"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="low">{{ $t('call_analysis.low') }}</option>
                <option value="medium">{{ $t('call_analysis.medium') }}</option>
                <option value="high">{{ $t('call_analysis.high') }}</option>
              </select>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button 
              type="button"
              @click="showAddNoteForm = false"
              class="mr-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {{ $t('common.cancel') }}
            </button>
            <button 
              type="submit"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              :disabled="!newNote.text || loading"
            >
              {{ $t('common.save') }}
            </button>
          </div>
        </form>
      </div>
      
      <!-- Formulaire d'ajout de suivi -->
      <div v-if="showAddFollowUpForm" class="mt-4 p-4 bg-gray-50 rounded-md">
        <form @submit.prevent="addFollowUp">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="follow-up-date" class="block text-sm font-medium text-gray-700">{{ $t('call_analysis.date') }}</label>
              <div class="mt-1">
                <input 
                  id="follow-up-date" 
                  v-model="newFollowUp.date" 
                  type="date"
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label for="follow-up-importance" class="block text-sm font-medium text-gray-700">{{ $t('call_analysis.importance') }}</label>
              <div class="mt-1">
                <select 
                  id="follow-up-importance" 
                  v-model="newFollowUp.importance"
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="low">{{ $t('call_analysis.low') }}</option>
                  <option value="medium">{{ $t('call_analysis.medium') }}</option>
                  <option value="high">{{ $t('call_analysis.high') }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <label for="follow-up-description" class="block text-sm font-medium text-gray-700">{{ $t('call_analysis.description') }}</label>
            <div class="mt-1">
              <textarea 
                id="follow-up-description" 
                v-model="newFollowUp.description" 
                rows="3"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                :placeholder="$t('call_analysis.follow_up_placeholder')"
              ></textarea>
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <button 
              type="button"
              @click="showAddFollowUpForm = false"
              class="mr-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {{ $t('common.cancel') }}
            </button>
            <button 
              type="submit"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              :disabled="!newFollowUp.date || !newFollowUp.description || loading"
            >
              {{ $t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ClockIcon, PencilIcon, CalendarIcon } from '@heroicons/vue/24/outline'
import { CallTimelineEvent } from '~/types/call-analysis'

const props = defineProps<{
  callId: string
}>()

const emit = defineEmits<{
  (e: 'update:events', events: CallTimelineEvent[]): void
  (e: 'add', event: CallTimelineEvent): void
}>()

// État local
const events = ref<CallTimelineEvent[]>([])
const loading = ref(true)
const zoomLevel = ref<'day' | 'week' | 'month'>('week')
const showAddNoteForm = ref(false)
const showAddFollowUpForm = ref(false)
const newNote = ref({
  text: '',
  importance: 'medium' as 'low' | 'medium' | 'high'
})
const newFollowUp = ref({
  date: new Date().toISOString().split('T')[0],
  description: '',
  importance: 'medium' as 'low' | 'medium' | 'high'
})

// Événements filtrés en fonction du niveau de zoom
const filteredEvents = computed(() => {
  if (zoomLevel.value === 'day') {
    // Filtrer les événements du jour
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return events.value.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= today && eventDate < tomorrow
    })
  } else if (zoomLevel.value === 'week') {
    // Filtrer les événements de la semaine
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Dimanche
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    
    return events.value.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= startOfWeek && eventDate < endOfWeek
    })
  } else {
    // Filtrer les événements du mois
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    return events.value.filter(event => {
      const eventDate = new Date(event.timestamp)
      return eventDate >= startOfMonth && eventDate <= endOfMonth
    })
  }
})

// Charger les événements de timeline
const loadEvents = async () => {
  loading.value = true
  
  try {
    const { data } = await useFetch(`/api/calls/${props.callId}/timeline`)
    
    if (data.value?.events) {
      events.value = data.value.events
      emit('update:events', events.value)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des événements de timeline:', error)
  } finally {
    loading.value = false
  }
}

// Ajouter une note
const addNote = async () => {
  if (!newNote.value.text) return
  
  loading.value = true
  
  try {
    const { data } = await useFetch(`/api/calls/${props.callId}/timeline`, {
      method: 'POST',
      body: {
        type: 'note',
        content: {
          text: newNote.value.text
        },
        importance: newNote.value.importance
      }
    })
    
    if (data.value?.event) {
      // Ajouter l'événement à la liste
      events.value.unshift(data.value.event)
      emit('update:events', events.value)
      emit('add', data.value.event)
      
      // Réinitialiser le formulaire
      newNote.value = {
        text: '',
        importance: 'medium'
      }
      showAddNoteForm.value = false
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la note:', error)
  } finally {
    loading.value = false
  }
}

// Ajouter un suivi
const addFollowUp = async () => {
  if (!newFollowUp.value.date || !newFollowUp.value.description) return
  
  loading.value = true
  
  try {
    const { data } = await useFetch(`/api/calls/${props.callId}/timeline`, {
      method: 'POST',
      body: {
        type: 'follow_up',
        content: {
          date: newFollowUp.value.date,
          description: newFollowUp.value.description
        },
        importance: newFollowUp.value.importance
      }
    })
    
    if (data.value?.event) {
      // Ajouter l'événement à la liste
      events.value.unshift(data.value.event)
      emit('update:events', events.value)
      emit('add', data.value.event)
      
      // Réinitialiser le formulaire
      newFollowUp.value = {
        date: new Date().toISOString().split('T')[0],
        description: '',
        importance: 'medium'
      }
      showAddFollowUpForm.value = false
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du suivi:', error)
  } finally {
    loading.value = false
  }
}

// Formater l'heure
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// Formater la date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

// Obtenir le titre de l'événement
const getEventTitle = (event: CallTimelineEvent) => {
  switch (event.type) {
    case 'insight':
      return `${$t('call_analysis.insight_detected')}: ${event.content.insight_value}`
    case 'tag':
      return $t('call_analysis.tag_added')
    case 'note':
      return $t('call_analysis.note_added')
    case 'follow_up':
      return $t('call_analysis.follow_up_scheduled')
    default:
      return $t('call_analysis.event')
  }
}

// Obtenir le type d'événement
const getEventType = (type: string) => {
  switch (type) {
    case 'insight':
      return $t('call_analysis.insight')
    case 'tag':
      return $t('call_analysis.tag')
    case 'note':
      return $t('call_analysis.note')
    case 'follow_up':
      return $t('call_analysis.follow_up')
    default:
      return type
  }
}

// Obtenir le libellé du type d'insight
const getInsightTypeLabel = (type: string) => {
  switch (type) {
    case 'price':
      return $t('call_analysis.price')
    case 'location':
      return $t('call_analysis.location')
    case 'property_type':
      return $t('call_analysis.property_type')
    case 'criteria':
      return $t('call_analysis.criteria')
    case 'availability':
      return $t('call_analysis.availability')
    case 'interest':
      return $t('call_analysis.interest')
    default:
      return $t('call_analysis.other')
  }
}

// Initialiser le composant
onMounted(() => {
  loadEvents()
})
</script>
