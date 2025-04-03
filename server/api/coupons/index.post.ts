// API routes pour gérer les codes promotionnels
import { defineEventHandler, readBody } from 'h3'

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
      code,
      description,
      discount_type,
      discount_amount,
      discount_percent,
      valid_until,
      max_redemptions,
      applies_to_plan,
      min_subscription_months
    } = body

    // Validation des données
    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Le code promo est requis'
      })
    }

    if (discount_type !== 'percent' && discount_type !== 'amount') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Type de remise invalide'
      })
    }

    if (discount_type === 'percent' && (discount_percent < 1 || discount_percent > 100)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Le pourcentage de remise doit être compris entre 1 et 100'
      })
    }

    if (discount_type === 'amount' && discount_amount < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Le montant de la remise doit être supérieur à 0'
      })
    }

    // Vérifier si l'utilisateur est administrateur
    const client = useSupabaseClient()
    const { data: roleData, error: roleError } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
    
    if (roleError || !roleData) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Accès non autorisé'
      })
    }

    // Vérifier si le code promo existe déjà
    const { data: existingCoupon, error: existingCouponError } = await client
      .from('coupons')
      .select('id')
      .eq('code', code)
      .maybeSingle()
    
    if (existingCouponError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la vérification du code promo',
        data: existingCouponError
      })
    }
    
    if (existingCoupon) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ce code promo existe déjà'
      })
    }

    // Créer le code promo
    const { data: coupon, error: couponError } = await client
      .from('coupons')
      .insert({
        code,
        description,
        discount_type,
        discount_amount: discount_type === 'amount' ? discount_amount : 0,
        discount_percent: discount_type === 'percent' ? discount_percent : 0,
        valid_from: new Date().toISOString(),
        valid_until: valid_until || null,
        max_redemptions: max_redemptions || null,
        times_redeemed: 0,
        applies_to_plan: applies_to_plan || null,
        min_subscription_months: min_subscription_months || 1,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()
    
    if (couponError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la création du code promo',
        data: couponError
      })
    }

    return {
      success: true,
      coupon
    }
  } catch (error) {
    console.error('Erreur lors de la création du code promo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de la création du code promo',
      data: error
    })
  }
})
