// API route pour intégrer les codes promo dans le processus de paiement Stripe
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
      couponCode,
      successUrl,
      cancelUrl
    } = body

    if (!planId || !agencyId || !successUrl || !cancelUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Paramètres manquants: planId, agencyId, successUrl et cancelUrl sont requis'
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
    let stripeCouponId = null
    let couponData = null

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

      // Créer un coupon Stripe si nécessaire
      if (coupon.discount_type === 'percent') {
        const stripeCoupon = await stripe.coupons.create({
          percent_off: coupon.discount_percent,
          duration: 'once',
          name: coupon.code,
          metadata: {
            coupon_id: coupon.id
          }
        })
        stripeCouponId = stripeCoupon.id
      } else {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: coupon.discount_amount,
          currency: 'eur',
          duration: 'once',
          name: coupon.code,
          metadata: {
            coupon_id: coupon.id
          }
        })
        stripeCouponId = stripeCoupon.id
      }

      couponData = coupon
    }

    // Créer une session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: planId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        agency_id: agencyId,
        coupon_id: couponData?.id || null
      },
      // Appliquer le coupon Stripe si disponible
      ...(stripeCouponId && {
        discounts: [
          {
            coupon: stripeCouponId
          }
        ]
      }),
      subscription_data: {
        metadata: {
          agency_id: agencyId,
          coupon_id: couponData?.id || null
        }
      }
    })

    // Si un code promo a été utilisé, incrémenter son compteur d'utilisation
    if (couponData) {
      await client
        .from('coupons')
        .update({ times_redeemed: client.sql`times_redeemed + 1` })
        .eq('id', couponData.id)
    }

    return {
      success: true,
      url: session.url,
      session_id: session.id
    }
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de la création de la session de paiement',
      data: error
    })
  }
})
