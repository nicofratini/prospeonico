<template>
  <div>
    <div class="sm:flex sm:items-center mb-6">
      <div class="sm:flex-auto">
        <h1 class="text-xl font-semibold text-gray-900">{{ $t('properties.title') }}</h1>
        <p class="mt-2 text-sm text-gray-700">{{ $t('properties.description') }}</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          @click="openAddPropertyModal"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          {{ $t('properties.add_property') }}
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="bg-white shadow rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="type-filter" class="block text-sm font-medium text-gray-700">{{ $t('properties.filter_type') }}</label>
          <select
            id="type-filter"
            v-model="filters.type"
            class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">{{ $t('properties.filter_type_all') }}</option>
            <option value="apartment">{{ $t('properties.type.apartment') }}</option>
            <option value="house">{{ $t('properties.type.house') }}</option>
            <option value="land">{{ $t('properties.type.land') }}</option>
            <option value="commercial">{{ $t('properties.type.commercial') }}</option>
          </select>
        </div>
        
        <div>
          <label for="status-filter" class="block text-sm font-medium text-gray-700">{{ $t('properties.filter_status') }}</label>
          <select
            id="status-filter"
            v-model="filters.status"
            class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">{{ $t('properties.filter_status_all') }}</option>
            <option value="active">{{ $t('properties.status.active') }}</option>
            <option value="pending">{{ $t('properties.status.pending') }}</option>
            <option value="sold">{{ $t('properties.status.sold') }}</option>
          </select>
        </div>
        
        <div>
          <label for="price-filter" class="block text-sm font-medium text-gray-700">{{ $t('properties.filter_price') }}</label>
          <select
            id="price-filter"
            v-model="filters.priceRange"
            class="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">{{ $t('properties.filter_price_all') }}</option>
            <option value="0-200000">< 200 000 €</option>
            <option value="200000-500000">200 000 € - 500 000 €</option>
            <option value="500000-1000000">500 000 € - 1 000 000 €</option>
            <option value="1000000+">1 000 000 € +</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Liste des propriétés -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
      
      <div v-else-if="filteredProperties.length === 0" class="text-center py-12">
        <HomeIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('properties.no_properties') }}</h3>
        <p class="mt-1 text-sm text-gray-500">{{ $t('properties.no_properties_description') }}</p>
        <div class="mt-6">
          <button
            @click="openAddPropertyModal"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon class="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {{ $t('properties.add_property') }}
          </button>
        </div>
      </div>
      
      <ul v-else role="list" class="divide-y divide-gray-200">
        <li v-for="property in filteredProperties" :key="property.id">
          <div class="block hover:bg-gray-50">
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <HomeIcon class="h-6 w-6 text-indigo-600" />
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-indigo-600 truncate">{{ property.title }}</p>
                    <p class="text-sm text-gray-500">{{ property.address }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <span 
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      property.status === 'active' ? 'bg-green-100 text-green-800' : 
                      property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'
                    ]"
                  >
                    {{ $t(`properties.status.${property.status}`) }}
                  </span>
                  <p class="text-sm font-medium text-gray-900">{{ formatPrice(property.price) }}</p>
                  <button
                    @click="openPropertyDetails(property)"
                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {{ $t('properties.view_details') }}
                    <ArrowRightIcon class="ml-1 h-3 w-3" />
                  </button>
                </div>
              </div>
              <div class="mt-2 sm:flex sm:justify-between">
                <div class="sm:flex">
                  <p class="flex items-center text-sm text-gray-500">
                    <SquareIcon class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {{ property.surface }} m²
                  </p>
                  <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                    <BedIcon class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {{ property.bedrooms }} {{ $t('properties.bedrooms') }}
                  </p>
                  <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                    <BathIcon class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {{ property.bathrooms }} {{ $t('properties.bathrooms') }}
                  </p>
                </div>
                <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <CalendarIcon class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                  <p>
                    {{ $t('properties.added_on') }} <time :datetime="property.created_at">{{ formatDate(property.created_at) }}</time>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Modal d'ajout/modification de propriété -->
    <div v-if="propertyModalOpen" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <div class="absolute right-0 top-0 pr-4 pt-4">
              <button 
                @click="propertyModalOpen = false" 
                class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span class="sr-only">{{ $t('common.close') }}</span>
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>
            
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-lg font-medium leading-6 text-gray-900">
                  {{ editingProperty ? $t('properties.edit_property') : $t('properties.add_property') }}
                </h3>
                
                <form @submit.prevent="saveProperty" class="mt-6 space-y-6">
                  <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div class="sm:col-span-6">
                      <label for="title" class="block text-sm font-medium text-gray-700">{{ $t('properties.title') }}</label>
                      <div class="mt-1">
                        <input
                          type="text"
                          id="title"
                          v-model="propertyForm.title"
                          required
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div class="sm:col-span-6">
                      <label for="address" class="block text-sm font-medium text-gray-700">{{ $t('properties.address') }}</label>
                      <div class="mt-1">
                        <input
                          type="text"
                          id="address"
                          v-model="propertyForm.address"
                          required
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div class="sm:col-span-3">
                      <label for="type" class="block text-sm font-medium text-gray-700">{{ $t('properties.type.label') }}</label>
                      <div class="mt-1">
                        <select
                          id="type"
                          v-model="propertyForm.type"
                          required
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="apartment">{{ $t('properties.type.apartment') }}</option>
                          <option value="house">{{ $t('properties.type.house') }}</option>
                          <option value="land">{{ $t('properties.type.land') }}</option>
                          <option value="commercial">{{ $t('properties.type.commercial') }}</option>
                        </select>
                      </div>
                    </div>
                    
                    <div class="sm:col-span-3">
                      <label for="status" class="block text-sm font-medium text-gray-700">{{ $t('properties.status.label') }}</label>
                      <div class="mt-1">
                        <select
                          id="status"
                          v-model="propertyForm.status"
                          required
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="active">{{ $t('properties.status.active') }}</option>
                          <option value="pending">{{ $t('properties.status.pending') }}</option>
                          <option value="sold">{{ $t('properties.status.sold') }}</option>
                        </select>
                      </div>
                    </div>
                    
                    <div class="sm:col-span-2">
                      <label for="price" class="block text-sm font-medium text-gray-700">{{ $t('properties.price') }}</label>
                      <div class="mt-1">
                        <input
                          type="number"
                          id="price"
                          v-model="propertyForm.price"
                          required
                          min="0"
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div class="sm:col-span-2">
                      <label for="surface" class="block text-sm font-medium text-gray-700">{{ $t('properties.surface') }} (m²)</label>
                      <div class="mt-1">
                        <input
                          type="number"
                          id="surface"
                          v-model="propertyForm.surface"
                          required
                          min="0"
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div class="sm:col-span-1">
                      <label for="bedrooms" class="block text-sm font-medium text-gray-700">{{ $t('properties.bedrooms') }}</label>
                      <div class="mt-1">
                        <input
                          type="number"
                          id="bedrooms"
                          v-model="propertyForm.bedrooms"
                          required
                          min="0"
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div class="sm:col-span-1">
                      <label for="bathrooms" class="block text-sm font-medium text-gray-700">{{ $t('properties.bathrooms') }}</label>
                      <div class="mt-1">
                        <input
                          type="number"
                          id="bathrooms"
                          v-model="propertyForm.bathrooms"
                          required
                          min="0"
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div class="sm:col-span-6">
                      <label for="description" class="block text-sm font-medium text-gray-700">{{ $t('properties.description') }}</label>
                      <div class="mt-1">
                        <textarea
                          id="description"
                          v-model="propertyForm.description"
                          rows="4"
                          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      class="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    >
                      {{ $t('common.save') }}
                    </button>
                    <button
                      type="button"
                      @click="propertyModalOpen = false"
                      class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                    >
                      {{ $t('common.cancel') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détail de propriété -->
    <div v-if="detailModalOpen" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <div class="absolute right-0 top-0 pr-4 pt-4">
              <button 
                @click="detailModalOpen = false" 
                class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span class="sr-only">{{ $t('common.close') }}</span>
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>
            
            <div v-if="selectedProperty">
              <div class="sm:flex sm:items-start">
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 class="text-lg font-medium leading-6 text-gray-900">
                    {{ selectedProperty.title }}
                  </h3>
                  
                  <div class="mt-4 bg-gray-50 p-4 rounded-lg">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p class="text-sm text-gray-500">{{ $t('properties.address') }}</p>
                        <p class="text-sm font-medium">{{ selectedProperty.address }}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">{{ $t('properties.type.label') }}</p>
                        <p class="text-sm font-medium">{{ $t(`properties.type.${selectedProperty.type}`) }}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">{{ $t('properties.price') }}</p>
                        <p class="text-sm font-medium">{{ formatPrice(selectedProperty.price) }}</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">{{ $t('properties.status.label') }}</p>
                        <p class="text-sm font-medium">
                          <span 
                            :class="[
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              selectedProperty.status === 'active' ? 'bg-green-100 text-green-800' : 
                              selectedProperty.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'
                            ]"
                          >
                            {{ $t(`properties.status.${selectedProperty.status}`) }}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">{{ $t('properties.surface') }}</p>
                        <p class="text-sm font-medium">{{ selectedProperty.surface }} m²</p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500">{{ $t('properties.rooms') }}</p>
                        <p class="text-sm font-medium">{{ selectedProperty.bedrooms }} {{ $t('properties.bedrooms') }}, {{ selectedProperty.bathrooms }} {{ $t('properties.bathrooms') }}</p>
                      </div>
                    </div>
                    
                    <div class="mt-4">
                      <p class="text-sm text-gray-500">{{ $t('properties.description') }}</p>
                      <p class="text-sm mt-1">{{ selectedProperty.description }}</p>
                    </div>
                  </div>
                  
                  <div class="mt-6 flex justify-end space-x-3">
                    <button
                      @click="editProperty(selectedProperty)"
                      class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PencilIcon class="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                      {{ $t('common.edit') }}
                    </button>
                    <button
                      @click="confirmDeleteProperty"
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon class="-ml-1 mr-2 h-5 w-5" />
                      {{ $t('common.delete') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <div v-if="deleteConfirmationOpen" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon class="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-base font-semibold leading-6 text-gray-900">{{ $t('properties.delete_property') }}</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">{{ $t('properties.delete_property_confirmation') }}</p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                @click="deleteProperty"
                class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
              >
                {{ $t('common.delete') }}
              </button>
              <button
                type="button"
                @click="deleteConfirmationOpen = false"
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                {{ $t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  HomeIcon, 
  PlusIcon, 
  ArrowRightIcon, 
  XMarkIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

// Icônes personnalisées
const SquareIcon = defineComponent({
  render: () => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    fill: 'none', 
    viewBox: '0 0 24 24', 
    stroke: 'currentColor' 
  }, [
    h('path', { 
      'stroke-linecap': 'round', 
      'stroke-linejoin': 'round', 
      'stroke-width': '2', 
      d: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' 
    })
  ])
})

const BedIcon = defineComponent({
  render: () => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    fill: 'none', 
    viewBox: '0 0 24 24', 
    stroke: 'currentColor' 
  }, [
    h('path', { 
      'stroke-linecap': 'round', 
      'stroke-linejoin': 'round', 
      'stroke-width': '2', 
      d: 'M3 12h18M3 12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2M3 12a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4' 
    })
  ])
})

const BathIcon = defineComponent({
  render: () => h('svg', { 
    xmlns: 'http://www.w3.org/2000/svg', 
    fill: 'none', 
    viewBox: '0 0 24 24', 
    stroke: 'currentColor' 
  }, [
    h('path', { 
      'stroke-linecap': 'round', 
      'stroke-linejoin': 'round', 
      'stroke-width': '2', 
      d: 'M5 12h14M5 12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2M5 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2' 
    })
  ])
})

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

const client = useSupabaseClient()

// État
const loading = ref(true)
const properties = ref<any[]>([])
const propertyModalOpen = ref(false)
const detailModalOpen = ref(false)
const deleteConfirmationOpen = ref(false)
const selectedProperty = ref<any>(null)
const editingProperty = ref(false)

// Formulaire
const propertyForm = reactive({
  id: '',
  title: '',
  address: '',
  type: 'apartment',
  status: 'active',
  price: 0,
  surface: 0,
  bedrooms: 0,
  bathrooms: 0,
  description: ''
})

// Filtres
const filters = reactive({
  type: 'all',
  status: 'all',
  priceRange: 'all'
})

// Propriétés filtrées
const filteredProperties = computed(() => {
  let result = [...properties.value]
  
  // Filtre par type
  if (filters.type !== 'all') {
    result = result.filter(property => property.type === filters.type)
  }
  
  // Filtre par statut
  if (filters.status !== 'all') {
    result = result.filter(property => property.status === filters.status)
  }
  
  // Filtre par prix
  if (filters.priceRange !== 'all') {
    const [min, max] = filters.priceRange.split('-')
    
    if (min && max) {
      result = result.filter(property => property.price >= parseInt(min) && property.price <= parseInt(max))
    } else if (min) {
      result = result.filter(property => property.price >= parseInt(min))
    }
  }
  
  return result
})

// Charger les propriétés
const loadProperties = async () => {
  loading.value = true
  
  try {
    const { data, error } = await client
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    properties.value = data
  } catch (error) {
    console.error('Erreur lors du chargement des propriétés:', error)
    // Données fictives pour la démo
    properties.value = [
      { 
        id: '1', 
        title: 'Appartement 3 pièces', 
        address: '15 rue de Paris, 75001 Paris', 
        type: 'apartment',
        status: 'active',
        price: 450000, 
        surface: 75,
        bedrooms: 2,
        bathrooms: 1,
        description: 'Bel appartement lumineux au cœur de Paris, proche des commerces et transports.',
        created_at: '2025-03-15T10:00:00Z'
      },
      { 
        id: '2', 
        title: 'Maison 5 pièces', 
        address: '8 avenue des Champs, 75008 Paris', 
        type: 'house',
        status: 'pending',
        price: 950000, 
        surface: 120,
        bedrooms: 3,
        bathrooms: 2,
        description: 'Magnifique maison avec jardin dans un quartier prisé de Paris.',
        created_at: '2025-03-10T14:30:00Z'
      },
      { 
        id: '3', 
        title: 'Studio 25m²', 
        address: '3 rue du Commerce, 75015 Paris', 
        type: 'apartment',
        status: 'sold',
        price: 250000, 
        surface: 25,
        bedrooms: 0,
        bathrooms: 1,
        description: 'Studio idéal pour investissement locatif, proche des écoles et universités.',
        created_at: '2025-03-05T09:15:00Z'
      }
    ]
  } finally {
    loading.value = false
  }
}

// Ouvrir le modal d'ajout de propriété
const openAddPropertyModal = () => {
  // Réinitialiser le formulaire
  Object.assign(propertyForm, {
    id: '',
    title: '',
    address: '',
    type: 'apartment',
    status: 'active',
    price: 0,
    surface: 0,
    bedrooms: 0,
    bathrooms: 0,
    description: ''
  })
  
  editingProperty.value = false
  propertyModalOpen.value = true
}

// Ouvrir le modal de détail de propriété
const openPropertyDetails = (property: any) => {
  selectedProperty.value = property
  detailModalOpen.value = true
}

// Éditer une propriété
const editProperty = (property: any) => {
  // Copier les valeurs dans le formulaire
  Object.assign(propertyForm, {
    id: property.id,
    title: property.title,
    address: property.address,
    type: property.type,
    status: property.status,
    price: property.price,
    surface: property.surface,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    description: property.description
  })
  
  editingProperty.value = true
  detailModalOpen.value = false
  propertyModalOpen.value = true
}

// Sauvegarder une propriété
const saveProperty = async () => {
  try {
    if (editingProperty.value) {
      // Mise à jour d'une propriété existante
      const { error } = await client
        .from('properties')
        .update({
          title: propertyForm.title,
          address: propertyForm.address,
          type: propertyForm.type,
          status: propertyForm.status,
          price: propertyForm.price,
          surface: propertyForm.surface,
          bedrooms: propertyForm.bedrooms,
          bathrooms: propertyForm.bathrooms,
          description: propertyForm.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyForm.id)
      
      if (error) throw error
      
      // Mettre à jour la propriété dans la liste
      const index = properties.value.findIndex(p => p.id === propertyForm.id)
      if (index !== -1) {
        properties.value[index] = {
          ...properties.value[index],
          ...propertyForm,
          updated_at: new Date().toISOString()
        }
      }
    } else {
      // Création d'une nouvelle propriété
      const { data, error } = await client
        .from('properties')
        .insert({
          title: propertyForm.title,
          address: propertyForm.address,
          type: propertyForm.type,
          status: propertyForm.status,
          price: propertyForm.price,
          surface: propertyForm.surface,
          bedrooms: propertyForm.bedrooms,
          bathrooms: propertyForm.bathrooms,
          description: propertyForm.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      
      // Ajouter la nouvelle propriété à la liste
      if (data && data.length > 0) {
        properties.value.unshift(data[0])
      } else {
        // Pour la démo, créer un ID fictif
        const newProperty = {
          ...propertyForm,
          id: `demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        properties.value.unshift(newProperty)
      }
    }
    
    propertyModalOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la propriété:', error)
    // En mode démo, simuler la sauvegarde
    if (!editingProperty.value) {
      const newProperty = {
        ...propertyForm,
        id: `demo-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      properties.value.unshift(newProperty)
    } else {
      const index = properties.value.findIndex(p => p.id === propertyForm.id)
      if (index !== -1) {
        properties.value[index] = {
          ...properties.value[index],
          ...propertyForm,
          updated_at: new Date().toISOString()
        }
      }
    }
    propertyModalOpen.value = false
  }
}

// Confirmer la suppression d'une propriété
const confirmDeleteProperty = () => {
  deleteConfirmationOpen.value = true
}

// Supprimer une propriété
const deleteProperty = async () => {
  if (!selectedProperty.value) return
  
  try {
    const { error } = await client
      .from('properties')
      .delete()
      .eq('id', selectedProperty.value.id)
    
    if (error) throw error
    
    // Supprimer la propriété de la liste
    properties.value = properties.value.filter(p => p.id !== selectedProperty.value.id)
    
    deleteConfirmationOpen.value = false
    detailModalOpen.value = false
  } catch (error) {
    console.error('Erreur lors de la suppression de la propriété:', error)
    // En mode démo, simuler la suppression
    properties.value = properties.value.filter(p => p.id !== selectedProperty.value.id)
    deleteConfirmationOpen.value = false
    detailModalOpen.value = false
  }
}

// Formater le prix
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price)
}

// Formater la date
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

// Charger les données au montage du composant
onMounted(() => {
  loadProperties()
})
</script>
