# Documentation des nouvelles fonctionnalités

## Table des matières
1. [Authentification sociale](#authentification-sociale)
2. [Flux d'onboarding](#flux-donboarding)
3. [Intégration avec Cal.com](#intégration-avec-calcom)
4. [Gestion des codes promotionnels](#gestion-des-codes-promotionnels)
5. [Notifications de quotas](#notifications-de-quotas)

## Authentification sociale

### Description
L'authentification sociale permet aux utilisateurs de se connecter à l'application Prospeo en utilisant leur compte Google, simplifiant ainsi le processus d'inscription et de connexion.

### Fonctionnalités
- Connexion via Google
- Inscription via Google
- Liaison de comptes existants avec Google
- Gestion des sessions via Nuxt Auth

### Utilisation
Pour se connecter avec Google, l'utilisateur peut cliquer sur le bouton "Continuer avec Google" sur les pages de connexion ou d'inscription. Le système redirigera l'utilisateur vers Google pour l'authentification, puis le ramènera à l'application après validation.

### Configuration technique
L'authentification sociale est configurée via Supabase Auth, mais gérée par Nuxt Auth pour une meilleure intégration avec le framework. Les clés d'API Google sont stockées dans les variables d'environnement :

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Flux d'onboarding

### Description
Le flux d'onboarding guide les nouveaux utilisateurs à travers les étapes essentielles pour configurer leur compte Prospeo et commencer à utiliser l'application efficacement.

### Étapes du flux
1. **Configuration du profil agence** : Saisie des informations de base de l'agence (nom, logo, adresse, etc.)
2. **Ajout de la première propriété** : Création manuelle d'une propriété ou import via CSV
3. **Configuration de l'agent IA** : Sélection de la voix et personnalisation du prompt système
4. **Tutoriel des fonctionnalités** : Présentation des principales fonctionnalités de l'application

### Indicateurs de progression
- Barre de progression en haut de chaque page d'onboarding
- Indicateur flottant rappelant à l'utilisateur de terminer son onboarding
- Notifications périodiques pour encourager la complétion de l'onboarding

### Intégration avec l'authentification
Le système redirige automatiquement les nouveaux utilisateurs vers le flux d'onboarding après leur inscription. Les utilisateurs existants qui n'ont pas terminé l'onboarding verront un indicateur de progression et seront encouragés à le compléter.

### Configuration technique
Le flux d'onboarding utilise un store Pinia (`onboarding.ts`) pour gérer l'état et la progression, et un middleware Nuxt (`onboarding.ts`) pour rediriger les utilisateurs vers l'étape appropriée.

## Intégration avec Cal.com

### Description
L'intégration avec Cal.com permet aux agents immobiliers de gérer leurs rendez-vous directement depuis l'application Prospeo, avec synchronisation bidirectionnelle et notifications en temps réel.

### Fonctionnalités
- Affichage des rendez-vous à venir sur le dashboard
- Calendrier complet avec vue mensuelle, hebdomadaire et quotidienne
- Gestion des disponibilités
- Création et modification de rendez-vous
- Notifications en temps réel pour les nouveaux rendez-vous

### Configuration technique
L'intégration utilise l'API Cal.com avec la clé API fournie. Les composants principaux sont :
- `CalendarView.vue` : Affichage du calendrier
- `BookingForm.vue` : Formulaire de prise de rendez-vous
- `BookingList.vue` : Liste des rendez-vous
- `AvailabilitySlot.vue` : Gestion des disponibilités

La clé API Cal.com est configurée dans les variables d'environnement :
```
CALCOM_API_KEY=MDM4MDFlZmFlNjM4NDY0Yzg0MmQ3YTg1ZjAyZDU0ZmYtMTczNzk2NTAyNQ==
```

## Gestion des codes promotionnels

### Description
La gestion des codes promotionnels permet d'offrir des réductions aux clients lors de la souscription à un abonnement Prospeo.

### Fonctionnalités
- Création de codes promo avec pourcentage ou montant fixe de réduction
- Limitation par date d'expiration
- Limitation par nombre d'utilisations
- Restriction par plan d'abonnement
- Interface d'administration pour gérer les codes

### Utilisation
Les administrateurs peuvent créer et gérer les codes promo depuis l'interface d'administration. Les utilisateurs peuvent appliquer un code promo lors de la souscription à un abonnement.

### Configuration technique
Les codes promo sont stockés dans la table `promo_codes` de Supabase et gérés via l'API Stripe pour l'application des réductions.

## Notifications de quotas

### Description
Les notifications de quotas alertent les utilisateurs lorsqu'ils approchent des limites de leur plan d'abonnement, leur permettant d'éviter les interruptions de service.

### Fonctionnalités
- Configuration des seuils d'alerte (50%, 75%, 90%, 95%)
- Notifications visuelles dans l'interface
- Notifications par email (optionnel)
- Suivi détaillé de la consommation

### Configuration technique
Le système vérifie régulièrement la consommation des utilisateurs et déclenche des notifications lorsque les seuils configurés sont atteints. Les préférences de notification sont stockées dans la table `user_profiles` de Supabase.
