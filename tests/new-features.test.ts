// Tests pour les nouvelles fonctionnalités
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import NotificationToast from '~/components/notifications/NotificationToast.vue'
import QuotaAlertSettings from '~/components/account/QuotaAlertSettings.vue'
import { useNotificationStore } from '~/stores/notification'

// Mock des composants
vi.mock('@heroicons/vue/24/outline', () => ({
  XMarkIcon: vi.fn(),
  ExclamationTriangleIcon: vi.fn(),
  PhoneIcon: vi.fn(),
  ClockIcon: vi.fn(),
  BellIcon: vi.fn(),
  CalendarIcon: vi.fn(),
  PlusIcon: vi.fn()
}))

// Mock des fonctions de navigation
vi.mock('#app', () => ({
  navigateTo: vi.fn()
}))

describe('Notifications et Alertes de Quota', () => {
  // Tests pour le store de notifications
  describe('NotificationStore', () => {
    let store

    beforeEach(() => {
      // Créer une instance de test du store
      const pinia = createTestingPinia({
        createSpy: vi.fn
      })
      store = useNotificationStore(pinia)
    })

    it('devrait permettre de s\'abonner aux notifications', () => {
      const callback = vi.fn()
      const unsubscribe = store.subscribe(callback)
      
      // Vérifier que la fonction de désabonnement est retournée
      expect(typeof unsubscribe).toBe('function')
      
      // Envoyer une notification
      store.notify({
        type: 'test',
        title: 'Test',
        message: 'Message de test'
      })
      
      // Vérifier que le callback a été appelé
      expect(callback).toHaveBeenCalledWith({
        type: 'test',
        title: 'Test',
        message: 'Message de test'
      })
      
      // Se désabonner
      unsubscribe()
      
      // Envoyer une autre notification
      store.notify({
        type: 'test2',
        title: 'Test 2',
        message: 'Message de test 2'
      })
      
      // Vérifier que le callback n'a pas été appelé une seconde fois
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('devrait envoyer des notifications de quota', () => {
      const spy = vi.spyOn(store, 'notify')
      
      store.notifyQuota('calls', 85)
      
      expect(spy).toHaveBeenCalledWith({
        type: 'quota_calls',
        title: 'Alerte de quota d\'appels',
        message: 'Vous avez utilisé 85% de votre quota d\'appels.',
        percentage: 85,
        metadata: undefined
      })
    })
  })

  // Tests pour le composant NotificationToast
  describe('NotificationToast', () => {
    it('devrait afficher une notification', async () => {
      const wrapper = mount(NotificationToast, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            XMarkIcon: true,
            ExclamationTriangleIcon: true,
            PhoneIcon: true,
            ClockIcon: true,
            BellIcon: true,
            CalendarIcon: true
          },
          mocks: {
            $t: (key) => key,
            navigateTo: vi.fn()
          }
        }
      })
      
      // Exposer la méthode addNotification
      const { addNotification } = wrapper.vm
      
      // Ajouter une notification
      addNotification({
        type: 'quota_calls',
        title: 'Test de notification',
        message: 'Ceci est un test',
        percentage: 85
      })
      
      // Attendre que la notification soit affichée
      await wrapper.vm.$nextTick()
      
      // Vérifier que la notification est affichée
      expect(wrapper.text()).toContain('Test de notification')
      expect(wrapper.text()).toContain('Ceci est un test')
      
      // Vérifier que la barre de progression est affichée
      const progressBar = wrapper.find('.bg-orange-500')
      expect(progressBar.exists()).toBe(true)
      expect(progressBar.attributes('style')).toContain('width: 85%')
    })
  })

  // Tests pour le composant QuotaAlertSettings
  describe('QuotaAlertSettings', () => {
    it('devrait afficher les paramètres de notification', () => {
      const wrapper = mount(QuotaAlertSettings, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            PlusIcon: true,
            ExclamationTriangleIcon: true,
            PhoneIcon: true,
            ClockIcon: true
          },
          mocks: {
            $t: (key) => key,
            useSupabaseClient: () => ({
              from: () => ({
                select: () => ({
                  eq: () => ({
                    single: () => ({ data: null, error: null })
                  }),
                  order: () => ({
                    limit: () => ({ data: [], error: null })
                  })
                }),
                update: () => ({
                  eq: () => ({ error: null })
                }),
                upsert: () => ({ error: null })
              })
            }),
            useSupabaseUser: () => ({ value: { id: 'test-user-id' } }),
            useAgencyStore: () => ({
              getActiveAgency: () => ({ id: 'test-agency-id' })
            }),
            useToast: () => ({
              success: vi.fn(),
              error: vi.fn()
            })
          }
        }
      })
      
      // Vérifier que les sliders sont affichés
      expect(wrapper.find('#calls-threshold').exists()).toBe(true)
      expect(wrapper.find('#minutes-threshold').exists()).toBe(true)
      
      // Vérifier que le sélecteur de délai est affiché
      expect(wrapper.find('#cooldown').exists()).toBe(true)
      
      // Vérifier que les cases à cocher des canaux de notification sont affichées
      expect(wrapper.find('#in-app').exists()).toBe(true)
      expect(wrapper.find('#email').exists()).toBe(true)
    })
  })

  // Tests pour les codes promotionnels
  describe('Codes Promotionnels', () => {
    it('devrait valider le format des codes promo', () => {
      // Fonction de validation de code promo
      const validatePromoCode = (code) => {
        if (!code) return false
        if (code.length < 3) return false
        if (code.length > 20) return false
        if (!/^[A-Z0-9_-]+$/.test(code)) return false
        return true
      }
      
      // Tester des codes valides
      expect(validatePromoCode('WELCOME10')).toBe(true)
      expect(validatePromoCode('SUMMER_2025')).toBe(true)
      expect(validatePromoCode('BLACK-FRIDAY')).toBe(true)
      
      // Tester des codes invalides
      expect(validatePromoCode('')).toBe(false)
      expect(validatePromoCode('AB')).toBe(false)
      expect(validatePromoCode('code_trop_long_plus_de_vingt_caracteres')).toBe(false)
      expect(validatePromoCode('code invalide')).toBe(false)
      expect(validatePromoCode('code@special')).toBe(false)
    })
  })

  // Tests pour les périodes d'essai
  describe('Périodes d\'essai', () => {
    it('devrait calculer correctement les dates de fin d\'essai', () => {
      // Fonction pour calculer la date de fin d'essai
      const calculateTrialEndDate = (startDate, trialDays) => {
        const date = new Date(startDate)
        date.setDate(date.getDate() + trialDays)
        return date
      }
      
      // Date de référence pour le test
      const startDate = new Date('2025-04-02')
      
      // Tester différentes durées d'essai
      expect(calculateTrialEndDate(startDate, 7).toISOString().split('T')[0]).toBe('2025-04-09')
      expect(calculateTrialEndDate(startDate, 14).toISOString().split('T')[0]).toBe('2025-04-16')
      expect(calculateTrialEndDate(startDate, 30).toISOString().split('T')[0]).toBe('2025-05-02')
    })
  })
})
