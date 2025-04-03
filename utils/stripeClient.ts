// Utilitaire pour l'intégration Stripe
// Configuration et fonctions pour interagir avec l'API Stripe

import Stripe from 'stripe';
import { StripeSubscription, StripeInvoice, UsageQuota } from '~/types/stripe';

// Initialisation du client Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Crée un client Stripe pour une agence
 * @param agencyId ID de l'agence
 * @param email Email du propriétaire de l'agence
 * @param name Nom de l'agence
 * @returns ID du client Stripe créé
 */
export async function createStripeCustomer(agencyId: string, email: string, name: string): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        agency_id: agencyId
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Erreur lors de la création du client Stripe:', error);
    throw error;
  }
}

/**
 * Crée une session de paiement Stripe Checkout
 * @param customerId ID du client Stripe
 * @param priceId ID du prix Stripe
 * @param successUrl URL de redirection en cas de succès
 * @param cancelUrl URL de redirection en cas d'annulation
 * @returns URL de la session de paiement
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session.url || '';
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    throw error;
  }
}

/**
 * Crée une session de portail client Stripe
 * @param customerId ID du client Stripe
 * @param returnUrl URL de retour après la session
 * @returns URL de la session de portail client
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    console.error('Erreur lors de la création de la session de portail client:', error);
    throw error;
  }
}

/**
 * Récupère les informations d'un abonnement Stripe
 * @param subscriptionId ID de l'abonnement Stripe
 * @returns Informations de l'abonnement
 */
export async function getSubscription(subscriptionId: string): Promise<StripeSubscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    });

    // Transformer les données Stripe en format StripeSubscription
    return {
      id: subscription.id,
      customer_id: subscription.customer as string,
      status: subscription.status as any,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      plan: {
        id: subscription.items.data[0].price.id,
        name: (subscription.items.data[0].price.product as Stripe.Product).name,
        amount: subscription.items.data[0].price.unit_amount || 0,
        currency: subscription.items.data[0].price.currency,
        interval: subscription.items.data[0].price.recurring?.interval as any || 'month',
      },
      items: subscription.items.data.map(item => ({
        id: item.id,
        price_id: item.price.id,
        quantity: item.quantity || 1,
      })),
    };
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    throw error;
  }
}

/**
 * Récupère les factures d'un client Stripe
 * @param customerId ID du client Stripe
 * @returns Liste des factures
 */
export async function getInvoices(customerId: string): Promise<StripeInvoice[]> {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });

    // Transformer les données Stripe en format StripeInvoice
    return invoices.data.map(invoice => ({
      id: invoice.id,
      customer_id: invoice.customer as string,
      subscription_id: invoice.subscription as string,
      status: invoice.status as any,
      amount_due: invoice.amount_due,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000).toISOString(),
      invoice_pdf: invoice.invoice_pdf || '',
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des factures:', error);
    throw error;
  }
}

/**
 * Met à jour les quotas d'utilisation dans Supabase
 * @param client Client Supabase
 * @param agencyId ID de l'agence
 * @param subscriptionId ID de l'abonnement
 * @param callsUsed Nombre d'appels utilisés
 * @param minutesUsed Nombre de minutes utilisées
 */
export async function updateUsageQuotas(
  client: any,
  agencyId: string,
  subscriptionId: string,
  callsUsed: number,
  minutesUsed: number
): Promise<void> {
  try {
    // Récupérer les quotas actuels
    const { data: quotaData, error: quotaError } = await client
      .from('usage_quotas')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('subscription_id', subscriptionId)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
      // PGRST116 = not found, ce qui est normal si c'est la première mise à jour
      console.error('Erreur lors de la récupération des quotas:', quotaError);
      throw quotaError;
    }

    if (quotaData) {
      // Mettre à jour les quotas existants
      const { error: updateError } = await client
        .from('usage_quotas')
        .update({
          calls_used: callsUsed,
          minutes_used: minutesUsed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quotaData.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour des quotas:', updateError);
        throw updateError;
      }
    } else {
      // Récupérer l'abonnement pour obtenir les limites
      const { data: subscriptionData, error: subscriptionError } = await client
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (subscriptionError) {
        console.error('Erreur lors de la récupération de l\'abonnement:', subscriptionError);
        throw subscriptionError;
      }

      // Déterminer les limites en fonction du plan
      let callsLimit = 50; // Valeurs par défaut pour le plan Basic
      let minutesLimit = 30;

      if (subscriptionData.plan_id.includes('pro')) {
        callsLimit = 200;
        minutesLimit = 120;
      } else if (subscriptionData.plan_id.includes('enterprise')) {
        callsLimit = 999999; // Illimité
        minutesLimit = 999999; // Illimité
      }

      // Calculer la date de réinitialisation (fin de la période en cours)
      const resetDate = new Date(subscriptionData.current_period_end);

      // Créer de nouveaux quotas
      const { error: insertError } = await client
        .from('usage_quotas')
        .insert({
          agency_id: agencyId,
          subscription_id: subscriptionId,
          calls_limit: callsLimit,
          calls_used: callsUsed,
          minutes_limit: minutesLimit,
          minutes_used: minutesUsed,
          reset_date: resetDate.toISOString(),
        });

      if (insertError) {
        console.error('Erreur lors de la création des quotas:', insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des quotas d\'utilisation:', error);
    throw error;
  }
}

/**
 * Vérifie si l'agence a dépassé ses quotas d'utilisation
 * @param client Client Supabase
 * @param agencyId ID de l'agence
 * @returns Vrai si les quotas sont dépassés
 */
export async function checkQuotaExceeded(client: any, agencyId: string): Promise<boolean> {
  try {
    // Récupérer les quotas actuels
    const { data: quotaData, error: quotaError } = await client
      .from('usage_quotas')
      .select('*')
      .eq('agency_id', agencyId)
      .single();

    if (quotaError) {
      console.error('Erreur lors de la vérification des quotas:', quotaError);
      return false; // En cas d'erreur, on autorise l'utilisation
    }

    // Vérifier si les quotas sont dépassés
    if (quotaData.calls_used >= quotaData.calls_limit || quotaData.minutes_used >= quotaData.minutes_limit) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification des quotas:', error);
    return false; // En cas d'erreur, on autorise l'utilisation
  }
}
