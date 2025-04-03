// Types pour l'intégration Stripe
// Définition des interfaces pour les abonnements, quotas et factures

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
  };
  items: {
    id: string;
    price_id: string;
    quantity: number;
  }[];
}

export interface StripeInvoice {
  id: string;
  customer_id: string;
  subscription_id: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: string;
  invoice_pdf: string;
}

export interface UsageQuota {
  plan_id: string;
  calls_limit: number;
  calls_used: number;
  minutes_limit: number;
  minutes_used: number;
  reset_date: string;
}

// Plans d'abonnement disponibles
export const SubscriptionPlans = {
  BASIC: {
    id: 'price_basic',
    name: 'Basic',
    description: 'Pour les agents immobiliers indépendants',
    features: [
      '50 appels par mois',
      '30 minutes de conversation par mois',
      'Historique des appels limité à 30 jours',
      'Support par email'
    ],
    price: {
      monthly: 29,
      yearly: 290
    },
    limits: {
      calls: 50,
      minutes: 30,
      history_days: 30
    }
  },
  PRO: {
    id: 'price_pro',
    name: 'Pro',
    description: 'Pour les agences immobilières de taille moyenne',
    features: [
      '200 appels par mois',
      '120 minutes de conversation par mois',
      'Historique des appels illimité',
      'Analyse avancée des appels',
      'Support prioritaire'
    ],
    price: {
      monthly: 99,
      yearly: 990
    },
    limits: {
      calls: 200,
      minutes: 120,
      history_days: 365
    }
  },
  ENTERPRISE: {
    id: 'price_enterprise',
    name: 'Enterprise',
    description: 'Pour les grands réseaux immobiliers',
    features: [
      'Appels illimités',
      'Minutes de conversation illimitées',
      'Historique des appels illimité',
      'Analyse avancée des appels',
      'Support dédié',
      'API personnalisée'
    ],
    price: {
      monthly: 299,
      yearly: 2990
    },
    limits: {
      calls: 999999,
      minutes: 999999,
      history_days: 999999
    }
  }
};

// Fonctions utilitaires pour les abonnements
export function getPlanById(planId: string) {
  const plans = Object.values(SubscriptionPlans);
  return plans.find(plan => plan.id === planId);
}

export function formatPrice(amount: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(amount);
}

export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit === 0 || limit >= 999999) return 0; // Plan illimité
  return Math.min(Math.round((used / limit) * 100), 100);
}

export function getUsageColor(percentage: number): string {
  if (percentage < 50) return '#10B981'; // Vert
  if (percentage < 80) return '#F59E0B'; // Orange
  return '#EF4444'; // Rouge
}
