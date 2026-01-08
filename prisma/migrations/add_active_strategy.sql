-- Migration manuelle pour ajouter la table ActiveStrategy
-- À exécuter dans Turso Shell

CREATE TABLE IF NOT EXISTS "ActiveStrategy" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "strategyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "activatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "ActiveStrategy_strategyId_idx" ON "ActiveStrategy"("strategyId");
CREATE INDEX IF NOT EXISTS "ActiveStrategy_isActive_idx" ON "ActiveStrategy"("isActive");
