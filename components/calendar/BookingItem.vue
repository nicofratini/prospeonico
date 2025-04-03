<template>
  <li class="py-4">
    <div class="flex items-start space-x-4">
      <div class="flex-shrink-0">
        <div 
          :class="[
            'flex items-center justify-center h-10 w-10 rounded-md',
            statusIconClass
          ]"
        >
          <CalendarIcon class="h-6 w-6" />
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ booking.title }}
          </p>
          <span 
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              statusBadgeClass
            ]"
          >
            {{ $t(`calendar.status.${booking.status.toLowerCase()}`) }}
          </span>
        </div>
        <div class="mt-2 flex items-center text-sm text-gray-500">
          <ClockIcon class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <span>{{ formatDateTime(booking.start) }}</span>
        </div>
        <div v-if="booking.attendees && booking.attendees.length > 0" class="mt-2 flex items-center text-sm text-gray-500">
          <UserIcon class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <span>{{ booking.attendees[0].name }}</span>
          <span class="ml-1 text-gray-400">({{ booking.attendees[0].email }})</span>
        </div>
        <div v-if="booking.location" class="mt-2 flex items-center text-sm text-gray-500">
          <MapPinIcon class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
          <span>{{ formatLocation(booking.location) }}</span>
        </div>
        
        <!-- Actions -->
        <div class="mt-3 flex space-x-2">
          <button 
            v-if="canReschedule"
            @click="reschedule"
            class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ClockIcon class="mr-1.5 h-4 w-4 text-gray-400" />
            {{ $t('calendar.reschedule') }}
          </button>
          <button 
            v-if="canCancel"
            @click="cancel"
            class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <XMarkIcon class="mr-1.5 h-4 w-4 text-red-400" />
            {{ $t('calendar.cancel') }}
          </button>
          <button 
            @click="toggleDetails"
            class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <InformationCircleIcon class="mr-1.5 h-4 w-4 text-gray-400" />
            {{ showDetails ? $t('common.hide_details') : $t('common.view_details') }}
          </button>
        </div>
        
        <!-- Détails supplémentaires (affichés/masqués) -->
        <div v-if="showDetails" class="mt-4 bg-gray-50 p-3 rounded-md">
          <div v-if="booking.description" class="mb-3">
            <h4 class="text-xs font-medium text-gray-700 mb-1">{{ $t('calendar.description') }}</h4>
            <p class="text-sm text-gray-600">{{ booking.description }}</p>
          </div>
          
          <div v-if="booking.metadata && Object.keys(booking.metadata).length > 0" class="mb-3">
            <h4 class="text-xs font-medium text-gray-700 mb-1">{{ $t('calendar.additional_info') }}</h4>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <div v-for="(value, key) in displayableMetadata" :key="key" class="sm:col-span-1">
                <dt class="text-xs text-gray-500">{{ formatMetadataKey(key) }}</dt>
                <dd class="text-sm text-gray-900">{{ formatMetadataValue(value) }}</dd>
              </div>
            </dl>
          </div>
          
          <div class="text-xs text-gray-500">
            <span>{{ $t('calendar.created') }}: {{ formatDateTime(booking.created_at) }}</span>
            <span v-if="booking.updated_at !== booking.created_at" class="ml-3">
              {{ $t('calendar.updated') }}: {{ formatDateTime(booking.updated_at) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  MapPinIcon, 
  XMarkIcon, 
  InformationCircleIcon 
} from '@heroicons/vue/24/outline'
import { CalComBooking } from '~/types/calcom'

const props = defineProps<{
  booking: CalComBooking
}>()

const emit = defineEmits<{
  (e: 'cancel', bookingId: string): void
  (e: 'reschedule', bookingId: string): void
}>()

// État local
const showDetails = ref(false)

// Vérifier si le rendez-vous peut être annulé
const canCancel = computed(() => {
  return ['ACCEPTED', 'PENDING'].includes(props.booking.status)
})

// Vérifier si le rendez-vous peut être reprogrammé
const canReschedule = computed(() => {
  return props.booking.status === 'ACCEPTED' && new Date(props.booking.start) > new Date()
})

// Classe CSS pour l'icône en fonction du statut
const statusIconClass = computed(() => {
  switch (props.booking.status.toLowerCase()) {
    case 'accepted':
      return 'bg-green-100 text-green-600'
    case 'pending':
      return 'bg-yellow-100 text-yellow-600'
    case 'cancelled':
      return 'bg-red-100 text-red-600'
    case 'rejected':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
})

// Classe CSS pour le badge de statut
const statusBadgeClass = computed(() => {
  switch (props.booking.status.toLowerCase()) {
    case 'accepted':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'rejected':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

// Métadonnées affichables (filtrer les clés techniques)
const displayableMetadata = computed(() => {
  if (!props.booking.metadata) return {}
  
  const result: Record<string, any> = {}
  const excludedKeys = ['__typename', 'hashedUrl', 'videoCallUrl']
  
  for (const [key, value] of Object.entries(props.booking.metadata)) {
    if (!excludedKeys.includes(key)) {
      result[key] = value
    }
  }
  
  return result
})

// Formater la date et l'heure
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Formater le lieu
const formatLocation = (location: string) => {
  switch (location.toLowerCase()) {
    case 'phone':
      return 'Téléphone'
    case 'google_meet':
      return 'Google Meet'
    case 'zoom':
      return 'Zoom'
    case 'in_person':
      return 'En personne'
    default:
      return location
  }
}

// Formater les clés de métadonnées
const formatMetadataKey = (key: string) => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
}

// Formater les valeurs de métadonnées
const formatMetadataValue = (value: any) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'object') return JSON.stringify(value)
  return value.toString()
}

// Afficher/masquer les détails
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

// Annuler le rendez-vous
const cancel = () => {
  emit('cancel', props.booking.uid)
}

// Reprogrammer le rendez-vous
const reschedule = () => {
  emit('reschedule', props.booking.uid)
}
</script>
