// Types pour l'analyse avancée des appels
// Définition des interfaces pour les insights, tags et timeline

export interface CallInsight {
  id: string;
  call_id: string;
  type: 'price' | 'location' | 'property_type' | 'criteria' | 'availability' | 'interest' | 'other';
  value: string;
  confidence: number;
  start_time: number; // Position dans la transcription (ms)
  end_time: number;
  extracted_text: string;
  created_at: string;
}

export interface CallTag {
  id: string;
  call_id: string;
  name: string;
  color: string;
  is_auto: boolean; // Tag généré automatiquement ou manuellement
  created_at: string;
  created_by: string;
}

export interface CallTimelineEvent {
  id: string;
  call_id: string;
  type: 'insight' | 'tag' | 'note' | 'follow_up';
  timestamp: string;
  content: any;
  importance: 'low' | 'medium' | 'high';
  created_at: string;
}

// Interfaces pour les requêtes API
export interface AnalyzeCallRequest {
  call_id: string;
  transcript?: string; // Optionnel si la transcription est déjà stockée
  extract_insights?: boolean;
  suggest_tags?: boolean;
  generate_timeline?: boolean;
}

export interface AnalyzeCallResponse {
  success: boolean;
  call_id: string;
  insights: CallInsight[];
  suggested_tags: CallTag[];
  timeline_events: CallTimelineEvent[];
}

// Patterns pour l'extraction d'insights
export const InsightPatterns = {
  price: {
    patterns: [
      /(\d+[\s]*[kK€]|\d+[\s]*euros|\d+[\s]*[€]|entre[\s]*\d+[\s]*et[\s]*\d+[\s]*[kK€]|entre[\s]*\d+[\s]*et[\s]*\d+[\s]*euros|entre[\s]*\d+[\s]*et[\s]*\d+[\s]*[€]|budget[\s]*de[\s]*\d+[\s]*[kK€]|budget[\s]*de[\s]*\d+[\s]*euros|budget[\s]*de[\s]*\d+[\s]*[€])/gi,
      /prix[\s]*de[\s]*\d+[\s]*[kK€]|prix[\s]*de[\s]*\d+[\s]*euros|prix[\s]*de[\s]*\d+[\s]*[€]/gi,
      /coûte[\s]*\d+[\s]*[kK€]|coûte[\s]*\d+[\s]*euros|coûte[\s]*\d+[\s]*[€]/gi
    ],
    confidence: 0.8
  },
  location: {
    patterns: [
      /(à|dans|sur|près de|proche de|quartier|arrondissement)[\s]+([\w\s-]+)/gi,
      /([\w\s-]+)[\s]+(quartier|arrondissement)/gi,
      /localisation[\s]+([\w\s-]+)/gi,
      /secteur[\s]+([\w\s-]+)/gi
    ],
    confidence: 0.7
  },
  property_type: {
    patterns: [
      /(appartement|maison|studio|loft|duplex|triplex|villa|château|propriété|terrain|local commercial|bureau|immeuble)/gi,
      /(T1|T2|T3|T4|T5|F1|F2|F3|F4|F5)/gi,
      /(\d+)[\s]+(pièces|chambres)/gi
    ],
    confidence: 0.85
  },
  criteria: {
    patterns: [
      /(balcon|terrasse|jardin|parking|garage|cave|ascenseur|étage|piscine|vue|calme|lumineux|rénové|neuf|ancien)/gi,
      /(surface|mètres carrés|m²|m2)[\s]*(\d+)/gi,
      /(\d+)[\s]*(surface|mètres carrés|m²|m2)/gi,
      /(avec|sans)[\s]+([\w\s]+)/gi
    ],
    confidence: 0.75
  },
  availability: {
    patterns: [
      /(disponible|libre)[\s]+([\w\s]+)/gi,
      /(à partir de|dès)[\s]+([\w\s]+)/gi,
      /(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi,
      /(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi,
      /(demain|après-demain|semaine prochaine|mois prochain)/gi
    ],
    confidence: 0.7
  },
  interest: {
    patterns: [
      /(intéressé|intéressée|intéressant|m'intéresse|nous intéresse|ça m'intéresse|ça nous intéresse)/gi,
      /(j'aime|j'adore|je préfère|nous aimons|nous adorons|nous préférons)/gi,
      /(je veux|nous voulons|je souhaite|nous souhaitons|je cherche|nous cherchons)/gi,
      /(parfait|idéal|exactement|correspond|convient)/gi
    ],
    confidence: 0.65
  }
};

// Couleurs pour les tags
export const TagColors = [
  '#EF4444', // Rouge
  '#F59E0B', // Orange
  '#10B981', // Vert
  '#3B82F6', // Bleu
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#6B7280', // Gris
];

// Tags suggérés par défaut
export const DefaultTags = [
  { name: 'Intéressé', color: '#10B981' },
  { name: 'À rappeler', color: '#F59E0B' },
  { name: 'Urgent', color: '#EF4444' },
  { name: 'Budget élevé', color: '#3B82F6' },
  { name: 'Primo-accédant', color: '#8B5CF6' },
  { name: 'Investisseur', color: '#EC4899' },
];
