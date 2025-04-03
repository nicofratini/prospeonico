// API route pour ajouter un tag à un appel
import { defineEventHandler } from 'h3'
import { CallTag } from '~/types/call-analysis'

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
  if (!body.name || !body.color) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nom et couleur du tag requis'
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
    
    // Créer le tag
    const { data: tag, error: tagError } = await client
      .from('call_tags')
      .upsert({
        call_id: callId,
        name: body.name,
        color: body.color,
        is_auto: body.is_auto || false,
        created_by: user.id
      })
      .select()
      .single()
    
    if (tagError) {
      console.error('Erreur lors de la création du tag:', tagError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la création du tag',
        data: tagError
      })
    }
    
    // Créer un événement de timeline pour ce tag
    const { error: timelineError } = await client
      .from('call_timeline_events')
      .insert({
        call_id: callId,
        type: 'tag',
        timestamp: new Date().toISOString(),
        content: {
          tag_id: tag.id,
          tag_name: tag.name,
          tag_color: tag.color
        },
        importance: body.importance || 'medium'
      })
    
    if (timelineError) {
      console.error('Erreur lors de la création de l\'événement de timeline:', timelineError)
      // Ne pas échouer la requête si la création de l'événement échoue
    }
    
    return {
      success: true,
      tag
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout du tag:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de l\'ajout du tag',
      data: error
    })
  }
})
