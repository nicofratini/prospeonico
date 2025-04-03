<template>
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg font-medium leading-6 text-gray-900">{{ $t('coupons.manage_promo_codes') }}</h3>
      <div class="mt-2 max-w-xl text-sm text-gray-500">
        <p>{{ $t('coupons.manage_promo_description') }}</p>
      </div>
      
      <!-- Liste des codes promo -->
      <div class="mt-5 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg" v-if="coupons.length > 0">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">{{ $t('coupons.code') }}</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{{ $t('coupons.discount') }}</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{{ $t('coupons.valid_until') }}</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{{ $t('coupons.redemptions') }}</th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{{ $t('coupons.status') }}</th>
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span class="sr-only">{{ $t('common.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="coupon in coupons" :key="coupon.id">
              <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {{ coupon.code }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <span v-if="coupon.discount_type === 'percent'">{{ coupon.discount_percent }}%</span>
                <span v-else>{{ formatCurrency(coupon.discount_amount / 100) }}</span>
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {{ coupon.valid_until ? formatDate(coupon.valid_until) : $t('coupons.no_expiration') }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {{ coupon.times_redeemed }} / {{ coupon.max_redemptions || '∞' }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm">
                <span :class="coupon.is_active ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'" class="inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                  {{ coupon.is_active ? $t('coupons.active') : $t('coupons.inactive') }}
                </span>
              </td>
              <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button @click="editCoupon(coupon)" class="text-indigo-600 hover:text-indigo-900 mr-4">
                  {{ $t('common.edit') }}
                </button>
                <button @click="toggleCouponStatus(coupon)" :class="coupon.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'">
                  {{ coupon.is_active ? $t('common.disable') : $t('common.enable') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-else class="mt-5 text-center py-6 bg-gray-50 rounded-lg">
        <p class="text-gray-500">{{ $t('coupons.no_coupons') }}</p>
      </div>
      
      <div class="mt-5">
        <button 
          type="button" 
          @click="showCreateModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon class="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          {{ $t('coupons.create_new') }}
        </button>
      </div>
    </div>
    
    <!-- Modal de création/édition de code promo -->
    <Modal v-if="showCreateModal || editingCoupon" @close="closeModal">
      <template #title>
        {{ editingCoupon ? $t('coupons.edit_promo_code') : $t('coupons.create_promo_code') }}
      </template>
      
      <template #content>
        <form @submit.prevent="saveCoupon" class="space-y-4">
          <!-- Code -->
          <div>
            <label for="code" class="block text-sm font-medium text-gray-700">{{ $t('coupons.code') }}</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="code" 
                v-model="couponForm.code" 
                :disabled="!!editingCoupon"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
                required
              />
            </div>
          </div>
          
          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">{{ $t('coupons.description') }}</label>
            <div class="mt-1">
              <input 
                type="text" 
                id="description" 
                v-model="couponForm.description" 
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              />
            </div>
          </div>
          
          <!-- Type de remise -->
          <div>
            <label class="block text-sm font-medium text-gray-700">{{ $t('coupons.discount_type') }}</label>
            <div class="mt-1 flex items-center space-x-4">
              <div class="flex items-center">
                <input 
                  id="percent" 
                  type="radio" 
                  v-model="couponForm.discount_type" 
                  value="percent" 
                  class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" 
                />
                <label for="percent" class="ml-2 block text-sm text-gray-700">{{ $t('coupons.percent') }}</label>
              </div>
              <div class="flex items-center">
                <input 
                  id="amount" 
                  type="radio" 
                  v-model="couponForm.discount_type" 
                  value="amount" 
                  class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" 
                />
                <label for="amount" class="ml-2 block text-sm text-gray-700">{{ $t('coupons.fixed_amount') }}</label>
              </div>
            </div>
          </div>
          
          <!-- Montant de la remise -->
          <div v-if="couponForm.discount_type === 'percent'">
            <label for="discount_percent" class="block text-sm font-medium text-gray-700">{{ $t('coupons.discount_percent') }}</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <input 
                type="number" 
                id="discount_percent" 
                v-model="couponForm.discount_percent" 
                min="1" 
                max="100" 
                class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md" 
                required
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
          
          <div v-else>
            <label for="discount_amount" class="block text-sm font-medium text-gray-700">{{ $t('coupons.discount_amount') }}</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">€</span>
              </div>
              <input 
                type="number" 
                id="discount_amount" 
                v-model="couponForm.discount_amount_euros" 
                min="1" 
                step="0.01"
                class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md" 
                required
              />
            </div>
          </div>
          
          <!-- Date de validité -->
          <div>
            <label for="valid_until" class="block text-sm font-medium text-gray-700">{{ $t('coupons.valid_until') }}</label>
            <div class="mt-1">
              <input 
                type="date" 
                id="valid_until" 
                v-model="couponForm.valid_until" 
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">{{ $t('coupons.leave_empty_no_expiration') }}</p>
          </div>
          
          <!-- Nombre maximum d'utilisations -->
          <div>
            <label for="max_redemptions" class="block text-sm font-medium text-gray-700">{{ $t('coupons.max_redemptions') }}</label>
            <div class="mt-1">
              <input 
                type="number" 
                id="max_redemptions" 
                v-model="couponForm.max_redemptions" 
                min="1"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">{{ $t('coupons.leave_empty_unlimited') }}</p>
          </div>
          
          <!-- Plan applicable -->
          <div>
            <label for="applies_to_plan" class="block text-sm font-medium text-gray-700">{{ $t('coupons.applies_to_plan') }}</label>
            <div class="mt-1">
              <select 
                id="applies_to_plan" 
                v-model="couponForm.applies_to_plan" 
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">{{ $t('coupons.all_plans') }}</option>
                <option value="price_basic_monthly">{{ $t('plans.basic_monthly') }}</option>
                <option value="price_basic_yearly">{{ $t('plans.basic_yearly') }}</option>
                <option value="price_pro_monthly">{{ $t('plans.pro_monthly') }}</option>
                <option value="price_pro_yearly">{{ $t('plans.pro_yearly') }}</option>
                <option value="price_enterprise_monthly">{{ $t('plans.enterprise_monthly') }}</option>
                <option value="price_enterprise_yearly">{{ $t('plans.enterprise_yearly') }}</option>
              </select>
            </div>
          </div>
          
          <!-- Durée minimale d'abonnement -->
          <div>
            <label for="min_subscription_months" class="block text-sm font-medium text-gray-700">{{ $t('coupons.min_subscription_months') }}</label>
            <div class="mt-1">
              <input 
                type="number" 
                id="min_subscription_months" 
                v-model="couponForm.min_subscription_months" 
                min="1"
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" 
              />
            </div>
          </div>
        </form>
      </template>
      
      <template #footer>
        <button 
          type="button" 
          @click="closeModal" 
          class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {{ $t('common.cancel') }}
        </button>
        <button 
          type="button" 
          @click="saveCoupon" 
          class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {{ $t('common.save') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import Modal from '~/components/ui/Modal.vue'

// Types
interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percent' | 'amount'
  discount_amount: number
  discount_percent: number
  valid_from: string
  valid_until: string | null
  max_redemptions: number | null
  times_redeemed: number
  applies_to_plan: string | null
  min_subscription_months: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// État
const coupons = ref<Coupon[]>([])
const showCreateModal = ref(false)
const editingCoupon = ref<Coupon | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Formulaire
const couponForm = reactive({
  code: '',
  description: '',
  discount_type: 'percent' as 'percent' | 'amount',
  discount_amount: 0,
  discount_amount_euros: 0, // Pour l'interface utilisateur (en euros)
  discount_percent: 10,
  valid_until: '',
  max_redemptions: null as number | null,
  applies_to_plan: '',
  min_subscription_months: 1,
})

// Charger les codes promo
const fetchCoupons = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/coupons')
    coupons.value = response.coupons
  } catch (err) {
    console.error('Erreur lors du chargement des codes promo:', err)
    error.value = 'Erreur lors du chargement des codes promo'
  } finally {
    loading.value = false
  }
}

// Éditer un code promo
const editCoupon = (coupon: Coupon) => {
  editingCoupon.value = coupon
  
  // Remplir le formulaire avec les données du coupon
  couponForm.code = coupon.code
  couponForm.description = coupon.description || ''
  couponForm.discount_type = coupon.discount_type
  couponForm.discount_amount = coupon.discount_amount
  couponForm.discount_amount_euros = coupon.discount_amount / 100 // Convertir en euros
  couponForm.discount_percent = coupon.discount_percent
  couponForm.valid_until = coupon.valid_until ? new Date(coupon.valid_until).toISOString().split('T')[0] : ''
  couponForm.max_redemptions = coupon.max_redemptions
  couponForm.applies_to_plan = coupon.applies_to_plan || ''
  couponForm.min_subscription_months = coupon.min_subscription_months
}

// Activer/désactiver un code promo
const toggleCouponStatus = async (coupon: Coupon) => {
  try {
    await $fetch(`/api/coupons/${coupon.id}/toggle-status`, {
      method: 'POST'
    })
    
    // Mettre à jour l'état local
    const index = coupons.value.findIndex(c => c.id === coupon.id)
    if (index !== -1) {
      coupons.value[index].is_active = !coupons.value[index].is_active
    }
    
    // Afficher une notification
    const message = coupon.is_active 
      ? 'Code promo désactivé avec succès' 
      : 'Code promo activé avec succès'
    
    useToast().success(message)
  } catch (err) {
    console.error('Erreur lors de la modification du statut du code promo:', err)
    useToast().error('Erreur lors de la modification du statut du code promo')
  }
}

// Sauvegarder un code promo
const saveCoupon = async () => {
  try {
    // Convertir le montant en centimes pour le stockage
    const discountAmount = couponForm.discount_type === 'amount' 
      ? Math.round(couponForm.discount_amount_euros * 100) 
      : 0
    
    const couponData = {
      code: couponForm.code,
      description: couponForm.description,
      discount_type: couponForm.discount_type,
      discount_amount: discountAmount,
      discount_percent: couponForm.discount_type === 'percent' ? couponForm.discount_percent : 0,
      valid_until: couponForm.valid_until || null,
      max_redemptions: couponForm.max_redemptions,
      applies_to_plan: couponForm.applies_to_plan || null,
      min_subscription_months: couponForm.min_subscription_months
    }
    
    if (editingCoupon.value) {
      // Mise à jour d'un code promo existant
      await $fetch(`/api/coupons/${editingCoupon.value.id}`, {
        method: 'PUT',
        body: couponData
      })
      
      useToast().success('Code promo mis à jour avec succès')
    } else {
      // Création d'un nouveau code promo
      await $fetch('/api/coupons', {
        method: 'POST',
        body: couponData
      })
      
      useToast().success('Code promo créé avec succès')
    }
    
    // Recharger les codes promo
    await fetchCoupons()
    
    // Fermer le modal
    closeModal()
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du code promo:', err)
    useToast().error('Erreur lors de la sauvegarde du code promo')
  }
}

// Fermer le modal et réinitialiser le formulaire
const closeModal = () => {
  showCreateModal.value = false
  editingCoupon.value = null
  
  // Réinitialiser le formulaire
  couponForm.code = ''
  couponForm.description = ''
  couponForm.discount_type = 'percent'
  couponForm.discount_amount = 0
  couponForm.discount_amount_euros = 0
  couponForm.discount_percent = 10
  couponForm.valid_until = ''
  couponForm.max_redemptions = null
  couponForm.applies_to_plan = ''
  couponForm.min_subscription_months = 1
}

// Formater une date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Formater un montant en devise
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Charger les codes promo au montage du composant
onMounted(() => {
  fetchCoupons()
})
</script>
