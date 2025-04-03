// Middleware pour vérifier si l'utilisateur est un administrateur
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()
  const client = useSupabaseClient()
  
  // Vérifier si l'utilisateur est connecté
  if (!user.value) {
    return navigateTo('/auth/login')
  }
  
  try {
    // Vérifier si l'utilisateur a le rôle d'administrateur
    const { data, error } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', user.value.id)
      .eq('role', 'admin')
      .maybeSingle()
    
    if (error || !data) {
      // L'utilisateur n'est pas administrateur, rediriger vers le dashboard
      return navigateTo('/dashboard')
    }
    
    // L'utilisateur est administrateur, autoriser l'accès
    return
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle d\'administrateur:', error)
    return navigateTo('/dashboard')
  }
})
