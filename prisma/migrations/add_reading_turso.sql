-- Migration pour ajouter la table Reading (Lectures)
-- À exécuter dans Turso Shell

CREATE TABLE IF NOT EXISTS "Reading" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'non_commencé',
  "notes" TEXT NOT NULL DEFAULT '',
  "startedAt" DATETIME,
  "finishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Reading_status_idx" ON "Reading"("status");
CREATE INDEX IF NOT EXISTS "Reading_category_idx" ON "Reading"("category");
