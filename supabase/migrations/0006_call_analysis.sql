-- Migration pour l'analyse avancée des appels
-- Création des tables pour stocker les insights, tags et événements de timeline

-- Table pour stocker les insights extraits des appels
CREATE TABLE IF NOT EXISTS call_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('price', 'location', 'property_type', 'criteria', 'availability', 'interest', 'other')),
  value TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  start_time INTEGER NOT NULL, -- Position dans la transcription (ms)
  end_time INTEGER NOT NULL,
  extracted_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte pour s'assurer que start_time < end_time
  CONSTRAINT start_before_end CHECK (start_time < end_time)
);

-- Table pour stocker les tags des appels
CREATE TABLE IF NOT EXISTS call_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_auto BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Contrainte d'unicité pour éviter les doublons de tags sur un même appel
  UNIQUE (call_id, name)
);

-- Table pour stocker les événements de timeline des appels
CREATE TABLE IF NOT EXISTS call_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('insight', 'tag', 'note', 'follow_up')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  content JSONB NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_call_insights_call_id ON call_insights(call_id);
CREATE INDEX IF NOT EXISTS idx_call_insights_type ON call_insights(type);
CREATE INDEX IF NOT EXISTS idx_call_tags_call_id ON call_tags(call_id);
CREATE INDEX IF NOT EXISTS idx_call_tags_name ON call_tags(name);
CREATE INDEX IF NOT EXISTS idx_call_timeline_events_call_id ON call_timeline_events(call_id);
CREATE INDEX IF NOT EXISTS idx_call_timeline_events_timestamp ON call_timeline_events(timestamp);

-- Politiques RLS (Row Level Security) pour les insights
ALTER TABLE call_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les insights des appels de leur agence"
ON call_insights FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_insights.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent créer des insights pour les appels de leur agence"
ON call_insights FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_insights.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent mettre à jour les insights des appels de leur agence"
ON call_insights FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_insights.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent supprimer les insights des appels de leur agence"
ON call_insights FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_insights.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

-- Politiques RLS pour les tags
ALTER TABLE call_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les tags des appels de leur agence"
ON call_tags FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_tags.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent créer des tags pour les appels de leur agence"
ON call_tags FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_tags.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent mettre à jour les tags des appels de leur agence"
ON call_tags FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_tags.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent supprimer les tags des appels de leur agence"
ON call_tags FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_tags.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

-- Politiques RLS pour les événements de timeline
ALTER TABLE call_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les événements de timeline des appels de leur agence"
ON call_timeline_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_timeline_events.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent créer des événements de timeline pour les appels de leur agence"
ON call_timeline_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_timeline_events.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent mettre à jour les événements de timeline des appels de leur agence"
ON call_timeline_events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_timeline_events.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent supprimer les événements de timeline des appels de leur agence"
ON call_timeline_events FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calls
    JOIN agencies ON calls.agency_id = agencies.id
    WHERE calls.id = call_timeline_events.call_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);
