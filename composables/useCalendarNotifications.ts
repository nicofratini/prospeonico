// Implémentation des notifications en temps réel pour Cal.com
// Ce fichier configure le client WebSocket pour recevoir les notifications

import { ref, onMounted, onUnmounted } from 'vue'

// État global pour les notifications
export const useCalendarNotifications = () => {
  const notifications = ref<CalendarNotification[]>([])
  const unreadCount = ref(0)
  const isConnected = ref(false)
  let socket: WebSocket | null = null

  // Structure d'une notification de calendrier
  interface CalendarNotification {
    id: string
    type: 'new_booking' | 'booking_cancelled' | 'booking_rescheduled' | 'reminder'
    title: string
    message: string
    booking_id?: string
    timestamp: string
    read: boolean
  }

  // Initialiser la connexion WebSocket
  const initWebSocket = (agencyId: string, userId: string) => {
    // Utiliser le serveur de WebSocket de Cal.com ou un proxy personnalisé
    const wsUrl = `wss://api.cal.com/v1/ws?api_key=${process.env.CALCOM_API_KEY}&agency_id=${agencyId}&user_id=${userId}`
    
    // Fermer la connexion existante si elle existe
    if (socket) {
      socket.close()
    }
    
    // Créer une nouvelle connexion
    socket = new WebSocket(wsUrl)
    
    // Gestionnaire d'événements pour l'ouverture de la connexion
    socket.onopen = () => {
      console.log('WebSocket connection established')
      isConnected.value = true
    }
    
    // Gestionnaire d'événements pour les messages
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Vérifier si c'est une notification de calendrier
        if (data.type && data.title && data.message) {
          // Créer une nouvelle notification
          const notification: CalendarNotification = {
            id: data.id || `notif_${Date.now()}`,
            type: data.type,
            title: data.title,
            message: data.message,
            booking_id: data.booking_id,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false
          }
          
          // Ajouter la notification à la liste
          notifications.value.unshift(notification)
          
          // Incrémenter le compteur de notifications non lues
          unreadCount.value++
          
          // Afficher une notification système si le navigateur le permet
          showSystemNotification(notification)
          
          // Stocker la notification dans le localStorage pour persistance
          saveNotificationsToStorage()
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }
    
    // Gestionnaire d'événements pour les erreurs
    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      isConnected.value = false
    }
    
    // Gestionnaire d'événements pour la fermeture de la connexion
    socket.onclose = () => {
      console.log('WebSocket connection closed')
      isConnected.value = false
      
      // Tenter de se reconnecter après un délai
      setTimeout(() => {
        if (!socket || socket.readyState === WebSocket.CLOSED) {
          initWebSocket(agencyId, userId)
        }
      }, 5000)
    }
  }

  // Afficher une notification système
  const showSystemNotification = (notification: CalendarNotification) => {
    // Vérifier si les notifications sont supportées et autorisées
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      })
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      // Demander la permission
      Notification.requestPermission()
    }
  }

  // Marquer une notification comme lue
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      saveNotificationsToStorage()
    }
  }

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true
    })
    unreadCount.value = 0
    saveNotificationsToStorage()
  }

  // Supprimer une notification
  const removeNotification = (notificationId: string) => {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      const notification = notifications.value[index]
      if (!notification.read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      notifications.value.splice(index, 1)
      saveNotificationsToStorage()
    }
  }

  // Sauvegarder les notifications dans le localStorage
  const saveNotificationsToStorage = () => {
    try {
      localStorage.setItem('calendar_notifications', JSON.stringify(notifications.value))
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error)
    }
  }

  // Charger les notifications depuis le localStorage
  const loadNotificationsFromStorage = () => {
    try {
      const storedNotifications = localStorage.getItem('calendar_notifications')
      if (storedNotifications) {
        notifications.value = JSON.parse(storedNotifications)
        unreadCount.value = notifications.value.filter(n => !n.read).length
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error)
    }
  }

  // Simuler une notification (pour les tests)
  const simulateNotification = (type: 'new_booking' | 'booking_cancelled' | 'booking_rescheduled' | 'reminder') => {
    const titles = {
      new_booking: 'Nouveau rendez-vous',
      booking_cancelled: 'Rendez-vous annulé',
      booking_rescheduled: 'Rendez-vous reprogrammé',
      reminder: 'Rappel de rendez-vous'
    }
    
    const messages = {
      new_booking: 'John Doe a pris rendez-vous pour le 15 avril à 10h00',
      booking_cancelled: 'Le rendez-vous avec John Doe du 15 avril a été annulé',
      booking_rescheduled: 'Le rendez-vous avec John Doe a été déplacé au 16 avril à 14h00',
      reminder: 'Rappel: Vous avez un rendez-vous demain à 10h00 avec John Doe'
    }
    
    const notification: CalendarNotification = {
      id: `notif_${Date.now()}`,
      type,
      title: titles[type],
      message: messages[type],
      booking_id: `booking_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    notifications.value.unshift(notification)
    unreadCount.value++
    saveNotificationsToStorage()
    showSystemNotification(notification)
  }

  // Initialiser les notifications au montage du composant
  onMounted(() => {
    loadNotificationsFromStorage()
    
    // Récupérer l'ID de l'agence et de l'utilisateur depuis le store ou les props
    const user = useSupabaseUser()
    const { getActiveAgency } = useAgencyStore()
    
    if (user.value && getActiveAgency()) {
      initWebSocket(getActiveAgency().id, user.value.id)
    }
  })

  // Nettoyer la connexion WebSocket au démontage du composant
  onUnmounted(() => {
    if (socket) {
      socket.close()
    }
  })

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    simulateNotification
  }
}
