// API route pour récupérer les détails d'une conversation ElevenLabs spécifique
import { defineEventHandler } from 'h3'
import { ElevenLabsConversationResponse } from '~/types/elevenlabs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const conversationId = event.context.params?.conversationId
  
  if (!conversationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de conversation requis'
    })
  }
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': config.public.elevenlabsApiKey
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail?.message || 'Erreur lors de la récupération de la conversation')
    }
    
    const data = await response.json() as ElevenLabsConversationResponse
    
    return {
      conversation: data.conversation
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la conversation:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération de la conversation',
      data: error
    })
  }
})
