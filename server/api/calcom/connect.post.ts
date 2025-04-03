// API route pour connecter un compte Cal.com
import { defineEventHandler } from 'h3'
import { ConnectCalComRequest, ConnectCalComResponse } from '~/types/calcom'
import { useCalComClient } from '~/utils/calcomClient'

export default defineEventHandler(async (event) => {
  // Vérifier l'authentification
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  // Récupérer les données du corps de la requête
  const body = await readBody(event) as ConnectCalComRequest
  
  // Valider la clé API
  if (!body.api_key) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Clé API Cal.com requise'
    })
  }

  try {
    // Créer un client Cal.com temporaire avec la clé API fournie
    const tempClient = new CalComClient(body.api_key)
    
    // Valider la clé API en essayant de récupérer les types d'événements
    const isValid = await tempClient.validateApiKey()
    
    if (!isValid) {
      return {
        success: false,
        message: 'Clé API Cal.com invalide'
      } as ConnectCalComResponse
    }
    
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
    
    // Vérifier si une connexion existe déjà
    const { data: existingConnection, error: connectionError } = await client
      .from('calcom_connections')
      .select('id, status')
      .eq('agency_id', agencyData.id)
      .maybeSingle()
    
    if (connectionError) {
      console.error('Erreur lors de la vérification de la connexion existante:', connectionError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la vérification de la connexion existante',
        data: connectionError
      })
    }
    
    let connectionId
    let connectionStatus = 'active'
    
    // Mettre à jour ou créer la connexion
    if (existingConnection) {
      // Mettre à jour la connexion existante
      const { data: updatedConnection, error: updateError } = await client
        .from('calcom_connections')
        .update({
          calcom_api_key: body.api_key,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .select('id, status')
        .single()
      
      if (updateError) {
        console.error('Erreur lors de la mise à jour de la connexion:', updateError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Erreur lors de la mise à jour de la connexion',
          data: updateError
        })
      }
      
      connectionId = updatedConnection.id
      connectionStatus = updatedConnection.status
    } else {
      // Créer une nouvelle connexion
      const { data: newConnection, error: insertError } = await client
        .from('calcom_connections')
        .insert({
          user_id: user.id,
          agency_id: agencyData.id,
          calcom_api_key: body.api_key,
          status: 'active'
        })
        .select('id, status')
        .single()
      
      if (insertError) {
        console.error('Erreur lors de la création de la connexion:', insertError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Erreur lors de la création de la connexion',
          data: insertError
        })
      }
      
      connectionId = newConnection.id
      connectionStatus = newConnection.status
    }
    
    return {
      success: true,
      message: 'Connexion Cal.com établie avec succès',
      connection: {
        id: connectionId,
        user_id: user.id,
        agency_id: agencyData.id,
        status: connectionStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } as ConnectCalComResponse
  } catch (error) {
    console.error('Erreur lors de la connexion à Cal.com:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la connexion à Cal.com',
      data: error
    })
  }
})
