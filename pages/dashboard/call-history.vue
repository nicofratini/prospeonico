// Optimisation des performances pour la page d'historique des appels
<template>
  <div>
    <div class="sm:flex sm:items-center mb-6">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-gray-900">{{ $t('calls.history_title') }}</h1>
        <p class="mt-2 text-sm text-gray-700">{{ $t('calls.history_description') }}</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          @click="syncCalls"
          :disabled="syncing"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto disabled:bg-indigo-300"
        >
          <ArrowPathIcon v-if="!syncing" class="h-4 w-4 mr-2" />
          <svg v-else class="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ syncing ? $t('calls.syncing') : $t('calls.sync') }}
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="bg-white shadow rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="date-filter" class="block text-sm font-medium text-gray-700">{{ $t('calls.filter_date') }}</label>
          <select
            id="date-filter"
            v-model="filters.dateRange"
            class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">{{ $t('calls.filter_date_all') }}</option>
            <option value="today">{{ $t('calls.filter_date_today') }}</option>
            <option value="yesterday">{{ $t('calls.filter_date_yesterday') }}</option>
            <option value="week">{{ $t('calls.filter_date_week') }}</option>
            <option value="month">{{ $t('calls.filter_date_month') }}</option>
          </select>
        </div>
        
        <div>
          <label for="status-filter" class="block text-sm font-medium text-gray-700">{{ $t('calls.filter_status') }}</label>
          <select
            id="status-filter"
            v-model="filters.status"
            class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">{{ $t('calls.filter_status_all') }}</option>
            <option value="completed">{{ $t('calls.status.completed') }}</option>
            <option value="in_progress">{{ $t('calls.status.in_progress') }}</option>
            <option value="failed">{{ $t('calls.status.failed') }}</option>
          </select>
        </div>
        
        <div>
          <label for="caller-filter" class="block text-sm font-medium text-gray-700">{{ $t('calls.filter_caller_type') }}</label>
          <select
            id="caller-filter"
            v-model="filters.callerType"
            class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">{{ $t('calls.filter_caller_type_all') }}</option>
            <option value="particular">{{ $t('calls.caller_type.particular') }}</option>
            <option value="professional">{{ $t('calls.caller_type.professional') }}</option>
            <option value="unknown">{{ $t('calls.caller_type.unknown') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Liste des appels -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else-if="paginatedCalls.length === 0" class="text-center py-12 bg-white shadow rounded-lg">
      <PhoneIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('calls.no_calls') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ $t('calls.no_calls_description') }}</p>
      <div class="mt-6">
        <button
          @click="syncCalls"
          :disabled="syncing"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
        >
          <ArrowPathIcon v-if="!syncing" class="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          <svg v-else class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ syncing ? $t('calls.syncing') : $t('calls.sync') }}
        </button>
      </div>
    </div>
    
    <div v-else class="space-y-4">
      <CallListItem 
        v-for="call in paginatedCalls" 
        :key="call.id" 
        :call="call"
        @view-details="openCallDetails"
      />
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-6">
        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <span class="sr-only">{{ $t('common.previous') }}</span>
            <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
          </button>
          
          <button
            v-for="page in displayedPages"
            :key="page"
            @click="currentPage = page"
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
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            <span class="sr-only">{{ $t('common.next') }}</span>
            <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>

    <!-- Modal de détail d'un appel -->
    <CallDetailModal 
      v-if="selectedCall"
      :call="selectedCall"
      :is-open="detailModalOpen"
      @close="detailModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { 
  PhoneIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { Call } from '~/types/elevenlabs'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

const client = useSupabaseClient()
const { showToast } = useToast()

// État
const loading = ref(true)
const syncing = ref(false)
const calls = ref<Call[]>([])
const selectedCall = ref<Call | null>(null)
const detailModalOpen = ref(false)
const currentPage = ref(1)
const pageSize = 10

// Filtres
const filters = reactive({
  dateRange: 'all',
  status: 'all',
  callerType: 'all'
})

// Appels filtrés avec mémoisation pour éviter des recalculs inutiles
const filteredCalls = computed(() => {
  let result = [...calls.value]
  
  // Filtre par date
  if (filters.dateRange !== 'all') {
    const now = new Date()
    let startDate: Date
    
    switch (filters.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        result = result.filter(call => {
          const callDate = new Date(call.started_at)
          return callDate >= startDate && callDate < endDate
        })
        return result
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      default:
        startDate = new Date(0) // Epoch time
    }
    
    result = result.filter(call => new Date(call.started_at) >= startDate)
  }
  
  // Filtre par statut
  if (filters.status !== 'all') {
    result = result.filter(call => call.status === filters.status)
  }
  
  // Filtre par type d'appelant
  if (filters.callerType !== 'all') {
    result = result.filter(call => call.caller_type === filters.callerType)
  }
  
  return result
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredCalls.value.length / pageSize))

const paginatedCalls = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredCalls.value.slice(start, end)
})

// Pages à afficher dans la pagination
const displayedPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 1 // Nombre de pages à afficher de chaque côté de la page courante
  
  if (total <= 5) {
    // Afficher toutes les pages si le total est inférieur ou égal à 5
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  // Calculer les pages à afficher
  let pages = []
  
  // Toujours inclure la première page
  pages.push(1)
  
  // Calculer la plage autour de la page courante
  const leftBound = Math.max(2, current - delta)
  const rightBound = Math.min(total - 1, current + delta)
  
  // Ajouter des ellipses si nécessaire
  if (leftBound > 2) {
    pages.push(null) // Ellipse
  }
  
  // Ajouter les pages dans la plage
  for (let i = leftBound; i <= rightBound; i++) {
    pages.push(i)
  }
  
  // Ajouter des ellipses si nécessaire
  if (rightBound < total - 1) {
    pages.push(null) // Ellipse
  }
  
  // Toujours inclure la dernière page
  pages.push(total)
  
  return pages.filter(p => p !== null)
})

// Réinitialiser la page courante lorsque les filtres changent
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

// Charger les appels
const loadCalls = async () => {
  loading.value = true
  
  try {
    const { data, error } = await client
      .from('calls')
      .select('*')
      .order('started_at', { ascending: false })
    
    if (error) throw error
    
    calls.value = data as Call[]
  } catch (error) {
    console.error('Erreur lors du chargement des appels:', error)
    showToast('error', $t('calls.error_loading'))
  } finally {
    loading.value = false
  }
}

// Synchroniser les appels avec ElevenLabs
const syncCalls = async () => {
  if (syncing.value) return
  
  syncing.value = true
  
  try {
    const { error } = await useFetch('/api/ai/sync-conversations', {
      method: 'POST'
    })
    
    if (error.value) throw error.value
    
    showToast('success', $t('calls.sync_success'))
    
    // Recharger les appels
    await loadCalls()
  } catch (error) {
    console.error('Erreur lors de la synchronisation des appels:', error)
    showToast('error', $t('calls.sync_error'))
  } finally {
    syncing.value = false
  }
}

// Ouvrir les détails d'un appel
const openCallDetails = (call: Call) => {
  selectedCall.value = call
  detailModalOpen.value = true
}

// Charger les données au montage du composant
onMounted(() => {
  loadCalls()
})
</script>
