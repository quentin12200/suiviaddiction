# 🚭 Application de Suivi d'Addiction au Cannabis

Application web de suivi personnel pour combattre l'addiction au cannabis avec patch nicotine. Suit les moments de consommation, les résistances, et affiche un compteur de sobriété en temps réel avec les bénéfices santé.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture technique](#-architecture-technique)
- [Subtilités importantes](#-subtilités-importantes)
- [Endpoints API](#-endpoints-api)
- [Guide de développement](#-guide-de-développement)
- [Déploiement](#-déploiement)
- [Debugging](#-debugging)

## ✨ Fonctionnalités

### 1. **Compteur de Sobriété** (Dashboard)
- ⏱️ Timer en temps réel depuis le dernier joint
- 📊 3 combats distincts :
  - **Nicotine** : Déjà géré par patch 14mg
  - **Cannabis/THC** : Le vrai combat psychologique
  - **Combustion** : Dommages pulmonaires
- 🎯 Paliers de récupération avec bénéfices santé
- 🔄 Actualisation automatique toutes les 5 secondes
- 💪 Message de motivation basé sur l'IA

### 2. **Saisie d'entrées**
- 📅 Date et heure de l'événement
- 🚬 Consommation (oui/non) avec nombre de joints
- 😤 Niveau d'envie (0-10)
- 😊 État émotionnel et contexte
- 🎯 Déclencheur et action alternative
- 💬 Commentaires libres
- ⚡ Gestion événements adrénaline
- 🏠 Gestion événements isolement

### 3. **Historique**
- 📜 Liste complète des entrées
- 🔍 Filtres : consommation, dates, niveau d'envie
- ✏️ Modification d'entrées
- 🗑️ Suppression d'entrées
- 📥 Export CSV

### 4. **Statistiques**
- 📊 Analyse des tendances
- 📈 Graphiques de progression
- 🎯 Taux de résistance

## 🏗️ Architecture technique

### Stack
- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript (strict mode)
- **Database** : Turso (libSQL) via Prisma
- **Hosting** : Vercel
- **Styling** : CSS Modules
- **AI** : OpenAI GPT-4 pour le coach motivationnel

### Structure
```
app/
├── api/                    # API Routes
│   ├── entries/           # CRUD entrées
│   ├── sobriety/stats/    # Timer de sobriété
│   ├── debug/             # Endpoints de diagnostic
│   └── ...
├── components/            # Composants React
│   ├── SobrietyCounter.tsx
│   └── Navigation.tsx
├── dashboard/             # Page dashboard
├── entry/[id]/           # Page détail entrée
├── history/              # Page historique
└── ...

prisma/
└── schema.prisma         # Schéma de base de données
```

## ⚠️ Subtilités importantes

### 1. **Tri des entrées par date ET heure**

**CRITIQUE** : Toujours trier par `date` **ET** `time`, jamais seulement par date.

```typescript
// ✅ CORRECT
const entries = await prisma.entry.findMany({
  orderBy: [
    { date: 'desc' },
    { time: 'desc' },  // OBLIGATOIRE
  ],
})

// ❌ INCORRECT - causera des bugs de détection
const entries = await prisma.entry.findMany({
  orderBy: { date: 'desc' },  // Manque le tri par time
})
```

**Pourquoi ?**
- Plusieurs entrées peuvent avoir la même date
- Sans tri par `time`, l'ordre des entrées du même jour est aléatoire
- Le timer détecte le "dernier joint" = première entrée avec `hasSmoked=true`
- Si l'ordre est mauvais, le timer affiche la mauvaise heure

**Exemple du bug** :
```
Sans tri par time:
- 12/01/2026 13:07 ← Détecté comme "dernier"
- 12/01/2026 15:49 ← Pourtant plus récent!

Avec tri par time:
- 12/01/2026 15:49 ← Correctement détecté
- 12/01/2026 13:07
```

### 2. **Cache Vercel sur les API Routes**

**CRITIQUE** : Vercel met en cache les API routes par défaut, même avec des headers `no-cache`.

**Solution** : Forcer le mode dynamique sur les routes sensibles

```typescript
// app/api/sobriety/stats/route.ts
export const dynamic = 'force-dynamic'  // OBLIGATOIRE
export const revalidate = 0             // OBLIGATOIRE

export async function GET() {
  // ... avec headers no-cache
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
```

**Sans ces directives**, le timer peut rester bloqué sur une ancienne valeur même après :
- Création d'une nouvelle entrée
- Suppression d'une entrée
- Modification d'une entrée

### 3. **Champs `jointTime` vs `time`**

L'application utilise **deux** champs de temps :
- `time` : Heure de saisie de l'entrée (toujours rempli)
- `jointTime` : Heure réelle du joint (peut être différente, peut être null)

**Règle** : Toujours utiliser `jointTime || time` pour le timer

```typescript
// ✅ CORRECT
const usedTime = entry.jointTime || entry.time

// ❌ INCORRECT - ignore l'heure réelle du joint
const usedTime = entry.time
```

**Pourquoi ?**
- Utilisateur peut saisir une entrée à 16:00 pour un joint fumé à 15:49
- Le timer doit afficher 15:49, pas 16:00
- Anciennes entrées n'ont pas `jointTime` (null), on fallback sur `time`

### 4. **Validation de format d'heure**

Le timer peut crasher avec des heures mal formatées. **Toujours valider** :

```typescript
const rawTime = entry.jointTime || entry.time

// Validation
if (!rawTime || typeof rawTime !== 'string') {
  return null  // Skip cette entrée
}

const timeParts = rawTime.split(':')
if (timeParts.length < 2) {
  return null  // Skip cette entrée
}

// Normalisation
const timeStr = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`
const fullDateTime = new Date(`${dateStr}T${timeStr}:00`)

// Vérifier que la date est valide
if (isNaN(fullDateTime.getTime())) {
  return null  // Skip cette entrée
}
```

### 5. **TypeScript strict mode**

L'application utilise TypeScript en mode strict. **Toujours** typer explicitement les callbacks :

```typescript
// ✅ CORRECT
entries.map((e: EntryType) => ({
  id: e.id,
  date: e.date,
}))

// ❌ INCORRECT - erreur TypeScript
entries.map(e => ({  // Erreur: implicit 'any'
  id: e.id,
}))
```

### 6. **Cache client-side**

Le composant `SobrietyCounter` utilise plusieurs techniques anti-cache :

1. **Cache-busting URL** avec timestamp + random
```typescript
const cacheBuster = `t=${Date.now()}&r=${Math.random()}`
fetch(`/api/sobriety/stats?${cacheBuster}`)
```

2. **Headers no-cache**
```typescript
headers: {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
}
```

3. **Actualisation automatique**
- Toutes les 5 secondes
- Au retour sur l'onglet (visibility change)
- Au focus de la fenêtre

4. **Bouton "Actualiser" manuel**

### 7. **Dates en UTC**

Les dates sont stockées en UTC à minuit pour éviter les problèmes de fuseau horaire :

```typescript
// ✅ CORRECT
const entryDate = new Date(body.date + 'T00:00:00.000Z')

// ❌ INCORRECT - peut causer des décalages de jour
const entryDate = new Date(body.date)
```

## 📡 Endpoints API

### Production

#### Entrées
- `GET /api/entries` - Liste des entrées (avec pagination)
- `POST /api/entries` - Créer une entrée
- `GET /api/entries/[id]` - Récupérer une entrée
- `PUT /api/entries/[id]` - Modifier une entrée
- `PATCH /api/entries/[id]` - Modifier partiellement
- `DELETE /api/entries/[id]` - Supprimer une entrée

#### Statistiques
- `GET /api/sobriety/stats` - Date/heure du dernier joint (pour le timer)
- `GET /api/dashboard/stats` - Stats complètes dashboard

#### Export
- `GET /api/export-csv` - Exporter toutes les entrées en CSV

### Debug (développement uniquement)

Ces endpoints sont utiles pour diagnostiquer les problèmes :

#### `GET /api/debug/check-timer`
Montre les 20 dernières entrées et ce que le timer devrait afficher.

**Usage** :
```bash
curl https://suiviaddiction.vercel.app/api/debug/check-timer | jq '.'
```

**Retourne** :
```json
{
  "success": true,
  "totalChecked": 20,
  "smokedCount": 15,
  "resistedCount": 5,
  "detectedLastSmoked": {
    "id": "cmkba5vwc",
    "date": "2026-01-12",
    "time": "15:49",
    "timestamp": "12/01/2026 15:49:00",
    "message": "👆 CETTE ENTRÉE devrait être affichée dans le compteur"
  },
  "entriesSummary": [...]
}
```

#### `GET /api/debug/sobriety-raw`
Montre étape par étape ce que calcule l'API de stats.

**Usage** :
```bash
curl https://suiviaddiction.vercel.app/api/debug/sobriety-raw | jq '.'
```

#### `GET /api/debug/entry-by-id?id=XXX`
Vérifie si une entrée spécifique existe.

**Usage** :
```bash
curl "https://suiviaddiction.vercel.app/api/debug/entry-by-id?id=cmkba5vwc0000c6m9ehamkhbt"
```

#### `GET /api/debug/verify-entry?time=HH:MM&date=YYYY-MM-DD`
Cherche des entrées correspondant à des critères.

**Usage** :
```bash
curl "https://suiviaddiction.vercel.app/api/debug/verify-entry?time=15:49&date=2026-01-12"
```

#### `GET /api/debug/entries`
Retourne les 10 dernières entrées + entrées d'aujourd'hui.

#### `GET /api/debug/history?id=XXX`
Liste les 5 dernières entrées ou détails d'une entrée spécifique.

## 🛠️ Guide de développement

### Installation

```bash
# Cloner le repo
git clone https://github.com/quentin12200/suiviaddiction.git
cd suiviaddiction

# Installer les dépendances
npm install

# Configurer la base de données
cp .env.example .env.local
# Éditer .env.local avec vos credentials Turso

# Générer le client Prisma
npx prisma generate

# Lancer en dev
npm run dev
```

### Variables d'environnement

```env
# .env.local
DATABASE_URL="libsql://[your-db].turso.io"
DATABASE_AUTH_TOKEN="your-token"
OPENAI_API_KEY="sk-..."
```

### Scripts utiles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Lancer le build localement
npm start

# TypeScript check
npm run type-check

# Prisma Studio (GUI base de données)
npx prisma studio

# Migrations
npx prisma migrate dev
```

### Règles de développement

1. **Toujours** trier les entrées par `date` ET `time`
2. **Toujours** utiliser `jointTime || time` pour le timer
3. **Toujours** typer explicitement les callbacks TypeScript
4. **Toujours** valider le format des heures
5. **Toujours** utiliser `dynamic = 'force-dynamic'` sur les API routes sensibles
6. **Toujours** logger les opérations importantes (création, suppression, etc.)

### Ajouter une nouvelle API route

```typescript
// app/api/ma-route/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic si besoin de données fraîches
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const data = await prisma.entry.findMany({
      orderBy: [
        { date: 'desc' },
        { time: 'desc' },  // NE PAS OUBLIER
      ],
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
```

## 🚀 Déploiement

L'application est déployée sur **Vercel** avec déploiement automatique :

1. **Push sur branche principale** → Déploiement production
2. **Push sur feature branch** → Preview deployment

### Vérifications après déploiement

1. **Tester le timer**
   - Aller sur le dashboard
   - Ouvrir la console (F12)
   - Vérifier les logs : `🔄 Fetching sobriety stats...`
   - Vérifier que le timer affiche la bonne heure

2. **Tester la création d'entrée**
   - Créer une nouvelle entrée avec consommation
   - Retourner au dashboard
   - Le timer doit se mettre à jour en max 5 secondes

3. **Tester la suppression**
   - Supprimer une entrée depuis l'historique
   - Retourner au dashboard
   - Le timer doit se mettre à jour en max 5 secondes

4. **Vérifier les logs Vercel**
   ```
   ✅ Entry created with ID: cmkba5vwc
   💾 Entry saved in database: { ... }
   🔍 Sobriety stats - Total entries checked: 100
   ✅ Last joint found: { ... }
   ```

## 🐛 Debugging

### Problème : Timer ne se met pas à jour

1. **Vérifier la console navigateur**
   ```javascript
   🔄 Fetching sobriety stats... t=1736689234567&r=0.123
   📥 Received sobriety stats: { lastJointDate: "...", lastJointTime: "..." }
   ✅ Timer updated with: { ... }
   ```

2. **Vérifier l'API directement**
   ```bash
   curl "https://suiviaddiction.vercel.app/api/sobriety/stats?t=$(date +%s)000"
   ```

3. **Vérifier avec l'endpoint de debug**
   ```bash
   curl https://suiviaddiction.vercel.app/api/debug/check-timer | jq '.detectedLastSmoked'
   ```

4. **Vérifier que `dynamic = 'force-dynamic'` est présent**
   ```typescript
   // app/api/sobriety/stats/route.ts
   export const dynamic = 'force-dynamic'  // Doit être là
   export const revalidate = 0             // Doit être là
   ```

### Problème : Entrée créée mais pas détectée

1. **Vérifier que l'entrée existe**
   ```bash
   curl "https://suiviaddiction.vercel.app/api/debug/verify-entry?date=2026-01-12"
   ```

2. **Vérifier les logs serveur** (Vercel Dashboard)
   ```
   ✅ Entry created with ID: cmkba5vwc0000c6m9ehamkhbt
   💾 Entry saved in database: { date: "2026-01-12", time: "15:49", hasSmoked: true }
   ```

3. **Vérifier le tri**
   - Ouvrir `app/api/sobriety/stats/route.ts`
   - Vérifier que `orderBy` contient `date` ET `time`

### Problème : Mauvaise heure affichée

1. **Vérifier l'utilisation de `jointTime`**
   ```typescript
   // ✅ Doit être
   const usedTime = entry.jointTime || entry.time

   // ❌ Pas juste
   const usedTime = entry.time
   ```

2. **Vérifier l'entrée dans la base**
   ```bash
   curl "https://suiviaddiction.vercel.app/api/debug/entry-by-id?id=cmkba5vwc0000c6m9ehamkhbt"
   ```

### Problème : Timer affiche une entrée supprimée

1. **Vérifier que la suppression a fonctionné**
   - Logs serveur Vercel doivent montrer :
   ```
   🗑️ DELETE /api/entries/[id] - Suppression entrée
   📋 Entrée trouvée: { ... }
   ✅ Entrée supprimée avec succès
   ✅ Vérification: entrée bien supprimée de la base
   ```

2. **Vérifier le cache**
   - Vider le cache navigateur (Ctrl+Shift+R)
   - Vérifier que `dynamic = 'force-dynamic'` est présent
   - Attendre 5 secondes pour l'auto-refresh du timer

3. **Forcer un refresh manuel**
   - Cliquer sur le bouton "🔄 Actualiser"

## 📝 Schéma de base de données

```prisma
model Entry {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Date et heure
  date      DateTime  // Date de l'événement (UTC minuit)
  time      String    // Heure de saisie (HH:MM)
  jointTime String?   // Heure réelle du joint si différente (HH:MM)

  // Consommation
  hasSmoked              Boolean @default(false)
  jointCount             Int     @default(0)
  minutesSinceLastJoint  Int?

  // États
  cravingLevel    Int    @default(0)
  emotionalState  String @default("")
  physicalState   String @default("")

  // Contexte
  context            String  @default("")
  trigger            String  @default("")
  alternativeAction  String  @default("")
  consciousDecision  Boolean @default(false)
  comment            String  @default("")

  // Événements spéciaux
  adrenalineEvent       Boolean @default(false)
  adrenalineType        String  @default("")
  adrenalineTrigger     String  @default("")
  adrenalineAlternative String  @default("")
  adrenalineOutcome     String  @default("")

  isolationEvent   Boolean @default(false)
  isolationPlanned Boolean @default(false)
  isolationActivity String @default("")
  isolationReason   String @default("")
  isolationOutcome  String @default("")
}
```

## 🤝 Contribution

Pour contribuer :

1. Créer une branche feature : `git checkout -b feature/ma-feature`
2. Faire vos modifications
3. **Tester localement** avec `npm run build`
4. Commit : `git commit -m "Description claire"`
5. Push : `git push origin feature/ma-feature`
6. Créer une Pull Request

## 📄 Licence

Projet personnel - Tous droits réservés

## 🆘 Support

Pour tout problème :
1. Vérifier ce README
2. Consulter les endpoints de debug
3. Vérifier les logs Vercel
4. Ouvrir une issue GitHub
