<template>
  <div class="relative">
    <!-- Slot de disponibilité -->
    <div 
      :class="[
        'p-2 rounded-md text-sm transition-colors duration-150 cursor-pointer',
        selected ? 'bg-indigo-100 border border-indigo-500' : 
                  slot.available ? 'bg-white border border-gray-300 hover:border-indigo-400' : 
                                  'bg-gray-100 border border-gray-300 opacity-50 cursor-not-allowed'
      ]"
      @click="handleClick"
    >
      <div class="flex justify-between items-center">
        <span class="font-medium">{{ formatTime(slot.start) }}</span>
        <span v-if="selected" class="text-indigo-600">
          <CheckIcon class="h-4 w-4" />
        </span>
      </div>
      <div class="text-xs text-gray-500 mt-1">
        {{ formatDuration(slot.start, slot.end) }}
      </div>
      <div v-if="!slot.available && slot.busy_reason" class="text-xs text-red-500 mt-1">
        {{ slot.busy_reason }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/outline'
import { CalComTimeSlot } from '~/types/calcom'

const props = defineProps<{
  slot: CalComTimeSlot
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

// Formater l'heure (HH:MM)
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Calculer et formater la durée
const formatDuration = (startString: string, endString: string) => {
  const start = new Date(startString)
  const end = new Date(endString)
  
  // Calculer la durée en minutes
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  
  // Formater la durée
  if (durationMinutes < 60) {
    return `${durationMinutes} min`
  } else {
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }
}

// Gérer le clic sur le slot
const handleClick = () => {
  if (props.slot.available) {
    emit('click')
  }
}
</script>
