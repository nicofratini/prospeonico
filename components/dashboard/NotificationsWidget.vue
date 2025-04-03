// Intégration des notifications dans le dashboard principal
// Ce composant affiche un widget de notifications sur le dashboard

<template>
  <div class="bg-white overflow-hidden shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg leading-6 font-medium text-gray-900">{{ $t('dashboard.notifications') }}</h3>
        <span 
          v-if="unreadCount > 0" 
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
        >
          {{ unreadCount }}
        </span>
      </div>
      
      <div class="mt-4 flow-root">
        <div v-if="loading" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
        </div>
        
        <div v-else-if="notifications.length === 0" class="text-center py-4">
          <p class="text-sm text-gray-500">{{ $t('dashboard.no_notifications') }}</p>
        </div>
        
        <ul v-else class="-my-5 divide-y divide-gray-200">
          <li v-for="notification in notifications.slice(0, 5)" :key="notification.id" class="py-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div 
                  class="h-8 w-8 rounded-full flex items-center justify-center"
                  :class="getNotificationIconClass(notification)"
                >
                  <component :is="getNotificationIcon(notification)" class="h-5 w-5 text-white" />
                </div>
              </div>
              <div class="ml-3 flex-1">
                <div class="text-sm font-medium text-gray-900">
                  {{ getNotificationTitle(notification) }}
                </div>
                <div class="mt-1 text-sm text-gray-500">
                  {{ getNotificationMessage(notification) }}
                </div>
                
                <!-- Barre de progression pour les notifications de quota -->
                <div v-if="isQuotaNotification(notification)" class="mt-2">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full" 
                      :class="getProgressBarClass(notification.current_usage_percent)"
                      :style="{ width: `${notification.current_usage_percent}%` }"
                    ></div>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ notification.current_usage_percent }}% {{ $t('quotas.usage') }}
                  </p>
                </div>
                
                <div class="mt-2 text-xs text-gray-500">
                  {{ formatDate(notification.sent_at || notification.created_at) }}
                </div>
              </div>
            </div>
          </li>
        </ul>
        
        <div v-if="notifications.length > 5" class="mt-6 text-center">
          <button 
            @click="navigateToAllNotifications" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {{ $t('dashboard.view_all_notifications') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  BellIcon, 
  PhoneIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

// Types
interface Notification {
  id: string
  type?: string
  notification_type?: string
  title?: string
  message?: string
  current_usage_percent?: number
  threshold_percent?: number
  sent_at?: string
  created_at: string
  read_at?: string | null
  metadata?: any
}

// État
const notifications = ref<Notification[]>([])
const loading = ref(true)

// Calculer le nombre de notifications non lues
const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read_at).length
})

// Charger les notifications
const loadNotifications = async () => {
  loading.value = true
  
  try {
    // Charger les notifications de quota
    const { data: quotaNotifications, error: quotaError } = await useSupabaseClient()
      .from('quota_notifications')
      .select('*')
      .eq('user_id', useSupabaseUser().value.id)
      .order('sent_at', { ascending: false })
      .limit(10)
    
    if (quotaError) throw quotaError
    
    // Charger les notifications de calendrier
    const { data: calendarNotifications, error: calendarError } = await useSupabaseClient()
      .from('calendar_notifications')
      .select('*')
      .eq('user_id', useSupabaseUser().value.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (calendarError) throw calendarError
    
    // Fusionner et trier les notifications
    const allNotifications = [
      ...(quotaNotifications || []),
      ...(calendarNotifications || [])
    ].sort((a, b) => {
      const dateA = new Date(a.sent_at || a.created_at)
      const dateB = new Date(b.sent_at || b.created_at)
      return dateB.getTime() - dateA.getTime()
    })
    
    notifications.value = allNotifications
  } catch (error) {
    console.error('Erreur lors du chargement des notifications:', error)
  } finally {
    loading.value = false
  }
}

// Vérifier si c'est une notification de quota
const isQuotaNotification = (notification: Notification) => {
  return notification.notification_type?.includes('threshold') || false
}

// Obtenir l'icône appropriée pour la notification
const getNotificationIcon = (notification: Notification) => {
  if (notification.notification_type === 'calls_threshold') {
    return PhoneIcon
  } else if (notification.notification_type === 'minutes_threshold') {
    return ClockIcon
  } else if (notification.notification_type === 'calls_and_minutes_threshold') {
    return ExclamationTriangleIcon
  } else if (notification.type === 'calendar' || notification.notification_type?.includes('booking')) {
    return CalendarIcon
  }
  return BellIcon
}

// Obtenir la classe CSS pour l'icône de notification
const getNotificationIconClass = (notification: Notification) => {
  if (notification.notification_type === 'calls_threshold') {
    return 'bg-yellow-500'
  } else if (notification.notification_type === 'minutes_threshold') {
    return 'bg-orange-500'
  } else if (notification.notification_type === 'calls_and_minutes_threshold') {
    return 'bg-red-500'
  } else if (notification.type === 'calendar' || notification.notification_type?.includes('booking')) {
    return 'bg-blue-500'
  }
  return 'bg-gray-500'
}

// Obtenir la classe CSS pour la barre de progression
const getProgressBarClass = (percentage?: number) => {
  if (!percentage) return 'bg-gray-500'
  if (percentage >= 90) return 'bg-red-600'
  if (percentage >= 75) return 'bg-orange-500'
  return 'bg-yellow-400'
}

// Obtenir le titre de la notification
const getNotificationTitle = (notification: Notification) => {
  if (notification.title) return notification.title
  
  if (notification.notification_type === 'calls_threshold') {
    return 'Alerte de quota d\'appels'
  } else if (notification.notification_type === 'minutes_threshold') {
    return 'Alerte de quota de minutes'
  } else if (notification.notification_type === 'calls_and_minutes_threshold') {
    return 'Alerte de quotas d\'appels et de minutes'
  } else if (notification.notification_type === 'new_booking') {
    return 'Nouveau rendez-vous'
  } else if (notification.notification_type === 'booking_cancelled') {
    return 'Rendez-vous annulé'
  } else if (notification.notification_type === 'booking_rescheduled') {
    return 'Rendez-vous reprogrammé'
  }
  
  return 'Notification'
}

// Obtenir le message de la notification
const getNotificationMessage = (notification: Notification) => {
  if (notification.message) return notification.message
  
  if (isQuotaNotification(notification) && notification.metadata) {
    const { metadata } = notification
    
    if (notification.notification_type === 'calls_threshold') {
      return `Vous avez utilisé ${metadata.calls_used} appels sur ${metadata.calls_limit} (${metadata.calls_percentage}%).`
    } else if (notification.notification_type === 'minutes_threshold') {
      return `Vous avez utilisé ${metadata.minutes_used} minutes sur ${metadata.minutes_limit} (${metadata.minutes_percentage}%).`
    } else if (notification.notification_type === 'calls_and_minutes_threshold') {
      return `Vous avez utilisé ${metadata.calls_used} appels sur ${metadata.calls_limit} (${metadata.calls_percentage}%) et ${metadata.minutes_used} minutes sur ${metadata.minutes_limit} (${metadata.minutes_percentage}%).`
    }
  }
  
  return 'Aucun détail disponible'
}

// Formater une date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
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

// Naviguer vers la page de toutes les notifications
const navigateToAllNotifications = () => {
  navigateTo('/dashboard/notifications')
}

// Charger les notifications au montage du composant
onMounted(() => {
  loadNotifications()
})
</script>
