-- Migration pour créer la table des appels (calls)
-- Cette migration crée la table calls pour stocker l'historique des appels

-- Création de la table calls
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  elevenlabs_conversation_id TEXT NOT NULL UNIQUE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  elevenlabs_agent_id TEXT,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  caller_number TEXT,
  caller_type TEXT CHECK (caller_type IN ('particular', 'professional', 'unknown')) DEFAULT 'unknown',
  status TEXT NOT NULL,
  outcome TEXT,
  summary TEXT,
  recording_url_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Commentaires sur les colonnes
COMMENT ON TABLE public.calls IS 'Historique des appels téléphoniques gérés par les agents IA';
COMMENT ON COLUMN public.calls.elevenlabs_conversation_id IS 'ID de la conversation dans ElevenLabs';
COMMENT ON COLUMN public.calls.agency_id IS 'ID de l''agence associée à cet appel';
COMMENT ON COLUMN public.calls.elevenlabs_agent_id IS 'ID de l''agent ElevenLabs qui a géré l''appel';
COMMENT ON COLUMN public.calls.property_id IS 'ID du bien immobilier concerné par l''appel (si applicable)';
COMMENT ON COLUMN public.calls.started_at IS 'Date et heure de début de l''appel';
COMMENT ON COLUMN public.calls.ended_at IS 'Date et heure de fin de l''appel';
COMMENT ON COLUMN public.calls.duration IS 'Durée de l''appel en secondes';
COMMENT ON COLUMN public.calls.caller_number IS 'Numéro de téléphone de l''appelant';
COMMENT ON COLUMN public.calls.caller_type IS 'Type d''appelant (particulier, professionnel, inconnu)';
COMMENT ON COLUMN public.calls.status IS 'Statut de l''appel (completed, in_progress, failed)';
COMMENT ON COLUMN public.calls.outcome IS 'Résultat de l''appel (rendez-vous pris, information donnée, etc.)';
COMMENT ON COLUMN public.calls.summary IS 'Résumé du contenu de l''appel';
COMMENT ON COLUMN public.calls.recording_url_expires_at IS 'Date d''expiration de l''URL d''enregistrement';

-- Index pour optimiser les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_calls_agency_id ON public.calls(agency_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON public.calls(started_at);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_caller_type ON public.calls(caller_type);

-- Trigger pour mettre à jour le timestamp updated_at automatiquement
DROP TRIGGER IF EXISTS update_calls_updated_at ON public.calls;
CREATE TRIGGER update_calls_updated_at
BEFORE UPDATE ON public.calls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Politiques RLS (Row Level Security)
-- Activer RLS sur la table calls
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Politique pour la sélection (SELECT)
CREATE POLICY "Users can view calls from their agency"
ON public.calls FOR SELECT
USING (agency_id IN (
  SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid()
));

-- Politique pour l'insertion (INSERT)
CREATE POLICY "Users can insert calls for their agency"
ON public.calls FOR INSERT
WITH CHECK (agency_id IN (
  SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid()
));

-- Politique pour la mise à jour (UPDATE)
CREATE POLICY "Users can update calls from their agency"
ON public.calls FOR UPDATE
USING (agency_id IN (
  SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid()
));

-- Politique pour la suppression (DELETE)
CREATE POLICY "Users can delete calls from their agency"
ON public.calls FOR DELETE
USING (agency_id IN (
  SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid()
));
