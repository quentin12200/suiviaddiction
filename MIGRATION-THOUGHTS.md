# Migration : Système de Pensées

Ce fichier explique comment appliquer la migration pour le nouveau système de pensées.

## Qu'est-ce que cette migration ajoute ?

- **Nouvelle table `Thought`** pour stocker les pensées avec horodatage
- **API `/api/thoughts`** pour gérer les pensées (GET et POST)
- **Page `/thoughts`** pour afficher et ajouter des pensées
- **Bouton flottant** accessible depuis toutes les pages pour noter rapidement

## Comment appliquer la migration ?

### Option 1 : Script automatique (recommandé)

```bash
./scripts/apply-thoughts-migration.sh
```

### Option 2 : Manuellement

Si le script ne fonctionne pas, exécutez ces commandes :

```bash
# Appliquer la migration SQL
sqlite3 prisma/dev.db < prisma/migrations/add_thoughts.sql

# Régénérer le client Prisma
npx prisma generate
```

### Option 3 : En production

Si vous utilisez une base de données en production, copiez le contenu de `prisma/migrations/add_thoughts.sql` et exécutez-le dans votre outil de gestion de base de données.

## Vérification

Après avoir appliqué la migration, vérifiez que tout fonctionne :

1. Redémarrez votre serveur de développement
2. Accédez à `/thoughts`
3. Essayez d'ajouter une pensée
4. Vérifiez que le bouton flottant 💭 apparaît en bas à droite

## En cas de problème

Si la migration ne fonctionne pas :

1. Vérifiez que le fichier `prisma/dev.db` existe
2. Vérifiez les logs de l'API dans la console
3. Essayez de regénérer le client Prisma : `npx prisma generate`
4. Redémarrez le serveur

## Structure de la table

```sql
CREATE TABLE "Thought" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Thought_createdAt_idx" ON "Thought"("createdAt");
```
