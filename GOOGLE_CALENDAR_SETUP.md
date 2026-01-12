# Configuration Google Calendar

Ce guide explique comment activer la synchronisation Google Calendar pour ton application de suivi des habitudes.

## 📋 Prérequis

1. Un compte Google
2. Accès à Google Cloud Console

## 🚀 Étapes de configuration

### 1. Créer un projet Google Cloud

1. Va sur [Google Cloud Console](https://console.cloud.google.com/)
2. Crée un nouveau projet ou sélectionne un projet existant
3. Note le nom de ton projet

### 2. Activer l'API Google Calendar

1. Dans la console Google Cloud, va dans "APIs & Services" > "Library"
2. Recherche "Google Calendar API"
3. Clique sur "Enable" pour activer l'API

### 3. Créer les identifiants OAuth 2.0

1. Va dans "APIs & Services" > "Credentials"
2. Clique sur "Create Credentials" > "OAuth client ID"
3. Si demandé, configure d'abord l'écran de consentement OAuth:
   - Choisis "External" (sauf si tu as un workspace)
   - Remplis les informations requises:
     - Nom de l'application: "Suivi Addiction Habitudes"
     - Email du développeur: ton email
   - Dans "Scopes", ajoute: `https://www.googleapis.com/auth/calendar.events`
   - Sauvegarde

4. Retourne dans "Credentials" et crée l'OAuth client ID:
   - Type d'application: "Web application"
   - Nom: "Habitudes Tracker"
   - URIs de redirection autorisés:
     - Pour développement: `http://localhost:3000/api/calendar/callback`
     - Pour production: `https://ton-domaine.com/api/calendar/callback`

5. Une fois créé, tu verras:
   - **Client ID**: commence par quelque chose comme `123456789-xxxxx.apps.googleusercontent.com`
   - **Client Secret**: une chaîne de caractères aléatoire

### 4. Configurer les variables d'environnement

Ajoute ces variables dans ton fichier `.env.local` (local) et dans Vercel (production):

```bash
# Google Calendar Configuration
GOOGLE_CALENDAR_CLIENT_ID=ton_client_id_ici.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=ton_client_secret_ici

# URL de base de ton application
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Pour développement
# NEXT_PUBLIC_BASE_URL=https://ton-domaine.com  # Pour production
```

### 5. Configuration dans Vercel (Production)

1. Va dans ton projet Vercel
2. Va dans "Settings" > "Environment Variables"
3. Ajoute les 3 variables:
   - `GOOGLE_CALENDAR_CLIENT_ID`
   - `GOOGLE_CALENDAR_CLIENT_SECRET`
   - `NEXT_PUBLIC_BASE_URL`
4. Redéploie l'application

## 🎯 Utilisation

### Première connexion

1. Va dans la page "Habitudes" (`/habits`)
2. Dans la section "Synchronisation Google Calendar", clique sur "Connecter Google Calendar"
3. Tu seras redirigé vers Google pour autoriser l'accès
4. Autorise l'application à accéder à ton Google Calendar
5. Tu seras redirigé vers l'application avec une confirmation

### Synchronisation automatique

Une fois connecté, **toutes les habitudes complétées sont automatiquement synchronisées** avec Google Calendar:

- ✅ Quand tu marques une habitude comme complétée → un événement est créé dans ton calendrier
- ❌ Quand tu décoches une habitude → l'événement est supprimé de ton calendrier

### Initialiser les habitudes recommandées

Clique sur le bouton **"🌱 Initialiser mes habitudes recommandées"** pour créer automatiquement 4 habitudes:

1. **Méditation quotidienne** (5-10 minutes)
   - Catégorie: mindfulness
   - Déclencheur: Après le réveil
   - Durée: 10 minutes

2. **Activité physique** (marche/vélo)
   - Catégorie: physical
   - Déclencheur: Après le déjeuner
   - Durée: 30 minutes
   - Fréquence recommandée: 3x par semaine

3. **Journal de gratitude**
   - Catégorie: mindfulness
   - Déclencheur: Avant le coucher
   - Durée: 5 minutes

4. **Respecter mon horaire quotidien**
   - Catégorie: discipline
   - Déclencheur: Réveil à heure fixe
   - Durée: toute la journée

## 🔧 Dépannage

### Erreur "Configuration Google Calendar manquante"

- Vérifie que les variables d'environnement sont bien configurées
- Redémarre le serveur de développement après avoir modifié `.env.local`
- Sur Vercel, vérifie que les variables sont bien dans "Environment Variables"

### Erreur lors de l'autorisation Google

- Vérifie que l'URL de redirection dans Google Cloud Console correspond exactement à celle utilisée
- Pour localhost, utilise `http://localhost:3000/api/calendar/callback`
- Pour production, utilise `https://ton-domaine.com/api/calendar/callback`

### Les événements ne se synchronisent pas

1. Vérifie le statut de la connexion sur `/habits`
2. Si "Token expiré", déconnecte et reconnecte Google Calendar
3. Vérifie les logs de la console pour les erreurs

### "Token expired" ou erreurs d'authentification

Le token d'accès Google expire après 1 heure, mais l'application le rafraîchit automatiquement. Si tu vois quand même des erreurs:

1. Déconnecte Google Calendar
2. Reconnecte-toi
3. Le nouveau token sera valide

## 📊 Format des événements

Les habitudes apparaissent dans ton calendrier comme suit:

- **Titre**: ✅ [Nom de l'habitude]
- **Description**:
  ```
  Habitude atomique

  Déclencheur: [trigger]
  Catégorie: [category]
  Durée: [duration] minutes
  ```
- **Heure**: 9h00 par défaut (modifiable dans le calendrier)
- **Durée**: Durée configurée pour l'habitude
- **Rappel**: 30 minutes avant

## 🔒 Sécurité et confidentialité

- L'application demande uniquement l'accès à la gestion des événements (`calendar.events`)
- Les tokens sont stockés de manière sécurisée dans la base de données
- Aucun accès à tes autres données Google
- Tu peux révoquer l'accès à tout moment dans [Google Account Permissions](https://myaccount.google.com/permissions)

## 💡 Conseils

1. **Crée d'abord tes habitudes**, puis connecte Google Calendar
2. **Utilise le tracker quotidien** (`/habits/tracker`) pour cocher facilement tes habitudes
3. **Vérifie ton calendrier** après avoir coché une habitude pour voir l'événement créé
4. **Personnalise dans Google Calendar**: tu peux modifier l'heure, ajouter des notes, etc.

## 🆘 Support

Si tu rencontres des problèmes:

1. Vérifie les logs dans la console du navigateur (F12)
2. Vérifie les logs de Vercel (pour la production)
3. Essaie de déconnecter et reconnecter Google Calendar
4. Vérifie que l'API Google Calendar est bien activée dans Cloud Console
