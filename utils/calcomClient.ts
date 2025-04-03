// Utilitaire pour interagir avec l'API Cal.com
import { 
  CalComAvailabilityResponse, 
  CalComBookingsResponse, 
  CalComBookingResponse,
  GetAvailabilityRequest,
  GetBookingsRequest,
  CalComCreateBookingRequest
} from '~/types/calcom';

export class CalComClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.cal.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Récupère les disponibilités pour une période donnée
   */
  async getAvailability(params: GetAvailabilityRequest): Promise<CalComAvailabilityResponse> {
    const { date_from, date_to, event_type_id, timezone } = params;
    
    let url = `${this.baseUrl}/availability?dateFrom=${date_from}&dateTo=${date_to}`;
    
    if (event_type_id) {
      url += `&eventTypeId=${event_type_id}`;
    }
    
    if (timezone) {
      url += `&timezone=${timezone}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération des disponibilités');
    }
    
    return await response.json() as CalComAvailabilityResponse;
  }

  /**
   * Récupère la liste des rendez-vous
   */
  async getBookings(params?: GetBookingsRequest): Promise<CalComBookingsResponse> {
    let url = `${this.baseUrl}/bookings`;
    
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.status) queryParams.append('status', params.status);
      if (params.date_from) queryParams.append('dateFrom', params.date_from);
      if (params.date_to) queryParams.append('dateTo', params.date_to);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.cursor) queryParams.append('cursor', params.cursor);
    }
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération des rendez-vous');
    }
    
    return await response.json() as CalComBookingsResponse;
  }

  /**
   * Récupère les détails d'un rendez-vous spécifique
   */
  async getBooking(bookingId: string): Promise<CalComBookingResponse> {
    const response = await fetch(`${this.baseUrl}/bookings/${bookingId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération du rendez-vous');
    }
    
    return await response.json() as CalComBookingResponse;
  }

  /**
   * Crée un nouveau rendez-vous
   */
  async createBooking(data: CalComCreateBookingRequest): Promise<CalComBookingResponse> {
    const response = await fetch(`${this.baseUrl}/bookings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création du rendez-vous');
    }
    
    return await response.json() as CalComBookingResponse;
  }

  /**
   * Annule un rendez-vous existant
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<CalComBookingResponse> {
    const response = await fetch(`${this.baseUrl}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'annulation du rendez-vous');
    }
    
    return await response.json() as CalComBookingResponse;
  }

  /**
   * Récupère les types d'événements disponibles
   */
  async getEventTypes(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/event-types`, {
      method: 'GET',
      headers: this.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la récupération des types d\'événements');
    }
    
    return await response.json();
  }

  /**
   * Vérifie si l'API key est valide
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getEventTypes();
      return true;
    } catch (error) {
      console.error('Erreur de validation de l\'API key:', error);
      return false;
    }
  }

  /**
   * Génère les en-têtes pour les requêtes API
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    };
  }
}

/**
 * Crée une instance du client Cal.com avec la clé API configurée
 */
export function useCalComClient() {
  const config = useRuntimeConfig();
  const apiKey = config.public.calcomApiKey;
  
  if (!apiKey) {
    console.error('Clé API Cal.com non configurée');
    throw new Error('Clé API Cal.com non configurée');
  }
  
  return new CalComClient(apiKey);
}
