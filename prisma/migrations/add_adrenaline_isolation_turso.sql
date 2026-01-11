-- Migration pour ajouter les champs Adrénaline et Isolement
-- À exécuter dans Turso Shell

-- Ajouter les champs Adrénaline
ALTER TABLE Entry ADD COLUMN adrenalineEvent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Entry ADD COLUMN adrenalineType TEXT NOT NULL DEFAULT '';
ALTER TABLE Entry ADD COLUMN adrenalineTrigger TEXT NOT NULL DEFAULT '';
ALTER TABLE Entry ADD COLUMN adrenalineAlternative TEXT NOT NULL DEFAULT '';
ALTER TABLE Entry ADD COLUMN adrenalineOutcome TEXT NOT NULL DEFAULT '';

-- Ajouter les champs Isolement
ALTER TABLE Entry ADD COLUMN isolationEvent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Entry ADD COLUMN isolationPlanned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Entry ADD COLUMN isolationActivity TEXT NOT NULL DEFAULT '';
ALTER TABLE Entry ADD COLUMN isolationReason TEXT NOT NULL DEFAULT '';
ALTER TABLE Entry ADD COLUMN isolationOutcome TEXT NOT NULL DEFAULT '';

-- Créer les index pour performance
CREATE INDEX IF NOT EXISTS Entry_adrenalineEvent_idx ON Entry(adrenalineEvent);
CREATE INDEX IF NOT EXISTS Entry_isolationEvent_idx ON Entry(isolationEvent);
