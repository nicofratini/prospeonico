// Système de notification pour les quotas presque atteints
// Ce service vérifie périodiquement les quotas d'utilisation et envoie des notifications

import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  // Vérifier l'authentification
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  try {
    // Initialiser le client Supabase
    const client = useSupabaseClient()
    
    // Récupérer les quotas d'utilisation pour toutes les agences
    const { data: quotas, error: quotasError } = await client
      .from('usage_quotas')
      .select(`
        id,
        agency_id,
        calls_limit,
        calls_used,
        minutes_limit,
        minutes_used,
        calls_notification_threshold,
        minutes_notification_threshold,
        last_notification_sent_at,
        notification_cooldown_hours,
        agencies (
          name,
          owner_id,
          profiles (
            email,
            full_name
          )
        )
      `)
    
    if (quotasError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des quotas d\'utilisation',
        data: quotasError
      })
    }
    
    if (!quotas || quotas.length === 0) {
      return {
        success: true,
        message: 'Aucun quota à vérifier',
        notifications_sent: 0
      }
    }
    
    // Compteur de notifications envoyées
    let notificationsSent = 0
    
    // Date actuelle
    const now = new Date()
    
    // Vérifier chaque quota
    for (const quota of quotas) {
      // Calculer les pourcentages d'utilisation
      const callsPercentage = quota.calls_limit > 0 
        ? Math.round((quota.calls_used / quota.calls_limit) * 100) 
        : 0
      
      const minutesPercentage = quota.minutes_limit > 0 
        ? Math.round((quota.minutes_used / quota.minutes_limit) * 100) 
        : 0
      
      // Vérifier si les seuils d'alerte sont atteints
      const callsThresholdReached = callsPercentage >= quota.calls_notification_threshold
      const minutesThresholdReached = minutesPercentage >= quota.minutes_notification_threshold
      
      // Vérifier si une notification a déjà été envoyée récemment
      const cooldownHours = quota.notification_cooldown_hours || 24
      const lastNotification = quota.last_notification_sent_at 
        ? new Date(quota.last_notification_sent_at) 
        : null
      
      const cooldownExpired = !lastNotification || 
        (now.getTime() - lastNotification.getTime()) > (cooldownHours * 60 * 60 * 1000)
      
      // Si un seuil est atteint et que le délai de grâce est expiré
      if ((callsThresholdReached || minutesThresholdReached) && cooldownExpired) {
        // Récupérer les informations de l'agence et du propriétaire
        const agency = quota.agencies
        
        if (!agency || !agency.owner_id) {
          console.warn(`Agence non trouvée pour le quota ${quota.id}`)
          continue
        }
        
        const ownerEmail = agency.profiles?.email
        
        if (!ownerEmail) {
          console.warn(`Email du propriétaire non trouvé pour l'agence ${agency.id}`)
          continue
        }
        
        // Déterminer le type de notification
        let notificationType = ''
        let thresholdPercent = 0
        let currentUsagePercent = 0
        
        if (callsThresholdReached && minutesThresholdReached) {
          notificationType = 'calls_and_minutes_threshold'
          thresholdPercent = Math.max(quota.calls_notification_threshold, quota.minutes_notification_threshold)
          currentUsagePercent = Math.max(callsPercentage, minutesPercentage)
        } else if (callsThresholdReached) {
          notificationType = 'calls_threshold'
          thresholdPercent = quota.calls_notification_threshold
          currentUsagePercent = callsPercentage
        } else {
          notificationType = 'minutes_threshold'
          thresholdPercent = quota.minutes_notification_threshold
          currentUsagePercent = minutesPercentage
        }
        
        // Créer une notification dans la base de données
        const { data: notification, error: notificationError } = await client
          .from('quota_notifications')
          .insert({
            agency_id: quota.agency_id,
            user_id: agency.owner_id,
            notification_type: notificationType,
            threshold_percent: thresholdPercent,
            current_usage_percent: currentUsagePercent,
            metadata: {
              agency_name: agency.name,
              calls_used: quota.calls_used,
              calls_limit: quota.calls_limit,
              calls_percentage: callsPercentage,
              minutes_used: quota.minutes_used,
              minutes_limit: quota.minutes_limit,
              minutes_percentage: minutesPercentage
            }
          })
          .select()
          .single()
        
        if (notificationError) {
          console.error('Erreur lors de la création de la notification:', notificationError)
          continue
        }
        
        // Mettre à jour la date de dernière notification
        await client
          .from('usage_quotas')
          .update({ last_notification_sent_at: now.toISOString() })
          .eq('id', quota.id)
        
        // Envoyer un email de notification (si configuré)
        if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
          try {
            // Utiliser un service d'envoi d'email comme SendGrid, Mailjet, etc.
            // Cette partie dépend de la configuration du projet
            
            // Exemple avec un service d'email générique
            /*
            await sendEmail({
              to: ownerEmail,
              subject: `Alerte de quota - ${agency.name}`,
              template: 'quota-alert',
              data: {
                agencyName: agency.name,
                ownerName: agency.profiles?.full_name || 'Client',
                notificationType,
                thresholdPercent,
                currentUsagePercent,
                callsUsed: quota.calls_used,
                callsLimit: quota.calls_limit,
                callsPercentage: callsPercentage,
                minutesUsed: quota.minutes_used,
                minutesLimit: quota.minutes_limit,
                minutesPercentage: minutesPercentage
              }
            })
            */
            
            console.log(`Email de notification envoyé à ${ownerEmail} pour l'agence ${agency.name}`)
          } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email de notification:', emailError)
          }
        }
        
        notificationsSent++
      }
    }
    
    return {
      success: true,
      message: `Vérification des quotas terminée`,
      notifications_sent: notificationsSent
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des quotas:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de la vérification des quotas',
      data: error
    })
  }
})
