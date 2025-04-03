<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900">{{ $t('calendar.upcoming_appointments') }}</h3>
      <button 
        @click="onViewAll"
        class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        {{ $t('common.view_all') }}
      </button>
    </div>
    
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else-if="bookings.length === 0" class="text-center py-6">
      <CalendarIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('calendar.no_upcoming_appointments') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ $t('calendar.no_appointments_description') }}</p>
    </div>
    
    <ul v-else class="divide-y divide-gray-200">
      <li v-for="booking in limitedBookings" :key="booking.uid" class="py-4">
        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-10 w-10 rounded-md bg-indigo-100 text-indigo-600">
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
                  statusClass(booking.status)
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
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarIcon, ClockIcon, UserIcon } from '@heroicons/vue/24/outline'
import { CalComBooking } from '~/types/calcom'

const props = defineProps<{
  bookings: CalComBooking[]
  loading: boolean
  limit?: number
}>()

const emit = defineEmits<{
  (e: 'viewAll'): void
}>()

// Limiter le nombre de rendez-vous affichés
const limitedBookings = computed(() => {
  const limit = props.limit || 3
  return props.bookings.slice(0, limit)
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

// Déterminer la classe CSS en fonction du statut
const statusClass = (status: string) => {
  switch (status.toLowerCase()) {
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
}

// Gérer le clic sur "Voir tout"
const onViewAll = () => {
  emit('viewAll')
}
</script>
