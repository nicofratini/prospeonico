<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- En-tête -->
      <div class="py-8">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-900">{{ $t('onboarding.title') }}</h1>
          <button 
            v-if="canSkip" 
            @click="skipOnboarding" 
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            {{ $t('onboarding.skip_for_now') }}
          </button>
        </div>
      </div>
      
      <!-- Barre de progression -->
      <OnboardingProgressBar 
        :current-step="currentStep" 
        :total-steps="totalSteps" 
        :completed-steps="completedSteps"
        @navigate="navigateToStep"
      />
      
      <!-- Contenu principal -->
      <div class="mt-8 bg-white shadow rounded-lg p-6">
        <slot></slot>
      </div>
      
      <!-- Boutons de navigation -->
      <OnboardingNavButtons 
        :current-step="currentStep"
        :total-steps="totalSteps"
        :can-continue="canContinue"
        :loading="loading"
        @previous="goToPrevious"
        @next="goToNext"
        @complete="completeOnboarding"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#app'
import OnboardingProgressBar from '~/components/onboarding/OnboardingProgressBar.vue'
import OnboardingNavButtons from '~/components/onboarding/OnboardingNavButtons.vue'
import { useOnboardingStore } from '~/stores/onboarding'

const props = defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  totalSteps: {
    type: Number,
    default: 4
  },
  canContinue: {
    type: Boolean,
    default: true
  },
  canSkip: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['previous', 'next', 'skip', 'complete'])

const router = useRouter()
const onboardingStore = useOnboardingStore()
const loading = ref(false)

// Étapes complétées
const completedSteps = computed(() => {
  return Array.from({ length: props.currentStep - 1 }, (_, i) => i + 1)
})

// Navigation
const goToPrevious = () => {
  if (props.currentStep > 1) {
    emit('previous')
    navigateToStep(props.currentStep - 1)
  }
}

const goToNext = async () => {
  loading.value = true
  try {
    emit('next')
    await onboardingStore.saveProgress(props.currentStep + 1)
    navigateToStep(props.currentStep + 1)
  } finally {
    loading.value = false
  }
}

const navigateToStep = (step: number) => {
  if (step < 1 || step > props.totalSteps) return
  
  const routes = [
    '/onboarding/welcome',
    '/onboarding/property',
    '/onboarding/ai-agent',
    '/onboarding/features'
  ]
  
  router.push(routes[step - 1])
}

const skipOnboarding = async () => {
  loading.value = true
  try {
    emit('skip')
    await onboardingStore.skipStep(props.currentStep)
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

const completeOnboarding = async () => {
  loading.value = true
  try {
    emit('complete')
    await onboardingStore.completeOnboarding()
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}

// Initialisation
onMounted(async () => {
  await onboardingStore.fetchProgress()
})
</script>
