// API route pour récupérer les appels
import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  // Vérifier l'authentification
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  // Récupérer les paramètres de requête
  const query = getQuery(event)
  const limit = query.limit ? parseInt(query.limit as string) : 10
  const offset = query.offset ? parseInt(query.offset as string) : 0
  const sortBy = query.sort_by as string || 'created_at'
  const sortOrder = query.sort_order as string || 'desc'

  try {
    // Récupérer les données de l'agence de l'utilisateur
    const client = useSupabaseClient()
    const { data: agencyData, error: agencyError } = await client
      .from('agencies')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (agencyError) {
      console.error('Erreur lors de la récupération de l\'agence:', agencyError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération de l\'agence',
        data: agencyError
      })
    }

    // Récupérer les appels
    const { data: calls, error: callsError, count } = await client
      .from('calls')
      .select('*', { count: 'exact' })
      .eq('agency_id', agencyData.id)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    if (callsError) {
      console.error('Erreur lors de la récupération des appels:', callsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des appels',
        data: callsError
      })
    }

    return {
      calls,
      total: count,
      limit,
      offset
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des appels:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des appels',
      data: error
    })
  }
})
