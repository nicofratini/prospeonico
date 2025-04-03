<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('calendar.booking_form') }}</h3>
    
    <!-- Informations sur le créneau sélectionné -->
    <div class="mb-6 p-3 bg-indigo-50 rounded-md">
      <div class="text-sm text-gray-700">
        <span class="font-medium">{{ $t('calendar.selected_slot') }}:</span> 
        {{ formatDateTime(selectedSlot.start) }} - {{ formatDateTime(selectedSlot.end) }}
      </div>
    </div>
    
    <!-- Formulaire -->
    <form @submit.prevent="submitForm">
      <div class="space-y-4">
        <!-- Nom -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">{{ $t('calendar.name') }} *</label>
          <input 
            id="name" 
            v-model="form.name" 
            type="text" 
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            :placeholder="$t('calendar.name_placeholder')"
          />
        </div>
        
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">{{ $t('calendar.email') }} *</label>
          <input 
            id="email" 
            v-model="form.email" 
            type="email" 
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            :placeholder="$t('calendar.email_placeholder')"
          />
        </div>
        
        <!-- Téléphone -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700">{{ $t('calendar.phone') }}</label>
          <input 
            id="phone" 
            v-model="form.phone" 
            type="tel"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            :placeholder="$t('calendar.phone_placeholder')"
          />
        </div>
        
        <!-- Bien immobilier (si disponible) -->
        <div v-if="properties && properties.length > 0">
          <label for="property" class="block text-sm font-medium text-gray-700">{{ $t('calendar.property') }}</label>
          <select 
            id="property" 
            v-model="form.propertyId"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">{{ $t('calendar.no_specific_property') }}</option>
            <option v-for="property in properties" :key="property.id" :value="property.id">
              {{ property.title }}
            </option>
          </select>
        </div>
        
        <!-- Notes -->
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700">{{ $t('calendar.notes') }}</label>
          <textarea 
            id="notes" 
            v-model="form.notes" 
            rows="3"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            :placeholder="$t('calendar.notes_placeholder')"
          ></textarea>
        </div>
        
        <!-- Lieu -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700">{{ $t('calendar.location') }}</label>
          <select 
            id="location" 
            v-model="form.location"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="phone">{{ $t('calendar.location_phone') }}</option>
            <option value="google_meet">{{ $t('calendar.location_google_meet') }}</option>
            <option value="zoom">{{ $t('calendar.location_zoom') }}</option>
            <option value="in_person">{{ $t('calendar.location_in_person') }}</option>
          </select>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="mt-6 flex justify-end space-x-3">
        <button 
          type="button" 
          @click="cancel"
          class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          :disabled="loading"
        >
          {{ $t('common.cancel') }}
        </button>
        <button 
          type="submit"
          class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          :disabled="loading"
        >
          <span v-if="loading" class="mr-2">
            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          {{ $t('calendar.book_appointment') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { CalComTimeSlot, CalComCreateBookingRequest } from '~/types/calcom'

const props = defineProps<{
  selectedSlot: CalComTimeSlot
  eventTypeId: number
  loading: boolean
  properties?: Array<{ id: string, title: string }>
}>()

const emit = defineEmits<{
  (e: 'submit', data: CalComCreateBookingRequest & { propertyId?: string, phone?: string }): void
  (e: 'cancel'): void
}>()

// Formulaire
const form = reactive({
  name: '',
  email: '',
  phone: '',
  notes: '',
  location: 'phone',
  propertyId: ''
})

// Formater la date et l'heure
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Soumettre le formulaire
const submitForm = () => {
  // Créer l'objet de données pour la création du rendez-vous
  const bookingData: CalComCreateBookingRequest & { propertyId?: string, phone?: string } = {
    event_type_id: props.eventTypeId,
    start: props.selectedSlot.start,
    end: props.selectedSlot.end,
    name: form.name,
    email: form.email,
    notes: form.notes,
    location: form.location,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || 'fr',
    metadata: {}
  }
  
  // Ajouter les champs optionnels s'ils sont remplis
  if (form.phone) {
    bookingData.phone = form.phone
    bookingData.metadata.phone = form.phone
  }
  
  if (form.propertyId) {
    bookingData.propertyId = form.propertyId
    bookingData.metadata.property_id = form.propertyId
  }
  
  emit('submit', bookingData)
}

// Annuler la réservation
const cancel = () => {
  emit('cancel')
}
</script>
