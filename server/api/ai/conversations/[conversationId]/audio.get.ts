// API route pour récupérer l'URL audio d'une conversation ElevenLabs
import { defineEventHandler } from 'h3'
import { ElevenLabsConversationAudioResponse } from '~/types/elevenlabs'

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
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': config.public.elevenlabsApiKey
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail?.message || 'Erreur lors de la récupération de l\'URL audio')
    }
    
    const data = await response.json() as ElevenLabsConversationAudioResponse
    
    return {
      audio_url: data.audio_url,
      expires_at: data.expires_at
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'URL audio:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération de l\'URL audio',
      data: error
    })
  }
})
