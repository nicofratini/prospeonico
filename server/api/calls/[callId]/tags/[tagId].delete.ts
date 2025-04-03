// API route pour supprimer un tag d'un appel
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

  // Récupérer l'ID de l'appel et l'ID du tag depuis les paramètres de l'URL
  const callId = event.context.params?.callId
  const tagId = event.context.params?.tagId
  
  if (!callId || !tagId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de l\'appel et ID du tag requis'
    })
  }

  try {
    const client = useSupabaseClient()
    
    // Vérifier que le tag existe et appartient à l'appel spécifié
    const { data: tagData, error: tagError } = await client
      .from('call_tags')
      .select('id, call_id, is_auto')
      .eq('id', tagId)
      .eq('call_id', callId)
      .single()
    
    if (tagError) {
      console.error('Erreur lors de la vérification du tag:', tagError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Tag non trouvé',
        data: tagError
      })
    }
    
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
    
    // Supprimer le tag
    const { error: deleteError } = await client
      .from('call_tags')
      .delete()
      .eq('id', tagId)
    
    if (deleteError) {
      console.error('Erreur lors de la suppression du tag:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression du tag',
        data: deleteError
      })
    }
    
    // Supprimer les événements de timeline associés à ce tag
    const { error: timelineError } = await client
      .from('call_timeline_events')
      .delete()
      .eq('call_id', callId)
      .eq('type', 'tag')
      .filter('content->tag_id', 'eq', tagId)
    
    if (timelineError) {
      console.error('Erreur lors de la suppression des événements de timeline:', timelineError)
      // Ne pas échouer la requête si la suppression des événements échoue
    }
    
    return {
      success: true,
      message: 'Tag supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du tag:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la suppression du tag',
      data: error
    })
  }
})
