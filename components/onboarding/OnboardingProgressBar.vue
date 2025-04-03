<template>
  <div class="flex items-center justify-between mb-8">
    <div class="w-full">
      <div class="relative">
        <!-- Ligne de progression -->
        <div class="absolute inset-0 flex items-center" aria-hidden="true">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        
        <!-- Étapes -->
        <div class="relative flex justify-between">
          <template v-for="step in totalSteps" :key="step">
            <div 
              class="flex items-center"
              :class="{ 
                'cursor-pointer': isStepAccessible(step)
              }"
              @click="isStepAccessible(step) ? navigateToStep(step) : null"
            >
              <!-- Cercle d'étape -->
              <span 
                class="h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium"
                :class="getStepClasses(step)"
              >
                <template v-if="isStepCompleted(step)">
                  <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </template>
                <template v-else>
                  {{ step }}
                </template>
              </span>
              
              <!-- Libellé d'étape -->
              <span 
                class="ml-2 text-sm font-medium"
                :class="getStepTextClasses(step)"
              >
                {{ getStepLabel(step) }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  currentStep: {
    type: Number,
    required: true
  },
  totalSteps: {
    type: Number,
    default: 4
  },
  completedSteps: {
    type: Array as () => number[],
    default: () => []
  }
})

const emit = defineEmits(['navigate'])

// Vérifier si une étape est complétée
const isStepCompleted = (step: number) => {
  return props.completedSteps.includes(step)
}

// Vérifier si une étape est accessible
const isStepAccessible = (step: number) => {
  return step <= props.currentStep || isStepCompleted(step)
}

// Obtenir les classes CSS pour le cercle d'étape
const getStepClasses = (step: number) => {
  if (isStepCompleted(step)) {
    return 'bg-indigo-600 text-white'
  } else if (step === props.currentStep) {
    return 'bg-indigo-600 text-white'
  } else if (isStepAccessible(step)) {
    return 'bg-white border-2 border-indigo-600 text-indigo-600'
  } else {
    return 'bg-white border-2 border-gray-300 text-gray-500'
  }
}

// Obtenir les classes CSS pour le texte d'étape
const getStepTextClasses = (step: number) => {
  if (step === props.currentStep) {
    return 'text-indigo-600'
  } else if (isStepCompleted(step)) {
    return 'text-indigo-600'
  } else if (isStepAccessible(step)) {
    return 'text-gray-900'
  } else {
    return 'text-gray-500'
  }
}

// Obtenir le libellé de l'étape
const getStepLabel = (step: number) => {
  const labels = [
    'onboarding.step_welcome',
    'onboarding.step_property',
    'onboarding.step_ai_agent',
    'onboarding.step_features'
  ]
  
  return $t(labels[step - 1])
}

// Naviguer vers une étape
const navigateToStep = (step: number) => {
  if (isStepAccessible(step)) {
    emit('navigate', step)
  }
}
</script>
