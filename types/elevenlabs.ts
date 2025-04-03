// Types pour l'API ElevenLabs et les tables Supabase

// Types pour les voix ElevenLabs
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  gender?: 'male' | 'female' | 'other';
  language?: string;
  accent?: string;
  age?: string;
  use_case?: string;
  sample_rate?: number;
}

export interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

// Types pour les agents ElevenLabs
export interface ElevenLabsAgent {
  agent_id: string;
  name: string;
  voice_id: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'pending';
  knowledge_base_id?: string;
  metadata?: Record<string, any>;
}

export interface ElevenLabsAgentResponse {
  agent: ElevenLabsAgent;
}

export interface ElevenLabsAgentsResponse {
  agents: ElevenLabsAgent[];
}

export interface ElevenLabsCreateAgentRequest {
  name: string;
  voice_id: string;
  system_prompt: string;
  knowledge_base_id?: string;
  metadata?: Record<string, any>;
}

export interface ElevenLabsUpdateAgentRequest {
  name?: string;
  voice_id?: string;
  system_prompt?: string;
  knowledge_base_id?: string;
  metadata?: Record<string, any>;
}

// Types pour les conversations ElevenLabs
export interface ElevenLabsConversationSegment {
  segment_id: string;
  text: string;
  start_time: number;
  end_time: number;
  speaker: 'agent' | 'user';
}

export interface ElevenLabsConversation {
  conversation_id: string;
  agent_id: string;
  started_at: string;
  ended_at?: string;
  duration?: number;
  status: 'in_progress' | 'completed' | 'failed';
  caller_number?: string;
  segments?: ElevenLabsConversationSegment[];
  summary?: string;
  metadata?: Record<string, any>;
}

export interface ElevenLabsConversationResponse {
  conversation: ElevenLabsConversation;
}

export interface ElevenLabsConversationsResponse {
  conversations: ElevenLabsConversation[];
  next_cursor?: string;
}

export interface ElevenLabsConversationAudioResponse {
  audio_url: string;
  expires_at: string;
}

// Types pour les tables Supabase
export interface Agency {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  elevenlabs_agent_id?: string;
  status: 'active' | 'inactive' | 'pending';
  subscription_tier?: string;
  subscription_status?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  role: 'admin' | 'agent' | 'manager';
}

export interface Property {
  id: string;
  agency_id: string;
  title: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  type: 'apartment' | 'house' | 'land' | 'commercial';
  status: 'active' | 'pending' | 'sold';
  price: number;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  elevenlabs_conversation_id: string;
  agency_id: string;
  elevenlabs_agent_id?: string;
  property_id?: string;
  started_at: string;
  ended_at?: string;
  duration?: number;
  caller_number?: string;
  caller_type: 'particular' | 'professional' | 'unknown';
  status: string;
  outcome?: string;
  summary?: string;
  recording_url_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les requêtes API
export interface VoicePreviewRequest {
  voice_id: string;
  text: string;
}

export interface VoicePreviewResponse {
  audio_url: string;
}

export interface SyncConversationsResponse {
  synced_count: number;
  new_count: number;
  updated_count: number;
  error_count: number;
}

export interface PaginatedCallsResponse {
  calls: Call[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
