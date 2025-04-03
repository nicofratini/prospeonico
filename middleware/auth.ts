// Middleware d'authentification
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser()
  
  // Si l'utilisateur n'est pas connecté et tente d'accéder à une page protégée
  if (!user.value && to.path.startsWith('/dashboard')) {
    return navigateTo('/auth/login')
  }
})
