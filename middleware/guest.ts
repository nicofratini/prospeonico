// Middleware pour les utilisateurs non authentifiés
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser()
  
  // Si l'utilisateur est déjà connecté et tente d'accéder à une page d'authentification
  if (user.value && to.path.startsWith('/auth')) {
    return navigateTo('/dashboard')
  }
})
