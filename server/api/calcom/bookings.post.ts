// API route pour créer un nouveau rendez-vous Cal.com
import { defineEventHandler } from 'h3'
import { CalComCreateBookingRequest } from '~/types/calcom'
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

  // Récupérer les données du corps de la requête
  const body = await readBody(event) as CalComCreateBookingRequest & { propertyId?: string, phone?: string }
  
  // Valider les champs requis
  if (!body.event_type_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID du type d\'événement requis'
    })
  }
  
  if (!body.start || !body.end) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dates de début et de fin requises'
    })
  }
  
  if (!body.name || !body.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nom et email requis'
    })
  }

  try {
    // Récupérer le client Cal.com
    const calcomClient = useCalComClient()
    
    // Préparer les données pour Cal.com
    const bookingData: CalComCreateBookingRequest = {
      event_type_id: body.event_type_id,
      start: body.start,
      end: body.end,
      name: body.name,
      email: body.email,
      notes: body.notes,
      location: body.location,
      timezone: body.timezone || 'Europe/Paris',
      language: body.language || 'fr',
      metadata: body.metadata || {}
    }
    
    // Ajouter les métadonnées supplémentaires
    if (body.propertyId) {
      bookingData.metadata = {
        ...bookingData.metadata,
        property_id: body.propertyId
      }
    }
    
    if (body.phone) {
      bookingData.metadata = {
        ...bookingData.metadata,
        phone: body.phone
      }
    }
    
    // Créer le rendez-vous dans Cal.com
    const bookingResponse = await calcomClient.createBooking(bookingData)
    
    // Récupérer les données de l'agence de l'utilisateur
    const client = useSupabaseClient()
    const { data: agencyData, error: agencyError } = await client
      .from('agencies')
      .select('id')
      .eq('owner_id', user.id)
      .single()
    
    if (agencyError) {
      console.error('Erreur lors de la récupération de l\'agence:', agencyError)
      // Ne pas échouer la requête si la récupération de l'agence échoue
    } else if (bookingResponse.booking) {
      // Enregistrer le rendez-vous dans Supabase
      const booking = bookingResponse.booking
      const { error: insertError } = await client
        .from('bookings')
        .insert({
          calcom_booking_id: booking.uid,
          agency_id: agencyData.id,
          property_id: body.propertyId || null,
          title: booking.title,
          description: booking.description || null,
          start_time: booking.start,
          end_time: booking.end,
          attendee_name: booking.attendees[0]?.name || body.name,
          attendee_email: booking.attendees[0]?.email || body.email,
          attendee_phone: body.phone || null,
          status: booking.status.toLowerCase(),
          location: booking.location || null,
          notes: body.notes || null,
          metadata: booking.metadata || {}
        })
      
      if (insertError) {
        console.error('Erreur lors de l\'enregistrement du rendez-vous dans Supabase:', insertError)
        // Ne pas échouer la requête si l'enregistrement échoue
      }
    }
    
    return bookingResponse
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création du rendez-vous',
      data: error
    })
  }
})
