// API route pour récupérer les données d'utilisation d'une agence
import { defineEventHandler } from 'h3'
import { UsageQuota, StripeSubscription } from '~/types/stripe'

export default defineEventHandler(async (event) => {
  // Vérifier l'authentification
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  // Récupérer l'ID de l'agence depuis les paramètres de la requête
  const query = getQuery(event)
  const agencyId = query.agency_id as string
  
  if (!agencyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de l\'agence requis'
    })
  }

  try {
    const client = useSupabaseClient()
    
    // Vérifier que l'utilisateur a accès à cette agence
    const { data: agencyData, error: agencyError } = await client
      .from('agencies')
      .select('id, owner_id')
      .eq('id', agencyId)
      .single()
    
    if (agencyError) {
      console.error('Erreur lors de la vérification de l\'accès à l\'agence:', agencyError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Agence non trouvée',
        data: agencyError
      })
    }
    
    // Vérifier si l'utilisateur est le propriétaire de l'agence ou un membre
    if (agencyData.owner_id !== user.id) {
      const { data: memberData, error: memberError } = await client
        .from('agency_members')
        .select('id')
        .eq('agency_id', agencyData.id)
        .eq('user_id', user.id)
        .single()
      
      if (memberError || !memberData) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Accès non autorisé à cette agence'
        })
      }
    }
    
    // Récupérer l'abonnement actif de l'agence
    const { data: subscriptionData, error: subscriptionError } = await client
      .from('subscriptions')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('status', 'active')
      .single()
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      // PGRST116 = not found, ce qui est normal si l'agence n'a pas d'abonnement actif
      console.error('Erreur lors de la récupération de l\'abonnement:', subscriptionError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération de l\'abonnement',
        data: subscriptionError
      })
    }
    
    // Si l'agence n'a pas d'abonnement actif, retourner des données vides
    if (!subscriptionData) {
      return {
        quota: null,
        subscription: null,
        history: []
      }
    }
    
    // Récupérer les quotas d'utilisation de l'agence
    const { data: quotaData, error: quotaError } = await client
      .from('usage_quotas')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('subscription_id', subscriptionData.id)
      .single()
    
    if (quotaError && quotaError.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération des quotas d\'utilisation:', quotaError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des quotas d\'utilisation',
        data: quotaError
      })
    }
    
    // Récupérer l'historique d'utilisation (derniers 30 jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Récupérer les appels des 30 derniers jours
    const { data: callsData, error: callsError } = await client
      .from('calls')
      .select('id, created_at, duration')
      .eq('agency_id', agencyId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })
    
    if (callsError) {
      console.error('Erreur lors de la récupération des appels:', callsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des appels',
        data: callsError
      })
    }
    
    // Agréger les données d'appels par jour
    const usageByDay: Record<string, { date: string, calls_used: number, minutes_used: number }> = {}
    
    callsData?.forEach(call => {
      const date = new Date(call.created_at).toISOString().split('T')[0]
      const minutes = Math.ceil((call.duration || 0) / 60) // Convertir les secondes en minutes (arrondi au supérieur)
      
      if (!usageByDay[date]) {
        usageByDay[date] = {
          date,
          calls_used: 0,
          minutes_used: 0
        }
      }
      
      usageByDay[date].calls_used += 1
      usageByDay[date].minutes_used += minutes
    })
    
    // Convertir l'objet en tableau
    const usageHistory = Object.values(usageByDay)
    
    // Si aucun quota n'existe encore, créer des quotas par défaut basés sur le plan
    let quota: UsageQuota | null = quotaData
    
    if (!quota) {
      // Déterminer les limites en fonction du plan
      let callsLimit = 50 // Valeurs par défaut pour le plan Basic
      let minutesLimit = 30
      
      if (subscriptionData.plan_id.includes('pro')) {
        callsLimit = 200
        minutesLimit = 120
      } else if (subscriptionData.plan_id.includes('enterprise')) {
        callsLimit = 999999 // Illimité
        minutesLimit = 999999 // Illimité
      }
      
      // Calculer la date de réinitialisation (fin de la période en cours)
      const resetDate = new Date(subscriptionData.current_period_end)
      
      // Calculer l'utilisation actuelle
      const callsUsed = callsData?.length || 0
      const minutesUsed = callsData?.reduce((total, call) => total + Math.ceil((call.duration || 0) / 60), 0) || 0
      
      // Créer un objet quota temporaire
      quota = {
        plan_id: subscriptionData.plan_id,
        calls_limit: callsLimit,
        calls_used: callsUsed,
        minutes_limit: minutesLimit,
        minutes_used: minutesUsed,
        reset_date: resetDate.toISOString()
      }
      
      // Enregistrer ces quotas dans la base de données
      const { error: insertError } = await client
        .from('usage_quotas')
        .insert({
          agency_id: agencyId,
          subscription_id: subscriptionData.id,
          calls_limit: callsLimit,
          calls_used: callsUsed,
          minutes_limit: minutesLimit,
          minutes_used: minutesUsed,
          reset_date: resetDate.toISOString()
        })
      
      if (insertError) {
        console.error('Erreur lors de la création des quotas:', insertError)
        // Ne pas échouer la requête si l'enregistrement échoue
      }
    }
    
    return {
      quota,
      subscription: subscriptionData,
      history: usageHistory
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données d\'utilisation:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des données d\'utilisation',
      data: error
    })
  }
})
