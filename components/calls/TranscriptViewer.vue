<template>
  <div class="space-y-4">
    <div 
      v-for="(segment, index) in segments" 
      :key="index"
      :class="[
        'flex',
        segment.speaker === 'agent' ? 'justify-start' : 'justify-end'
      ]"
    >
      <div 
        :class="[
          'max-w-3/4 rounded-lg px-4 py-2 text-sm',
          segment.speaker === 'agent' 
            ? 'bg-indigo-100 text-indigo-900' 
            : 'bg-gray-100 text-gray-900'
        ]"
      >
        <div class="flex items-center mb-1">
          <span class="font-medium">
            {{ segment.speaker === 'agent' ? $t('calls.agent') : $t('calls.caller') }}
          </span>
          <span class="ml-2 text-xs text-gray-500">
            {{ formatTimestamp(segment.start_time) }}
          </span>
        </div>
        <p>{{ segment.text }}</p>
      </div>
    </div>
    
    <div v-if="segments.length === 0" class="text-center py-4">
      <p class="text-sm text-gray-500">{{ $t('calls.no_transcript_segments') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElevenLabsConversationSegment } from '~/types/elevenlabs'

const props = defineProps<{
  segments: ElevenLabsConversationSegment[]
}>()

// Formater le timestamp en format lisible (MM:SS)
const formatTimestamp = (seconds: number) => {
  if (typeof seconds !== 'number') return '00:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>
