-- Migration: Add Atomic Habits tables
-- Date: 2026-01-12

-- Table pour les Habitudes Atomiques (James Clear)
CREATE TABLE IF NOT EXISTS "AtomicHabit" (
    "id" TEXT NOT NULL PRIMARY KEY,

    -- STEP 1: Make it Obvious (Rendre évident)
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "stackAfter" TEXT,
    "visualCue" TEXT,

    -- STEP 2: Make it Attractive (Rendre attractif)
    "reward" TEXT,
    "pleasure" TEXT,

    -- STEP 3: Make it Easy (Rendre facile)
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "preparation" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 5,

    -- STEP 4: Make it Satisfying (Rendre satisfaisant)
    "trackingMethod" TEXT NOT NULL DEFAULT 'checkbox',

    -- Métadonnées
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "isPositive" INTEGER NOT NULL DEFAULT 1,
    "replacesAddiction" INTEGER NOT NULL DEFAULT 0,

    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Index pour AtomicHabit
CREATE INDEX IF NOT EXISTS "AtomicHabit_isActive_idx" ON "AtomicHabit"("isActive");
CREATE INDEX IF NOT EXISTS "AtomicHabit_category_idx" ON "AtomicHabit"("category");
CREATE INDEX IF NOT EXISTS "AtomicHabit_replacesAddiction_idx" ON "AtomicHabit"("replacesAddiction");

-- Table pour tracker les complétions quotidiennes d'habitudes
CREATE TABLE IF NOT EXISTS "HabitCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "value" INTEGER,
    "duration" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "difficulty" TEXT,
    "mood" TEXT,
    "rewardClaimed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    FOREIGN KEY ("habitId") REFERENCES "AtomicHabit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index pour HabitCompletion
CREATE UNIQUE INDEX IF NOT EXISTS "HabitCompletion_habitId_date_key" ON "HabitCompletion"("habitId", "date");
CREATE INDEX IF NOT EXISTS "HabitCompletion_habitId_idx" ON "HabitCompletion"("habitId");
CREATE INDEX IF NOT EXISTS "HabitCompletion_date_idx" ON "HabitCompletion"("date");
CREATE INDEX IF NOT EXISTS "HabitCompletion_completed_idx" ON "HabitCompletion"("completed");

-- Table pour les badges et récompenses
CREATE TABLE IF NOT EXISTS "Badge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "requiredValue" INTEGER NOT NULL,
    "earnedAt" DATETIME,
    "isUnlocked" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Index pour Badge
CREATE INDEX IF NOT EXISTS "Badge_category_idx" ON "Badge"("category");
CREATE INDEX IF NOT EXISTS "Badge_isUnlocked_idx" ON "Badge"("isUnlocked");
