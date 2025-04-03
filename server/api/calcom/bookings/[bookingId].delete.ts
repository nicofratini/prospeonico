// API route pour annuler un rendez-vous Cal.com
import { defineEventHandler } from 'h3'
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

  // Récupérer l'ID du rendez-vous depuis les paramètres de l'URL
  const bookingId = event.context.params?.bookingId
  if (!bookingId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID du rendez-vous requis'
    })
  }

  // Récupérer la raison d'annulation depuis le corps de la requête
  const body = await readBody(event)
  const reason = body?.reason || 'Annulé par l\'utilisateur'

  try {
    // Récupérer le client Cal.com
    const calcomClient = useCalComClient()
    
    // Annuler le rendez-vous dans Cal.com
    const cancelResponse = await calcomClient.cancelBooking(bookingId, reason)
    
    // Mettre à jour le statut du rendez-vous dans Supabase
    const client = useSupabaseClient()
    const { error: updateError } = await client
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('calcom_booking_id', bookingId)
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour du statut du rendez-vous dans Supabase:', updateError)
      // Ne pas échouer la requête si la mise à jour échoue
    }
    
    return cancelResponse
  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de l\'annulation du rendez-vous',
      data: error
    })
  }
})
