// Vérification de la page de paramétrage des agents
// Ajout de la définition de la page meta pour utiliser le layout dashboard

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})
