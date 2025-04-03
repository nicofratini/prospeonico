// Logique pour gérer les périodes d'essai dans les abonnements Stripe

import { defineEventHandler, readBody } from 'h3'
import Stripe from 'stripe'

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
    const body = await readBody(event)
    const { 
      planId, 
      agencyId, 
      trialDays = 14, // Période d'essai par défaut de 14 jours
      couponCode = null // Code promo optionnel
    } = body

    if (!planId || !agencyId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Paramètres manquants: planId et agencyId sont requis'
      })
    }

    // Initialiser le client Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    })

    // Récupérer les informations de l'agence
    const client = useSupabaseClient()
    const { data: agency, error: agencyError } = await client
      .from('agencies')
      .select('name, owner_id, stripe_customer_id')
      .eq('id', agencyId)
      .single()

    if (agencyError || !agency) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Agence non trouvée',
        data: agencyError
      })
    }

    // Vérifier que l'utilisateur est le propriétaire de l'agence
    if (agency.owner_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Vous n\'êtes pas autorisé à gérer les abonnements de cette agence'
      })
    }

    // Récupérer ou créer le client Stripe
    let stripeCustomerId = agency.stripe_customer_id
    
    if (!stripeCustomerId) {
      // Récupérer les informations du propriétaire
      const { data: owner, error: ownerError } = await client
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      if (ownerError || !owner) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erreur lors de la récupération des informations du propriétaire',
          data: ownerError
        })
      }

      // Créer un nouveau client Stripe
      const customer = await stripe.customers.create({
        email: owner.email,
        name: owner.full_name || agency.name,
        metadata: {
          agency_id: agencyId,
          user_id: user.id
        }
      })

      stripeCustomerId = customer.id

      // Mettre à jour l'agence avec l'ID client Stripe
      await client
        .from('agencies')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', agencyId)
    }

    // Vérifier si un code promo a été fourni
    let couponId = null
    let discountAmount = 0
    let discountPercent = 0
    let couponName = null

    if (couponCode) {
      // Vérifier si le code promo existe et est valide
      const { data: coupon, error: couponError } = await client
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single()

      if (couponError || !coupon) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Code promo invalide ou expiré',
          data: couponError
        })
      }

      // Vérifier si le code promo est applicable au plan sélectionné
      if (coupon.applies_to_plan && coupon.applies_to_plan !== planId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ce code promo n\'est pas applicable à ce plan'
        })
      }

      // Vérifier si le code promo a atteint son nombre maximum d'utilisations
      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ce code promo a atteint son nombre maximum d\'utilisations'
        })
      }

      // Vérifier si le code promo est encore valide
      const now = new Date()
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ce code promo a expiré'
        })
      }

      // Stocker les informations du code promo
      couponId = coupon.id
      discountAmount = coupon.discount_amount || 0
      discountPercent = coupon.discount_percent || 0
      couponName = coupon.code
    }

    // Créer un abonnement avec période d'essai
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: planId
        }
      ],
      trial_period_days: trialDays,
      metadata: {
        agency_id: agencyId,
        coupon_id: couponId
      },
      // Appliquer le coupon Stripe si disponible
      ...(couponId && {
        coupon: couponId
      })
    })

    // Déterminer les limites du plan
    let callsLimit = 0
    let minutesLimit = 0

    if (planId.includes('basic')) {
      callsLimit = 100
      minutesLimit = 300
    } else if (planId.includes('pro')) {
      callsLimit = 500
      minutesLimit = 1500
    } else if (planId.includes('enterprise')) {
      callsLimit = 2000
      minutesLimit = 6000
    }

    // Enregistrer l'abonnement dans la base de données
    const { data: subscriptionData, error: subscriptionError } = await client
      .from('subscriptions')
      .insert({
        agency_id: agencyId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: subscription.id,
        plan_id: planId,
        status: subscription.status,
        interval: subscription.items.data[0].price.recurring.interval,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        
        // Informations de période d'essai
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        is_in_trial: !!subscription.trial_end,
        trial_days: trialDays,
        
        // Informations de code promo
        coupon_id: couponId,
        coupon_name: couponName,
        discount_amount: discountAmount,
        discount_percent: discountPercent
      })
      .select()
      .single()

    if (subscriptionError) {
      // Annuler l'abonnement Stripe en cas d'erreur
      await stripe.subscriptions.del(subscription.id)
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de l\'enregistrement de l\'abonnement',
        data: subscriptionError
      })
    }

    // Créer ou mettre à jour les quotas d'utilisation
    const { data: quotaData, error: quotaError } = await client
      .from('usage_quotas')
      .upsert({
        agency_id: agencyId,
        subscription_id: subscriptionData.id,
        calls_limit: callsLimit,
        minutes_limit: minutesLimit,
        reset_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .select()
      .single()

    if (quotaError) {
      console.error('Erreur lors de la création des quotas d\'utilisation:', quotaError)
    }

    // Si un code promo a été utilisé, enregistrer son utilisation
    if (couponId) {
      // Incrémenter le compteur d'utilisation du code promo
      await client
        .from('coupons')
        .update({ times_redeemed: client.sql`times_redeemed + 1` })
        .eq('id', couponId)

      // Enregistrer l'utilisation du code promo
      await client
        .from('coupon_redemptions')
        .insert({
          coupon_id: couponId,
          agency_id: agencyId,
          subscription_id: subscriptionData.id,
          discount_applied: discountAmount || (discountPercent / 100) * getPlanPrice(planId)
        })
    }

    return {
      success: true,
      subscription: {
        id: subscriptionData.id,
        status: subscriptionData.status,
        trial_end: subscriptionData.trial_end,
        is_in_trial: subscriptionData.is_in_trial
      },
      quota: quotaData
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'abonnement avec période d\'essai:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de la création de l\'abonnement',
      data: error
    })
  }
})

// Fonction utilitaire pour obtenir le prix du plan
function getPlanPrice(planId: string): number {
  if (planId.includes('basic')) {
    return 2900 // 29€
  } else if (planId.includes('pro')) {
    return 9900 // 99€
  } else if (planId.includes('enterprise')) {
    return 29900 // 299€
  }
  return 0
}
