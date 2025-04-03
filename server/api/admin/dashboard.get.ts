// API route pour récupérer les données du dashboard administrateur
import { defineEventHandler } from 'h3'
import { AdminMetrics, AgencyUsage, ApiUsageStats, RevenueStats } from '~/types/admin'

export default defineEventHandler(async (event) => {
  // Vérifier l'authentification
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  // Vérifier si l'utilisateur est administrateur
  const client = useSupabaseClient()
  const { data: roleData, error: roleError } = await client
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle()
  
  if (roleError || !roleData) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Accès non autorisé'
    })
  }

  try {
    // Récupérer les métriques globales
    const metrics = await getGlobalMetrics(client)
    
    // Récupérer les données d'utilisation des agences
    const agencies = await getAgenciesUsage(client)
    
    // Récupérer les statistiques d'utilisation API
    const apiUsage = await getApiUsageStats(client)
    
    // Récupérer les statistiques de revenus
    const revenue = await getRevenueStats(client)
    
    return {
      metrics,
      agencies,
      api_usage: apiUsage,
      revenue
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données du dashboard admin:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des données du dashboard admin',
      data: error
    })
  }
})

// Fonction pour récupérer les métriques globales
async function getGlobalMetrics(client: any): Promise<AdminMetrics> {
  // Nombre total d'agences
  const { count: totalAgencies, error: agenciesError } = await client
    .from('agencies')
    .select('*', { count: 'exact', head: true })
  
  if (agenciesError) {
    console.error('Erreur lors du comptage des agences:', agenciesError)
    throw agenciesError
  }
  
  // Nombre total d'utilisateurs
  const { count: totalUsers, error: usersError } = await client
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  if (usersError) {
    console.error('Erreur lors du comptage des utilisateurs:', usersError)
    throw usersError
  }
  
  // Nombre total de propriétés
  const { count: totalProperties, error: propertiesError } = await client
    .from('properties')
    .select('*', { count: 'exact', head: true })
  
  if (propertiesError) {
    console.error('Erreur lors du comptage des propriétés:', propertiesError)
    throw propertiesError
  }
  
  // Nombre total d'appels
  const { count: totalCalls, error: callsError } = await client
    .from('calls')
    .select('*', { count: 'exact', head: true })
  
  if (callsError) {
    console.error('Erreur lors du comptage des appels:', callsError)
    throw callsError
  }
  
  // Durée totale des appels (en minutes)
  const { data: callsData, error: callsDurationError } = await client
    .from('calls')
    .select('duration')
  
  if (callsDurationError) {
    console.error('Erreur lors de la récupération de la durée des appels:', callsDurationError)
    throw callsDurationError
  }
  
  const totalMinutes = callsData?.reduce((total, call) => total + Math.ceil((call.duration || 0) / 60), 0) || 0
  
  // Nombre d'abonnements actifs
  const { count: activeSubscriptions, error: subscriptionsError } = await client
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  
  if (subscriptionsError) {
    console.error('Erreur lors du comptage des abonnements actifs:', subscriptionsError)
    throw subscriptionsError
  }
  
  // Revenus mensuels et annuels
  const { data: subscriptionsData, error: subscriptionsDataError } = await client
    .from('subscriptions')
    .select('plan_id, interval')
    .eq('status', 'active')
  
  if (subscriptionsDataError) {
    console.error('Erreur lors de la récupération des abonnements:', subscriptionsDataError)
    throw subscriptionsDataError
  }
  
  let monthlyRevenue = 0
  let yearlyRevenue = 0
  
  subscriptionsData?.forEach(subscription => {
    if (subscription.plan_id.includes('basic')) {
      if (subscription.interval === 'month') {
        monthlyRevenue += 29
      } else {
        yearlyRevenue += 290
      }
    } else if (subscription.plan_id.includes('pro')) {
      if (subscription.interval === 'month') {
        monthlyRevenue += 99
      } else {
        yearlyRevenue += 990
      }
    } else if (subscription.plan_id.includes('enterprise')) {
      if (subscription.interval === 'month') {
        monthlyRevenue += 299
      } else {
        yearlyRevenue += 2990
      }
    }
  })
  
  return {
    total_agencies: totalAgencies || 0,
    total_users: totalUsers || 0,
    total_properties: totalProperties || 0,
    total_calls: totalCalls || 0,
    total_minutes: totalMinutes,
    active_subscriptions: activeSubscriptions || 0,
    revenue: {
      monthly: monthlyRevenue,
      yearly: yearlyRevenue,
      total: monthlyRevenue + yearlyRevenue
    }
  }
}

// Fonction pour récupérer les données d'utilisation des agences
async function getAgenciesUsage(client: any): Promise<AgencyUsage[]> {
  // Récupérer toutes les agences avec leurs propriétaires
  const { data: agenciesData, error: agenciesError } = await client
    .from('agencies')
    .select(`
      id,
      name,
      created_at,
      owner_id,
      profiles (
        email
      )
    `)
    .order('created_at', { ascending: false })
  
  if (agenciesError) {
    console.error('Erreur lors de la récupération des agences:', agenciesError)
    throw agenciesError
  }
  
  if (!agenciesData || agenciesData.length === 0) {
    return []
  }
  
  // Récupérer les abonnements actifs
  const { data: subscriptionsData, error: subscriptionsError } = await client
    .from('subscriptions')
    .select('*')
  
  if (subscriptionsError) {
    console.error('Erreur lors de la récupération des abonnements:', subscriptionsError)
    throw subscriptionsError
  }
  
  // Récupérer les quotas d'utilisation
  const { data: quotasData, error: quotasError } = await client
    .from('usage_quotas')
    .select('*')
  
  if (quotasError) {
    console.error('Erreur lors de la récupération des quotas d\'utilisation:', quotasError)
    throw quotasError
  }
  
  // Construire les données d'utilisation des agences
  const agenciesUsage: AgencyUsage[] = agenciesData.map(agency => {
    // Trouver l'abonnement de l'agence
    const subscription = subscriptionsData?.find(sub => sub.agency_id === agency.id) || null
    
    // Trouver les quotas d'utilisation de l'agence
    const quota = quotasData?.find(q => q.agency_id === agency.id) || null
    
    // Calculer le pourcentage d'utilisation
    let usagePercentage = 0
    if (quota) {
      const callsPercentage = quota.calls_limit > 0 ? Math.min(Math.round((quota.calls_used / quota.calls_limit) * 100), 100) : 0
      const minutesPercentage = quota.minutes_limit > 0 ? Math.min(Math.round((quota.minutes_used / quota.minutes_limit) * 100), 100) : 0
      usagePercentage = Math.max(callsPercentage, minutesPercentage)
    }
    
    return {
      agency_id: agency.id,
      agency_name: agency.name,
      owner_email: agency.profiles?.email || '',
      subscription_plan: subscription?.plan_id || 'none',
      subscription_status: subscription?.status || 'none',
      calls_used: quota?.calls_used || 0,
      calls_limit: quota?.calls_limit || 0,
      minutes_used: quota?.minutes_used || 0,
      minutes_limit: quota?.minutes_limit || 0,
      usage_percentage: usagePercentage,
      created_at: agency.created_at
    }
  })
  
  return agenciesUsage
}

// Fonction pour récupérer les statistiques d'utilisation API
async function getApiUsageStats(client: any): Promise<ApiUsageStats[]> {
  // Récupérer les appels des 30 derniers jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: callsData, error: callsError } = await client
    .from('calls')
    .select('id, created_at, duration, agency_id')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })
  
  if (callsError) {
    console.error('Erreur lors de la récupération des appels:', callsError)
    throw callsError
  }
  
  if (!callsData || callsData.length === 0) {
    return []
  }
  
  // Agréger les données d'appels par jour
  const statsByDay: Record<string, ApiUsageStats> = {}
  
  callsData.forEach(call => {
    const date = new Date(call.created_at).toISOString().split('T')[0]
    const minutes = Math.ceil((call.duration || 0) / 60) // Convertir les secondes en minutes (arrondi au supérieur)
    
    if (!statsByDay[date]) {
      statsByDay[date] = {
        date,
        calls: 0,
        minutes: 0,
        unique_agencies: new Set()
      } as any
    }
    
    statsByDay[date].calls += 1
    statsByDay[date].minutes += minutes
    statsByDay[date].unique_agencies.add(call.agency_id)
  })
  
  // Convertir l'objet en tableau et calculer le nombre d'agences uniques
  const apiUsageStats: ApiUsageStats[] = Object.values(statsByDay).map(stat => ({
    date: stat.date,
    calls: stat.calls,
    minutes: stat.minutes,
    unique_agencies: (stat.unique_agencies as Set<string>).size
  }))
  
  return apiUsageStats
}

// Fonction pour récupérer les statistiques de revenus
async function getRevenueStats(client: any): Promise<RevenueStats[]> {
  // Récupérer les abonnements des 12 derniers mois
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  
  const { data: subscriptionsData, error: subscriptionsError } = await client
    .from('subscriptions')
    .select('*')
    .gte('created_at', twelveMonthsAgo.toISOString())
    .order('created_at', { ascending: true })
  
  if (subscriptionsError) {
    console.error('Erreur lors de la récupération des abonnements:', subscriptionsError)
    throw subscriptionsError
  }
  
  if (!subscriptionsData || subscriptionsData.length === 0) {
    return []
  }
  
  // Agréger les données d'abonnements par mois
  const statsByMonth: Record<string, RevenueStats> = {}
  
  // Initialiser les 12 derniers mois
  for (let i = 0; i < 12; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    statsByMonth[monthKey] = {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`,
      monthly_revenue: 0,
      yearly_revenue: 0,
      total_revenue: 0,
      new_subscriptions: 0,
      canceled_subscriptions: 0
    }
  }
  
  subscriptionsData.forEach(subscription => {
    const date = new Date(subscription.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!statsByMonth[monthKey]) {
      return // Ignorer les mois en dehors de notre plage
    }
    
    // Compter les nouveaux abonnements
    statsByMonth[monthKey].new_subscriptions += 1
    
    // Calculer les revenus en fonction du plan
    let monthlyRevenue = 0
    let yearlyRevenue = 0
    
    if (subscription.plan_id.includes('basic')) {
      if (subscription.interval === 'month') {
        monthlyRevenue = 29
      } else {
        yearlyRevenue = 290
      }
    } else if (subscription.plan_id.includes('pro')) {
      if (subscription.interval === 'month') {
        monthlyRevenue = 99
      } else {
        yearlyRevenue = 990
      }
    } else if (subscription.plan_id.includes('enterprise')) {
      if (subscription.interval === 'month') {
        monthlyRevenue = 299
      } else {
        yearlyRevenue = 2990
      }
    }
    
    statsByMonth[monthKey].monthly_revenue += monthlyRevenue
    statsByMonth[monthKey].yearly_revenue += yearlyRevenue
    statsByMonth[monthKey].total_revenue += monthlyRevenue + yearlyRevenue
    
    // Compter les abonnements annulés
    if (subscription.status === 'canceled') {
      const cancelDate = new Date(subscription.updated_at)
      const cancelMonthKey = `${cancelDate.getFullYear()}-${String(cancelDate.getMonth() + 1).padStart(2, '0')}`
      
      if (statsByMonth[cancelMonthKey]) {
        statsByMonth[cancelMonthKey].canceled_subscriptions += 1
      }
    }
  })
  
  // Convertir l'objet en tableau
  const revenueStats: RevenueStats[] = Object.values(statsByMonth).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  
  return revenueStats
}
