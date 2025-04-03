import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOnboardingStore } from '~/stores/onboarding'

// Mock des dépendances externes
vi.mock('#imports', () => ({
  useSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ 
              data: { 
                user_id: '123', 
                onboarding_step: 1, 
                onboarding_completed: false 
              }, 
              error: null 
            })
          })
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ 
                data: { 
                  user_id: '123', 
                  onboarding_step: 2, 
                  onboarding_completed: false 
                }, 
                error: null 
              })
            })
          })
        })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: { path: 'test-path' }, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: 'https://test-url.com/image.jpg' } })
        })
      }
    }),
  }),
  useSupabaseUser: () => ({ value: { id: '123', email: 'test@example.com' } }),
  useRouter: () => ({
    push: vi.fn()
  })
}))

describe('Onboarding Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const store = useOnboardingStore()
    expect(store.currentStep).toBe(1)
    expect(store.totalSteps).toBe(4)
    expect(store.completed).toBe(false)
    expect(store.userProfile).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should fetch user progress', async () => {
    const store = useOnboardingStore()
    await store.fetchProgress()
    expect(store.userProfile).not.toBeNull()
    expect(store.currentStep).toBe(1)
    expect(store.completed).toBe(false)
  })

  it('should save progress to next step', async () => {
    const store = useOnboardingStore()
    await store.fetchProgress()
    await store.saveProgress(2)
    expect(store.currentStep).toBe(2)
  })

  it('should calculate progress percentage correctly', async () => {
    const store = useOnboardingStore()
    await store.fetchProgress()
    expect(store.progress).toBe(0)
    
    await store.saveProgress(2)
    expect(store.progress).toBe(25)
    
    await store.saveProgress(3)
    expect(store.progress).toBe(50)
    
    await store.saveProgress(4)
    expect(store.progress).toBe(75)
  })

  it('should mark onboarding as completed', async () => {
    const store = useOnboardingStore()
    await store.fetchProgress()
    await store.completeOnboarding()
    expect(store.completed).toBe(true)
    expect(store.showOnboardingIndicator).toBe(false)
    expect(store.showOnboardingReminder).toBe(false)
  })

  it('should correctly identify completed steps', async () => {
    const store = useOnboardingStore()
    await store.fetchProgress()
    expect(store.isStepCompleted(1)).toBe(false)
    
    await store.saveProgress(2)
    expect(store.isStepCompleted(1)).toBe(true)
    expect(store.isStepCompleted(2)).toBe(false)
    
    await store.saveProgress(3)
    expect(store.isStepCompleted(1)).toBe(true)
    expect(store.isStepCompleted(2)).toBe(true)
    expect(store.isStepCompleted(3)).toBe(false)
  })

  it('should calculate remaining steps correctly', async () => {
    const store = useOnboardingStore()
    await store.fetchProgress()
    expect(store.remainingSteps).toBe(4)
    
    await store.saveProgress(2)
    expect(store.remainingSteps).toBe(3)
    
    await store.saveProgress(3)
    expect(store.remainingSteps).toBe(2)
    
    await store.saveProgress(4)
    expect(store.remainingSteps).toBe(1)
  })
})
