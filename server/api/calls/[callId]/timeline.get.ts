// API route pour récupérer la timeline d'un appel
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

  // Récupérer l'ID de l'appel depuis les paramètres de l'URL
  const callId = event.context.params?.callId
  if (!callId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de l\'appel requis'
    })
  }

  try {
    const client = useSupabaseClient()
    
    // Vérifier que l'utilisateur a accès à cet appel
    const { data: callData, error: callError } = await client
      .from('calls')
      .select('id, agency_id')
      .eq('id', callId)
      .single()
    
    if (callError) {
      console.error('Erreur lors de la vérification de l\'accès à l\'appel:', callError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Appel non trouvé',
        data: callError
      })
    }
    
    // Vérifier que l'utilisateur appartient à l'agence associée à l'appel
    const { data: agencyData, error: agencyError } = await client
      .from('agencies')
      .select('id, owner_id')
      .eq('id', callData.agency_id)
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
          statusMessage: 'Accès non autorisé à cet appel'
        })
      }
    }
    
    // Récupérer les événements de timeline de l'appel
    const { data: events, error: eventsError } = await client
      .from('call_timeline_events')
      .select('*')
      .eq('call_id', callId)
      .order('timestamp', { ascending: false })
    
    if (eventsError) {
      console.error('Erreur lors de la récupération des événements de timeline:', eventsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des événements de timeline',
        data: eventsError
      })
    }
    
    return {
      call_id: callId,
      events: events || []
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la timeline:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération de la timeline',
      data: error
    })
  }
})
