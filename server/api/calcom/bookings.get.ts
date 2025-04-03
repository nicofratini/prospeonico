// API route pour récupérer les rendez-vous Cal.com
import { defineEventHandler } from 'h3'
import { GetBookingsRequest } from '~/types/calcom'
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
  const status = query.status as string
  const dateFrom = query.date_from as string
  const dateTo = query.date_to as string
  const limit = query.limit ? parseInt(query.limit as string) : undefined
  const cursor = query.cursor as string

  try {
    // Récupérer le client Cal.com
    const calcomClient = useCalComClient()

    // Récupérer les rendez-vous
    const bookingsParams: GetBookingsRequest = {}
    
    if (status) bookingsParams.status = status as any
    if (dateFrom) bookingsParams.date_from = dateFrom
    if (dateTo) bookingsParams.date_to = dateTo
    if (limit) bookingsParams.limit = limit
    if (cursor) bookingsParams.cursor = cursor

    const bookingsResponse = await calcomClient.getBookings(bookingsParams)

    // Récupérer les données de l'agence de l'utilisateur
    const client = useSupabaseClient()
    const { data: agencyData, error: agencyError } = await client
      .from('agencies')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (agencyError) {
      console.error('Erreur lors de la récupération de l\'agence:', agencyError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération de l\'agence',
        data: agencyError
      })
    }

    // Synchroniser les rendez-vous avec Supabase (optionnel, peut être fait dans une tâche séparée)
    const bookingsToSync = bookingsResponse.bookings.map(booking => ({
      calcom_booking_id: booking.uid,
      agency_id: agencyData.id,
      title: booking.title,
      description: booking.description || null,
      start_time: booking.start,
      end_time: booking.end,
      attendee_name: booking.attendees[0]?.name || '',
      attendee_email: booking.attendees[0]?.email || '',
      status: booking.status.toLowerCase(),
      location: booking.location || null,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      metadata: booking.metadata || {}
    }))

    // Upsert des rendez-vous dans Supabase (mise à jour si existe, création sinon)
    if (bookingsToSync.length > 0) {
      const { error: syncError } = await client
        .from('bookings')
        .upsert(bookingsToSync, {
          onConflict: 'calcom_booking_id',
          ignoreDuplicates: false
        })

      if (syncError) {
        console.error('Erreur lors de la synchronisation des rendez-vous:', syncError)
        // Ne pas échouer la requête si la synchronisation échoue
      }
    }

    return bookingsResponse
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des rendez-vous',
      data: error
    })
  }
})
