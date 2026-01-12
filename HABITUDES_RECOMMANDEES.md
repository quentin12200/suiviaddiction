# Habitudes Recommandées - Guide d'utilisation

## 🎯 Objectif

Ce système te permet d'initialiser automatiquement 4 habitudes recommandées pour remplacer ton addiction au cannabis. Ces habitudes sont conçues selon la méthode des Habitudes Atomiques de James Clear.

## 📋 Les 4 Habitudes Recommandées

### 1. 🧘 Méditation quotidienne (10 minutes)

**Objectif** : Te centrer et mieux gérer tes émotions

- **Déclencheur** : Après mon réveil et ma toilette matinale
- **Stack après** : Brosser mes dents le matin
- **Indice visuel** : Coussin de méditation à côté du lit
- **Récompense** : Un moment de paix mentale pour bien démarrer la journée
- **Plaisir** : Musique douce ou sons de la nature
- **Préparation** : Coussin préparé, application installée
- **Durée** : 10 minutes
- **Catégorie** : Mindfulness
- **Remplace l'addiction** : ✅ Oui

### 2. 🚴 Activité physique (30 minutes, 3x/semaine)

**Objectif** : Libérer des endorphines naturelles et améliorer ton humeur

- **Déclencheur** : Après le déjeuner ou en fin d'après-midi
- **Stack après** : Manger mon déjeuner
- **Indice visuel** : Chaussures de sport près de la porte
- **Récompense** : Sensation de bien-être et endorphines
- **Plaisir** : Podcast ou musique énergisante
- **Préparation** : Tenue de sport prête, vélo vérifié
- **Durée** : 30 minutes
- **Fréquence recommandée** : 3 fois par semaine
- **Catégorie** : Physical
- **Remplace l'addiction** : ✅ Oui

### 3. 📝 Journal de gratitude (5 minutes)

**Objectif** : Garder une perspective positive et reconnaissante

- **Déclencheur** : Chaque soir avant de me coucher
- **Stack après** : Me préparer pour aller au lit
- **Indice visuel** : Journal et stylo sur ma table de nuit
- **Récompense** : Dormir avec des pensées positives
- **Plaisir** : Moment de réflexion calme avec une tisane
- **Préparation** : Journal dédié, stylo qui fonctionne
- **Durée** : 5 minutes
- **Format** : Noter 3 choses pour lesquelles tu es reconnaissant
- **Catégorie** : Mindfulness
- **Remplace l'addiction** : ✅ Oui

### 4. ⏰ Respecter mon horaire quotidien

**Objectif** : Structurer tes journées et réduire l'ennui

- **Déclencheur** : Réveil à la même heure chaque jour
- **Indice visuel** : Planning visible (mur ou téléphone)
- **Récompense** : Sentiment de contrôle et de productivité
- **Plaisir** : Satisfaction de cocher les tâches accomplies
- **Préparation** : Planning créé la veille, alarmes configurées
- **Durée** : Toute la journée
- **Catégorie** : Discipline
- **Remplace l'addiction** : Non (mais aide à la structure)

## 🚀 Comment initialiser les habitudes

### Méthode 1 : Via l'interface utilisateur (Recommandé)

1. Va sur la page **Habitudes** (`/habits`)
2. Clique sur le bouton **🌱 Initialiser mes habitudes recommandées**
3. Confirme la création
4. ✅ Les 4 habitudes sont créées automatiquement!

### Méthode 2 : Via l'API directement

```bash
curl -X POST http://localhost:3000/api/habits/seed
```

Ou en production:
```bash
curl -X POST https://ton-domaine.com/api/habits/seed
```

## 📊 Utiliser le tracker quotidien

Une fois les habitudes créées:

1. Va sur la page **Tracker** (`/habits/tracker`)
2. Coche les habitudes que tu as complétées aujourd'hui
3. ✅ Tes streaks et statistiques sont calculés automatiquement
4. 🎯 Si Google Calendar est connecté, les événements seront synchronisés

## 🔧 Gestion des habitudes

### Voir toutes les habitudes

```http
GET /api/habits
```

Paramètres optionnels:
- `?includeInactive=true` - Inclure les habitudes inactives
- `?category=mindfulness` - Filtrer par catégorie

### Supprimer les habitudes recommandées

Si tu veux réinitialiser et recommencer:

```bash
curl -X DELETE http://localhost:3000/api/habits/seed
```

Ou via l'interface, supprime-les une par une depuis la page Habitudes.

## 📈 Statistiques trackées

Pour chaque habitude, le système calcule automatiquement:

- **Total de complétions** : Nombre de fois où tu as complété l'habitude
- **Streak actuel** : Nombre de jours consécutifs actuels
- **Plus long streak** : Record de jours consécutifs
- **Taux de complétion** : Pourcentage de succès sur les 30 derniers jours

## 💡 Conseils d'utilisation

### Commencer progressivement

1. **Semaine 1** : Active seulement la méditation (10 min, facile à faire)
2. **Semaine 2** : Ajoute le journal de gratitude (5 min le soir)
3. **Semaine 3** : Ajoute l'activité physique (commence par 15 min, 2x/semaine)
4. **Semaine 4+** : Augmente progressivement la fréquence et la durée

### Adapter à ton rythme

Tu peux modifier chaque habitude en cliquant dessus:
- Change les horaires qui te conviennent
- Ajuste la durée si nécessaire
- Personnalise les déclencheurs selon ta routine

### Utiliser le Habit Stacking

Les habitudes sont déjà "stackées" (liées à d'autres):
- Méditation → après brosser tes dents
- Sport → après le déjeuner
- Gratitude → avant de te coucher

Cela te permet de créer une chaîne d'habitudes automatiques.

## 🎯 Objectif final

L'objectif est de remplacer progressivement:

**L'envie de fumer** ➡️ **L'une de ces 4 habitudes positives**

Quand tu ressens une envie:
1. 🧘 Médite 5 minutes (respiration profonde)
2. 🚴 Fais une marche rapide de 10-15 minutes
3. 📝 Écris ce que tu ressens dans ton journal
4. ⏰ Consulte ton planning et fais la prochaine tâche

## 📚 Ressources supplémentaires

- [HABITUDES_ATOMIQUES.md](./HABITUDES_ATOMIQUES.md) - Guide complet de la méthodologie
- [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) - Configuration de la synchronisation Google Calendar

## 🆘 Dépannage

### Les habitudes ne s'affichent pas

1. Rafraîchis la page (`/habits`)
2. Vérifie la console pour les erreurs
3. Vérifie que l'API `/api/habits` fonctionne

### Les habitudes existent déjà

Si tu vois le message "X habitude(s) existent déjà":
1. Supprime d'abord les habitudes existantes
2. Ou crée-les manuellement avec d'autres noms

### Les streaks ne se calculent pas

1. Assure-toi de cocher les habitudes depuis le tracker (`/habits/tracker`)
2. Les streaks se calculent à partir de dates consécutives
3. Vérifie que tu as bien des complétions enregistrées

## 🎉 Bon courage!

Ces 4 habitudes sont un excellent point de départ pour remplacer ton addiction. Rappelle-toi :

- **Commence petit** : Mieux vaut faire 5 minutes chaque jour que 0
- **Sois constant** : La régularité compte plus que la perfection
- **Célèbre les petites victoires** : Chaque jour compte!
- **Utilise le tracker** : Voir tes progrès te motivera

Tu as tout ce qu'il faut pour réussir. Un jour à la fois! 💪
