<template>
  <div>
    <!-- Barre latérale -->
    <div class="fixed inset-y-0 left-0 bg-indigo-700 w-64 overflow-y-auto transition duration-300 transform lg:translate-x-0 lg:static lg:inset-0 z-40" :class="{ '-translate-x-full': !sidebarOpen }">
      <div class="flex items-center justify-center mt-8">
        <div class="flex items-center">
          <span class="text-white text-2xl mx-2 font-semibold">Prospeo</span>
        </div>
      </div>
      
      <nav class="mt-10">
        <NuxtLink to="/dashboard" class="flex items-center mt-4 py-2 px-6 text-gray-100 hover:bg-indigo-600 hover:bg-opacity-25 hover:text-gray-100" :class="{ 'bg-indigo-600 bg-opacity-25': route.path === '/dashboard' }">
          <HomeIcon class="h-6 w-6" />
          <span class="mx-3">{{ $t('navigation.dashboard') }}</span>
        </NuxtLink>
        
        <NuxtLink to="/dashboard/call-history" class="flex items-center mt-4 py-2 px-6 text-gray-100 hover:bg-indigo-600 hover:bg-opacity-25 hover:text-gray-100" :class="{ 'bg-indigo-600 bg-opacity-25': route.path.includes('/call-history') }">
          <PhoneIcon class="h-6 w-6" />
          <span class="mx-3">{{ $t('navigation.call_history') }}</span>
        </NuxtLink>
        
        <NuxtLink to="/dashboard/properties" class="flex items-center mt-4 py-2 px-6 text-gray-100 hover:bg-indigo-600 hover:bg-opacity-25 hover:text-gray-100" :class="{ 'bg-indigo-600 bg-opacity-25': route.path.includes('/properties') }">
          <HomeIcon class="h-6 w-6" />
          <span class="mx-3">{{ $t('navigation.properties') }}</span>
        </NuxtLink>
        
        <NuxtLink to="/dashboard/ai-agent" class="flex items-center mt-4 py-2 px-6 text-gray-100 hover:bg-indigo-600 hover:bg-opacity-25 hover:text-gray-100" :class="{ 'bg-indigo-600 bg-opacity-25': route.path.includes('/ai-agent') }">
          <UserGroupIcon class="h-6 w-6" />
          <span class="mx-3">{{ $t('navigation.ai_agents') }}</span>
        </NuxtLink>
        
        <NuxtLink to="/dashboard/settings" class="flex items-center mt-4 py-2 px-6 text-gray-100 hover:bg-indigo-600 hover:bg-opacity-25 hover:text-gray-100" :class="{ 'bg-indigo-600 bg-opacity-25': route.path.includes('/settings') }">
          <CogIcon class="h-6 w-6" />
          <span class="mx-3">{{ $t('navigation.settings') }}</span>
        </NuxtLink>
      </nav>
      
      <div class="absolute bottom-0 w-full">
        <button @click="handleLogout" class="flex items-center py-4 px-6 text-gray-100 hover:bg-indigo-600 hover:bg-opacity-25 hover:text-gray-100 w-full">
          <LogoutIcon class="h-6 w-6" />
          <span class="mx-3">{{ $t('navigation.logout') }}</span>
        </button>
      </div>
    </div>
    
    <!-- Contenu principal -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- En-tête -->
      <header class="flex justify-between items-center py-4 px-6 bg-white border-b-4 border-indigo-600">
        <div class="flex items-center">
          <button @click="sidebarOpen = !sidebarOpen" class="text-gray-500 focus:outline-none lg:hidden">
            <MenuIcon v-if="!sidebarOpen" class="h-6 w-6" />
            <XIcon v-else class="h-6 w-6" />
          </button>
        </div>
        
        <div class="flex items-center">
          <div class="relative">
            <button @click="userMenuOpen = !userMenuOpen" class="flex items-center space-x-2 text-sm focus:outline-none">
              <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
              <span>{{ user?.user_metadata?.full_name || user?.email }}</span>
              <ChevronDownIcon class="h-5 w-5 text-gray-400" />
            </button>
            
            <div v-if="userMenuOpen" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" @click.prevent="handleLogout">{{ $t('common.logout') }}</a>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Contenu de la page -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div class="container mx-auto px-6 py-8">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  HomeIcon, 
  PhoneIcon, 
  UserGroupIcon, 
  CogIcon, 
  MenuIcon, 
  XIcon,
  ChevronDownIcon,
  LogoutIcon
} from '@heroicons/vue/24/outline'

const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(false)
const userMenuOpen = ref(false)

// Fermer le menu utilisateur lorsqu'on clique ailleurs
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (userMenuOpen.value) userMenuOpen.value = false
  })
})

// Déconnexion
const handleLogout = async () => {
  try {
    await client.auth.signOut()
    router.push('/auth/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}
</script>
