<template>
  <div class="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
    <div class="w-full flex flex-col items-center space-y-4 sm:items-end">
      <!-- Notification de quota -->
      <transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        v-for="notification in visibleNotifications"
        :key="notification.id"
      >
        <div 
          class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <component 
                  :is="getNotificationIcon(notification.type)" 
                  :class="getNotificationIconColor(notification.type)"
                  class="h-6 w-6"
                  aria-hidden="true" 
                />
              </div>
              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-sm font-medium text-gray-900">
                  {{ notification.title }}
                </p>
                <p class="mt-1 text-sm text-gray-500">
                  {{ notification.message }}
                </p>
                
                <!-- Barre de progression pour les notifications de quota -->
                <div v-if="notification.percentage" class="mt-2">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full" 
                      :class="getProgressBarClass(notification.percentage)"
                      :style="{ width: `${notification.percentage}%` }"
                    ></div>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ notification.percentage }}% {{ $t('quotas.usage') }}
                  </p>
                </div>
                
                <!-- Actions pour les notifications de quota -->
                <div v-if="notification.type.includes('quota')" class="mt-3 flex space-x-4">
                  <button
                    type="button"
                    @click="viewQuotaDetails(notification)"
                    class="bg-white text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {{ $t('quotas.view_details') }}
                  </button>
                  <button
                    type="button"
                    @click="upgradeSubscription(notification)"
                    class="bg-white text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {{ $t('quotas.upgrade_plan') }}
                  </button>
                </div>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="dismissNotification(notification.id)"
                  class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span class="sr-only">{{ $t('common.close') }}</span>
                  <XMarkIcon class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { 
  XMarkIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ClockIcon,
  BellIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

// Types
interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  percentage?: number
  timestamp: Date
  metadata?: any
}

// État
const visibleNotifications = ref<NotificationItem[]>([])
const notificationQueue = ref<NotificationItem[]>([])
const maxVisibleNotifications = 3
const notificationDuration = 8000 // 8 secondes

// Ajouter une notification
const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newNotification = {
    ...notification,
    id,
    timestamp: new Date()
  }
  
  // Ajouter à la file d'attente
  notificationQueue.value.push(newNotification)
  
  // Traiter la file d'attente
  processQueue()
}

// Traiter la file d'attente des notifications
const processQueue = () => {
  // Si la file d'attente est vide ou si le nombre maximum de notifications est atteint, ne rien faire
  if (notificationQueue.value.length === 0 || visibleNotifications.value.length >= maxVisibleNotifications) {
    return
  }
  
  // Prendre la première notification de la file d'attente
  const notification = notificationQueue.value.shift()
  
  // Ajouter la notification aux notifications visibles
  visibleNotifications.value.push(notification)
  
  // Programmer la suppression de la notification après un délai
  setTimeout(() => {
    dismissNotification(notification.id)
  }, notificationDuration)
}

// Supprimer une notification
const dismissNotification = (id: string) => {
  const index = visibleNotifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    visibleNotifications.value.splice(index, 1)
    
    // Traiter la file d'attente après la suppression
    setTimeout(processQueue, 300) // Attendre la fin de l'animation
  }
}

// Obtenir l'icône appropriée pour le type de notification
const getNotificationIcon = (type: string) => {
  if (type.includes('quota_calls')) return PhoneIcon
  if (type.includes('quota_minutes')) return ClockIcon
  if (type.includes('quota')) return ExclamationTriangleIcon
  if (type.includes('calendar')) return CalendarIcon
  return BellIcon
}

// Obtenir la couleur de l'icône pour le type de notification
const getNotificationIconColor = (type: string) => {
  if (type.includes('quota_critical')) return 'text-red-600'
  if (type.includes('quota')) return 'text-yellow-500'
  if (type.includes('calendar')) return 'text-blue-500'
  return 'text-gray-500'
}

// Obtenir la classe CSS pour la barre de progression
const getProgressBarClass = (percentage: number) => {
  if (percentage >= 90) return 'bg-red-600'
  if (percentage >= 75) return 'bg-orange-500'
  return 'bg-yellow-400'
}

// Voir les détails du quota
const viewQuotaDetails = (notification: NotificationItem) => {
  navigateTo('/dashboard/account/usage')
  dismissNotification(notification.id)
}

// Mettre à niveau l'abonnement
const upgradeSubscription = (notification: NotificationItem) => {
  navigateTo('/dashboard/account/subscription')
  dismissNotification(notification.id)
}

// Écouter les événements de notification
let unsubscribe: Function | null = null

onMounted(() => {
  // S'abonner aux événements de notification
  const { subscribe } = useNotificationStore()
  unsubscribe = subscribe((notification) => {
    addNotification(notification)
  })
  
  // Vérifier les notifications de quota au démarrage
  checkQuotaNotifications()
  
  // Vérifier les notifications de quota toutes les heures
  const interval = setInterval(checkQuotaNotifications, 3600000) // 1 heure
  
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
    clearInterval(interval)
  })
})

// Vérifier les notifications de quota
const checkQuotaNotifications = async () => {
  try {
    const { data: quotaNotifications, error } = await useSupabaseClient()
      .from('quota_notifications')
      .select('*')
      .eq('user_id', useSupabaseUser().value.id)
      .is('read_at', null)
      .order('sent_at', { ascending: false })
    
    if (error) throw error
    
    if (quotaNotifications && quotaNotifications.length > 0) {
      // Traiter uniquement la notification la plus récente
      const latestNotification = quotaNotifications[0]
      
      // Déterminer le type de notification
      let type = 'quota'
      let title = 'Alerte de quota'
      let message = 'Votre utilisation approche de la limite de votre forfait.'
      let percentage = latestNotification.current_usage_percent
      
      if (latestNotification.notification_type === 'calls_threshold') {
        type = 'quota_calls'
        title = 'Alerte de quota d\'appels'
        message = `Vous avez utilisé ${latestNotification.metadata.calls_percentage}% de votre quota d'appels.`
      } else if (latestNotification.notification_type === 'minutes_threshold') {
        type = 'quota_minutes'
        title = 'Alerte de quota de minutes'
        message = `Vous avez utilisé ${latestNotification.metadata.minutes_percentage}% de votre quota de minutes.`
      } else if (latestNotification.notification_type === 'calls_and_minutes_threshold') {
        type = 'quota_critical'
        title = 'Alerte critique de quotas'
        message = `Vous avez atteint ${percentage}% de vos quotas d'appels et de minutes.`
      }
      
      // Ajouter la notification
      addNotification({
        type,
        title,
        message,
        percentage,
        metadata: latestNotification.metadata
      })
      
      // Marquer la notification comme lue
      await useSupabaseClient()
        .from('quota_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', latestNotification.id)
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des notifications de quota:', error)
  }
}

// Exposer les fonctions pour les tests
defineExpose({
  addNotification
})
</script>
