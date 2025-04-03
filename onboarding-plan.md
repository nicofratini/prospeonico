# Plan détaillé du flux d'onboarding

## Structure générale

Le flux d'onboarding sera structuré en 4 étapes principales, avec un système de progression qui permettra aux utilisateurs de reprendre là où ils se sont arrêtés. Chaque étape sera une page distincte avec une interface utilisateur cohérente.

## Modèle de données

### Table `user_profiles`

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT,
  agency_logo TEXT,
  agency_address TEXT,
  agency_phone TEXT,
  agency_email TEXT,
  onboarding_step INTEGER DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Politiques RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Composants communs

### `OnboardingLayout.vue`
- Layout commun pour toutes les pages d'onboarding
- Affiche l'indicateur de progression
- Boutons de navigation (précédent, suivant, ignorer)

### `OnboardingProgressBar.vue`
- Barre de progression visuelle
- Affiche les étapes complétées et l'étape actuelle
- Permet de naviguer entre les étapes déjà visitées

### `OnboardingNavButtons.vue`
- Boutons de navigation standardisés
- Gestion des états désactivés
- Option pour ignorer certaines étapes

## Pages d'onboarding

### 1. Bienvenue et configuration du profil (`/onboarding/welcome`)
- **Objectif**: Accueillir l'utilisateur et recueillir les informations de base sur son agence
- **Champs**:
  - Nom de l'agence
  - Logo (upload)
  - Adresse
  - Téléphone
  - Email de contact
- **Actions**:
  - Enregistrer et continuer
  - Ignorer pour plus tard (avec rappel)

### 2. Première propriété (`/onboarding/property`)
- **Objectif**: Aider l'utilisateur à ajouter sa première propriété
- **Options**:
  - Formulaire simplifié pour ajouter une propriété
  - Import CSV pour les utilisateurs avec catalogue existant
  - Tutoriel vidéo sur la gestion des propriétés
- **Champs minimaux**:
  - Titre de la propriété
  - Type (appartement, maison, etc.)
  - Surface
  - Prix
  - Adresse
  - Photo principale (upload)
- **Actions**:
  - Enregistrer et continuer
  - Ignorer pour plus tard

### 3. Configuration de l'agent IA (`/onboarding/ai-agent`)
- **Objectif**: Configurer l'agent IA pour les appels automatisés
- **Fonctionnalités**:
  - Sélection de voix avec prévisualisation audio
  - Personnalisation du prompt système avec variables
  - Exemple de conversation
- **Actions**:
  - Tester l'agent (simulation d'appel)
  - Enregistrer et continuer
  - Ignorer pour plus tard

### 4. Découverte des fonctionnalités (`/onboarding/features`)
- **Objectif**: Présenter les fonctionnalités principales de l'application
- **Contenu**:
  - Tour guidé interactif
  - Vidéos courtes de démonstration
  - Liens vers la documentation
- **Sections**:
  - Dashboard et métriques
  - Gestion du calendrier et des rendez-vous
  - Historique et analyse des appels
  - Gestion des propriétés
- **Actions**:
  - Terminer l'onboarding
  - Accéder au dashboard

## Gestion de la progression

### Store Pinia pour l'onboarding
```typescript
export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    currentStep: 1,
    totalSteps: 4,
    completed: false,
    userProfile: null
  }),
  
  actions: {
    async fetchProgress() {
      // Récupérer la progression depuis Supabase
    },
    
    async saveProgress(step: number) {
      // Sauvegarder la progression dans Supabase
    },
    
    async completeOnboarding() {
      // Marquer l'onboarding comme terminé
    },
    
    async skipStep(step: number) {
      // Marquer une étape comme ignorée
    }
  },
  
  getters: {
    progress: (state) => (state.currentStep - 1) / state.totalSteps * 100,
    isStepCompleted: (state) => (step: number) => step < state.currentStep
  }
});
```

## Intégration avec l'authentification

- Redirection automatique vers l'onboarding après la première connexion
- Option pour reprendre l'onboarding depuis le dashboard si non complété
- Notifications pour rappeler de compléter les étapes ignorées

## Considérations UX/UI

- Design épuré et moderne
- Animations de transition entre les étapes
- Feedback visuel pour les actions réussies
- Messages d'encouragement
- Tooltips et aides contextuelles
- Responsive design pour mobile et desktop

## Tests et validation

- Tests unitaires pour chaque composant
- Tests d'intégration pour le flux complet
- Tests de compatibilité mobile
- Validation des formulaires
