<template>
  <div class="relative">
    <!-- Bouton de notification avec badge -->
    <button 
      @click="toggleNotificationPanel" 
      class="relative p-2 text-gray-500 rounded-full hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <span class="sr-only">{{ $t('notifications.view_notifications') }}</span>
      <BellIcon class="h-6 w-6" />
      
      <!-- Badge de notification -->
      <span 
        v-if="unreadCount > 0" 
        class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>
    
    <!-- Panneau de notifications -->
    <div 
      v-if="isOpen" 
      class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50"
      @click.outside="isOpen = false"
    >
      <div class="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900">{{ $t('notifications.notifications') }}</h3>
        <div class="flex space-x-2">
          <button 
            v-if="unreadCount > 0"
            @click="markAllAsRead" 
            class="text-xs text-indigo-600 hover:text-indigo-800"
          >
            {{ $t('notifications.mark_all_read') }}
          </button>
        </div>
      </div>
      
      <div class="max-h-96 overflow-y-auto">
        <div v-if="notifications.length === 0" class="p-4 text-center text-sm text-gray-500">
          {{ $t('notifications.no_notifications') }}
        </div>
        
        <ul v-else class="divide-y divide-gray-200">
          <li 
            v-for="notification in notifications" 
            :key="notification.id" 
            class="p-4 hover:bg-gray-50 transition-colors duration-150"
            :class="{ 'bg-blue-50': !notification.read }"
          >
            <div class="flex items-start">
              <!-- Icône de notification -->
              <div class="flex-shrink-0 mr-3">
                <div 
                  class="h-8 w-8 rounded-full flex items-center justify-center"
                  :class="getNotificationIconClass(notification.type)"
                >
                  <component :is="getNotificationIcon(notification.type)" class="h-5 w-5 text-white" />
                </div>
              </div>
              
              <!-- Contenu de la notification -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">
                  {{ notification.title }}
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ formatTimestamp(notification.timestamp) }}
                </p>
                
                <!-- Actions pour les notifications de rendez-vous -->
                <div v-if="notification.booking_id && notification.type === 'new_booking'" class="mt-2 flex space-x-2">
                  <button 
                    @click="viewBookingDetails(notification.booking_id)" 
                    class="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {{ $t('notifications.view_details') }}
                  </button>
                </div>
              </div>
              
              <!-- Actions de notification -->
              <div class="ml-3 flex-shrink-0 flex">
                <button 
                  @click="removeNotification(notification.id)" 
                  class="text-gray-400 hover:text-gray-500"
                >
                  <span class="sr-only">{{ $t('notifications.dismiss') }}</span>
                  <XMarkIcon class="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
      
      <!-- Pied du panneau -->
      <div class="p-3 border-t border-gray-200 text-center">
        <button 
          @click="navigateToAllNotifications" 
          class="text-xs text-indigo-600 hover:text-indigo-800"
        >
          {{ $t('notifications.view_all') }}
        </button>
      </div>
    </div>
    
    <!-- Indicateur de connexion WebSocket -->
    <div 
      v-if="showConnectionStatus" 
      class="absolute bottom-0 right-0 h-2 w-2 rounded-full"
      :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
      :title="isConnected ? $t('notifications.connected') : $t('notifications.disconnected')"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { 
  BellIcon, 
  XMarkIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import { useCalendarNotifications } from '~/composables/useCalendarNotifications'

const props = defineProps({
  showConnectionStatus: {
    type: Boolean,
    default: false
  }
})

// État local
const isOpen = ref(false)

// Utiliser le composable de notifications
const { 
  notifications, 
  unreadCount, 
  isConnected,
  markAsRead, 
  markAllAsRead, 
  removeNotification 
} = useCalendarNotifications()

// Basculer l'affichage du panneau de notifications
const toggleNotificationPanel = () => {
  isOpen.value = !isOpen.value
  
  // Marquer les notifications comme lues lorsque le panneau est ouvert
  if (isOpen.value && unreadCount.value > 0) {
    // Marquer uniquement les notifications visibles comme lues
    const visibleNotifications = notifications.value.slice(0, 10)
    visibleNotifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
    })
  }
}

// Obtenir l'icône appropriée pour le type de notification
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_booking':
      return CalendarIcon
    case 'booking_cancelled':
      return ExclamationCircleIcon
    case 'booking_rescheduled':
      return ArrowPathIcon
    case 'reminder':
      return ClockIcon
    default:
      return BellIcon
  }
}

// Obtenir la classe CSS pour l'icône de notification
const getNotificationIconClass = (type: string) => {
  switch (type) {
    case 'new_booking':
      return 'bg-green-500'
    case 'booking_cancelled':
      return 'bg-red-500'
    case 'booking_rescheduled':
      return 'bg-yellow-500'
    case 'reminder':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

// Formater l'horodatage
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.round(diffMs / 60000)
  const diffHours = Math.round(diffMs / 3600000)
  const diffDays = Math.round(diffMs / 86400000)
  
  if (diffMins < 1) {
    return 'À l\'instant'
  } else if (diffMins < 60) {
    return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`
  } else if (diffHours < 24) {
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
  } else {
    return date.toLocaleDateString()
  }
}

// Voir les détails d'un rendez-vous
const viewBookingDetails = (bookingId: string) => {
  navigateTo(`/dashboard/calendar/bookings/${bookingId}`)
  isOpen.value = false
}

// Naviguer vers la page de toutes les notifications
const navigateToAllNotifications = () => {
  navigateTo('/dashboard/notifications')
  isOpen.value = false
}

// Fermer le panneau lorsque l'utilisateur clique en dehors
onMounted(() => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.notification-panel') && !target.closest('.notification-button')) {
      isOpen.value = false
    }
  })
})

// Observer les changements du nombre de notifications non lues
watch(unreadCount, (newCount) => {
  // Mettre à jour le titre de la page pour indiquer les nouvelles notifications
  if (newCount > 0) {
    document.title = `(${newCount}) ${document.title.replace(/^\(\d+\)\s/, '')}`
  } else {
    document.title = document.title.replace(/^\(\d+\)\s/, '')
  }
})
</script>
