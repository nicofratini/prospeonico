// Types pour l'interface d'administration
// Définition des interfaces pour les métriques et statistiques globales

export interface AdminMetrics {
  total_agencies: number;
  total_users: number;
  total_properties: number;
  total_calls: number;
  total_minutes: number;
  active_subscriptions: number;
  revenue: {
    monthly: number;
    yearly: number;
    total: number;
  };
}

export interface AgencyUsage {
  agency_id: string;
  agency_name: string;
  owner_email: string;
  subscription_plan: string;
  subscription_status: string;
  calls_used: number;
  calls_limit: number;
  minutes_used: number;
  minutes_limit: number;
  usage_percentage: number;
  created_at: string;
}

export interface ApiUsageStats {
  date: string;
  calls: number;
  minutes: number;
  unique_agencies: number;
}

export interface RevenueStats {
  date: string;
  monthly_revenue: number;
  yearly_revenue: number;
  total_revenue: number;
  new_subscriptions: number;
  canceled_subscriptions: number;
}

// Fonctions utilitaires pour l'administration
export function calculateTotalRevenue(agencies: AgencyUsage[]): number {
  return agencies.reduce((total, agency) => {
    // Calculer le revenu en fonction du plan
    let revenue = 0;
    
    if (agency.subscription_status !== 'active') {
      return total;
    }
    
    if (agency.subscription_plan.includes('basic')) {
      revenue = 29; // 29€/mois pour le plan Basic
    } else if (agency.subscription_plan.includes('pro')) {
      revenue = 99; // 99€/mois pour le plan Pro
    } else if (agency.subscription_plan.includes('enterprise')) {
      revenue = 299; // 299€/mois pour le plan Enterprise
    }
    
    return total + revenue;
  }, 0);
}

export function formatLargeNumber(number: number): string {
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'k';
  } else {
    return number.toString();
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return '#10B981'; // Vert
    case 'trialing':
      return '#3B82F6'; // Bleu
    case 'past_due':
      return '#F59E0B'; // Orange
    case 'canceled':
    case 'unpaid':
      return '#EF4444'; // Rouge
    default:
      return '#6B7280'; // Gris
  }
}

export function getUsageColor(percentage: number): string {
  if (percentage < 50) return '#10B981'; // Vert
  if (percentage < 80) return '#F59E0B'; // Orange
  return '#EF4444'; // Rouge
}
