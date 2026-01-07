# 🚀 Guide de déploiement sur Vercel

Ce guide vous explique comment déployer l'application sur Vercel avec Turso comme base de données.

## 📋 Prérequis

- Compte GitHub (avec le repo déjà poussé)
- Compte Vercel (gratuit) : https://vercel.com
- Compte Turso (gratuit) : https://turso.tech

## Étape 1️⃣ : Créer la base de données Turso

### 1. Installer Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm get.tur.so/install.ps1 | iex
```

### 2. S'authentifier

```bash
turso auth login
```

### 3. Créer la base de données

```bash
# Créer la base
turso db create suiviaddiction

# Obtenir l'URL de la base
turso db show suiviaddiction --url
# Copier l'URL (libsql://suiviaddiction-xxx.turso.io)

# Créer un token d'authentification
turso db tokens create suiviaddiction
# Copier le token généré
```

**Important** : Sauvegardez ces deux valeurs, vous en aurez besoin sur Vercel :
- `DATABASE_URL` : l'URL complète (ex: `libsql://suiviaddiction-xxx.turso.io`)
- `DATABASE_AUTH_TOKEN` : le token généré

### 4. Appliquer les migrations Prisma

```bash
# Depuis votre projet local, avec les variables Turso :
DATABASE_URL="libsql://suiviaddiction-xxx.turso.io" \
DATABASE_AUTH_TOKEN="votre_token_ici" \
npx prisma migrate deploy
```

## Étape 2️⃣ : Déployer sur Vercel

### 1. Connecter le projet

1. Aller sur https://vercel.com
2. Cliquer sur "Add New Project"
3. Importer votre repository GitHub `quentin12200/suiviaddiction`
4. Sélectionner la branche `claude/start-from-prompt-5Xurf`

### 2. Configurer les variables d'environnement

Dans les "Environment Variables", ajouter :

```
DATABASE_URL=libsql://suiviaddiction-xxx.turso.io
DATABASE_AUTH_TOKEN=votre_token_turso
APP_USERNAME=votre_nom_utilisateur
APP_PASSWORD=votre_mot_de_passe_securise
SESSION_SECRET=votre_secret_aleatoire_32_caracteres_minimum
```

**Conseil sécurité** : Générer un SESSION_SECRET aléatoire :
```bash
# Linux/macOS
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Configurer le build

Vercel détecte automatiquement Next.js, mais vous pouvez vérifier :

- **Framework Preset** : Next.js
- **Build Command** : `npm run build` (Vercel exécute automatiquement `postinstall` qui génère Prisma)
- **Output Directory** : `.next` (automatique)
- **Install Command** : `npm install` (automatique)

### 4. Déployer

1. Cliquer sur "Deploy"
2. Attendre la fin du build (2-3 minutes)
3. Votre app sera disponible sur `https://suiviaddiction-xxx.vercel.app`

## Étape 3️⃣ : Importer vos données CSV (optionnel)

### Option 1 : Depuis votre machine locale

```bash
# Placer votre CSV dans data/journal_addiction.csv
# Exécuter avec les variables Turso :
DATABASE_URL="libsql://suiviaddiction-xxx.turso.io" \
DATABASE_AUTH_TOKEN="votre_token" \
npm run import:csv
```

### Option 2 : Via Turso Shell

```bash
# Ouvrir le shell Turso
turso db shell suiviaddiction

# Puis utiliser les commandes SQL pour insérer vos données
```

## 🔧 Configuration avancée

### Domaine personnalisé

1. Aller dans Settings > Domains sur Vercel
2. Ajouter votre domaine personnalisé
3. Configurer les DNS selon les instructions

### Activer les logs

Les logs sont automatiquement disponibles dans :
- Vercel Dashboard > Votre projet > Logs
- Turso Dashboard > Votre base > Logs

### Sauvegardes automatiques

Turso sauvegarde automatiquement votre base de données. Pour créer des backups manuels :

```bash
# Sauvegarder
turso db dump suiviaddiction > backup.sql

# Restaurer
turso db shell suiviaddiction < backup.sql
```

## 🐛 Dépannage

### Erreur "Prisma Client not generated"

```bash
# Localement, exécuter :
npm run postinstall

# Vérifier que vercel.json contient bien prisma generate
```

### Erreur de connexion à la base

Vérifier que :
- `DATABASE_URL` commence bien par `libsql://`
- `DATABASE_AUTH_TOKEN` est défini sur Vercel
- Les migrations ont été appliquées : `npx prisma migrate deploy`

### Erreur de session

Vérifier que `SESSION_SECRET` :
- Fait au moins 32 caractères
- Est défini sur Vercel
- Est identique entre tous les déploiements

## 📊 Surveillance

### Métriques Vercel (gratuites)

- Visites
- Temps de réponse
- Erreurs
- Bande passante

### Métriques Turso (gratuites)

- Nombre de requêtes
- Latence
- Stockage utilisé

## 🔄 Mises à jour

Pour déployer des mises à jour :

1. Pusher sur GitHub :
```bash
git add .
git commit -m "Votre message"
git push
```

2. Vercel redéploie automatiquement !

## 💰 Coûts

**100% GRATUIT** pour usage personnel :
- ✅ Vercel : Projets illimités, 100 GB bandwidth/mois
- ✅ Turso : 500 bases de données, 9 GB stockage, 1 milliard de lectures/mois

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Turso](https://docs.turso.tech)
- [Documentation Prisma + Turso](https://www.prisma.io/docs/orm/overview/databases/turso)

---

**Besoin d'aide ?** Vérifiez les logs sur Vercel et Turso en cas de problème.
