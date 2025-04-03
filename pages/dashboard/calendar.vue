<template>
  <div>
    <Head>
      <title>{{ $t('dashboard.calendar') }} | Prospeo</title>
      <meta name="description" :content="$t('dashboard.calendar_description')" />
    </Head>

    <div class="py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 class="text-2xl font-semibold text-gray-900">{{ $t('dashboard.calendar') }}</h1>
      </div>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <!-- État de connexion Cal.com -->
        <div v-if="!calcomConnected && !connectLoading" class="mt-6 bg-white shadow rounded-lg p-6">
          <div class="text-center">
            <CalendarIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-lg font-medium text-gray-900">{{ $t('calendar.not_connected') }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ $t('calendar.connect_description') }}</p>
            <div class="mt-6">
              <form @submit.prevent="connectCalcom">
                <div class="flex items-center max-w-md mx-auto">
                  <div class="w-full">
                    <label for="api-key" class="sr-only">{{ $t('calendar.api_key') }}</label>
                    <input 
                      id="api-key" 
                      v-model="apiKey" 
                      type="password" 
                      required
                      class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      :placeholder="$t('calendar.api_key_placeholder')"
                    />
                  </div>
                  <button 
                    type="submit"
                    class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    :disabled="!apiKey || connectLoading"
                  >
                    <span v-if="connectLoading" class="mr-2">
                      <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    {{ $t('calendar.connect') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <!-- Calendrier (si connecté) -->
        <div v-else-if="calcomConnected" class="mt-6">
          <CalendarView 
            :availabilities="availabilities"
            :bookings="bookings"
            :loading="loading"
            :default-event-type-id="defaultEventTypeId"
            @date-change="handleDateChange"
            @view-change="handleViewChange"
            @slot-select="handleSlotSelect"
            @create-booking="handleCreateBooking"
          />
        </div>
        
        <!-- État de chargement initial -->
        <div v-else class="mt-6 flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
        
        <!-- Liste des rendez-vous (si connecté) -->
        <div v-if="calcomConnected" class="mt-8 bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-6">{{ $t('calendar.your_bookings') }}</h2>
          
          <BookingList 
            :bookings="bookings"
            :loading="loading"
            @cancel="handleCancelBooking"
            @reschedule="handleRescheduleBooking"
            @page-change="handlePageChange"
            @filter-change="handleFilterChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { CalendarIcon } from '@heroicons/vue/24/outline'
import { CalComAvailability, CalComBooking } from '~/types/calcom'
import CalendarView from '~/components/calendar/CalendarView.vue'
import BookingList from '~/components/calendar/BookingList.vue'

// État
const apiKey = ref('')
const connectLoading = ref(false)
const calcomConnected = ref(false)
const loading = ref(true)
const availabilities = ref<CalComAvailability[]>([])
const bookings = ref<CalComBooking[]>([])
const currentDate = ref(new Date())
const currentView = ref<'month' | 'week' | 'day'>('month')
const defaultEventTypeId = ref<number | undefined>(undefined)

// Vérifier si l'utilisateur est connecté à Cal.com
const checkCalcomConnection = async () => {
  try {
    const client = useSupabaseClient()
    const { data, error } = await client
      .from('calcom_connections')
      .select('id, status')
      .eq('status', 'active')
      .maybeSingle()
    
    if (error) throw error
    
    calcomConnected.value = !!data
    
    if (calcomConnected.value) {
      // Charger les données initiales
      await Promise.all([
        loadAvailabilities(),
        loadBookings()
      ])
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion Cal.com:', error)
  } finally {
    loading.value = false
  }
}

// Connecter à Cal.com
const connectCalcom = async () => {
  if (!apiKey.value) return
  
  connectLoading.value = true
  
  try {
    const { data } = await useFetch('/api/calcom/connect', {
      method: 'POST',
      body: {
        api_key: apiKey.value
      }
    })
    
    if (data.value?.success) {
      calcomConnected.value = true
      apiKey.value = ''
      
      // Charger les données initiales
      await Promise.all([
        loadAvailabilities(),
        loadBookings()
      ])
    } else {
      // Afficher une erreur
      alert(data.value?.message || 'Erreur lors de la connexion à Cal.com')
    }
  } catch (error) {
    console.error('Erreur lors de la connexion à Cal.com:', error)
    alert('Erreur lors de la connexion à Cal.com')
  } finally {
    connectLoading.value = false
  }
}

// Charger les disponibilités
const loadAvailabilities = async () => {
  loading.value = true
  
  try {
    // Calculer les dates de début et de fin en fonction de la vue
    const dateFrom = new Date(currentDate.value)
    const dateTo = new Date(currentDate.value)
    
    if (currentView.value === 'month') {
      // Premier jour du mois
      dateFrom.setDate(1)
      // Dernier jour du mois suivant
      dateTo.setMonth(dateTo.getMonth() + 1, 0)
    } else if (currentView.value === 'week') {
      // Premier jour de la semaine (lundi)
      const day = dateFrom.getDay() || 7
      dateFrom.setDate(dateFrom.getDate() - day + 1)
      // Dernier jour de la semaine (dimanche)
      dateTo.setDate(dateFrom.getDate() + 6)
    }
    
    // Formater les dates au format YYYY-MM-DD
    const dateFromStr = dateFrom.toISOString().split('T')[0]
    const dateToStr = dateTo.toISOString().split('T')[0]
    
    const { data } = await useFetch(`/api/calcom/availability?date_from=${dateFromStr}&date_to=${dateToStr}`)
    
    if (data.value?.availabilities) {
      availabilities.value = data.value.availabilities
    }
  } catch (error) {
    console.error('Erreur lors du chargement des disponibilités:', error)
  } finally {
    loading.value = false
  }
}

// Charger les rendez-vous
const loadBookings = async () => {
  loading.value = true
  
  try {
    const { data } = await useFetch('/api/calcom/bookings')
    
    if (data.value?.bookings) {
      bookings.value = data.value.bookings
    }
  } catch (error) {
    console.error('Erreur lors du chargement des rendez-vous:', error)
  } finally {
    loading.value = false
  }
}

// Gérer le changement de date
const handleDateChange = (date: Date) => {
  currentDate.value = date
  loadAvailabilities()
}

// Gérer le changement de vue
const handleViewChange = (view: 'month' | 'week' | 'day') => {
  currentView.value = view
  loadAvailabilities()
}

// Gérer la sélection d'un créneau
const handleSlotSelect = (slot: any) => {
  // Cette fonction est gérée par le composant CalendarView
  console.log('Créneau sélectionné:', slot)
}

// Gérer la création d'un rendez-vous
const handleCreateBooking = async (data: any) => {
  try {
    const response = await useFetch('/api/calcom/bookings', {
      method: 'POST',
      body: data
    })
    
    if (response.data.value) {
      // Recharger les rendez-vous
      await loadBookings()
      // Recharger les disponibilités
      await loadAvailabilities()
    }
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error)
    alert('Erreur lors de la création du rendez-vous')
  }
}

// Gérer l'annulation d'un rendez-vous
const handleCancelBooking = async (bookingId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
    return
  }
  
  try {
    const response = await useFetch(`/api/calcom/bookings/${bookingId}`, {
      method: 'DELETE'
    })
    
    if (response.data.value) {
      // Recharger les rendez-vous
      await loadBookings()
      // Recharger les disponibilités
      await loadAvailabilities()
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error)
    alert('Erreur lors de l\'annulation du rendez-vous')
  }
}

// Gérer la reprogrammation d'un rendez-vous
const handleRescheduleBooking = (bookingId: string) => {
  // Pour la reprogrammation, on pourrait annuler le rendez-vous existant
  // et rediriger vers le formulaire de création avec les mêmes informations
  alert('Fonctionnalité de reprogrammation non implémentée')
}

// Gérer le changement de page
const handlePageChange = (page: number) => {
  // Cette fonction serait utilisée si la pagination était côté serveur
  console.log('Changement de page:', page)
}

// Gérer le changement de filtre
const handleFilterChange = (filters: any) => {
  // Cette fonction serait utilisée si le filtrage était côté serveur
  console.log('Changement de filtre:', filters)
}

// Initialiser la page
onMounted(() => {
  checkCalcomConnection()
})
</script>
