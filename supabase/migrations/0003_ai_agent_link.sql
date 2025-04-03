-- Migration pour ajouter le lien avec l'agent ElevenLabs
-- Cette migration ajoute la colonne elevenlabs_agent_id à la table agencies

-- Ajout de la colonne elevenlabs_agent_id à la table agencies
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id TEXT;

-- Commentaire sur la colonne
COMMENT ON COLUMN public.agencies.elevenlabs_agent_id IS 'ID de l''agent ElevenLabs associé à cette agence';

-- Index pour accélérer les recherches par elevenlabs_agent_id
CREATE INDEX IF NOT EXISTS idx_agencies_elevenlabs_agent_id ON public.agencies(elevenlabs_agent_id);

-- Mise à jour des politiques RLS pour prendre en compte le nouvel attribut
-- Assurons-nous que les utilisateurs ne peuvent voir et modifier que les agents de leur agence
ALTER POLICY IF EXISTS "Les utilisateurs peuvent voir leur agence" 
ON public.agencies FOR SELECT USING (
  id IN (
    SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid()
  )
);

ALTER POLICY IF EXISTS "Les utilisateurs peuvent modifier leur agence" 
ON public.agencies FOR UPDATE USING (
  id IN (
    SELECT agency_id FROM public.agency_users WHERE user_id = auth.uid()
  )
);

-- Fonction pour mettre à jour le timestamp updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Assurons-nous que le trigger existe pour mettre à jour le timestamp
DROP TRIGGER IF EXISTS update_agencies_updated_at ON public.agencies;
CREATE TRIGGER update_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
