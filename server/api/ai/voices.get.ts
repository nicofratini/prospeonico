// API route pour récupérer la liste des voix disponibles
import { defineEventHandler } from 'h3'
import { ElevenLabsVoicesResponse } from '~/types/elevenlabs'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': config.public.elevenlabsApiKey
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail?.message || 'Erreur lors de la récupération des voix')
    }
    
    const data = await response.json() as ElevenLabsVoicesResponse
    
    return {
      voices: data.voices.map(voice => ({
        ...voice,
        // Ajouter des informations supplémentaires pour les voix françaises
        language: voice.name.includes('French') ? 'fr' : 
                 voice.name.includes('English') ? 'en' :
                 voice.name.includes('Spanish') ? 'es' :
                 voice.name.includes('German') ? 'de' :
                 voice.name.includes('Italian') ? 'it' :
                 voice.name.includes('Portuguese') ? 'pt' :
                 voice.name.includes('Dutch') ? 'nl' :
                 voice.name.includes('Russian') ? 'ru' :
                 voice.name.includes('Japanese') ? 'ja' :
                 voice.name.includes('Chinese') ? 'zh' :
                 voice.name.includes('Arabic') ? 'ar' :
                 'other',
        gender: voice.name.includes('Male') ? 'male' :
               voice.name.includes('Female') ? 'female' :
               'other'
      }))
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des voix:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des voix',
      data: error
    })
  }
})
