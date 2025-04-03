<template>
  <div class="bg-white rounded-lg shadow">
    <!-- En-tête du calendrier avec navigation et sélection de vue -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <button 
            @click="navigateMonth(-1)" 
            class="p-2 rounded-full hover:bg-gray-100"
            aria-label="Mois précédent"
          >
            <ChevronLeftIcon class="h-5 w-5 text-gray-500" />
          </button>
          <h2 class="text-lg font-semibold text-gray-900 mx-4">
            {{ formatMonthYear(currentDate) }}
          </h2>
          <button 
            @click="navigateMonth(1)" 
            class="p-2 rounded-full hover:bg-gray-100"
            aria-label="Mois suivant"
          >
            <ChevronRightIcon class="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div class="flex space-x-2">
          <button 
            @click="setView('month')" 
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md',
              currentView === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ $t('calendar.month') }}
          </button>
          <button 
            @click="setView('week')" 
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md',
              currentView === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ $t('calendar.week') }}
          </button>
          <button 
            @click="setView('day')" 
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md',
              currentView === 'day' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            ]"
          >
            {{ $t('calendar.day') }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- État de chargement -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
    
    <!-- Vue mensuelle -->
    <div v-else-if="currentView === 'month'" class="p-4">
      <!-- Jours de la semaine -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div v-for="day in weekDays" :key="day" class="text-center text-sm font-medium text-gray-500 py-2">
          {{ day }}
        </div>
      </div>
      
      <!-- Grille des jours -->
      <div class="grid grid-cols-7 gap-1">
        <div 
          v-for="(day, index) in monthDays" 
          :key="index" 
          :class="[
            'min-h-[100px] p-2 border rounded-md',
            day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
            day.isToday ? 'border-indigo-500' : 'border-gray-200',
            day.date.getTime() < today.getTime() && day.isCurrentMonth ? 'opacity-50' : ''
          ]"
          @click="selectDay(day.date)"
        >
          <!-- Numéro du jour -->
          <div 
            :class="[
              'text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center',
              day.isToday ? 'bg-indigo-600 text-white' : 'text-gray-900'
            ]"
          >
            {{ day.date.getDate() }}
          </div>
          
          <!-- Événements du jour -->
          <div class="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
            <div 
              v-for="booking in getBookingsForDay(day.date)" 
              :key="booking.uid"
              class="text-xs p-1 rounded truncate"
              :class="getStatusColor(booking.status)"
            >
              {{ formatTime(booking.start) }} - {{ booking.title }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Vue hebdomadaire -->
    <div v-else-if="currentView === 'week'" class="p-4">
      <!-- En-tête des jours -->
      <div class="grid grid-cols-7 gap-2 mb-4">
        <div 
          v-for="(day, index) in weekDays" 
          :key="index"
          :class="[
            'text-center py-2',
            isToday(weekDates[index]) ? 'bg-indigo-100 rounded-md' : ''
          ]"
        >
          <div class="text-sm font-medium text-gray-900">{{ day }}</div>
          <div 
            :class="[
              'text-2xl font-semibold mt-1',
              isToday(weekDates[index]) ? 'text-indigo-600' : 'text-gray-900'
            ]"
          >
            {{ weekDates[index].getDate() }}
          </div>
        </div>
      </div>
      
      <!-- Grille des heures -->
      <div class="grid grid-cols-7 gap-2">
        <div v-for="(date, dateIndex) in weekDates" :key="dateIndex" class="space-y-2">
          <!-- Disponibilités pour ce jour -->
          <div v-if="getAvailabilityForDay(date).length > 0" class="space-y-2">
            <AvailabilitySlot 
              v-for="(slot, slotIndex) in getAvailabilityForDay(date)" 
              :key="slotIndex"
              :slot="slot"
              :selected="isSelectedSlot(slot)"
              @click="selectSlot(slot)"
            />
          </div>
          
          <!-- Message si pas de disponibilités -->
          <div v-else class="text-center py-4 text-sm text-gray-500">
            {{ $t('calendar.no_availability') }}
          </div>
          
          <!-- Rendez-vous pour ce jour -->
          <div 
            v-for="booking in getBookingsForDay(date)" 
            :key="booking.uid"
            :class="[
              'p-2 rounded-md text-sm border',
              getStatusColor(booking.status)
            ]"
          >
            <div class="font-medium">{{ formatTime(booking.start) }}</div>
            <div class="truncate">{{ booking.title }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Vue journalière -->
    <div v-else-if="currentView === 'day'" class="p-4">
      <!-- Navigation des jours -->
      <div class="flex items-center justify-between mb-4">
        <button 
          @click="navigateDay(-1)" 
          class="p-2 rounded-full hover:bg-gray-100"
          aria-label="Jour précédent"
        >
          <ChevronLeftIcon class="h-5 w-5 text-gray-500" />
        </button>
        <h3 
          :class="[
            'text-xl font-semibold',
            isToday(currentDate) ? 'text-indigo-600' : 'text-gray-900'
          ]"
        >
          {{ formatFullDate(currentDate) }}
        </h3>
        <button 
          @click="navigateDay(1)" 
          class="p-2 rounded-full hover:bg-gray-100"
          aria-label="Jour suivant"
        >
          <ChevronRightIcon class="h-5 w-5 text-gray-500" />
        </button>
      </div>
      
      <!-- Disponibilités pour ce jour -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-700 mb-2">{{ $t('calendar.available_slots') }}</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <AvailabilitySlot 
            v-for="(slot, index) in getAvailabilityForDay(currentDate)" 
            :key="index"
            :slot="slot"
            :selected="isSelectedSlot(slot)"
            @click="selectSlot(slot)"
          />
        </div>
        
        <!-- Message si pas de disponibilités -->
        <div v-if="getAvailabilityForDay(currentDate).length === 0" class="text-center py-4 text-sm text-gray-500">
          {{ $t('calendar.no_availability_today') }}
        </div>
      </div>
      
      <!-- Rendez-vous pour ce jour -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 mb-2">{{ $t('calendar.bookings') }}</h4>
        <div class="space-y-2">
          <div 
            v-for="booking in getBookingsForDay(currentDate)" 
            :key="booking.uid"
            :class="[
              'p-3 rounded-md border',
              getStatusColor(booking.status)
            ]"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium text-gray-900">{{ booking.title }}</div>
                <div class="text-sm text-gray-500 mt-1">
                  {{ formatTime(booking.start) }} - {{ formatTime(booking.end) }}
                </div>
                <div v-if="booking.attendees && booking.attendees.length > 0" class="text-sm text-gray-500 mt-1">
                  {{ booking.attendees[0].name }} ({{ booking.attendees[0].email }})
                </div>
              </div>
              <span 
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getStatusBadgeColor(booking.status)
                ]"
              >
                {{ $t(`calendar.status.${booking.status.toLowerCase()}`) }}
              </span>
            </div>
            <div v-if="booking.description" class="mt-2 text-sm text-gray-700">
              {{ booking.description }}
            </div>
          </div>
          
          <!-- Message si pas de rendez-vous -->
          <div v-if="getBookingsForDay(currentDate).length === 0" class="text-center py-4 text-sm text-gray-500">
            {{ $t('calendar.no_bookings_today') }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Formulaire de réservation (si un créneau est sélectionné) -->
    <BookingForm 
      v-if="selectedSlot"
      :selected-slot="selectedSlot"
      :event-type-id="defaultEventTypeId"
      :loading="bookingLoading"
      @submit="createBooking"
      @cancel="cancelSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { CalComTimeSlot, CalComBooking, CalComAvailability } from '~/types/calcom'
import AvailabilitySlot from './AvailabilitySlot.vue'
import BookingForm from './BookingForm.vue'

const props = defineProps<{
  availabilities: CalComAvailability[]
  bookings: CalComBooking[]
  loading: boolean
  defaultEventTypeId?: number
}>()

const emit = defineEmits<{
  (e: 'dateChange', date: Date): void
  (e: 'viewChange', view: 'month' | 'week' | 'day'): void
  (e: 'slotSelect', slot: CalComTimeSlot): void
  (e: 'createBooking', data: any): void
}>()

// État local
const currentDate = ref(new Date())
const currentView = ref<'month' | 'week' | 'day'>('month')
const selectedSlot = ref<CalComTimeSlot | null>(null)
const bookingLoading = ref(false)
const today = ref(new Date())

// Jours de la semaine (commençant par lundi pour la France)
const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Dates de la semaine actuelle
const weekDates = computed(() => {
  const dates = []
  const firstDayOfWeek = new Date(currentDate.value)
  
  // Trouver le lundi de la semaine
  const day = firstDayOfWeek.getDay()
  const diff = firstDayOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour commencer le lundi
  firstDayOfWeek.setDate(diff)
  
  // Générer les 7 jours de la semaine
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDayOfWeek)
    date.setDate(firstDayOfWeek.getDate() + i)
    dates.push(date)
  }
  
  return dates
})

// Jours du mois actuel (avec jours du mois précédent/suivant pour compléter la grille)
const monthDays = computed(() => {
  const days = []
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // Premier jour du mois
  const firstDay = new Date(year, month, 1)
  // Dernier jour du mois
  const lastDay = new Date(year, month + 1, 0)
  
  // Trouver le premier jour à afficher (lundi précédant le premier jour du mois)
  const firstDayOfGrid = new Date(firstDay)
  const firstDayWeekday = firstDay.getDay() || 7 // 0 (dimanche) devient 7
  firstDayOfGrid.setDate(firstDay.getDate() - (firstDayWeekday - 1))
  
  // Trouver le dernier jour à afficher
  const lastDayOfGrid = new Date(lastDay)
  const lastDayWeekday = lastDay.getDay() || 7
  if (lastDayWeekday < 7) {
    lastDayOfGrid.setDate(lastDay.getDate() + (7 - lastDayWeekday))
  }
  
  // Générer tous les jours de la grille
  const currentDay = new Date(firstDayOfGrid)
  while (currentDay <= lastDayOfGrid) {
    days.push({
      date: new Date(currentDay),
      isCurrentMonth: currentDay.getMonth() === month,
      isToday: isToday(currentDay)
    })
    currentDay.setDate(currentDay.getDate() + 1)
  }
  
  return days
})

// Vérifier si une date est aujourd'hui
function isToday(date: Date): boolean {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

// Formater le mois et l'année (ex: "Avril 2025")
function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric'
  }).format(date)
}

// Formater la date complète (ex: "Mercredi 2 avril 2025")
function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

// Formater l'heure (HH:MM)
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Naviguer d'un mois
function navigateMonth(direction: number): void {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + direction)
  currentDate.value = newDate
  emit('dateChange', newDate)
}

// Naviguer d'un jour
function navigateDay(direction: number): void {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + direction)
  currentDate.value = newDate
  emit('dateChange', newDate)
}

// Changer la vue (mois, semaine, jour)
function setView(view: 'month' | 'week' | 'day'): void {
  currentView.value = view
  emit('viewChange', view)
}

// Sélectionner un jour
function selectDay(date: Date): void {
  currentDate.value = date
  setView('day')
  emit('dateChange', date)
}

// Sélectionner un créneau
function selectSlot(slot: CalComTimeSlot): void {
  selectedSlot.value = slot
  emit('slotSelect', slot)
}

// Vérifier si un créneau est sélectionné
function isSelectedSlot(slot: CalComTimeSlot): boolean {
  if (!selectedSlot.value) return false
  return selectedSlot.value.start === slot.start && selectedSlot.value.end === slot.end
}

// Annuler la sélection
function cancelSelection(): void {
  selectedSlot.value = null
}

// Créer un rendez-vous
function createBooking(data: any): void {
  bookingLoading.value = true
  emit('createBooking', data)
  // Note: Dans une implémentation réelle, on attendrait la réponse de l'API
  // avant de réinitialiser l'état et de rafraîchir les données
  setTimeout(() => {
    bookingLoading.value = false
    selectedSlot.value = null
  }, 1000)
}

// Obtenir les disponibilités pour un jour spécifique
function getAvailabilityForDay(date: Date): CalComTimeSlot[] {
  const dateString = date.toISOString().split('T')[0] // Format YYYY-MM-DD
  const availability = props.availabilities.find(a => a.date === dateString)
  return availability ? availability.slots.filter(slot => slot.available) : []
}

// Obtenir les rendez-vous pour un jour spécifique
function getBookingsForDay(date: Date): CalComBooking[] {
  return props.bookings.filter(booking => {
    const bookingDate = new Date(booking.start)
    return bookingDate.getDate() === date.getDate() &&
           bookingDate.getMonth() === date.getMonth() &&
           bookingDate.getFullYear() === date.getFullYear()
  })
}

// Obtenir la couleur de fond en fonction du statut
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'border-green-200 bg-green-50'
    case 'pending':
      return 'border-yellow-200 bg-yellow-50'
    case 'cancelled':
      return 'border-red-200 bg-red-50'
    case 'rejected':
      return 'border-gray-200 bg-gray-50'
    default:
      return 'border-gray-200 bg-gray-50'
  }
}

// Obtenir la couleur du badge en fonction du statut
function getStatusBadgeColor(status: string): string {
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

// Surveiller les changements de date pour émettre l'événement
watch(currentDate, (newDate) => {
  emit('dateChange', newDate)
})

// Initialiser le composant
onMounted(() => {
  // Émettre la date initiale
  emit('dateChange', currentDate.value)
  // Émettre la vue initiale
  emit('viewChange', currentView.value)
})
</script>
