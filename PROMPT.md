# Prompt pour Claude Code – Application web de suivi d’addiction (Quentin)

## 1. Rôle et contexte

Tu es un assistant développeur expert (fullstack TypeScript / React / Next.js) chargé de créer une **application web personnelle** pour le suivi de mon addiction (cannabis/tabac) avec objectifs journaliers.

Je veux un projet prêt à être poussé sur **GitHub** et déployé (par exemple sur Vercel).

Je suis **le seul utilisateur** de l’application : il y a donc un système de compte, mais **mono-utilisateur** (juste pour moi).

Je dispose déjà d’un **fichier Excel** de suivi détaillé. Je pourrai l’exporter en **CSV**. Je veux que l’application puisse **importer ces anciennes données** pour les afficher et les analyser.

---

## 2. Stack technique souhaitée

Merci de créer un projet avec la stack suivante :

- **Framework** : Next.js (version récente, en TypeScript)
- **Frontend** : React avec CSS Modules ou CSS classique, pas de Tailwind (juste du CSS responsive propre, flex/grid, breakpoints)
- **Base de données** : SQLite via Prisma (DB embarquée, simple pour usage perso)
- **Auth** : simple login avec mot de passe unique (défini dans les variables d’environnement)
- **Graphiques** : une lib simple type `chart.js` ou `recharts` pour afficher les stats de consommation
- **Formulaires** : gérés côté client avec validation basique

Le projet doit être organisé proprement, prêt à être utilisé sur GitHub :

- fichier `README.md` décrivant :
  - installation
  - commandes de dev
  - migration de la base
  - import du CSV d’historique

---

## 3. Fonctionnalités principales

### 3.1. Authentification (mono-utilisateur)

- Une page `/login` avec :
  - champ `username`
  - champ `password`
- Les identifiants sont stockés côté serveur dans des variables d’environnement (par ex. `APP_USERNAME` et `APP_PASSWORD`).
- Si l’utilisateur est authentifié, il peut accéder :
  - au tableau de bord
  - au formulaire d’ajout
  - à l’historique
  - à la gestion des objectifs
- Si non authentifié, redirection vers `/login`.

### 3.2. Modèle de données – Journal d’addiction

Créer un modèle Prisma `Entry` avec au moins ces champs (adapter les types) :

- `id` (string ou int, clé primaire)
- `date` (Date)
- `time` (string ou time, heure de l’entrée)
- `hasSmoked` (boolean) – Ai-je fumé ? (O/N)
- `jointCount` (int) – Nombre de joints
- `jointTime` (string / time, heure du joint si différent)
- `minutesSinceLastJoint` (int ou null)
- `cravingLevel` (int 0–10) – Envie de fumer (0-10)
- `emotionalState` (string) – État émotionnel
- `physicalState` (string) – État physique
- `context` (string) – Contexte / activité
- `trigger` (string) – Déclencheur
- `alternativeAction` (string) – Action alternative (si pas fumé)
- `consciousDecision` (boolean) – Décision consciente (O/N)
- `comment` (string, texte long) – Commentaire libre
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### 3.3. Modèle de données – Objectifs journaliers

Créer un modèle Prisma `DailyGoal` par date :

- `id`
- `date` (Date, unique)
- `maxJoints` (int) – nombre max de joints prévu ce jour-là
- `minIntervalMinutes` (int) – intervalle minimum entre joints
- `note` (string, optionnel) – note sur l’objectif du jour

Un jour sans objectif explicite = pas de contrainte formelle, mais on peut calculer les stats quand même.

---

## 4. Pages et UX souhaités

### 4.1. Page d’accueil / Dashboard (`/`)

Une fois connecté, l’URL `/` affiche un **tableau de bord** :

- Résumé du jour (aujourd’hui) :
  - nombre de joints
  - objectif du jour (max joints, intervalle) s’il existe
  - écart à l’objectif (ex : 5/7 joints, encore 2 “slots” possibles)
- Graphique sur les 7 / 30 derniers jours :
  - joints / jour
  - éventuellement niveau moyen de craving
- Indicateur de progression :
  - moyenne sur les 7 derniers jours vs. moyenne historique
- Boutons d’accès rapide :
  - “Ajouter une entrée”
  - “Voir l’historique complet”
  - “Définir / modifier l’objectif du jour”

### 4.2. Formulaire de saisie d’une entrée (`/new`)

Une page avec un **formulaire clair** pour ajouter une nouvelle entrée :

- pré-remplir **la date du jour** et **l’heure actuelle**
- champs :
  - Ai-je fumé ? (O/N → case à cocher / switch → bool)
  - Nombre de joints (int, obligatoire si “O”)
  - Heure du joint (pré-remplie avec heure actuelle, modifiable)
  - Envie de fumer (0–10, slider ou select)
  - État émotionnel (texte court / select)
  - État physique (texte court / select)
  - Contexte / activité (texte ou select)
  - Déclencheur (texte ou select)
  - Action alternative (si pas fumé)
  - Décision consciente (O/N → bool)
  - Commentaire libre (textarea)

La logique côté serveur :

- Calculer automatiquement `minutesSinceLastJoint` en fonction de la dernière entrée ou du dernier joint enregistré.
- Enregistrer l’entrée dans la BDD.
- Rediriger vers le dashboard avec un message de succès.

### 4.3. Historique (`/history`)

- Tableau filtrable / triable de toutes les entrées :
  - filtres par date, par présence de consommation, par niveau d’envie, etc.
- Pagination ou scroll infini.
- Afficher les données principales directement dans la table, avec possibilité de cliquer pour voir le détail complet d’une entrée (page `/entry/[id]` ou modal).

### 4.4. Objectifs (`/goals`)

- Formulaire pour définir / modifier les objectifs par date :
  - date
  - max joints
  - min intervalle minutes
  - note
- Affichage d’une liste des prochains objectifs (et éventuellement des passés).

---

## 5. Import des anciennes données

Je vais exporter mon Excel actuel en **CSV**, par exemple `data/journal_addiction.csv`.

### 5.1. Format attendu du CSV

Merci de définir clairement dans le README un format de colonnes attendu, par exemple :

- `Date`
- `Heure`
- `Ai-je fumé ? (O/N)`
- `Nombre de joints`
- `Heure du joint`
- `Intervalle depuis dernier joint (min)`
- `Envie de fumer (0-10)`
- `État émotionnel`
- `État physique`
- `Contexte / activité`
- `Déclencheur`
- `Action alternative (si pas fumé)`
- `Décision consciente (O/N)`
- `Commentaire libre (texte intégral)`

### 5.2. Script d’import

Créer un script Node/TS (par ex. `scripts/importCsv.ts`) qui :

1. Lit le fichier CSV depuis `data/journal_addiction.csv`.
2. Mappe chaque ligne aux champs du modèle Prisma `Entry`.
3. Convertit les “O/N” en booléens pour `hasSmoked` et `consciousDecision`.
4. Convertit les dates et heures au bon format.
5. Insère dans la base de données via Prisma.

Ajouter dans le README :

- comment lancer le script (ex : `npx ts-node scripts/importCsv.ts` ou commande `npm run import:csv`).

---

## 6. Responsive design

Le site doit être **full responsive**, utilisable :

- sur smartphone (écran vertical)
- tablette
- ordinateur

Spécifiquement :

- Navigation simple (menu en haut ou burger sur mobile)
- Tableaux lisibles sur mobile (stack des colonnes les plus importantes, ou scroll horizontal propre)
- Formulaire de saisie agréable sur mobile :
  - gros champs
  - labels lisibles
  - boutons facilement cliquables

Merci de soigner les breakpoints CSS (ex : mobile < 768px, tablette 768–1024, desktop > 1024).

---

## 7. Fichiers à produire

Merci de générer :

1. La structure complète du projet Next.js en TypeScript.
2. Le fichier `schema.prisma` avec les modèles `Entry` et `DailyGoal`.
3. Les pages :
   - `/login`
   - `/` (dashboard)
   - `/new`
   - `/history`
   - `/goals`
   - `/entry/[id]` (optionnel mais souhaité)
4. Les composants nécessaires (formulaire, graphiques, layout, etc.).
5. Un middleware ou équivalent pour protéger les routes (redirection vers `/login` si non connecté).
6. Le script d’import CSV dans `scripts/importCsv.ts`.
7. Un `README.md` complet (installation, dev, build, migrations, import CSV, variables d’environnement pour l’auth).

---

## 8. Style global

- Design simple, sobre, lisible.
- Fonds clairs, contrast suffisant.
- Focalisation sur :
  - lisibilité des données
  - simplicité d’utilisation au quotidien
  - ressenti de **progression** plutôt que de culpabilité.

---

## 9. Ce que j’attends de toi

Je veux que tu :

1. Crées l’arborescence complète du projet.
2. Fournisses tous les fichiers source (code complet).
3. Donnes les commandes à lancer (install, migration, dev, import).
4. Ajoutes des commentaires dans le code aux endroits importants (auth, import, calculs d’intervalle, etc.).

Tu peux maintenant générer le projet complet (code, fichiers, instructions).
```markdown
