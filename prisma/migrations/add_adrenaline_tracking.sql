-- AlterTable: Add adrenaline tracking fields to Entry
ALTER TABLE Entry ADD COLUMN adrenalineEvent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Entry ADD COLUMN adrenalineType TEXT NOT NULL DEFAULT '';
ALTER TABLE Entry ADD COLUMN adrenalineTrigger TEXT NOT NULL DEFAULT '';
ALTER TABLE Entry ADD COLUMN adrenalineAlternative TEXT NOT NULL DEFAULT '';
ALTER TABLE Entry ADD COLUMN adrenalineOutcome TEXT NOT NULL DEFAULT '';

-- CreateIndex: Index on adrenalineEvent for better query performance
CREATE INDEX Entry_adrenalineEvent_idx ON Entry(adrenalineEvent);
