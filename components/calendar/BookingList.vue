<template>
  <div>
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else-if="bookings.length === 0" class="text-center py-8">
      <CalendarIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('calendar.no_bookings') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ $t('calendar.no_bookings_description') }}</p>
    </div>
    
    <div v-else>
      <!-- Filtres -->
      <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center space-x-4">
          <div>
            <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">{{ $t('calendar.status') }}</label>
            <select
              id="status-filter"
              v-model="filters.status"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">{{ $t('calendar.all_statuses') }}</option>
              <option value="accepted">{{ $t('calendar.status.accepted') }}</option>
              <option value="pending">{{ $t('calendar.status.pending') }}</option>
              <option value="cancelled">{{ $t('calendar.status.cancelled') }}</option>
              <option value="rejected">{{ $t('calendar.status.rejected') }}</option>
            </select>
          </div>
          
          <div>
            <label for="date-filter" class="block text-sm font-medium text-gray-700 mb-1">{{ $t('calendar.date_range') }}</label>
            <select
              id="date-filter"
              v-model="filters.dateRange"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">{{ $t('calendar.all_dates') }}</option>
              <option value="today">{{ $t('calendar.today') }}</option>
              <option value="tomorrow">{{ $t('calendar.tomorrow') }}</option>
              <option value="this_week">{{ $t('calendar.this_week') }}</option>
              <option value="next_week">{{ $t('calendar.next_week') }}</option>
              <option value="this_month">{{ $t('calendar.this_month') }}</option>
              <option value="past">{{ $t('calendar.past') }}</option>
            </select>
          </div>
        </div>
        
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-1">{{ $t('calendar.search') }}</label>
          <div class="relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              v-model="filters.search"
              type="text"
              class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              :placeholder="$t('calendar.search_placeholder')"
            />
          </div>
        </div>
      </div>
      
      <!-- Liste des rendez-vous -->
      <ul class="divide-y divide-gray-200">
        <BookingItem 
          v-for="booking in filteredBookings" 
          :key="booking.uid"
          :booking="booking"
          @cancel="cancelBooking"
          @reschedule="rescheduleBooking"
        />
      </ul>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            :class="[
              'relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md',
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ $t('common.previous') }}
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            :class="[
              'ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md',
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ $t('common.next') }}
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              {{ $t('common.showing') }} <span class="font-medium">{{ startItem }}</span> {{ $t('common.to') }} <span class="font-medium">{{ endItem }}</span> {{ $t('common.of') }} <span class="font-medium">{{ totalItems }}</span> {{ $t('calendar.bookings') }}
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                :class="[
                  'relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium',
                  currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-50'
                ]"
              >
                <span class="sr-only">{{ $t('common.previous') }}</span>
                <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
              </button>
              
              <button
                v-for="page in displayedPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                :class="[
                  'relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium',
                  currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-50'
                ]"
              >
                <span class="sr-only">{{ $t('common.next') }}</span>
                <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CalendarIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { CalComBooking } from '~/types/calcom'
import BookingItem from './BookingItem.vue'

const props = defineProps<{
  bookings: CalComBooking[]
  loading: boolean
  totalItems?: number
  pageSize?: number
  currentPage?: number
  totalPages?: number
}>()

const emit = defineEmits<{
  (e: 'cancel', bookingId: string): void
  (e: 'reschedule', bookingId: string): void
  (e: 'pageChange', page: number): void
  (e: 'filterChange', filters: any): void
}>()

// Filtres
const filters = ref({
  status: 'all',
  dateRange: 'all',
  search: ''
})

// Pagination
const localCurrentPage = ref(props.currentPage || 1)
const localPageSize = ref(props.pageSize || 10)

// Calculer les rendez-vous filtrés (si la pagination est côté client)
const filteredBookings = computed(() => {
  // Si la pagination est gérée côté serveur, on utilise directement les bookings fournis
  if (props.totalPages) {
    return props.bookings
  }
  
  // Sinon, on filtre côté client
  return props.bookings.filter(booking => {
    // Filtre par statut
    if (filters.value.status !== 'all' && booking.status.toLowerCase() !== filters.value.status) {
      return false
    }
    
    // Filtre par date
    if (filters.value.dateRange !== 'all') {
      const bookingDate = new Date(booking.start)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const nextWeekStart = new Date(today)
      nextWeekStart.setDate(nextWeekStart.getDate() - nextWeekStart.getDay() + 8) // Lundi prochain
      
      const nextWeekEnd = new Date(nextWeekStart)
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6) // Dimanche prochain
      
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      
      switch (filters.value.dateRange) {
        case 'today':
          if (bookingDate.getDate() !== today.getDate() ||
              bookingDate.getMonth() !== today.getMonth() ||
              bookingDate.getFullYear() !== today.getFullYear()) {
            return false
          }
          break
        case 'tomorrow':
          if (bookingDate.getDate() !== tomorrow.getDate() ||
              bookingDate.getMonth() !== tomorrow.getMonth() ||
              bookingDate.getFullYear() !== tomorrow.getFullYear()) {
            return false
          }
          break
        case 'this_week':
          const thisWeekStart = new Date(today)
          thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1) // Lundi de cette semaine
          const thisWeekEnd = new Date(thisWeekStart)
          thisWeekEnd.setDate(thisWeekEnd.getDate() + 6) // Dimanche de cette semaine
          
          if (bookingDate < thisWeekStart || bookingDate > thisWeekEnd) {
            return false
          }
          break
        case 'next_week':
          if (bookingDate < nextWeekStart || bookingDate > nextWeekEnd) {
            return false
          }
          break
        case 'this_month':
          if (bookingDate.getMonth() !== today.getMonth() ||
              bookingDate.getFullYear() !== today.getFullYear() ||
              bookingDate < today) {
            return false
          }
          break
        case 'past':
          if (bookingDate >= today) {
            return false
          }
          break
      }
    }
    
    // Filtre par recherche
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      const titleMatch = booking.title.toLowerCase().includes(searchLower)
      const attendeeMatch = booking.attendees && booking.attendees.some(
        attendee => attendee.name.toLowerCase().includes(searchLower) || 
                   attendee.email.toLowerCase().includes(searchLower)
      )
      
      if (!titleMatch && !attendeeMatch) {
        return false
      }
    }
    
    return true
  })
})

// Pagination côté client
const paginatedBookings = computed(() => {
  if (props.totalPages) {
    return filteredBookings.value
  }
  
  const start = (localCurrentPage.value - 1) * localPageSize.value
  const end = start + localPageSize.value
  return filteredBookings.value.slice(start, end)
})

// Calculer le nombre total de pages (si pagination côté client)
const totalPages = computed(() => {
  if (props.totalPages) {
    return props.totalPages
  }
  
  return Math.ceil(filteredBookings.value.length / localPageSize.value)
})

// Calculer les indices des éléments affichés
const startItem = computed(() => {
  if (filteredBookings.value.length === 0) return 0
  return (localCurrentPage.value - 1) * localPageSize.value + 1
})

const endItem = computed(() => {
  if (filteredBookings.value.length === 0) return 0
  return Math.min(localCurrentPage.value * localPageSize.value, props.totalItems || filteredBookings.value.length)
})

const totalItems = computed(() => {
  return props.totalItems || filteredBookings.value.length
})

// Calculer les pages à afficher dans la pagination
const displayedPages = computed(() => {
  const total = totalPages.value
  const current = localCurrentPage.value
  const pages = []
  
  if (total <= 7) {
    // Afficher toutes les pages si moins de 7
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Toujours afficher la première page
    pages.push(1)
    
    // Calculer les pages du milieu
    if (current <= 3) {
      // Près du début
      for (let i = 2; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
    } else if (current >= total - 2) {
      // Près de la fin
      pages.push('...')
      for (let i = total - 4; i <= total - 1; i++) {
        pages.push(i)
      }
    } else {
      // Au milieu
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
    }
    
    // Toujours afficher la dernière page
    pages.push(total)
  }
  
  return pages
})

// Navigation dans les pages
const prevPage = () => {
  if (localCurrentPage.value > 1) {
    goToPage(localCurrentPage.value - 1)
  }
}

const nextPage = () => {
  if (localCurrentPage.value < totalPages.value) {
    goToPage(localCurrentPage.value + 1)
  }
}

const goToPage = (page: number | string) => {
  if (typeof page === 'number') {
    localCurrentPage.value = page
    emit('pageChange', page)
  }
}

// Actions sur les rendez-vous
const cancelBooking = (bookingId: string) => {
  emit('cancel', bookingId)
}

const rescheduleBooking = (bookingId: string) => {
  emit('reschedule', bookingId)
}

// Surveiller les changements de filtres
watch(filters, (newFilters) => {
  // Réinitialiser la pagination lors d'un changement de filtre
  localCurrentPage.value = 1
  emit('filterChange', newFilters)
}, { deep: true })

// Surveiller les changements de page courante depuis les props
watch(() => props.currentPage, (newPage) => {
  if (newPage && newPage !== localCurrentPage.value) {
    localCurrentPage.value = newPage
  }
})
</script>
