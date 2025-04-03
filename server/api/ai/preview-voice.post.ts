// API route pour prévisualiser une voix
import { defineEventHandler } from 'h3'
import { VoicePreviewRequest, VoicePreviewResponse } from '~/types/elevenlabs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event) as VoicePreviewRequest
  
  if (!body.voice_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de voix requis'
    })
  }
  
  if (!body.text) {
    body.text = "Bonjour, je suis un agent virtuel de l'agence immobilière. Comment puis-je vous aider aujourd'hui ?"
  }
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${body.voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': config.public.elevenlabsApiKey
      },
      body: JSON.stringify({
        text: body.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail?.message || 'Erreur lors de la prévisualisation de la voix')
    }
    
    const audioBlob = await response.blob()
    const audioBuffer = await audioBlob.arrayBuffer()
    const audioBase64 = Buffer.from(audioBuffer).toString('base64')
    
    return {
      audio_url: `data:audio/mpeg;base64,${audioBase64}`
    } as VoicePreviewResponse
  } catch (error) {
    console.error('Erreur lors de la prévisualisation de la voix:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la prévisualisation de la voix',
      data: error
    })
  }
})
