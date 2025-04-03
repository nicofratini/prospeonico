<template>
  <div>
    <Head>
      <title>{{ $t('dashboard.title') }} | Prospeo</title>
      <meta name="description" :content="$t('dashboard.description')" />
    </Head>

    <div class="py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 class="text-2xl font-semibold text-gray-900">{{ $t('dashboard.welcome') }}, {{ user?.user_metadata?.full_name || user?.email }}</h1>
      </div>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <!-- Statistiques -->
        <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Statistique: Propriétés -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <HomeIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">{{ $t('dashboard.properties') }}</dt>
                    <dd>
                      <div class="text-lg font-medium text-gray-900">{{ stats.properties }}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-5 py-3">
              <div class="text-sm">
                <NuxtLink to="/dashboard/properties" class="font-medium text-indigo-600 hover:text-indigo-500">
                  {{ $t('dashboard.view_all') }}
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Statistique: Rendez-vous -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <CalendarIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">{{ $t('dashboard.upcoming_appointments') }}</dt>
                    <dd>
                      <div class="text-lg font-medium text-gray-900">{{ stats.upcomingAppointments }}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-5 py-3">
              <div class="text-sm">
                <NuxtLink to="/dashboard/calendar" class="font-medium text-indigo-600 hover:text-indigo-500">
                  {{ $t('dashboard.view_all') }}
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Statistique: Appels -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <PhoneIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">{{ $t('dashboard.recent_calls') }}</dt>
                    <dd>
                      <div class="text-lg font-medium text-gray-900">{{ stats.recentCalls }}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-5 py-3">
              <div class="text-sm">
                <NuxtLink to="/dashboard/call-history" class="font-medium text-indigo-600 hover:text-indigo-500">
                  {{ $t('dashboard.view_all') }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Widgets -->
        <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Widget: Rendez-vous à venir -->
          <UpcomingAppointmentsWidget 
            :bookings="upcomingAppointments" 
            :loading="loadingAppointments"
            @view-all="navigateTo('/dashboard/calendar')"
          />

          <!-- Widget: Propriétés récentes -->
          <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900">{{ $t('dashboard.recent_properties') }}</h3>
              <NuxtLink 
                to="/dashboard/properties"
                class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                {{ $t('common.view_all') }}
              </NuxtLink>
            </div>
            
            <div v-if="loadingProperties" class="flex justify-center py-4">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
            
            <div v-else-if="recentProperties.length === 0" class="text-center py-6">
              <HomeIcon class="mx-auto h-12 w-12 text-gray-400" />
              <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('dashboard.no_properties') }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ $t('dashboard.no_properties_description') }}</p>
              <div class="mt-6">
                <NuxtLink
                  to="/dashboard/properties/new"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon class="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  {{ $t('dashboard.add_property') }}
                </NuxtLink>
              </div>
            </div>
            
            <ul v-else class="divide-y divide-gray-200">
              <li v-for="property in recentProperties" :key="property.id" class="py-4">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <img 
                      v-if="property.main_image" 
                      :src="property.main_image" 
                      alt="" 
                      class="h-12 w-12 rounded-md object-cover"
                    />
                    <div v-else class="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center">
                      <HomeIcon class="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 truncate">
                      {{ property.title }}
                    </p>
                    <p class="text-sm text-gray-500 truncate">
                      {{ property.price ? formatPrice(property.price) : $t('properties.price_on_request') }}
                    </p>
                  </div>
                  <div>
                    <NuxtLink
                      :to="`/dashboard/properties/${property.id}`"
                      class="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                    >
                      {{ $t('common.view') }}
                    </NuxtLink>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Appels récents -->
        <div class="mt-8 bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">{{ $t('dashboard.recent_calls') }}</h3>
            <NuxtLink 
              to="/dashboard/call-history"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {{ $t('common.view_all') }}
            </NuxtLink>
          </div>
          
          <div v-if="loadingCalls" class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
          
          <div v-else-if="recentCalls.length === 0" class="text-center py-6">
            <PhoneIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('dashboard.no_calls') }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ $t('dashboard.no_calls_description') }}</p>
          </div>
          
          <ul v-else class="divide-y divide-gray-200">
            <CallListItem 
              v-for="call in recentCalls" 
              :key="call.id" 
              :call="call"
              @click="navigateTo(`/dashboard/call-history/${call.id}`)"
            />
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { HomeIcon, CalendarIcon, PhoneIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { CalComBooking } from '~/types/calcom'
import UpcomingAppointmentsWidget from '~/components/dashboard/UpcomingAppointmentsWidget.vue'
import CallListItem from '~/components/calls/CallListItem.vue'

// État utilisateur
const user = useSupabaseUser()

// État des statistiques
const stats = ref({
  properties: 0,
  upcomingAppointments: 0,
  recentCalls: 0
})

// État des données
const upcomingAppointments = ref<CalComBooking[]>([])
const recentProperties = ref<any[]>([])
const recentCalls = ref<any[]>([])

// État de chargement
const loadingAppointments = ref(true)
const loadingProperties = ref(true)
const loadingCalls = ref(true)

// Charger les rendez-vous à venir
const loadUpcomingAppointments = async () => {
  loadingAppointments.value = true
  
  try {
    // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]
    
    const { data } = await useFetch(`/api/calcom/bookings?date_from=${today}&status=accepted`)
    
    if (data.value?.bookings) {
      upcomingAppointments.value = data.value.bookings.slice(0, 5) // Limiter à 5 rendez-vous
      stats.value.upcomingAppointments = data.value.bookings.length
    }
  } catch (error) {
    console.error('Erreur lors du chargement des rendez-vous:', error)
  } finally {
    loadingAppointments.value = false
  }
}

// Charger les propriétés récentes
const loadRecentProperties = async () => {
  loadingProperties.value = true
  
  try {
    const client = useSupabaseClient()
    const { data, error, count } = await client
      .from('properties')
      .select('id, title, price, main_image, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) throw error
    
    recentProperties.value = data || []
    stats.value.properties = count || 0
  } catch (error) {
    console.error('Erreur lors du chargement des propriétés:', error)
  } finally {
    loadingProperties.value = false
  }
}

// Charger les appels récents
const loadRecentCalls = async () => {
  loadingCalls.value = true
  
  try {
    const { data } = await useFetch('/api/calls?limit=5')
    
    if (data.value?.calls) {
      recentCalls.value = data.value.calls
      stats.value.recentCalls = data.value.total || data.value.calls.length
    }
  } catch (error) {
    console.error('Erreur lors du chargement des appels:', error)
  } finally {
    loadingCalls.value = false
  }
}

// Formater le prix
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price)
}

// Initialiser la page
onMounted(() => {
  Promise.all([
    loadUpcomingAppointments(),
    loadRecentProperties(),
    loadRecentCalls()
  ])
})
</script>
