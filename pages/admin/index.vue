<template>
  <div class="min-h-screen bg-gray-100">
    <!-- En-tête -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-900">{{ $t('admin.dashboard') }}</h1>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">{{ $t('admin.logged_as') }}: {{ user?.email }}</span>
          <button 
            @click="logout" 
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {{ $t('auth.logout') }}
          </button>
        </div>
      </div>
    </header>
    
    <!-- Contenu principal -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Métriques globales -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <AdminMetricCard 
          :title="$t('admin.total_agencies')" 
          :value="formatLargeNumber(metrics.total_agencies)" 
          icon="BuildingOffice2Icon" 
          color="bg-blue-500"
        />
        <AdminMetricCard 
          :title="$t('admin.total_users')" 
          :value="formatLargeNumber(metrics.total_users)" 
          icon="UsersIcon" 
          color="bg-green-500"
        />
        <AdminMetricCard 
          :title="$t('admin.total_calls')" 
          :value="formatLargeNumber(metrics.total_calls)" 
          icon="PhoneIcon" 
          color="bg-indigo-500"
        />
        <AdminMetricCard 
          :title="$t('admin.monthly_revenue')" 
          :value="formatCurrency(metrics.revenue.monthly)" 
          icon="CurrencyEuroIcon" 
          color="bg-purple-500"
        />
      </div>
      
      <!-- Graphiques -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
        <!-- Graphique d'utilisation API -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">{{ $t('admin.api_usage') }}</h2>
          <div class="h-64">
            <canvas ref="apiUsageChart"></canvas>
          </div>
        </div>
        
        <!-- Graphique de revenus -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">{{ $t('admin.revenue') }}</h2>
          <div class="h-64">
            <canvas ref="revenueChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Liste des agences -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">{{ $t('admin.agencies') }}</h2>
        </div>
        <div class="px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <div class="relative max-w-xs w-full">
            <label for="search" class="sr-only">{{ $t('common.search') }}</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input 
                id="search" 
                v-model="searchQuery" 
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                :placeholder="$t('admin.search_agencies')" 
                type="search"
              />
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <label for="filter" class="text-sm font-medium text-gray-700">{{ $t('admin.filter') }}:</label>
            <select 
              id="filter" 
              v-model="statusFilter" 
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">{{ $t('admin.all_statuses') }}</option>
              <option value="active">{{ $t('admin.active') }}</option>
              <option value="trialing">{{ $t('admin.trialing') }}</option>
              <option value="past_due">{{ $t('admin.past_due') }}</option>
              <option value="canceled">{{ $t('admin.canceled') }}</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ $t('admin.agency') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ $t('admin.owner') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ $t('admin.plan') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ $t('admin.status') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ $t('admin.usage') }}
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ $t('admin.created') }}
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ $t('admin.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading">
                <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                  {{ $t('common.loading') }}...
                </td>
              </tr>
              <tr v-else-if="filteredAgencies.length === 0">
                <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                  {{ $t('admin.no_agencies_found') }}
                </td>
              </tr>
              <tr v-for="agency in filteredAgencies" :key="agency.agency_id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ agency.agency_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ agency.owner_email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ getPlanName(agency.subscription_plan) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                    :style="{ backgroundColor: getStatusColorWithOpacity(agency.subscription_status), color: getStatusColor(agency.subscription_status) }"
                  >
                    {{ getStatusLabel(agency.subscription_status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        class="h-2.5 rounded-full" 
                        :style="{ 
                          width: `${agency.usage_percentage}%`,
                          backgroundColor: getUsageColor(agency.usage_percentage)
                        }"
                      ></div>
                    </div>
                    <span class="text-sm text-gray-500">{{ agency.usage_percentage }}%</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(agency.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    @click="viewAgencyDetails(agency.agency_id)" 
                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    {{ $t('admin.view') }}
                  </button>
                  <button 
                    @click="impersonateAgency(agency.agency_id)" 
                    class="text-green-600 hover:text-green-900"
                  >
                    {{ $t('admin.impersonate') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div class="text-sm text-gray-500">
            {{ $t('admin.showing_results', { count: filteredAgencies.length, total: agencies.length }) }}
          </div>
          <div class="flex-1 flex justify-end">
            <button 
              @click="exportAgenciesData" 
              class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {{ $t('admin.export_csv') }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { 
  BuildingOffice2Icon, 
  UsersIcon, 
  PhoneIcon, 
  CurrencyEuroIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'
import Chart from 'chart.js/auto'
import { AdminMetrics, AgencyUsage, ApiUsageStats, RevenueStats, formatLargeNumber, getStatusColor, getUsageColor } from '~/types/admin'
import AdminMetricCard from '~/components/admin/AdminMetricCard.vue'

// Définir le middleware
definePageMeta({
  middleware: ['admin-only']
})

// État local
const user = useSupabaseUser()
const loading = ref(true)
const metrics = ref<AdminMetrics>({
  total_agencies: 0,
  total_users: 0,
  total_properties: 0,
  total_calls: 0,
  total_minutes: 0,
  active_subscriptions: 0,
  revenue: {
    monthly: 0,
    yearly: 0,
    total: 0
  }
})
const agencies = ref<AgencyUsage[]>([])
const apiUsageStats = ref<ApiUsageStats[]>([])
const revenueStats = ref<RevenueStats[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')
const apiUsageChart = ref<HTMLCanvasElement | null>(null)
const revenueChart = ref<HTMLCanvasElement | null>(null)
let apiChart: Chart | null = null
let revChart: Chart | null = null

// Agences filtrées en fonction de la recherche et du filtre de statut
const filteredAgencies = computed(() => {
  return agencies.value.filter(agency => {
    const matchesSearch = 
      agency.agency_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      agency.owner_email.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = 
      statusFilter.value === 'all' || 
      agency.subscription_status === statusFilter.value
    
    return matchesSearch && matchesStatus
  })
})

// Charger les données du dashboard admin
const loadAdminDashboard = async () => {
  loading.value = true
  
  try {
    const { data } = await useFetch('/api/admin/dashboard')
    
    if (data.value) {
      metrics.value = data.value.metrics
      agencies.value = data.value.agencies
      apiUsageStats.value = data.value.api_usage
      revenueStats.value = data.value.revenue
      
      // Mettre à jour les graphiques
      nextTick(() => {
        updateCharts()
      })
    }
  } catch (error) {
    console.error('Erreur lors du chargement du dashboard admin:', error)
  } finally {
    loading.value = false
  }
}

// Mettre à jour les graphiques
const updateCharts = () => {
  // Graphique d'utilisation API
  if (apiUsageChart.value && apiUsageStats.value.length > 0) {
    const ctx = apiUsageChart.value.getContext('2d')
    if (!ctx) return
    
    // Détruire le graphique existant s'il y en a un
    if (apiChart) {
      apiChart.destroy()
    }
    
    // Préparer les données pour le graphique
    const labels = apiUsageStats.value.map(stat => formatDate(stat.date))
    const callsData = apiUsageStats.value.map(stat => stat.calls)
    const minutesData = apiUsageStats.value.map(stat => stat.minutes)
    
    // Créer le graphique
    apiChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Appels',
            data: callsData,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Minutes',
            data: minutesData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }
  
  // Graphique de revenus
  if (revenueChart.value && revenueStats.value.length > 0) {
    const ctx = revenueChart.value.getContext('2d')
    if (!ctx) return
    
    // Détruire le graphique existant s'il y en a un
    if (revChart) {
      revChart.destroy()
    }
    
    // Préparer les données pour le graphique
    const labels = revenueStats.value.map(stat => formatDate(stat.date))
    const monthlyData = revenueStats.value.map(stat => stat.monthly_revenue)
    const yearlyData = revenueStats.value.map(stat => stat.yearly_revenue)
    
    // Créer le graphique
    revChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Abonnements mensuels',
            data: monthlyData,
            backgroundColor: 'rgba(79, 70, 229, 0.8)',
          },
          {
            label: 'Abonnements annuels',
            data: yearlyData,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + '€';
              }
            }
          }
        }
      }
    })
  }
}

// Formater une date
const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

// Formater un montant en devise
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Obtenir le nom du plan
const getPlanName = (planId: string): string => {
  if (planId.includes('basic')) return 'Basic'
  if (planId.includes('pro')) return 'Pro'
  if (planId.includes('enterprise')) return 'Enterprise'
  return planId
}

// Obtenir le libellé du statut
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Actif'
    case 'trialing':
      return 'Essai'
    case 'past_due':
      return 'En retard'
    case 'canceled':
      return 'Annulé'
    case 'unpaid':
      return 'Impayé'
    default:
      return status
  }
}

// Obtenir la couleur du statut avec opacité
const getStatusColorWithOpacity = (status: string): string => {
  const color = getStatusColor(status)
  return color + '20' // Ajouter 20% d'opacité
}

// Voir les détails d'une agence
const viewAgencyDetails = (agencyId: string) => {
  navigateTo(`/admin/agencies/${agencyId}`)
}

// Usurper l'identité d'une agence
const impersonateAgency = async (agencyId: string) => {
  try {
    const { data } = await useFetch(`/api/admin/impersonate`, {
      method: 'POST',
      body: {
        agency_id: agencyId
      }
    })
    
    if (data.value?.success) {
      // Rediriger vers le dashboard de l'agence
      navigateTo('/dashboard')
    }
  } catch (error) {
    console.error('Erreur lors de l\'usurpation d\'identité:', error)
  }
}

// Exporter les données des agences au format CSV
const exportAgenciesData = () => {
  // Créer les en-têtes CSV
  const headers = [
    'Nom de l\'agence',
    'Email du propriétaire',
    'Plan',
    'Statut',
    'Utilisation (%)',
    'Appels utilisés',
    'Appels limite',
    'Minutes utilisées',
    'Minutes limite',
    'Date de création'
  ]
  
  // Créer les lignes de données
  const rows = agencies.value.map(agency => [
    agency.agency_name,
    agency.owner_email,
    getPlanName(agency.subscription_plan),
    getStatusLabel(agency.subscription_status),
    agency.usage_percentage,
    agency.calls_used,
    agency.calls_limit,
    agency.minutes_used,
    agency.minutes_limit,
    formatDate(agency.created_at)
  ])
  
  // Combiner les en-têtes et les lignes
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  // Créer un blob et un lien de téléchargement
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `prospeo-agencies-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Se déconnecter
const logout = async () => {
  const client = useSupabaseClient()
  await client.auth.signOut()
  navigateTo('/auth/login')
}

// Observer les changements de recherche et de filtre
watch([searchQuery, statusFilter], () => {
  // Pas besoin de recharger les données, juste filtrer les agences existantes
})

// Initialiser le composant
onMounted(() => {
  loadAdminDashboard()
})
</script>
