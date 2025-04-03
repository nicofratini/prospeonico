<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-medium text-gray-900">{{ $t('call_analysis.tag_manager') }}</h3>
      <button 
        @click="showAddTagForm = !showAddTagForm"
        class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <PlusIcon v-if="!showAddTagForm" class="-ml-1 mr-1 h-4 w-4" />
        <XMarkIcon v-else class="-ml-1 mr-1 h-4 w-4" />
        {{ showAddTagForm ? $t('common.cancel') : $t('call_analysis.add_tag') }}
      </button>
    </div>
    
    <!-- Formulaire d'ajout de tag -->
    <div v-if="showAddTagForm" class="mb-6 p-4 bg-gray-50 rounded-md">
      <form @submit.prevent="addTag">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="sm:col-span-2">
            <label for="tag-name" class="block text-sm font-medium text-gray-700">{{ $t('call_analysis.tag_name') }}</label>
            <div class="mt-1">
              <input 
                id="tag-name" 
                v-model="newTag.name" 
                type="text" 
                required
                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                :placeholder="$t('call_analysis.tag_name_placeholder')"
              />
            </div>
          </div>
          <div>
            <label for="tag-color" class="block text-sm font-medium text-gray-700">{{ $t('call_analysis.tag_color') }}</label>
            <div class="mt-1 flex items-center space-x-2">
              <div 
                v-for="color in availableColors" 
                :key="color"
                :class="[
                  'w-6 h-6 rounded-full cursor-pointer border',
                  newTag.color === color ? 'ring-2 ring-offset-2 ring-indigo-500' : 'hover:opacity-80'
                ]"
                :style="{ backgroundColor: color }"
                @click="newTag.color = color"
              ></div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button 
            type="submit"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="!newTag.name || !newTag.color || loading"
          >
            <span v-if="loading" class="mr-2">
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ $t('call_analysis.save_tag') }}
          </button>
        </div>
      </form>
    </div>
    
    <!-- Liste des tags -->
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
    
    <div v-else-if="tags.length === 0" class="text-center py-6">
      <TagIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('call_analysis.no_tags') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ $t('call_analysis.no_tags_description') }}</p>
    </div>
    
    <div v-else>
      <div class="flex flex-wrap gap-2">
        <div 
          v-for="tag in tags" 
          :key="tag.id"
          class="inline-flex items-center group px-3 py-1.5 rounded-full text-sm font-medium"
          :style="{ backgroundColor: tag.color + '20', color: tag.color }"
        >
          <span>{{ tag.name }}</span>
          <button 
            v-if="!tag.is_auto"
            @click="removeTag(tag.id)"
            class="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span class="sr-only">{{ $t('common.remove') }}</span>
            <XMarkIcon class="h-3 w-3" />
          </button>
          <span 
            v-else
            class="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            {{ $t('call_analysis.auto') }}
          </span>
        </div>
      </div>
      
      <!-- Tags suggérés -->
      <div v-if="suggestedTags.length > 0" class="mt-6">
        <h4 class="text-sm font-medium text-gray-700 mb-2">{{ $t('call_analysis.suggested_tags') }}</h4>
        <div class="flex flex-wrap gap-2">
          <div 
            v-for="tag in suggestedTags" 
            :key="tag.name"
            class="inline-flex items-center group px-3 py-1.5 rounded-full text-sm font-medium border border-dashed"
            :style="{ borderColor: tag.color, color: tag.color }"
          >
            <span>{{ tag.name }}</span>
            <button 
              @click="addSuggestedTag(tag)"
              class="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span class="sr-only">{{ $t('common.add') }}</span>
              <PlusIcon class="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { TagIcon, PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { CallTag, TagColors } from '~/types/call-analysis'

const props = defineProps<{
  callId: string
  suggestedTags?: CallTag[]
}>()

const emit = defineEmits<{
  (e: 'update:tags', tags: CallTag[]): void
  (e: 'add', tag: CallTag): void
  (e: 'remove', tagId: string): void
}>()

// État local
const tags = ref<CallTag[]>([])
const loading = ref(true)
const showAddTagForm = ref(false)
const newTag = ref<{ name: string; color: string }>({
  name: '',
  color: TagColors[0]
})

// Couleurs disponibles pour les tags
const availableColors = TagColors

// Charger les tags
const loadTags = async () => {
  loading.value = true
  
  try {
    const client = useSupabaseClient()
    const { data, error } = await client
      .from('call_tags')
      .select('*')
      .eq('call_id', props.callId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    tags.value = data || []
    emit('update:tags', tags.value)
  } catch (error) {
    console.error('Erreur lors du chargement des tags:', error)
  } finally {
    loading.value = false
  }
}

// Ajouter un tag
const addTag = async () => {
  if (!newTag.value.name || !newTag.value.color) return
  
  loading.value = true
  
  try {
    const client = useSupabaseClient()
    const { data, error } = await client
      .from('call_tags')
      .insert({
        call_id: props.callId,
        name: newTag.value.name,
        color: newTag.value.color,
        is_auto: false,
        created_by: useSupabaseUser().value?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Ajouter le tag à la liste
    tags.value.unshift(data)
    emit('update:tags', tags.value)
    emit('add', data)
    
    // Réinitialiser le formulaire
    newTag.value = { name: '', color: TagColors[0] }
    showAddTagForm.value = false
  } catch (error) {
    console.error('Erreur lors de l\'ajout du tag:', error)
  } finally {
    loading.value = false
  }
}

// Ajouter un tag suggéré
const addSuggestedTag = async (tag: CallTag) => {
  loading.value = true
  
  try {
    const client = useSupabaseClient()
    const { data, error } = await client
      .from('call_tags')
      .upsert({
        call_id: props.callId,
        name: tag.name,
        color: tag.color,
        is_auto: false,
        created_by: useSupabaseUser().value?.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Mettre à jour la liste des tags
    await loadTags()
    emit('add', data)
  } catch (error) {
    console.error('Erreur lors de l\'ajout du tag suggéré:', error)
  } finally {
    loading.value = false
  }
}

// Supprimer un tag
const removeTag = async (tagId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) return
  
  loading.value = true
  
  try {
    const client = useSupabaseClient()
    const { error } = await client
      .from('call_tags')
      .delete()
      .eq('id', tagId)
    
    if (error) throw error
    
    // Supprimer le tag de la liste
    tags.value = tags.value.filter(tag => tag.id !== tagId)
    emit('update:tags', tags.value)
    emit('remove', tagId)
  } catch (error) {
    console.error('Erreur lors de la suppression du tag:', error)
  } finally {
    loading.value = false
  }
}

// Initialiser le composant
onMounted(() => {
  loadTags()
})
</script>
