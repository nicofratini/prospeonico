// Utilitaire pour l'extraction d'insights à partir des transcriptions d'appels
import { InsightPatterns, CallInsight } from '~/types/call-analysis';

/**
 * Extrait les insights d'une transcription d'appel
 * @param callId ID de l'appel
 * @param transcript Texte de la transcription
 * @returns Liste des insights extraits
 */
export function extractInsightsFromTranscript(callId: string, transcript: string): CallInsight[] {
  const insights: CallInsight[] = [];
  
  // Parcourir tous les types d'insights et leurs patterns
  for (const [type, config] of Object.entries(InsightPatterns)) {
    // Parcourir tous les patterns pour ce type d'insight
    for (const pattern of config.patterns) {
      // Rechercher toutes les occurrences du pattern dans la transcription
      const matches = [...transcript.matchAll(pattern)];
      
      for (const match of matches) {
        // Extraire le texte complet du match
        const extractedText = match[0];
        // Extraire la valeur (peut être dans un groupe de capture)
        let value = '';
        
        if (match.length > 1 && match[1]) {
          // Si le pattern contient des groupes de capture, utiliser le premier groupe
          value = match[1];
        } else {
          // Sinon, utiliser le match complet
          value = extractedText;
        }
        
        // Nettoyer la valeur
        value = value.trim();
        
        // Calculer les positions de début et de fin dans la transcription
        const startTime = match.index || 0;
        const endTime = startTime + extractedText.length;
        
        // Créer l'insight
        const insight: CallInsight = {
          id: '', // Sera généré par la base de données
          call_id: callId,
          type: type as any, // Cast pour satisfaire TypeScript
          value,
          confidence: config.confidence,
          start_time: startTime,
          end_time: endTime,
          extracted_text: extractedText,
          created_at: new Date().toISOString()
        };
        
        // Ajouter l'insight à la liste
        insights.push(insight);
      }
    }
  }
  
  // Filtrer les doublons et trier par position dans la transcription
  return filterAndSortInsights(insights);
}

/**
 * Filtre les insights en supprimant les doublons et les trie par position
 * @param insights Liste des insights à filtrer et trier
 * @returns Liste filtrée et triée
 */
function filterAndSortInsights(insights: CallInsight[]): CallInsight[] {
  // Regrouper les insights par type et valeur similaire
  const groupedInsights: Record<string, CallInsight[]> = {};
  
  for (const insight of insights) {
    const key = `${insight.type}:${insight.value.toLowerCase()}`;
    
    if (!groupedInsights[key]) {
      groupedInsights[key] = [];
    }
    
    groupedInsights[key].push(insight);
  }
  
  // Pour chaque groupe, garder l'insight avec la plus grande confiance
  const filteredInsights: CallInsight[] = [];
  
  for (const group of Object.values(groupedInsights)) {
    // Trier par confiance décroissante
    group.sort((a, b) => b.confidence - a.confidence);
    // Garder le premier (celui avec la plus grande confiance)
    filteredInsights.push(group[0]);
  }
  
  // Trier par position dans la transcription
  return filteredInsights.sort((a, b) => a.start_time - b.start_time);
}

/**
 * Suggère des tags basés sur les insights extraits
 * @param insights Liste des insights extraits
 * @returns Liste des noms de tags suggérés
 */
export function suggestTagsFromInsights(insights: CallInsight[]): string[] {
  const suggestedTags: string[] = [];
  
  // Règles pour suggérer des tags basés sur les insights
  for (const insight of insights) {
    switch (insight.type) {
      case 'price':
        // Extraire le montant du prix
        const priceMatch = insight.value.match(/\d+/);
        if (priceMatch) {
          const price = parseInt(priceMatch[0]);
          
          if (price >= 500000) {
            suggestedTags.push('Budget élevé');
          } else if (price >= 300000) {
            suggestedTags.push('Budget moyen');
          } else {
            suggestedTags.push('Budget modeste');
          }
        }
        break;
        
      case 'property_type':
        // Suggérer des tags basés sur le type de bien
        if (/appartement|studio|T1|T2|F1|F2/i.test(insight.value)) {
          suggestedTags.push('Appartement');
        } else if (/maison|villa/i.test(insight.value)) {
          suggestedTags.push('Maison');
        } else if (/terrain/i.test(insight.value)) {
          suggestedTags.push('Terrain');
        } else if (/commercial|bureau/i.test(insight.value)) {
          suggestedTags.push('Professionnel');
        }
        break;
        
      case 'interest':
        // Suggérer des tags basés sur l'intérêt
        if (/intéressé|intéressant|m'intéresse|ça m'intéresse/i.test(insight.value)) {
          suggestedTags.push('Intéressé');
        }
        if (/parfait|idéal|exactement/i.test(insight.value)) {
          suggestedTags.push('Très intéressé');
        }
        break;
        
      case 'criteria':
        // Suggérer des tags basés sur les critères
        if (/balcon|terrasse/i.test(insight.value)) {
          suggestedTags.push('Extérieur');
        }
        if (/parking|garage/i.test(insight.value)) {
          suggestedTags.push('Stationnement');
        }
        if (/neuf/i.test(insight.value)) {
          suggestedTags.push('Neuf');
        }
        if (/rénové/i.test(insight.value)) {
          suggestedTags.push('Rénové');
        }
        break;
    }
  }
  
  // Supprimer les doublons
  return [...new Set(suggestedTags)];
}

/**
 * Génère des événements de timeline basés sur les insights et les tags
 * @param callId ID de l'appel
 * @param insights Liste des insights extraits
 * @param tags Liste des tags
 * @returns Liste des événements de timeline
 */
export function generateTimelineEvents(
  callId: string,
  insights: CallInsight[],
  tags: string[]
): any[] {
  const events: any[] = [];
  
  // Créer des événements pour les insights importants
  for (const insight of insights) {
    // Déterminer l'importance de l'insight
    let importance: 'low' | 'medium' | 'high' = 'low';
    
    if (insight.type === 'interest' || insight.type === 'price') {
      importance = 'high';
    } else if (insight.type === 'property_type' || insight.type === 'location') {
      importance = 'medium';
    }
    
    // Créer l'événement
    events.push({
      id: '',
      call_id: callId,
      type: 'insight',
      timestamp: new Date().toISOString(),
      content: {
        insight_id: insight.id,
        insight_type: insight.type,
        insight_value: insight.value,
        insight_text: insight.extracted_text
      },
      importance,
      created_at: new Date().toISOString()
    });
  }
  
  // Créer des événements pour les tags
  for (const tag of tags) {
    // Déterminer l'importance du tag
    let importance: 'low' | 'medium' | 'high' = 'medium';
    
    if (['Intéressé', 'Très intéressé', 'Urgent', 'À rappeler'].includes(tag)) {
      importance = 'high';
    } else if (['Budget élevé', 'Investisseur'].includes(tag)) {
      importance = 'medium';
    }
    
    // Créer l'événement
    events.push({
      id: '',
      call_id: callId,
      type: 'tag',
      timestamp: new Date().toISOString(),
      content: {
        tag_name: tag
      },
      importance,
      created_at: new Date().toISOString()
    });
  }
  
  // Trier les événements par importance (high -> medium -> low)
  return events.sort((a, b) => {
    const importanceOrder = { high: 0, medium: 1, low: 2 };
    return importanceOrder[a.importance] - importanceOrder[b.importance];
  });
}
