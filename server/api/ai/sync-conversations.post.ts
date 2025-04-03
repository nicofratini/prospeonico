// API route pour synchroniser les conversations ElevenLabs avec Supabase
import { defineEventHandler } from 'h3'
import { ElevenLabsConversationsResponse, Call } from '~/types/elevenlabs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const client = useSupabaseClient()
  
  try {
    // Récupérer l'agence de l'utilisateur connecté
    const { data: agencyData, error: agencyError } = await client
      .from('agencies')
      .select('*')
      .single()
    
    if (agencyError) throw agencyError
    
    if (!agencyData.elevenlabs_agent_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun agent ElevenLabs configuré pour cette agence'
      })
    }
    
    // Récupérer toutes les conversations depuis ElevenLabs
    let allConversations = []
    let nextCursor = null
    
    do {
      let url = `https://api.elevenlabs.io/v1/convai/conversations?limit=100`
      if (nextCursor) {
        url += `&cursor=${nextCursor}`
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': config.public.elevenlabsApiKey
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail?.message || 'Erreur lors de la récupération des conversations')
      }
      
      const data = await response.json() as ElevenLabsConversationsResponse
      
      allConversations = [...allConversations, ...data.conversations]
      nextCursor = data.next_cursor
    } while (nextCursor)
    
    // Filtrer les conversations pour ne garder que celles de l'agent de l'agence
    const agentConversations = allConversations.filter(
      conv => conv.agent_id === agencyData.elevenlabs_agent_id
    )
    
    // Récupérer les IDs des conversations déjà enregistrées dans Supabase
    const { data: existingCalls, error: existingCallsError } = await client
      .from('calls')
      .select('elevenlabs_conversation_id')
    
    if (existingCallsError) throw existingCallsError
    
    const existingConversationIds = new Set(
      existingCalls.map(call => call.elevenlabs_conversation_id)
    )
    
    // Préparer les données pour l'insertion/mise à jour
    const newCalls = []
    const updatedCalls = []
    
    for (const conv of agentConversations) {
      const callData: Partial<Call> = {
        elevenlabs_conversation_id: conv.conversation_id,
        agency_id: agencyData.id,
        elevenlabs_agent_id: conv.agent_id,
        started_at: conv.started_at,
        ended_at: conv.ended_at,
        duration: conv.duration,
        status: conv.status,
        summary: conv.summary,
        caller_number: conv.metadata?.caller_number,
        caller_type: conv.metadata?.caller_type || 'unknown',
        property_id: conv.metadata?.property_id,
        updated_at: new Date().toISOString()
      }
      
      if (existingConversationIds.has(conv.conversation_id)) {
        // Mise à jour d'un appel existant
        updatedCalls.push(callData)
      } else {
        // Nouvel appel
        newCalls.push({
          ...callData,
          created_at: new Date().toISOString()
        })
      }
    }
    
    // Insérer les nouveaux appels
    let newCount = 0
    if (newCalls.length > 0) {
      const { data: insertedData, error: insertError } = await client
        .from('calls')
        .insert(newCalls)
        .select()
      
      if (insertError) throw insertError
      
      newCount = insertedData.length
    }
    
    // Mettre à jour les appels existants
    let updatedCount = 0
    for (const call of updatedCalls) {
      const { error: updateError } = await client
        .from('calls')
        .update(call)
        .eq('elevenlabs_conversation_id', call.elevenlabs_conversation_id)
      
      if (updateError) throw updateError
      
      updatedCount++
    }
    
    return {
      synced_count: newCount + updatedCount,
      new_count: newCount,
      updated_count: updatedCount,
      error_count: 0
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation des conversations:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la synchronisation des conversations',
      data: error
    })
  }
})
