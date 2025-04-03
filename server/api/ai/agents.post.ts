// API route pour créer un nouvel agent ElevenLabs
import { defineEventHandler } from 'h3'
import { ElevenLabsCreateAgentRequest, ElevenLabsAgentResponse } from '~/types/elevenlabs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) as ElevenLabsCreateAgentRequest
  
  // Validation des champs requis
  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nom de l\'agent requis'
    })
  }
  
  if (!body.voice_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de voix requis'
    })
  }
  
  if (!body.system_prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt système requis'
    })
  }
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'xi-api-key': config.public.elevenlabsApiKey
      },
      body: JSON.stringify({
        name: body.name,
        voice_id: body.voice_id,
        system_prompt: body.system_prompt,
        knowledge_base_id: body.knowledge_base_id,
        metadata: body.metadata || {}
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail?.message || 'Erreur lors de la création de l\'agent')
    }
    
    const data = await response.json() as ElevenLabsAgentResponse
    
    return {
      agent: data.agent
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'agent:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création de l\'agent',
      data: error
    })
  }
})
