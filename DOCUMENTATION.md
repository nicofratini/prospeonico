# Documentation Projet Prospeo - Application SaaS Immobilière

## Vue d'ensemble

Prospeo est une application SaaS destinée aux agents immobiliers français, conçue pour simplifier la gestion quotidienne des leads immobiliers. L'application intègre plusieurs technologies clés :

- **ElevenLabs** pour l'IA conversationnelle
- **Cal.com** pour la gestion de calendrier
- **Supabase** comme base de données
- **Stripe** pour la gestion des abonnements

Cette documentation couvre l'ensemble des fonctionnalités développées à travers les différentes phases du projet.

## Structure du projet

Le projet est structuré selon l'architecture Nuxt 3 avec les dossiers suivants :

- **components/** : Composants Vue réutilisables
- **layouts/** : Layouts pour différentes sections de l'application
- **pages/** : Pages de l'application
- **server/api/** : API routes pour les interactions avec les services externes
- **types/** : Définitions TypeScript pour le typage strict
- **utils/** : Fonctions utilitaires
- **supabase/** : Migrations et configurations Supabase

## Phases implémentées

### Phase 3 : Gestion Calendrier (Cal.com)

Cette phase intègre Cal.com pour permettre aux agents immobiliers de gérer leurs rendez-vous.

**Fonctionnalités :**
- Affichage des disponibilités
- Prise de rendez-vous
- Synchronisation avec le calendrier de l'agent
- Widget de rendez-vous à venir sur le dashboard

**Fichiers clés :**
- `/types/calcom.ts` : Types pour l'intégration Cal.com
- `/utils/calcomClient.ts` : Client pour interagir avec l'API Cal.com
- `/components/calendar/CalendarView.vue` : Composant principal du calendrier
- `/server/api/calcom/` : API routes pour Cal.com

### Phase 4 : Configuration Agent IA (ElevenLabs)

Cette phase permet aux agents immobiliers de configurer leur agent IA conversationnel.

**Fonctionnalités :**
- Sélection de voix avec prévisualisation
- Édition du prompt système
- Création et mise à jour d'agents ElevenLabs
- Personnalisation des paramètres de l'agent

**Fichiers clés :**
- `/types/elevenlabs.ts` : Types pour l'intégration ElevenLabs
- `/pages/dashboard/ai-agent.vue` : Page de configuration de l'agent
- `/components/ai-agent/VoiceSelector.vue` : Sélecteur de voix
- `/server/api/ai/` : API routes pour ElevenLabs

### Phase 5 : Historique Appels

Cette phase permet de visualiser et d'analyser l'historique des appels effectués par l'agent IA.

**Fonctionnalités :**
- Liste des appels avec filtrage et pagination
- Détails d'un appel avec transcription
- Lecture des enregistrements audio
- Synchronisation des données depuis ElevenLabs

**Fichiers clés :**
- `/pages/dashboard/call-history.vue` : Page d'historique des appels
- `/pages/dashboard/call-history/[id].vue` : Page de détail d'un appel
- `/components/calls/` : Composants pour l'affichage des appels
- `/server/api/calls/` : API routes pour les appels

### Phase 6 : Analyse Appels Avancée

Cette phase ajoute des fonctionnalités d'analyse avancée pour les appels.

**Fonctionnalités :**
- Extraction d'insights à partir des transcriptions
- Système de tagging manuel et automatique
- Timeline visuelle des interactions
- Suivi des points importants

**Fichiers clés :**
- `/types/call-analysis.ts` : Types pour l'analyse des appels
- `/utils/callAnalysis.ts` : Fonctions d'analyse
- `/components/call-analysis/` : Composants pour l'analyse
- `/server/api/calls/analyze.post.ts` : API route pour l'analyse

### Phase 7 : Gestion Compte Utilisateur (Stripe)

Cette phase intègre Stripe pour la gestion des abonnements et le suivi de la consommation.

**Fonctionnalités :**
- Plans d'abonnement (Basic, Pro, Enterprise)
- Suivi de la consommation vs quota
- Gestion des paiements
- Historique des factures

**Fichiers clés :**
- `/types/stripe.ts` : Types pour l'intégration Stripe
- `/utils/stripeClient.ts` : Client pour interagir avec l'API Stripe
- `/components/account/UsageMetricsChart.vue` : Visualisation de la consommation
- `/server/api/account/` : API routes pour la gestion du compte

### Phase 8 : Interface Administration

Cette phase ajoute une interface d'administration pour la gestion globale de la plateforme.

**Fonctionnalités :**
- Dashboard avec métriques globales
- Liste des agences avec filtrage
- Suivi de l'utilisation des API
- Statistiques de revenus

**Fichiers clés :**
- `/types/admin.ts` : Types pour l'administration
- `/middleware/admin-only.ts` : Middleware de restriction d'accès
- `/pages/admin/` : Pages d'administration
- `/server/api/admin/` : API routes pour l'administration

## Configuration et déploiement

### Variables d'environnement requises

```
# Supabase
SUPABASE_URL=
SUPABASE_KEY=

# ElevenLabs
ELEVENLABS_API_KEY=

# Cal.com
CALCOM_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLIC_KEY=
```

### Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Construction pour production
npm run build

# Démarrage en production
npm run start
```

### Migrations Supabase

Les migrations Supabase sont situées dans le dossier `/supabase/migrations/`. Pour les appliquer :

```bash
npx supabase db push
```

## Utilisation

### Authentification

L'application utilise Supabase Auth pour l'authentification. Les utilisateurs peuvent s'inscrire, se connecter et réinitialiser leur mot de passe.

### Dashboard

Le dashboard principal affiche :
- Statistiques clés (appels, rendez-vous, propriétés)
- Rendez-vous à venir
- Appels récents
- Propriétés récentes

### Gestion des propriétés

Les agents peuvent ajouter, modifier et supprimer des propriétés immobilières, avec des détails comme le prix, la localisation, les caractéristiques, etc.

### Agent IA

La configuration de l'agent IA permet de personnaliser :
- La voix utilisée
- Le prompt système
- Les connaissances spécifiques sur les propriétés

### Calendrier

La gestion du calendrier permet de :
- Définir des disponibilités
- Accepter des rendez-vous
- Recevoir des notifications
- Synchroniser avec d'autres calendriers

### Historique des appels

L'historique des appels permet de :
- Voir tous les appels passés
- Filtrer par date, durée, etc.
- Écouter les enregistrements
- Lire les transcriptions
- Analyser les insights

### Gestion du compte

La gestion du compte permet de :
- Voir son plan actuel
- Suivre sa consommation
- Mettre à jour son abonnement
- Consulter ses factures

## Tests

Des tests d'intégration sont disponibles dans le dossier `/tests/`. Pour les exécuter :

```bash
npm run test
```

## Support et contact

Pour toute question ou problème, veuillez contacter l'équipe de support à support@prospeo.ai.
