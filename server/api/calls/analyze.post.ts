// API route pour analyser un appel et extraire des insights
import { defineEventHandler } from 'h3'
import { AnalyzeCallRequest, AnalyzeCallResponse, CallInsight, CallTag } from '~/types/call-analysis'
import { extractInsightsFromTranscript, suggestTagsFromInsights, generateTimelineEvents } from '~/utils/callAnalysis'

export default defineEventHandler(async (event) => {
  // Vérifier l'authentification
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé'
    })
  }

  // Récupérer les données du corps de la requête
  const body = await readBody(event) as AnalyzeCallRequest
  
  // Valider les champs requis
  if (!body.call_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de l\'appel requis'
    })
  }

  try {
    const client = useSupabaseClient()
    let transcript = body.transcript
    
    // Si la transcription n'est pas fournie, la récupérer depuis la base de données
    if (!transcript) {
      const { data: callData, error: callError } = await client
        .from('calls')
        .select('transcript')
        .eq('id', body.call_id)
        .single()
      
      if (callError) {
        console.error('Erreur lors de la récupération de l\'appel:', callError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Erreur lors de la récupération de l\'appel',
          data: callError
        })
      }
      
      if (!callData.transcript) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Aucune transcription disponible pour cet appel'
        })
      }
      
      transcript = callData.transcript
    }
    
    // Extraire les insights
    const insights: CallInsight[] = body.extract_insights !== false 
      ? extractInsightsFromTranscript(body.call_id, transcript)
      : []
    
    // Enregistrer les insights dans la base de données
    if (insights.length > 0) {
      const { error: insightsError } = await client
        .from('call_insights')
        .upsert(
          insights.map(insight => ({
            call_id: insight.call_id,
            type: insight.type,
            value: insight.value,
            confidence: insight.confidence,
            start_time: insight.start_time,
            end_time: insight.end_time,
            extracted_text: insight.extracted_text
          })),
          { onConflict: 'call_id,type,value' }
        )
      
      if (insightsError) {
        console.error('Erreur lors de l\'enregistrement des insights:', insightsError)
        // Ne pas échouer la requête si l'enregistrement échoue
      }
    }
    
    // Suggérer des tags
    const suggestedTagNames: string[] = body.suggest_tags !== false
      ? suggestTagsFromInsights(insights)
      : []
    
    // Créer les objets de tags suggérés
    const suggestedTags: CallTag[] = suggestedTagNames.map(name => ({
      id: '',
      call_id: body.call_id,
      name,
      color: getTagColor(name),
      is_auto: true,
      created_at: new Date().toISOString(),
      created_by: user.id
    }))
    
    // Enregistrer les tags suggérés dans la base de données
    if (suggestedTags.length > 0) {
      const { error: tagsError } = await client
        .from('call_tags')
        .upsert(
          suggestedTags.map(tag => ({
            call_id: tag.call_id,
            name: tag.name,
            color: tag.color,
            is_auto: tag.is_auto,
            created_by: tag.created_by
          })),
          { onConflict: 'call_id,name' }
        )
      
      if (tagsError) {
        console.error('Erreur lors de l\'enregistrement des tags:', tagsError)
        // Ne pas échouer la requête si l'enregistrement échoue
      }
    }
    
    // Générer les événements de timeline
    const timelineEvents = body.generate_timeline !== false
      ? generateTimelineEvents(body.call_id, insights, suggestedTagNames)
      : []
    
    // Enregistrer les événements de timeline dans la base de données
    if (timelineEvents.length > 0) {
      const { error: timelineError } = await client
        .from('call_timeline_events')
        .insert(timelineEvents.map(event => ({
          call_id: event.call_id,
          type: event.type,
          timestamp: event.timestamp,
          content: event.content,
          importance: event.importance
        })))
      
      if (timelineError) {
        console.error('Erreur lors de l\'enregistrement des événements de timeline:', timelineError)
        // Ne pas échouer la requête si l'enregistrement échoue
      }
    }
    
    // Récupérer les insights, tags et événements de timeline enregistrés
    const [insightsResult, tagsResult, timelineResult] = await Promise.all([
      client
        .from('call_insights')
        .select('*')
        .eq('call_id', body.call_id)
        .order('start_time', { ascending: true }),
      client
        .from('call_tags')
        .select('*')
        .eq('call_id', body.call_id)
        .order('created_at', { ascending: false }),
      client
        .from('call_timeline_events')
        .select('*')
        .eq('call_id', body.call_id)
        .order('timestamp', { ascending: true })
    ])
    
    return {
      success: true,
      call_id: body.call_id,
      insights: insightsResult.data || [],
      suggested_tags: tagsResult.data || [],
      timeline_events: timelineResult.data || []
    } as AnalyzeCallResponse
  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'appel:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de l\'analyse de l\'appel',
      data: error
    })
  }
})

// Fonction pour obtenir une couleur pour un tag en fonction de son nom
function getTagColor(tagName: string): string {
  // Couleurs prédéfinies pour certains tags courants
  const tagColors: Record<string, string> = {
    'Intéressé': '#10B981',
    'Très intéressé': '#059669',
    'À rappeler': '#F59E0B',
    'Urgent': '#EF4444',
    'Budget élevé': '#3B82F6',
    'Budget moyen': '#60A5FA',
    'Budget modeste': '#93C5FD',
    'Appartement': '#8B5CF6',
    'Maison': '#7C3AED',
    'Terrain': '#A78BFA',
    'Professionnel': '#EC4899',
    'Extérieur': '#14B8A6',
    'Stationnement': '#6366F1',
    'Neuf': '#F97316',
    'Rénové': '#FB923C',
    'Investisseur': '#0EA5E9'
  }
  
  // Retourner la couleur si elle existe, sinon une couleur par défaut
  return tagColors[tagName] || '#6B7280'
}
