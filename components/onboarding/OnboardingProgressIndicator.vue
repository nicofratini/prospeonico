<template>
  <div class="relative">
    <!-- Indicateur de progression d'onboarding -->
    <div v-if="showIndicator" class="fixed bottom-4 right-4 z-50">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm">
        <div class="bg-indigo-600 px-4 py-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-white">{{ $t('onboarding.progress_indicator_title') }}</h3>
            <button @click="dismissIndicator" class="text-white hover:text-indigo-100">
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">{{ $t('onboarding.progress') }}</span>
            <span class="text-xs font-medium text-indigo-600">{{ Math.round(progress) }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-indigo-600 h-2 rounded-full" :style="{ width: `${progress}%` }"></div>
          </div>
          <p class="mt-3 text-sm text-gray-600">
            {{ $t('onboarding.steps_remaining', { count: remainingSteps }) }}
          </p>
          <div class="mt-4 flex justify-end space-x-2">
            <button 
              @click="dismissIndicator" 
              class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {{ $t('onboarding.remind_later') }}
            </button>
            <button 
              @click="resumeOnboarding" 
              class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {{ $t('onboarding.continue') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { useOnboardingStore } from '~/stores/onboarding'

const props = defineProps({
  forceShow: {
    type: Boolean,
    default: false
  }
})

const onboardingStore = useOnboardingStore()

// État local
const localDismissed = ref(false)

// Calculer si l'indicateur doit être affiché
const showIndicator = computed(() => {
  if (props.forceShow) return true
  if (localDismissed.value) return false
  return onboardingStore.showOnboardingIndicator || onboardingStore.showOnboardingReminder
})

// Progression
const progress = computed(() => onboardingStore.progress)
const remainingSteps = computed(() => onboardingStore.remainingSteps)

// Fermer l'indicateur temporairement (session courante)
const dismissIndicator = () => {
  localDismissed.value = true
  onboardingStore.dismissReminder()
}

// Reprendre l'onboarding
const resumeOnboarding = () => {
  onboardingStore.resumeOnboarding()
}

// Initialisation
onMounted(async () => {
  await onboardingStore.fetchProgress()
})
</script>
