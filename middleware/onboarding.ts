import { defineNuxtRouteMiddleware, navigateTo, useSupabaseUser } from '#imports'
import { useOnboardingStore } from '~/stores/onboarding'

export default defineNuxtRouteMiddleware(async (to) => {
  // Ignorer le middleware pour les routes d'authentification
  if (to.path.startsWith('/auth/')) {
    return
  }
  
  const user = useSupabaseUser()
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user.value) {
    return navigateTo('/auth/login')
  }
  
  // Initialiser le store d'onboarding
  const onboardingStore = useOnboardingStore()
  await onboardingStore.fetchProgress()
  
  // Si l'utilisateur n'a pas terminé l'onboarding et n'est pas déjà sur une page d'onboarding
  if (!onboardingStore.isOnboardingCompleted && !to.path.startsWith('/onboarding/')) {
    // Rediriger vers l'étape actuelle de l'onboarding
    const routes = [
      '/onboarding/welcome',
      '/onboarding/property',
      '/onboarding/ai-agent',
      '/onboarding/features'
    ]
    
    const currentStep = onboardingStore.currentStep
    const targetRoute = routes[Math.min(currentStep - 1, routes.length - 1)]
    
    return navigateTo(targetRoute)
  }
})
