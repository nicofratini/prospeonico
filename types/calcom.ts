// Types pour l'API Cal.com et les tables Supabase associées

// Types pour les disponibilités Cal.com
export interface CalComTimeSlot {
  start: string; // Format ISO 8601
  end: string; // Format ISO 8601
  available: boolean;
  busy_reason?: string;
}

export interface CalComAvailability {
  date: string; // Format YYYY-MM-DD
  slots: CalComTimeSlot[];
}

export interface CalComAvailabilityResponse {
  availabilities: CalComAvailability[];
  timezone: string;
}

// Types pour les rendez-vous Cal.com
export interface CalComAttendee {
  email: string;
  name: string;
  timezone: string;
  language?: string;
}

export interface CalComBooking {
  id: number;
  uid: string;
  title: string;
  description?: string;
  start: string; // Format ISO 8601
  end: string; // Format ISO 8601
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  attendees: CalComAttendee[];
  location?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  event_type_id: number;
  event_type_name: string;
  metadata?: Record<string, any>;
}

export interface CalComBookingsResponse {
  bookings: CalComBooking[];
  next_cursor?: string;
}

export interface CalComBookingResponse {
  booking: CalComBooking;
}

// Types pour la création de rendez-vous
export interface CalComCreateBookingRequest {
  event_type_id: number;
  start: string; // Format ISO 8601
  end: string; // Format ISO 8601
  name: string;
  email: string;
  notes?: string;
  location?: string;
  timezone: string;
  language?: string;
  metadata?: Record<string, any>;
}

// Types pour la connexion Cal.com
export interface CalComConnection {
  id: string;
  user_id: string;
  agency_id: string;
  calcom_api_key: string;
  calcom_user_id?: string;
  calcom_username?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'pending';
}

// Types pour les tables Supabase
export interface Booking {
  id: string;
  calcom_booking_id: string;
  agency_id: string;
  property_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  status: 'accepted' | 'pending' | 'cancelled' | 'rejected';
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Types pour les requêtes API
export interface GetAvailabilityRequest {
  date_from: string; // Format YYYY-MM-DD
  date_to: string; // Format YYYY-MM-DD
  event_type_id?: number;
  timezone?: string;
}

export interface GetBookingsRequest {
  status?: 'ACCEPTED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
  date_from?: string; // Format YYYY-MM-DD
  date_to?: string; // Format YYYY-MM-DD
  limit?: number;
  cursor?: string;
}

export interface ConnectCalComRequest {
  api_key: string;
}

export interface ConnectCalComResponse {
  success: boolean;
  message: string;
  connection?: CalComConnection;
}

// Types pour les widgets et composants
export interface CalendarViewProps {
  date: Date;
  view: 'month' | 'week' | 'day';
  availabilities: CalComAvailability[];
  bookings: CalComBooking[];
  loading: boolean;
}

export interface AvailabilitySlotProps {
  slot: CalComTimeSlot;
  selected: boolean;
  onClick: () => void;
}

export interface BookingFormProps {
  selectedSlot?: CalComTimeSlot;
  eventTypeId: number;
  onSubmit: (data: CalComCreateBookingRequest) => void;
  onCancel: () => void;
  loading: boolean;
}

export interface BookingItemProps {
  booking: CalComBooking;
  onCancel: (bookingId: string) => void;
  onReschedule: (bookingId: string) => void;
}

export interface UpcomingAppointmentsWidgetProps {
  bookings: CalComBooking[];
  loading: boolean;
  limit?: number;
  onViewAll: () => void;
}

// Types pour les statistiques
export interface BookingStats {
  total: number;
  upcoming: number;
  past: number;
  cancelled: number;
  conversion_rate?: number; // Pourcentage de rendez-vous pris par rapport aux disponibilités
}

export interface PaginatedBookingsResponse {
  bookings: Booking[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
