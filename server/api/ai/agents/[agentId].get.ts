// API route pour récupérer un agent ElevenLabs spécifique
import { defineEventHandler } from 'h3'
import { ElevenLabsAgentResponse } from '~/types/elevenlabs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const agentId = event.context.params?.agentId
  
  if (!agentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID d\'agent requis'
    })
  }
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': config.public.elevenlabsApiKey
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail?.message || 'Erreur lors de la récupération de l\'agent')
    }
    
    const data = await response.json() as ElevenLabsAgentResponse
    
    return {
      agent: data.agent
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'agent:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération de l\'agent',
      data: error
    })
  }
})
