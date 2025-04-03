<template>
  <div>
    <OnboardingLayout
      :current-step="2"
      :total-steps="4"
      :can-continue="isFormValid"
      :can-skip="true"
      @previous="goToPrevious"
      @next="saveAndContinue"
      @skip="skipStep"
    >
      <div class="space-y-8">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900">{{ $t('onboarding.property_title') }}</h2>
          <p class="mt-2 text-gray-600">{{ $t('onboarding.property_description') }}</p>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <InformationCircleIcon class="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">
                {{ $t('onboarding.property_tip') }}
              </p>
            </div>
          </div>
        </div>
        
        <div class="flex justify-center mb-6">
          <div class="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              @click="activeTab = 'manual'"
              :class="[
                activeTab === 'manual' 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50',
                'px-4 py-2 text-sm font-medium rounded-l-md border border-gray-300 focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              ]"
            >
              {{ $t('onboarding.add_manually') }}
            </button>
            <button
              type="button"
              @click="activeTab = 'import'"
              :class="[
                activeTab === 'import' 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50',
                'px-4 py-2 text-sm font-medium rounded-r-md border border-gray-300 focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              ]"
            >
              {{ $t('onboarding.import_csv') }}
            </button>
          </div>
        </div>
        
        <!-- Formulaire manuel -->
        <form v-if="activeTab === 'manual'" @submit.prevent="saveAndContinue" class="space-y-6">
          <!-- Titre de la propriété -->
          <div>
            <label for="property-title" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.property_title_field') }} *
            </label>
            <div class="mt-1">
              <input
                id="property-title"
                v-model="propertyTitle"
                type="text"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <!-- Type de propriété -->
          <div>
            <label for="property-type" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.property_type') }} *
            </label>
            <div class="mt-1">
              <select
                id="property-type"
                v-model="propertyType"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">{{ $t('onboarding.select_type') }}</option>
                <option value="apartment">{{ $t('onboarding.apartment') }}</option>
                <option value="house">{{ $t('onboarding.house') }}</option>
                <option value="villa">{{ $t('onboarding.villa') }}</option>
                <option value="land">{{ $t('onboarding.land') }}</option>
                <option value="commercial">{{ $t('onboarding.commercial') }}</option>
              </select>
            </div>
          </div>
          
          <!-- Surface et prix -->
          <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label for="property-surface" class="block text-sm font-medium text-gray-700">
                {{ $t('onboarding.property_surface') }} *
              </label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <input
                  id="property-surface"
                  v-model="propertySurface"
                  type="number"
                  min="1"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 sm:text-sm">m²</span>
                </div>
              </div>
            </div>
            
            <div>
              <label for="property-price" class="block text-sm font-medium text-gray-700">
                {{ $t('onboarding.property_price') }} *
              </label>
              <div class="mt-1 relative rounded-md shadow-sm">
                <input
                  id="property-price"
                  v-model="propertyPrice"
                  type="number"
                  min="0"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 sm:text-sm">€</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Adresse de la propriété -->
          <div>
            <label for="property-address" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.property_address') }} *
            </label>
            <div class="mt-1">
              <textarea
                id="property-address"
                v-model="propertyAddress"
                rows="3"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
          
          <!-- Photo principale -->
          <div>
            <label for="property-photo" class="block text-sm font-medium text-gray-700">
              {{ $t('onboarding.property_photo') }}
            </label>
            <div class="mt-1 flex items-center space-x-4">
              <div v-if="photoPreview" class="flex-shrink-0 h-24 w-32 rounded-md overflow-hidden bg-gray-100">
                <img :src="photoPreview" alt="Property photo preview" class="h-full w-full object-cover" />
              </div>
              <div v-else class="flex-shrink-0 h-24 w-32 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <PhotographIcon class="h-8 w-8 text-gray-300" />
              </div>
              <div>
                <input
                  id="property-photo"
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  ref="photoInput"
                  @change="handlePhotoUpload"
                />
                <button
                  type="button"
                  @click="$refs.photoInput.click()"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {{ $t('onboarding.upload_photo') }}
                </button>
              </div>
            </div>
          </div>
        </form>
        
        <!-- Import CSV -->
        <div v-if="activeTab === 'import'" class="space-y-6">
          <div class="bg-white p-6 border border-gray-300 rounded-md">
            <div class="flex flex-col items-center justify-center space-y-4">
              <DocumentIcon class="h-12 w-12 text-gray-400" />
              <div class="text-center">
                <h3 class="text-lg font-medium text-gray-900">{{ $t('onboarding.import_csv_title') }}</h3>
                <p class="mt-1 text-sm text-gray-500">{{ $t('onboarding.import_csv_description') }}</p>
              </div>
              
              <div class="mt-2">
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  class="sr-only"
                  ref="csvInput"
                  @change="handleCsvUpload"
                />
                <button
                  type="button"
                  @click="$refs.csvInput.click()"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {{ $t('onboarding.select_csv_file') }}
                </button>
              </div>
              
              <div v-if="csvFile" class="flex items-center space-x-2 text-sm text-gray-600">
                <DocumentTextIcon class="h-5 w-5 text-gray-400" />
                <span>{{ csvFile.name }}</span>
              </div>
            </div>
            
            <div v-if="csvFile" class="mt-6">
              <div class="flex justify-center">
                <button
                  type="button"
                  @click="importCsv"
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {{ $t('onboarding.import_properties') }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-md">
            <h4 class="text-sm font-medium text-gray-900">{{ $t('onboarding.csv_format') }}</h4>
            <p class="mt-1 text-xs text-gray-500">{{ $t('onboarding.csv_format_description') }}</p>
            <div class="mt-2 overflow-x-auto">
              <pre class="text-xs text-gray-600 bg-gray-100 p-2 rounded">title,type,surface,price,address,description
Appartement T3 Centre Ville,apartment,75,250000,"123 Rue de la République, 75001 Paris","Bel appartement lumineux..."
Maison 5 pièces avec jardin,house,120,350000,"45 Avenue des Fleurs, 69000 Lyon","Grande maison familiale..."</pre>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { InformationCircleIcon, PhotographIcon, DocumentIcon, DocumentTextIcon } from '@heroicons/vue/24/solid'
import { useRouter } from '#app'
import { useOnboardingStore } from '~/stores/onboarding'
import OnboardingLayout from '~/layouts/onboarding.vue'

definePageMeta({
  middleware: ['auth']
})

const router = useRouter()
const onboardingStore = useOnboardingStore()
const supabase = useSupabaseClient()

// Onglet actif
const activeTab = ref('manual')

// Données du formulaire manuel
const propertyTitle = ref('')
const propertyType = ref('')
const propertySurface = ref<number | null>(null)
const propertyPrice = ref<number | null>(null)
const propertyAddress = ref('')
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)

// Données pour l'import CSV
const csvFile = ref<File | null>(null)
const csvInput = ref<HTMLInputElement | null>(null)

// Validation du formulaire
const isFormValid = computed(() => {
  if (activeTab.value === 'manual') {
    return !!propertyTitle.value.trim() && 
           !!propertyType.value && 
           !!propertySurface.value && 
           !!propertyPrice.value && 
           !!propertyAddress.value.trim()
  } else {
    return !!csvFile.value
  }
})

// Gestion de la photo
const handlePhotoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    photoFile.value = input.files[0]
    
    // Créer un aperçu de la photo
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(photoFile.value)
  }
}

// Gestion du fichier CSV
const handleCsvUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    csvFile.value = input.files[0]
  }
}

// Téléchargement de la photo vers Supabase Storage
const uploadPhoto = async (): Promise<string | null> => {
  if (!photoFile.value) return null
  
  const user = useSupabaseUser()
  if (!user.value) return null
  
  const fileExt = photoFile.value.name.split('.').pop()
  const fileName = `${user.value.id}-${Date.now()}.${fileExt}`
  const filePath = `property-photos/${fileName}`
  
  try {
    const { data, error } = await supabase.storage
      .from('property-assets')
      .upload(filePath, photoFile.value, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) throw error
    
    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('property-assets')
      .getPublicUrl(filePath)
    
    return publicUrl
  } catch (error) {
    console.error('Erreur lors du téléchargement de la photo:', error)
    return null
  }
}

// Sauvegarder la propriété
const saveProperty = async () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  
  if (!user.value) return
  
  let photoUrl = null
  
  if (photoFile.value) {
    photoUrl = await uploadPhoto()
  }
  
  try {
    const { data, error } = await client
      .from('properties')
      .insert({
        user_id: user.value.id,
        title: propertyTitle.value,
        type: propertyType.value,
        surface: propertySurface.value,
        price: propertyPrice.value,
        address: propertyAddress.value,
        main_photo: photoUrl
      })
      .select()
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la propriété:', error)
    return null
  }
}

// Importer les propriétés depuis un CSV
const importCsv = async () => {
  if (!csvFile.value) return
  
  try {
    // Simuler l'importation pour l'onboarding
    // Dans une implémentation réelle, nous analyserions le CSV et importerions les propriétés
    
    // Passer à l'étape suivante après l'importation
    await onboardingStore.saveProgress(3)
  } catch (error) {
    console.error('Erreur lors de l\'importation du CSV:', error)
  }
}

// Sauvegarder et continuer
const saveAndContinue = async () => {
  if (activeTab.value === 'manual') {
    await saveProperty()
  } else {
    await importCsv()
  }
  
  // Passer à l'étape suivante
  await onboardingStore.saveProgress(3)
}

// Revenir à l'étape précédente
const goToPrevious = () => {
  router.push('/onboarding/welcome')
}

// Ignorer cette étape
const skipStep = async () => {
  await onboardingStore.skipStep(2)
}

// Initialisation
onMounted(async () => {
  await onboardingStore.fetchProgress()
})
</script>
