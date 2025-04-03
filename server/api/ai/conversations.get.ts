// API route pour récupérer la liste des conversations ElevenLabs
import { defineEventHandler } from 'h3'
import { ElevenLabsConversationsResponse } from '~/types/elevenlabs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const cursor = query.cursor as string | undefined
  const limit = query.limit ? parseInt(query.limit as string) : 20
  
  try {
    let url = `https://api.elevenlabs.io/v1/convai/conversations?limit=${limit}`
    if (cursor) {
      url += `&cursor=${cursor}`
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
    
    return {
      conversations: data.conversations,
      next_cursor: data.next_cursor
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des conversations',
      data: error
    })
  }
})
