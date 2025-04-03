-- Migration pour l'intégration du calendrier Cal.com
-- Création des tables pour stocker les connexions Cal.com et les rendez-vous

-- Table pour stocker les connexions avec Cal.com
CREATE TABLE IF NOT EXISTS calcom_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  calcom_api_key TEXT NOT NULL,
  calcom_user_id TEXT,
  calcom_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE (agency_id)
);

-- Table pour stocker les métadonnées des rendez-vous
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calcom_booking_id TEXT NOT NULL,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('accepted', 'pending', 'cancelled', 'rejected')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  
  -- Contrainte d'unicité pour éviter les doublons
  UNIQUE (calcom_booking_id)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_bookings_agency_id ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_calcom_connections_user_id ON calcom_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calcom_connections_agency_id ON calcom_connections(agency_id);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_calcom_connections_updated_at
BEFORE UPDATE ON calcom_connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS (Row Level Security) pour les connexions Cal.com
ALTER TABLE calcom_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres connexions Cal.com"
ON calcom_connections FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = calcom_connections.agency_id
    AND agencies.owner_id = auth.uid()
  )
);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres connexions Cal.com"
ON calcom_connections FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = calcom_connections.agency_id
    AND agencies.owner_id = auth.uid()
  )
);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres connexions Cal.com"
ON calcom_connections FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = calcom_connections.agency_id
    AND agencies.owner_id = auth.uid()
  )
);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres connexions Cal.com"
ON calcom_connections FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = calcom_connections.agency_id
    AND agencies.owner_id = auth.uid()
  )
);

-- Politiques RLS pour les rendez-vous
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les rendez-vous de leur agence"
ON bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = bookings.agency_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent créer des rendez-vous pour leur agence"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = bookings.agency_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent mettre à jour les rendez-vous de leur agence"
ON bookings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = bookings.agency_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

CREATE POLICY "Les utilisateurs peuvent supprimer les rendez-vous de leur agence"
ON bookings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = bookings.agency_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);
