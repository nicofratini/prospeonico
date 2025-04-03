<template>
  <div>
    <OnboardingLayout
      :current-step="4"
      :total-steps="4"
      :can-continue="true"
      :can-skip="false"
      @previous="goToPrevious"
      @complete="completeOnboarding"
    >
      <div class="space-y-8">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900">{{ $t('onboarding.features_title') }}</h2>
          <p class="mt-2 text-gray-600">{{ $t('onboarding.features_description') }}</p>
        </div>
        
        <!-- Carrousel de fonctionnalités -->
        <div class="relative">
          <div class="overflow-hidden">
            <div class="flex transition-transform duration-300 ease-in-out" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
              <!-- Slide 1: Dashboard -->
              <div class="w-full flex-shrink-0 px-4">
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div class="p-6">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4">
                      <ChartBarIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">{{ $t('onboarding.feature_dashboard_title') }}</h3>
                    <p class="mt-2 text-sm text-gray-500">{{ $t('onboarding.feature_dashboard_description') }}</p>
                    
                    <div class="mt-4 bg-gray-100 rounded-lg p-4">
                      <ul class="space-y-2 text-sm">
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_dashboard_point1') }}</span>
                        </li>
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_dashboard_point2') }}</span>
                        </li>
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_dashboard_point3') }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-6 py-4">
                    <button
                      type="button"
                      @click="openFeatureDemo('dashboard')"
                      class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {{ $t('onboarding.see_how_it_works') }}
                      <ArrowRightIcon class="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Slide 2: Catalogue de propriétés -->
              <div class="w-full flex-shrink-0 px-4">
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div class="p-6">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4">
                      <HomeIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">{{ $t('onboarding.feature_properties_title') }}</h3>
                    <p class="mt-2 text-sm text-gray-500">{{ $t('onboarding.feature_properties_description') }}</p>
                    
                    <div class="mt-4 bg-gray-100 rounded-lg p-4">
                      <ul class="space-y-2 text-sm">
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_properties_point1') }}</span>
                        </li>
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_properties_point2') }}</span>
                        </li>
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_properties_point3') }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-6 py-4">
                    <button
                      type="button"
                      @click="openFeatureDemo('properties')"
                      class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {{ $t('onboarding.see_how_it_works') }}
                      <ArrowRightIcon class="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Slide 3: Agent IA -->
              <div class="w-full flex-shrink-0 px-4">
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div class="p-6">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4">
                      <ChatBubbleLeftRightIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">{{ $t('onboarding.feature_ai_agent_title') }}</h3>
                    <p class="mt-2 text-sm text-gray-500">{{ $t('onboarding.feature_ai_agent_description') }}</p>
                    
                    <div class="mt-4 bg-gray-100 rounded-lg p-4">
                      <ul class="space-y-2 text-sm">
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_ai_agent_point1') }}</span>
                        </li>
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_ai_agent_point2') }}</span>
                        </li>
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_ai_agent_point3') }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-6 py-4">
                    <button
                      type="button"
                      @click="openFeatureDemo('ai-agent')"
                      class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {{ $t('onboarding.see_how_it_works') }}
                      <ArrowRightIcon class="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Slide 4: Calendrier -->
              <div class="w-full flex-shrink-0 px-4">
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div class="p-6">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mb-4">
                      <CalendarIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium text-gray-900">{{ $t('onboarding.feature_calendar_title') }}</h3>
                    <p class="mt-2 text-sm text-gray-500">{{ $t('onboarding.feature_calendar_description') }}</p>
                    
                    <div class="mt-4 bg-gray-100 rounded-lg p-4">
                      <ul class="space-y-2 text-sm">
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_calendar_point1') }}</span>
                        </li>
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_calendar_point2') }}</span>
                        </li>
                        <li class="flex items-start">
                          <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span>{{ $t('onboarding.feature_calendar_point3') }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div class="bg-gray-50 px-6 py-4">
                    <button
                      type="button"
                      @click="openFeatureDemo('calendar')"
                      class="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {{ $t('onboarding.see_how_it_works') }}
                      <ArrowRightIcon class="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Contrôles du carrousel -->
          <div class="absolute inset-0 flex items-center justify-between p-4">
            <button
              @click="prevSlide"
              class="p-1 rounded-full shadow bg-white/80 text-gray-800 hover:bg-white focus:outline-none"
              :disabled="currentSlide === 0"
              :class="{ 'opacity-50 cursor-not-allowed': currentSlide === 0 }"
            >
              <ChevronLeftIcon class="h-6 w-6" />
            </button>
            <button
              @click="nextSlide"
              class="p-1 rounded-full shadow bg-white/80 text-gray-800 hover:bg-white focus:outline-none"
              :disabled="currentSlide === totalSlides - 1"
              :class="{ 'opacity-50 cursor-not-allowed': currentSlide === totalSlides - 1 }"
            >
              <ChevronRightIcon class="h-6 w-6" />
            </button>
          </div>
          
          <!-- Indicateurs de slide -->
          <div class="absolute bottom-0 left-0 right-0 flex justify-center p-4">
            <div class="flex space-x-2">
              <button
                v-for="(_, index) in totalSlides"
                :key="index"
                @click="goToSlide(index)"
                class="w-2.5 h-2.5 rounded-full focus:outline-none"
                :class="currentSlide === index ? 'bg-indigo-600' : 'bg-gray-300'"
              ></button>
            </div>
          </div>
        </div>
        
        <!-- Vidéo de démonstration -->
        <div v-if="showDemo" class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 transition-opacity" aria-hidden="true">
              <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                      {{ getDemoTitle() }}
                    </h3>
                    <div class="mt-4 aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <!-- Ici, nous simulons une vidéo de démonstration -->
                      <div class="text-center p-4">
                        <VideoCameraIcon class="h-12 w-12 text-gray-400 mx-auto" />
                        <p class="mt-2 text-sm text-gray-500">{{ $t('onboarding.demo_video_placeholder') }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  @click="closeDemo"
                  class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {{ $t('onboarding.close') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '#app'
import { 
  ChartBarIcon, 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  CalendarIcon, 
  CheckIcon, 
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/solid'
import { useOnboardingStore } from '~/stores/onboarding'
import OnboardingLayout from '~/layouts/onboarding.vue'

definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const onboardingStore = useOnboardingStore()

// Carrousel
const currentSlide = ref(0)
const totalSlides = 4

// Démo
const showDemo = ref(false)
const currentDemo = ref('')

// Navigation du carrousel
const nextSlide = () => {
  if (currentSlide.value < totalSlides - 1) {
    currentSlide.value++
  }
}

const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

const goToSlide = (index: number) => {
  currentSlide.value = index
}

// Gestion des démos
const openFeatureDemo = (feature: string) => {
  currentDemo.value = feature
  showDemo.value = true
}

const closeDemo = () => {
  showDemo.value = false
}

const getDemoTitle = () => {
  switch (currentDemo.value) {
    case 'dashboard':
      return $t('onboarding.feature_dashboard_demo_title')
    case 'properties':
      return $t('onboarding.feature_properties_demo_title')
    case 'ai-agent':
      return $t('onboarding.feature_ai_agent_demo_title')
    case 'calendar':
      return $t('onboarding.feature_calendar_demo_title')
    default:
      return ''
  }
}

// Revenir à l'étape précédente
const goToPrevious = () => {
  router.push('/onboarding/ai-agent')
}

// Terminer l'onboarding
const completeOnboarding = async () => {
  await onboardingStore.completeOnboarding()
}
</script>
