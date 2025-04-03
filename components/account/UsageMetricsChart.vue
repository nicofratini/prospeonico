<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium text-gray-900">{{ $t('account.usage_metrics') }}</h3>
      <div class="flex space-x-2">
        <button 
          @click="period = 'month'"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md',
            period === 'month' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ $t('account.month') }}
        </button>
        <button 
          @click="period = 'year'"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md',
            period === 'year' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ $t('account.year') }}
        </button>
      </div>
    </div>
    
    <!-- Métriques d'utilisation -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else-if="!quota" class="text-center py-8">
      <ChartBarIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('account.no_usage_data') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ $t('account.no_usage_data_description') }}</p>
    </div>
    
    <div v-else>
      <!-- Appels -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-gray-700">{{ $t('account.calls_usage') }}</h4>
          <span class="text-sm text-gray-500">{{ quota.calls_used }} / {{ formatLimit(quota.calls_limit) }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            class="h-2.5 rounded-full" 
            :style="{ 
              width: `${calculatePercentage(quota.calls_used, quota.calls_limit)}%`,
              backgroundColor: getUsageColor(calculatePercentage(quota.calls_used, quota.calls_limit))
            }"
          ></div>
        </div>
        <div class="mt-1 flex justify-between text-xs text-gray-500">
          <span>{{ $t('account.used') }}: {{ quota.calls_used }}</span>
          <span>{{ $t('account.remaining') }}: {{ Math.max(0, quota.calls_limit - quota.calls_used) }}</span>
        </div>
      </div>
      
      <!-- Minutes -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-gray-700">{{ $t('account.minutes_usage') }}</h4>
          <span class="text-sm text-gray-500">{{ quota.minutes_used }} / {{ formatLimit(quota.minutes_limit) }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            class="h-2.5 rounded-full" 
            :style="{ 
              width: `${calculatePercentage(quota.minutes_used, quota.minutes_limit)}%`,
              backgroundColor: getUsageColor(calculatePercentage(quota.minutes_used, quota.minutes_limit))
            }"
          ></div>
        </div>
        <div class="mt-1 flex justify-between text-xs text-gray-500">
          <span>{{ $t('account.used') }}: {{ quota.minutes_used }}</span>
          <span>{{ $t('account.remaining') }}: {{ Math.max(0, quota.minutes_limit - quota.minutes_used) }}</span>
        </div>
      </div>
      
      <!-- Période de facturation -->
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-medium text-gray-700">{{ $t('account.billing_period') }}</h4>
            <p class="text-sm text-gray-500">{{ formatDate(subscription?.current_period_start) }} - {{ formatDate(subscription?.current_period_end) }}</p>
          </div>
          <div class="text-right">
            <h4 class="text-sm font-medium text-gray-700">{{ $t('account.reset_date') }}</h4>
            <p class="text-sm text-gray-500">{{ formatDate(quota.reset_date) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Historique d'utilisation -->
      <div v-if="usageHistory.length > 0" class="mt-6 pt-6 border-t border-gray-200">
        <h4 class="text-sm font-medium text-gray-700 mb-4">{{ $t('account.usage_history') }}</h4>
        <div class="h-64">
          <canvas ref="usageChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ChartBarIcon } from '@heroicons/vue/24/outline'
import { UsageQuota, StripeSubscription, calculateUsagePercentage, getUsageColor } from '~/types/stripe'
import Chart from 'chart.js/auto'

const props = defineProps<{
  agencyId: string
}>()

// État local
const loading = ref(true)
const period = ref<'month' | 'year'>('month')
const quota = ref<UsageQuota | null>(null)
const subscription = ref<StripeSubscription | null>(null)
const usageHistory = ref<any[]>([])
const usageChart = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

// Charger les données d'utilisation
const loadUsageData = async () => {
  loading.value = true
  
  try {
    const { data } = await useFetch(`/api/account/usage?agency_id=${props.agencyId}`)
    
    if (data.value) {
      quota.value = data.value.quota
      subscription.value = data.value.subscription
      usageHistory.value = data.value.history || []
      
      // Mettre à jour le graphique si disponible
      if (usageHistory.value.length > 0) {
        nextTick(() => {
          updateChart()
        })
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données d\'utilisation:', error)
  } finally {
    loading.value = false
  }
}

// Calculer le pourcentage d'utilisation
const calculatePercentage = (used: number, limit: number): number => {
  if (limit === 0 || limit >= 999999) return 0 // Plan illimité
  return Math.min(Math.round((used / limit) * 100), 100)
}

// Formater une limite
const formatLimit = (limit: number): string => {
  return limit >= 999999 ? '∞' : limit.toString()
}

// Formater une date
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

// Mettre à jour le graphique
const updateChart = () => {
  if (!usageChart.value || usageHistory.value.length === 0) return
  
  const ctx = usageChart.value.getContext('2d')
  if (!ctx) return
  
  // Détruire le graphique existant s'il y en a un
  if (chart) {
    chart.destroy()
  }
  
  // Filtrer les données en fonction de la période
  const filteredData = usageHistory.value.filter(item => {
    const itemDate = new Date(item.date)
    const now = new Date()
    
    if (period.value === 'month') {
      // Filtrer sur le mois en cours
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
    } else {
      // Filtrer sur l'année en cours
      return itemDate.getFullYear() === now.getFullYear()
    }
  })
  
  // Préparer les données pour le graphique
  const labels = filteredData.map(item => formatDate(item.date))
  const callsData = filteredData.map(item => item.calls_used)
  const minutesData = filteredData.map(item => item.minutes_used)
  
  // Créer le graphique
  chart = new Chart(ctx, {
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

// Observer les changements de période
watch(period, () => {
  nextTick(() => {
    updateChart()
  })
})

// Initialiser le composant
onMounted(() => {
  loadUsageData()
})
</script>
