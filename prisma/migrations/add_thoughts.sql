-- CreateTable
CREATE TABLE IF NOT EXISTS "Thought" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Thought_createdAt_idx" ON "Thought"("createdAt");
