-- Migration pour l'intégration Stripe
-- Création des tables pour stocker les abonnements, quotas et factures

-- Table pour stocker les informations de client Stripe
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les abonnements
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  plan_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les quotas d'utilisation
CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  calls_limit INTEGER NOT NULL,
  calls_used INTEGER NOT NULL DEFAULT 0,
  minutes_limit INTEGER NOT NULL,
  minutes_used INTEGER NOT NULL DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les factures
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  currency TEXT NOT NULL,
  invoice_pdf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter des colonnes à la table agencies pour le suivi de l'abonnement
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_agency_id ON stripe_customers(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_agency_id ON subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_agency_id ON usage_quotas(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoices_agency_id ON invoices(agency_id);

-- Politiques RLS (Row Level Security) pour les clients Stripe
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les clients Stripe de leur agence"
ON stripe_customers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = stripe_customers.agency_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

-- Politiques RLS pour les abonnements
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les abonnements de leur agence"
ON subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = subscriptions.agency_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

-- Politiques RLS pour les quotas d'utilisation
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les quotas d'utilisation de leur agence"
ON usage_quotas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = usage_quotas.agency_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

-- Politiques RLS pour les factures
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir les factures de leur agence"
ON invoices FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agencies
    WHERE agencies.id = invoices.agency_id
    AND (agencies.owner_id = auth.uid() OR
         EXISTS (
           SELECT 1 FROM agency_members
           WHERE agency_members.agency_id = agencies.id
           AND agency_members.user_id = auth.uid()
         ))
  )
);

-- Fonction pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour le champ updated_at
CREATE TRIGGER update_stripe_customers_updated_at
BEFORE UPDATE ON stripe_customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_quotas_updated_at
BEFORE UPDATE ON usage_quotas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
