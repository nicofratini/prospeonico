// API route pour récupérer les disponibilités Cal.com
import { defineEventHandler } from 'h3'
import { GetAvailabilityRequest } from '~/types/calcom'
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

  // Récupérer les paramètres de requête
  const query = getQuery(event)
  const dateFrom = query.date_from as string
  const dateTo = query.date_to as string
  const eventTypeId = query.event_type_id ? parseInt(query.event_type_id as string) : undefined
  const timezone = query.timezone as string || 'Europe/Paris'

  // Valider les paramètres requis
  if (!dateFrom || !dateTo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Les paramètres date_from et date_to sont requis'
    })
  }

  try {
    // Récupérer le client Cal.com
    const calcomClient = useCalComClient()

    // Récupérer les disponibilités
    const availabilityParams: GetAvailabilityRequest = {
      date_from: dateFrom,
      date_to: dateTo,
      event_type_id: eventTypeId,
      timezone
    }

    const availabilityResponse = await calcomClient.getAvailability(availabilityParams)

    return availabilityResponse
  } catch (error) {
    console.error('Erreur lors de la récupération des disponibilités:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des disponibilités',
      data: error
    })
  }
})
