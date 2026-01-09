#!/bin/bash

# Script pour appliquer la migration Thought
# À exécuter depuis la racine du projet

echo "🔧 Application de la migration Thought..."

# Vérifier que le fichier de base de données existe
if [ ! -f "prisma/dev.db" ]; then
    echo "❌ Erreur: prisma/dev.db n'existe pas"
    exit 1
fi

# Appliquer la migration SQL
if command -v sqlite3 &> /dev/null; then
    sqlite3 prisma/dev.db < prisma/migrations/add_thoughts.sql
    echo "✅ Migration appliquée avec succès!"
else
    echo "⚠️  sqlite3 non trouvé. Voici les commandes à exécuter manuellement:"
    echo ""
    echo "sqlite3 prisma/dev.db"
    echo ""
    cat prisma/migrations/add_thoughts.sql
    echo ""
fi

# Régénérer le client Prisma
echo "📦 Régénération du client Prisma..."
npx prisma generate

echo "✅ Terminé!"
