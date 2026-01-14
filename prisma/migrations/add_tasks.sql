-- Add TaskItem table
CREATE TABLE IF NOT EXISTS "TaskItem" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "type" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'normale',
  "category" TEXT NOT NULL DEFAULT 'Personnel',
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" DATETIME,
  "lastCompleted" DATETIME,
  "daysNotCompleted" INTEGER NOT NULL DEFAULT 0,
  "isFromHabit" BOOLEAN NOT NULL DEFAULT false,
  "habitId" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TaskItem_completed_idx" ON "TaskItem"("completed");
CREATE INDEX IF NOT EXISTS "TaskItem_type_idx" ON "TaskItem"("type");
CREATE INDEX IF NOT EXISTS "TaskItem_category_idx" ON "TaskItem"("category");
