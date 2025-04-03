// Optimisation des performances pour le composant CallListItem
<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
      <div class="flex items-center justify-between">
        <div class="flex items-center min-w-0">
          <div class="flex-shrink-0">
            <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <PhoneIcon class="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div class="min-w-0 flex-1 px-4">
            <div>
              <p class="text-sm font-medium text-indigo-600 truncate">
                {{ formatDate(call.started_at) }}
              </p>
              <p class="mt-1 flex items-center text-sm text-gray-500">
                <UserIcon class="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                <span class="truncate">{{ call.caller_number || $t('calls.unknown') }}</span>
              </p>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-end">
          <span 
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              statusClass
            ]"
          >
            {{ $t(`calls.status.${call.status}`) }}
          </span>
          <p class="mt-1 text-sm text-gray-500">{{ formatDuration(call.duration) }}</p>
        </div>
      </div>
      
      <div class="mt-4">
        <div v-if="call.summary" class="text-sm text-gray-700 line-clamp-2">
          {{ call.summary }}
        </div>
        <div v-else class="text-sm text-gray-500 italic">
          {{ $t('calls.no_summary') }}
        </div>
      </div>
      
      <div class="mt-4 flex justify-end">
        <button
          @click="$emit('view-details', call)"
          class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {{ $t('calls.view_details') }}
          <ArrowRightIcon class="ml-1 h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhoneIcon, UserIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import { Call } from '~/types/elevenlabs'
import { computed } from 'vue'

const props = defineProps<{
  call: Call
}>()

defineEmits<{
  (e: 'view-details', call: Call): void
}>()

// Utilisation de computed pour éviter des recalculs inutiles
const statusClass = computed(() => {
  switch (props.call.status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

// Fonctions memoizées pour améliorer les performances
const formatCache = new Map()

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  
  // Utiliser un cache pour éviter de reformater les mêmes dates
  const cacheKey = `date_${dateString}`
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)
  }
  
  const date = new Date(dateString)
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
  
  formatCache.set(cacheKey, formatted)
  return formatted
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '00:00'
  
  // Utiliser un cache pour éviter de reformater les mêmes durées
  const cacheKey = `duration_${seconds}`
  if (formatCache.has(cacheKey)) {
    return formatCache.get(cacheKey)
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const formatted = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  
  formatCache.set(cacheKey, formatted)
  return formatted
}
</script>

<style scoped>
/* Utilisation de classes utilitaires pour optimiser le CSS */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
