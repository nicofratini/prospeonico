// API route pour ajouter un événement à la timeline d'un appel
import { defineEventHandler } from 'h3'
import { CallTimelineEvent } from '~/types/call-analysis'

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

  // Récupérer les données du corps de la requête
  const body = await readBody(event)
  
  // Valider les champs requis
  if (!body.type || !body.content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Type et contenu de l\'événement requis'
    })
  }

  // Valider le type d'événement
  if (!['insight', 'tag', 'note', 'follow_up'].includes(body.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Type d\'événement invalide'
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
    
    // Créer l'événement de timeline
    const { data: timelineEvent, error: timelineError } = await client
      .from('call_timeline_events')
      .insert({
        call_id: callId,
        type: body.type,
        timestamp: new Date().toISOString(),
        content: body.content,
        importance: body.importance || 'medium'
      })
      .select()
      .single()
    
    if (timelineError) {
      console.error('Erreur lors de la création de l\'événement de timeline:', timelineError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la création de l\'événement de timeline',
        data: timelineError
      })
    }
    
    return {
      success: true,
      event: timelineEvent
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'événement de timeline:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de l\'ajout de l\'événement de timeline',
      data: error
    })
  }
})
