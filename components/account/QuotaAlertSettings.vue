<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg font-medium leading-6 text-gray-900">{{ $t('quotas.usage_alerts') }}</h3>
      <div class="mt-2 max-w-xl text-sm text-gray-500">
        <p>{{ $t('quotas.usage_alerts_description') }}</p>
      </div>
      
      <div class="mt-5 space-y-6">
        <!-- Seuil d'alerte pour les appels -->
        <div>
          <label for="calls-threshold" class="block text-sm font-medium text-gray-700">
            {{ $t('quotas.calls_threshold') }}
          </label>
          <div class="mt-1 flex items-center">
            <input
              type="range"
              id="calls-threshold"
              v-model="callsThreshold"
              min="50"
              max="95"
              step="5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span class="ml-3 text-sm font-medium text-gray-700">{{ callsThreshold }}%</span>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            {{ $t('quotas.threshold_description', { threshold: callsThreshold }) }}
          </p>
        </div>
        
        <!-- Seuil d'alerte pour les minutes -->
        <div>
          <label for="minutes-threshold" class="block text-sm font-medium text-gray-700">
            {{ $t('quotas.minutes_threshold') }}
          </label>
          <div class="mt-1 flex items-center">
            <input
              type="range"
              id="minutes-threshold"
              v-model="minutesThreshold"
              min="50"
              max="95"
              step="5"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span class="ml-3 text-sm font-medium text-gray-700">{{ minutesThreshold }}%</span>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            {{ $t('quotas.threshold_description', { threshold: minutesThreshold }) }}
          </p>
        </div>
        
        <!-- Délai entre les notifications -->
        <div>
          <label for="cooldown" class="block text-sm font-medium text-gray-700">
            {{ $t('quotas.notification_cooldown') }}
          </label>
          <div class="mt-1">
            <select
              id="cooldown"
              v-model="cooldownHours"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="12">{{ $t('quotas.every_12_hours') }}</option>
              <option value="24">{{ $t('quotas.every_24_hours') }}</option>
              <option value="48">{{ $t('quotas.every_48_hours') }}</option>
              <option value="72">{{ $t('quotas.every_72_hours') }}</option>
            </select>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            {{ $t('quotas.cooldown_description') }}
          </p>
        </div>
        
        <!-- Canaux de notification -->
        <div>
          <span class="block text-sm font-medium text-gray-700">
            {{ $t('quotas.notification_channels') }}
          </span>
          <div class="mt-2 space-y-2">
            <div class="relative flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="in-app"
                  v-model="notificationChannels.inApp"
                  type="checkbox"
                  class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div class="ml-3 text-sm">
                <label for="in-app" class="font-medium text-gray-700">{{ $t('quotas.in_app_notifications') }}</label>
                <p class="text-gray-500">{{ $t('quotas.in_app_description') }}</p>
              </div>
            </div>
            
            <div class="relative flex items-start">
              <div class="flex items-center h-5">
                <input
                  id="email"
                  v-model="notificationChannels.email"
                  type="checkbox"
                  class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div class="ml-3 text-sm">
                <label for="email" class="font-medium text-gray-700">{{ $t('quotas.email_notifications') }}</label>
                <p class="text-gray-500">{{ $t('quotas.email_description') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-6">
        <button
          type="button"
          @click="saveSettings"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          :disabled="isSaving"
        >
          <span v-if="isSaving">{{ $t('common.saving') }}...</span>
          <span v-else>{{ $t('common.save_settings') }}</span>
        </button>
      </div>
    </div>
    
    <!-- Historique des notifications -->
    <div class="px-4 py-5 sm:p-6 border-t border-gray-200">
      <h3 class="text-lg font-medium leading-6 text-gray-900">{{ $t('quotas.notification_history') }}</h3>
      <div class="mt-2 max-w-xl text-sm text-gray-500">
        <p>{{ $t('quotas.notification_history_description') }}</p>
      </div>
      
      <div class="mt-5">
        <div v-if="notifications.length === 0" class="text-center py-6 bg-gray-50 rounded-lg">
          <p class="text-gray-500">{{ $t('quotas.no_notifications') }}</p>
        </div>
        
        <ul v-else class="divide-y divide-gray-200">
          <li v-for="notification in notifications" :key="notification.id" class="py-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div 
                  class="h-8 w-8 rounded-full flex items-center justify-center"
                  :class="getNotificationIconClass(notification.notification_type)"
                >
                  <component :is="getNotificationIcon(notification.notification_type)" class="h-5 w-5 text-white" />
                </div>
              </div>
              <div class="ml-3 flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-gray-900">
                    {{ getNotificationTitle(notification) }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ formatDate(notification.sent_at) }}
                  </p>
                </div>
                <div class="mt-1 text-sm text-gray-500">
                  <p>{{ getNotificationMessage(notification) }}</p>
                </div>
                
                <!-- Barre de progression -->
                <div class="mt-2">
                  <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      class="h-2.5 rounded-full" 
                      :class="getProgressBarClass(notification.current_usage_percent)"
                      :style="{ width: `${notification.current_usage_percent}%` }"
                    ></div>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">
                    {{ notification.current_usage_percent }}% {{ $t('quotas.usage') }}
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  PhoneIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Types
interface QuotaNotification {
  id: string
  agency_id: string
  user_id: string
  notification_type: string
  threshold_percent: number
  current_usage_percent: number
  sent_at: string
  read_at: string | null
  metadata: {
    agency_name: string
    calls_used: number
    calls_limit: number
    calls_percentage: number
    minutes_used: number
    minutes_limit: number
    minutes_percentage: number
  }
}

// État
const callsThreshold = ref(80)
const minutesThreshold = ref(80)
const cooldownHours = ref(24)
const notificationChannels = ref({
  inApp: true,
  email: true
})
const isSaving = ref(false)
const notifications = ref<QuotaNotification[]>([])
const loading = ref(false)

// Charger les paramètres actuels
const loadSettings = async () => {
  loading.value = true
  
  try {
    const { data: quota, error } = await useSupabaseClient()
      .from('usage_quotas')
      .select('*')
      .eq('agency_id', useAgencyStore().getActiveAgency().id)
      .single()
    
    if (error) throw error
    
    if (quota) {
      callsThreshold.value = quota.calls_notification_threshold || 80
      minutesThreshold.value = quota.minutes_notification_threshold || 80
      cooldownHours.value = quota.notification_cooldown_hours || 24
    }
    
    // Charger les préférences de notification
    const { data: preferences, error: preferencesError } = await useSupabaseClient()
      .from('user_preferences')
      .select('notification_preferences')
      .eq('user_id', useSupabaseUser().value.id)
      .single()
    
    if (!preferencesError && preferences?.notification_preferences) {
      notificationChannels.value = {
        inApp: preferences.notification_preferences.quota_alerts_in_app !== false,
        email: preferences.notification_preferences.quota_alerts_email !== false
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
  } finally {
    loading.value = false
  }
}

// Sauvegarder les paramètres
const saveSettings = async () => {
  isSaving.value = true
  
  try {
    // Mettre à jour les seuils de notification
    const { error } = await useSupabaseClient()
      .from('usage_quotas')
      .update({
        calls_notification_threshold: callsThreshold.value,
        minutes_notification_threshold: minutesThreshold.value,
        notification_cooldown_hours: cooldownHours.value
      })
      .eq('agency_id', useAgencyStore().getActiveAgency().id)
    
    if (error) throw error
    
    // Mettre à jour les préférences de notification
    const { error: preferencesError } = await useSupabaseClient()
      .from('user_preferences')
      .upsert({
        user_id: useSupabaseUser().value.id,
        notification_preferences: {
          quota_alerts_in_app: notificationChannels.value.inApp,
          quota_alerts_email: notificationChannels.value.email
        }
      })
    
    if (preferencesError) throw preferencesError
    
    useToast().success('Paramètres de notification enregistrés avec succès')
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error)
    useToast().error('Erreur lors de la sauvegarde des paramètres')
  } finally {
    isSaving.value = false
  }
}

// Charger l'historique des notifications
const loadNotifications = async () => {
  loading.value = true
  
  try {
    const { data, error } = await useSupabaseClient()
      .from('quota_notifications')
      .select('*')
      .eq('agency_id', useAgencyStore().getActiveAgency().id)
      .order('sent_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    notifications.value = data || []
  } catch (error) {
    console.error('Erreur lors du chargement des notifications:', error)
  } finally {
    loading.value = false
  }
}

// Obtenir l'icône appropriée pour le type de notification
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'calls_threshold':
      return PhoneIcon
    case 'minutes_threshold':
      return ClockIcon
    case 'calls_and_minutes_threshold':
      return ExclamationTriangleIcon
    default:
      return ExclamationTriangleIcon
  }
}

// Obtenir la classe CSS pour l'icône de notification
const getNotificationIconClass = (type: string) => {
  switch (type) {
    case 'calls_threshold':
      return 'bg-yellow-500'
    case 'minutes_threshold':
      return 'bg-orange-500'
    case 'calls_and_minutes_threshold':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

// Obtenir la classe CSS pour la barre de progression
const getProgressBarClass = (percentage: number) => {
  if (percentage >= 90) return 'bg-red-600'
  if (percentage >= 75) return 'bg-orange-500'
  return 'bg-yellow-400'
}

// Obtenir le titre de la notification
const getNotificationTitle = (notification: QuotaNotification) => {
  switch (notification.notification_type) {
    case 'calls_threshold':
      return 'Alerte de quota d\'appels'
    case 'minutes_threshold':
      return 'Alerte de quota de minutes'
    case 'calls_and_minutes_threshold':
      return 'Alerte de quotas d\'appels et de minutes'
    default:
      return 'Alerte de quota'
  }
}

// Obtenir le message de la notification
const getNotificationMessage = (notification: QuotaNotification) => {
  const { metadata } = notification
  
  switch (notification.notification_type) {
    case 'calls_threshold':
      return `Vous avez utilisé ${metadata.calls_used} appels sur ${metadata.calls_limit} (${metadata.calls_percentage}%).`
    case 'minutes_threshold':
      return `Vous avez utilisé ${metadata.minutes_used} minutes sur ${metadata.minutes_limit} (${metadata.minutes_percentage}%).`
    case 'calls_and_minutes_threshold':
      return `Vous avez utilisé ${metadata.calls_used} appels sur ${metadata.calls_limit} (${metadata.calls_percentage}%) et ${metadata.minutes_used} minutes sur ${metadata.minutes_limit} (${metadata.minutes_percentage}%).`
    default:
      return 'Votre utilisation approche de la limite de votre forfait.'
  }
}

// Formater une date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Charger les données au montage du composant
onMounted(() => {
  loadSettings()
  loadNotifications()
})
</script>
