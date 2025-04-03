import { defineStore } from 'pinia'
import { useSupabaseClient, useSupabaseUser } from '#imports'

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  userProfile: any | null;
  loading: boolean;
  error: string | null;
  showOnboardingIndicator: boolean;
  showOnboardingReminder: boolean;
  lastReminderDate: string | null;
}

export const useOnboardingStore = defineStore('onboarding', {
  state: (): OnboardingState => ({
    currentStep: 1,
    totalSteps: 4,
    completed: false,
    userProfile: null,
    loading: false,
    error: null,
    showOnboardingIndicator: false,
    showOnboardingReminder: false,
    lastReminderDate: null
  }),
  
  actions: {
    async fetchProgress() {
      const client = useSupabaseClient()
      const user = useSupabaseUser()
      
      if (!user.value) return
      
      this.loading = true
      this.error = null
      
      try {
        const { data, error } = await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.value.id)
          .single()
        
        if (error) throw error
        
        if (data) {
          this.userProfile = data
          this.currentStep = data.onboarding_step || 1
          this.completed = data.onboarding_completed || false
          this.lastReminderDate = data.last_onboarding_reminder || null
          
          // Afficher l'indicateur si l'onboarding n'est pas terminé
          this.showOnboardingIndicator = !this.completed
          
          // Afficher le rappel si l'onboarding n'est pas terminé et que le dernier rappel date d'au moins 24h
          if (!this.completed && this.lastReminderDate) {
            const lastReminder = new Date(this.lastReminderDate)
            const now = new Date()
            const diffHours = (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60)
            this.showOnboardingReminder = diffHours >= 24
          } else if (!this.completed && !this.lastReminderDate) {
            this.showOnboardingReminder = true
          }
        } else {
          // Créer un profil utilisateur s'il n'existe pas
          await this.createUserProfile()
        }
      } catch (e: any) {
        this.error = e.message
        console.error('Erreur lors de la récupération de la progression:', e)
      } finally {
        this.loading = false
      }
    },
    
    async createUserProfile() {
      const client = useSupabaseClient()
      const user = useSupabaseUser()
      
      if (!user.value) return
      
      try {
        const { data, error } = await client
          .from('user_profiles')
          .insert({
            user_id: user.value.id,
            onboarding_step: 1,
            onboarding_completed: false,
            last_onboarding_reminder: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) throw error
        
        this.userProfile = data
        this.showOnboardingIndicator = true
        this.showOnboardingReminder = false
      } catch (e: any) {
        this.error = e.message
        console.error('Erreur lors de la création du profil utilisateur:', e)
      }
    },
    
    async saveProgress(step: number) {
      const client = useSupabaseClient()
      const user = useSupabaseUser()
      
      if (!user.value || !this.userProfile) return
      
      this.loading = true
      this.error = null
      
      try {
        const { error } = await client
          .from('user_profiles')
          .update({
            onboarding_step: step,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.value.id)
        
        if (error) throw error
        
        this.currentStep = step
      } catch (e: any) {
        this.error = e.message
        console.error('Erreur lors de la sauvegarde de la progression:', e)
      } finally {
        this.loading = false
      }
    },
    
    async completeOnboarding() {
      const client = useSupabaseClient()
      const user = useSupabaseUser()
      
      if (!user.value || !this.userProfile) return
      
      this.loading = true
      this.error = null
      
      try {
        const { error } = await client
          .from('user_profiles')
          .update({
            onboarding_completed: true,
            onboarding_step: this.totalSteps,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.value.id)
        
        if (error) throw error
        
        this.completed = true
        this.showOnboardingIndicator = false
        this.showOnboardingReminder = false
      } catch (e: any) {
        this.error = e.message
        console.error('Erreur lors de la finalisation de l\'onboarding:', e)
      } finally {
        this.loading = false
      }
    },
    
    async skipStep(step: number) {
      // Marquer l'étape comme ignorée mais continuer à la suivante
      await this.saveProgress(step + 1)
    },
    
    async updateUserProfile(profileData: any) {
      const client = useSupabaseClient()
      const user = useSupabaseUser()
      
      if (!user.value || !this.userProfile) return
      
      this.loading = true
      this.error = null
      
      try {
        const { data, error } = await client
          .from('user_profiles')
          .update({
            ...profileData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.value.id)
          .select()
          .single()
        
        if (error) throw error
        
        this.userProfile = data
      } catch (e: any) {
        this.error = e.message
        console.error('Erreur lors de la mise à jour du profil:', e)
      } finally {
        this.loading = false
      }
    },
    
    async dismissReminder() {
      const client = useSupabaseClient()
      const user = useSupabaseUser()
      
      if (!user.value || !this.userProfile) return
      
      try {
        const now = new Date().toISOString()
        
        const { error } = await client
          .from('user_profiles')
          .update({
            last_onboarding_reminder: now,
            updated_at: now
          })
          .eq('user_id', user.value.id)
        
        if (error) throw error
        
        this.showOnboardingReminder = false
        this.lastReminderDate = now
      } catch (e: any) {
        console.error('Erreur lors de la mise à jour du rappel:', e)
      }
    },
    
    async resumeOnboarding() {
      const router = useRouter()
      
      if (this.completed) return
      
      // Rediriger vers l'étape actuelle
      const routes = [
        '/onboarding/welcome',
        '/onboarding/property',
        '/onboarding/ai-agent',
        '/onboarding/features'
      ]
      
      const targetRoute = routes[Math.min(this.currentStep - 1, routes.length - 1)]
      router.push(targetRoute)
    }
  },
  
  getters: {
    progress: (state) => (state.currentStep - 1) / state.totalSteps * 100,
    isStepCompleted: (state) => (step: number) => step < state.currentStep,
    isOnboardingCompleted: (state) => state.completed,
    remainingSteps: (state) => state.totalSteps - state.currentStep + 1
  }
})
