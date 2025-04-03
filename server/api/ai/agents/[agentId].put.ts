// API route pour mettre à jour un agent ElevenLabs existant
import { defineEventHandler } from 'h3'
import { ElevenLabsUpdateAgentRequest, ElevenLabsAgentResponse } from '~/types/elevenlabs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const agentId = event.context.params?.agentId
  const body = await readBody(event) as ElevenLabsUpdateAgentRequest
  
  if (!agentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID d\'agent requis'
    })
  }
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PUT',
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
        metadata: body.metadata
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail?.message || 'Erreur lors de la mise à jour de l\'agent')
    }
    
    const data = await response.json() as ElevenLabsAgentResponse
    
    return {
      agent: data.agent
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'agent:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour de l\'agent',
      data: error
    })
  }
})
