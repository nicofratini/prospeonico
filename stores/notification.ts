// Store pour gérer les notifications
import { defineStore } from 'pinia'

export interface Notification {
  type: string
  title: string
  message: string
  percentage?: number
  metadata?: any
}

export const useNotificationStore = defineStore('notifications', () => {
  // État
  const subscribers = ref<Function[]>([])
  
  // Actions
  
  // S'abonner aux notifications
  function subscribe(callback: (notification: Notification) => void): Function {
    subscribers.value.push(callback)
    
    // Retourner une fonction pour se désabonner
    return () => {
      const index = subscribers.value.indexOf(callback)
      if (index !== -1) {
        subscribers.value.splice(index, 1)
      }
    }
  }
  
  // Envoyer une notification
  function notify(notification: Notification) {
    // Notifier tous les abonnés
    subscribers.value.forEach(callback => {
      callback(notification)
    })
  }
  
  // Envoyer une notification de quota
  function notifyQuota(type: 'calls' | 'minutes' | 'both', percentage: number, metadata?: any) {
    let notificationType = 'quota'
    let title = 'Alerte de quota'
    let message = 'Votre utilisation approche de la limite de votre forfait.'
    
    if (type === 'calls') {
      notificationType = 'quota_calls'
      title = 'Alerte de quota d\'appels'
      message = `Vous avez utilisé ${percentage}% de votre quota d'appels.`
    } else if (type === 'minutes') {
      notificationType = 'quota_minutes'
      title = 'Alerte de quota de minutes'
      message = `Vous avez utilisé ${percentage}% de votre quota de minutes.`
    } else if (type === 'both') {
      notificationType = 'quota_critical'
      title = 'Alerte critique de quotas'
      message = `Vous avez atteint ${percentage}% de vos quotas d'appels et de minutes.`
    }
    
    notify({
      type: notificationType,
      title,
      message,
      percentage,
      metadata
    })
  }
  
  // Envoyer une notification de calendrier
  function notifyCalendar(title: string, message: string, metadata?: any) {
    notify({
      type: 'calendar',
      title,
      message,
      metadata
    })
  }
  
  return {
    subscribe,
    notify,
    notifyQuota,
    notifyCalendar
  }
})
