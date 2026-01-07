# Suivi d'Addiction

Application web personnelle de suivi d'addiction (cannabis/tabac) avec objectifs journaliers, statistiques et graphiques.

## 🚀 Fonctionnalités

- ✅ **Authentification mono-utilisateur** sécurisée
- 📊 **Tableau de bord** avec statistiques et graphiques
- ✍️ **Journal détaillé** de consommation et d'états
- 🎯 **Objectifs journaliers** personnalisables
- 📈 **Graphiques de progression** sur 7 et 30 jours
- 📜 **Historique complet** avec filtres avancés
- 📥 **Import CSV** pour anciennes données
- 📱 **Design responsive** (mobile, tablette, desktop)

## 🛠️ Stack technique

- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Base de données** : SQLite via Prisma
- **Authentification** : iron-session
- **Graphiques** : Recharts
- **Styling** : CSS Modules (responsive)

## 📦 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Étapes

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd suiviaddiction
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**

   Créer un fichier `.env` à la racine du projet :
   ```bash
   cp .env.example .env
   ```

   Éditer le fichier `.env` :
   ```env
   # Base de données
   DATABASE_URL="file:./dev.db"

   # Authentification (mono-utilisateur)
   APP_USERNAME="votre_nom_utilisateur"
   APP_PASSWORD="votre_mot_de_passe_securise"

   # Secret de session (générer une chaîne aléatoire longue)
   SESSION_SECRET="votre_secret_aleatoire_minimum_32_caracteres"
   ```

4. **Initialiser la base de données**
   ```bash
   # Générer le client Prisma
   npm run prisma:generate

   # Créer la base de données et appliquer les migrations
   npm run prisma:migrate
   ```

5. **Lancer en développement**
   ```bash
   npm run dev
   ```

   L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🗄️ Structure du projet

```
suiviaddiction/
├── app/                    # Pages et composants Next.js
│   ├── api/               # Routes API
│   │   ├── auth/          # Authentification
│   │   ├── entries/       # Gestion des entrées
│   │   ├── goals/         # Gestion des objectifs
│   │   └── stats/         # Statistiques
│   ├── components/        # Composants réutilisables
│   ├── entry/[id]/        # Page de détail d'une entrée
│   ├── goals/             # Page de gestion des objectifs
│   ├── history/           # Page d'historique
│   ├── login/             # Page de connexion
│   ├── new/               # Page de nouvelle entrée
│   └── page.tsx           # Tableau de bord (page d'accueil)
├── lib/                   # Bibliothèques et utilitaires
│   ├── prisma.ts          # Client Prisma
│   └── session.ts         # Gestion des sessions
├── prisma/
│   └── schema.prisma      # Schéma de la base de données
├── scripts/
│   └── importCsv.ts       # Script d'import CSV
├── data/                  # Dossier pour les fichiers CSV
└── public/                # Assets statiques
```

## 📊 Import des données CSV

### Format CSV attendu

Créez un fichier CSV avec les colonnes suivantes (voir `data/journal_addiction.example.csv`) :

- **Date** (YYYY-MM-DD ou DD/MM/YYYY)
- **Heure** (HH:mm)
- **Ai-je fumé ? (O/N)**
- **Nombre de joints**
- **Heure du joint** (HH:mm)
- **Intervalle depuis dernier joint (min)**
- **Envie de fumer (0-10)**
- **État émotionnel**
- **État physique**
- **Contexte / activité**
- **Déclencheur**
- **Action alternative (si pas fumé)**
- **Décision consciente (O/N)**
- **Commentaire libre (texte intégral)**

### Lancer l'import

1. Placer votre fichier CSV dans `data/journal_addiction.csv`
2. Exécuter le script :
   ```bash
   npm run import:csv
   ```

Le script affichera la progression et le nombre d'entrées importées.

## 🎯 Utilisation

### Connexion

1. Accéder à [http://localhost:3000](http://localhost:3000)
2. Vous serez redirigé vers `/login`
3. Saisir les identifiants configurés dans `.env`

### Ajouter une entrée

1. Cliquer sur "Nouvelle entrée" dans le menu
2. Remplir le formulaire
3. Enregistrer

L'intervalle depuis le dernier joint est calculé automatiquement.

### Définir des objectifs

1. Aller dans "Objectifs"
2. Définir un objectif pour une date donnée :
   - Nombre maximum de joints
   - Intervalle minimum entre joints
   - Note de motivation

### Consulter l'historique

1. Aller dans "Historique"
2. Utiliser les filtres pour affiner la recherche :
   - Par consommation (oui/non)
   - Par période
   - Par niveau d'envie

## 🚢 Déploiement

### Vercel + Turso (recommandé) ⭐

**👉 [Guide complet de déploiement Vercel](DEPLOYMENT_VERCEL.md)**

Le guide couvre :
- Configuration de Turso (base de données SQLite gratuite)
- Déploiement sur Vercel (hébergement gratuit)
- Configuration des variables d'environnement
- Import des données CSV
- Dépannage et surveillance

**Résumé rapide** :
1. Créer une base Turso gratuite
2. Connecter le repo GitHub à Vercel
3. Configurer les variables d'environnement
4. Déployer !

### Build local

```bash
npm run build
npm start
```

## 📝 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lancer en mode développement |
| `npm run build` | Builder pour la production |
| `npm start` | Lancer en production |
| `npm run lint` | Vérifier le code |
| `npm run prisma:generate` | Générer le client Prisma |
| `npm run prisma:migrate` | Créer/appliquer les migrations |
| `npm run prisma:studio` | Ouvrir l'interface Prisma Studio |
| `npm run import:csv` | Importer des données CSV |

## 🔒 Sécurité

- Les mots de passe ne sont jamais stockés en clair
- Utilisation de sessions sécurisées avec iron-session
- Protection CSRF intégrée
- Variables d'environnement pour les secrets
- Middleware de protection des routes

## 📱 Responsive Design

L'application est optimisée pour :
- 📱 **Mobile** : < 768px
- 📲 **Tablette** : 768px - 1024px
- 💻 **Desktop** : > 1024px

## 🎨 Personnalisation

### Modifier les couleurs

Les couleurs principales sont définies dans les fichiers CSS modules. Pour changer le thème :
- Modifier le gradient dans `app/login/login.module.css`
- Modifier `background` et `color` dans les différents modules CSS

### Ajouter des champs

1. Modifier le schéma Prisma : `prisma/schema.prisma`
2. Créer une migration : `npm run prisma:migrate`
3. Mettre à jour les formulaires et API correspondants

## 🐛 Dépannage

### La base de données ne se crée pas
```bash
rm -rf prisma/dev.db
npm run prisma:migrate
```

### Erreur de session
Vérifier que `SESSION_SECRET` contient au moins 32 caractères aléatoires.

### Import CSV échoue
Vérifier :
- Le fichier est bien à `data/journal_addiction.csv`
- Le format des colonnes correspond exactement
- Les dates sont au bon format

## 📄 Licence

Projet personnel - Tous droits réservés

## 👤 Auteur

Quentin - Application de suivi personnel d'addiction

---

**Note** : Cette application est destinée à un usage personnel. Les données sont stockées localement dans une base SQLite.
